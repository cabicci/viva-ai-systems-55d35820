import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { PATHS, getPath, type CurriculumPath } from "@/lib/curriculum-data";
import { captureWarn } from "@/lib/error-capture";

/* ============================================================== */
/*  Entitlements + free/paid gating + admin bypass                 */
/* ============================================================== */

export type Tier = "free" | "pro";

/**
 * Admin status is sourced from `public.user_roles` via the
 * `has_role` security-definer function — never from the client bundle.
 * Kept as a no-op export so call sites that haven't migrated yet still
 * type-check; always returns false. Use `useEntitlement().isAdmin`.
 */
export function isAdminEmail(_email: string | null | undefined): boolean {
  return false;
}

/* -------------------------------------------------------------- */
/*  Free-lesson rules (derived purely from curriculum structure)  */
/*  - Every Intro path lesson = free                              */
/*  - First lesson of every other path = free (path-intro)        */
/* -------------------------------------------------------------- */

function computeFreeLessonIds(): Set<string> {
  const free = new Set<string>();
  for (const p of PATHS) {
    if (p.id === "intro") {
      for (const m of p.modules) {
        for (const l of m.lessons) {
          if (l.state === "available") free.add(l.id);
        }
      }
      continue;
    }
    // First available lesson in the first module = path-intro (free)
    outer: for (const m of p.modules) {
      for (const l of m.lessons) {
        if (l.state === "available") {
          free.add(l.id);
          break outer;
        }
      }
    }
  }
  return free;
}

const FREE_IDS = computeFreeLessonIds();

export function isLessonFree(lessonId: string): boolean {
  return FREE_IDS.has(lessonId);
}

export function freeLessonIds(): string[] {
  return Array.from(FREE_IDS);
}

/** The path that owns this lesson, or null. */
export function findLessonPath(lessonId: string): CurriculumPath | null {
  for (const p of PATHS) {
    for (const m of p.modules) {
      if (m.lessons.some((l) => l.id === lessonId)) return p;
    }
  }
  return null;
}

/* -------------------------------------------------------------- */
/*  Subscription hook                                              */
/* -------------------------------------------------------------- */

const SUB_QK = ["user-subscription"] as const;
const ADMIN_QK = ["user-is-admin"] as const;

export function useEntitlement(): {
  tier: Tier;
  isPro: boolean;
  isAdmin: boolean;
  isLoaded: boolean;
} {
  const { user, loading } = useAuth();
  const userId = user?.id ?? null;

  const { data: adminData, isSuccess: adminLoaded } = useQuery({
    queryKey: [...ADMIN_QK, userId],
    queryFn: async (): Promise<boolean> => {
      if (!userId) return false;
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: userId,
        _role: "admin",
      });
      if (error) {
        captureWarn("entitlements:has_role", error);
        return false;
      }
      return !!data;
    },
    enabled: !!userId,
    staleTime: 5 * 60_000,
  });
  const admin = !!adminData;

  const { data, isSuccess } = useQuery({
    queryKey: [...SUB_QK, userId],
    queryFn: async (): Promise<Tier> => {
      if (!userId) return "free";
      // Authoritative paid-access source after Billing cutover:
      // billing.subscriptions via public.get_my_billing_access_tier.
      // Legacy public.user_subscriptions is not independently authoritative.
      const { data, error } = await supabase.rpc("get_my_billing_access_tier");
      if (error) {
        captureWarn("entitlements:billing_access_tier", error);
        return "free";
      }
      return data === "pro" ? "pro" : "free";
    },
    enabled: !!userId,
    staleTime: 60_000,
  });

  const tier: Tier = admin ? "pro" : (data ?? "free");
  return {
    tier,
    isPro: tier === "pro",
    isAdmin: admin,
    // C6 fix: simplified — when there's no user we're loaded; when there is,
    // we need BOTH the subscription query and the admin query to have settled.
    isLoaded: !loading && (!userId || (isSuccess && adminLoaded)),
  };
}

/* -------------------------------------------------------------- */
/*  Streak hook                                                    */
/* -------------------------------------------------------------- */

export interface StreakState {
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
}

const STREAK_QK = ["user-streak"] as const;

export function useStreak() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: [...STREAK_QK, userId],
    queryFn: async (): Promise<StreakState> => {
      if (!userId) {
        return { current_streak: 0, longest_streak: 0, last_activity_date: null };
      }
      const { data } = await supabase
        .from("user_streaks")
        .select("current_streak, longest_streak, last_activity_date")
        .eq("user_id", userId)
        .maybeSingle();
      return data ?? { current_streak: 0, longest_streak: 0, last_activity_date: null };
    },
    enabled: !!userId,
    staleTime: 30_000,
  });

  const record = useMutation({
    mutationFn: async () => {
      if (!userId) return;
      const { data, error } = await supabase.rpc("record_user_activity");
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...STREAK_QK, userId] });
    },
  });

  const recordMutate = record.mutate;
  const recordActivity = React.useCallback(() => {
    if (!userId) return;
    recordMutate();
  }, [userId, recordMutate]);

  return {
    streak: data ?? { current_streak: 0, longest_streak: 0, last_activity_date: null },
    isLoading,
    recordActivity,
  };
}

/* -------------------------------------------------------------- */
/*  Access decision — used by lesson page + dashboard rows        */
/* -------------------------------------------------------------- */

export type LessonGate =
  | { kind: "open" }
  | { kind: "complete-intro-first"; introDone: number; introTotal: number }
  | { kind: "paywall" };

export function decideLessonGate(args: {
  lessonId: string;
  isPro: boolean;
  isAdmin: boolean;
  introCompletedCount: number;
  introTotal: number;
}): LessonGate {
  if (args.isAdmin || args.isPro) return { kind: "open" };

  const path = findLessonPath(args.lessonId);
  // Lesson in Intro path is always free
  if (path?.id === "intro") return { kind: "open" };

  // Non-intro path: must complete Intro first
  if (args.introCompletedCount < args.introTotal) {
    return {
      kind: "complete-intro-first",
      introDone: args.introCompletedCount,
      introTotal: args.introTotal,
    };
  }

  // Path-intro (first lesson of a path) is free; rest are Pro-only
  if (isLessonFree(args.lessonId)) return { kind: "open" };
  return { kind: "paywall" };
}

/** Convenience hook: combines auth+subscription+intro progress. */
export function useLessonGate(lessonId: string, introCompletedCount: number) {
  const ent = useEntitlement();
  const introTotal = (getPath("intro")?.modules ?? [])
    .flatMap((m) => m.lessons)
    .filter((l) => l.state === "available").length;
  const gate = decideLessonGate({
    lessonId,
    isPro: ent.isPro,
    isAdmin: ent.isAdmin,
    introCompletedCount,
    introTotal,
  });
  return { gate, entitlement: ent, introTotal, isLoaded: ent.isLoaded };
}

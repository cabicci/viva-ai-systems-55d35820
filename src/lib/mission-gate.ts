import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useEntitlement } from "@/lib/entitlements";
import type { IntroLessonContent } from "@/components/intro/intro-lesson-types";
import { loadIntroLessonContent, hasIntroLessonContent } from "@/components/intro/lessons";
import { adaptPackageMissionsFromSections, packageMissionId } from "@/lib/locale-lessons/adapt-package-to-live-mission";
import type { LocalizedLessonPackage } from "@/lib/locale-lessons/types";

/**
 * Mission Gate — controls whether the "Next Lesson" button is unlocked.
 *
 * A lesson is "gated" when its content array contains a `kind: "mission"`
 * block that has a `rubric` (i.e. it ships with AI evaluation). For gated
 * lessons we look up `mission_submissions` to see if the current user has
 * a row with `status='passed'` for `mission_id = ${lessonId}::mission`.
 *
 * If the lesson has no mission block, the gate is always "open".
 */

export const MISSION_PASSED_EVENT = "mission-gate:passed";

/** Dispatch a window event so listening gates refetch immediately. */
export function emitMissionPassed(missionId: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(MISSION_PASSED_EVENT, { detail: { missionId } }),
  );
}

export interface LessonMissionShape {
  missionId: string;
  prompt: string;
  intro: string;
  hasRubric: boolean;
}

function extractLessonMission(
  content: IntroLessonContent | null,
  lessonId: string,
): LessonMissionShape | null {
  if (!content) return null;
  for (const section of content) {
    if (section.block.kind === "mission") {
      const m = section.block;
      return {
        missionId: m.missionId ?? `${m.lessonId ?? lessonId}::mission`,
        intro: m.intro,
        prompt: m.prompt,
        hasRubric: Array.isArray(m.rubric) && m.rubric.length > 0,
      };
    }
  }
  return null;
}

export async function loadLessonMission(
  lessonId: string,
): Promise<LessonMissionShape | null> {
  if (!hasIntroLessonContent(lessonId)) return null;
  const content = await loadIntroLessonContent(lessonId);
  return extractLessonMission(content, lessonId);
}

export function extractMissionFromLocalizedPackage(
  pkg: Pick<LocalizedLessonPackage, "lessonId" | "sections">,
): LessonMissionShape | null {
  try {
    const missions = adaptPackageMissionsFromSections(pkg.lessonId, pkg.sections);
    if (missions.length === 0) return null;
    const mission = missions[0]!;
    return {
      missionId: mission.missionId,
      intro: mission.intro,
      prompt: mission.prompt,
      hasRubric: mission.rubric.length > 0,
    };
  } catch {
    return null;
  }
}

export function useLocalizedPackageMissionShape(
  pkg: LocalizedLessonPackage | null,
): LessonMissionShape | null {
  return React.useMemo(
    () => (pkg ? extractMissionFromLocalizedPackage(pkg) : null),
    [pkg],
  );
}

export function useLessonMissionShapeForPage(
  lessonId: string,
  localizedPackage: LocalizedLessonPackage | null,
  isLocalizedPackagePage: boolean,
): LessonMissionShape | null | undefined {
  const egyptianShape = useLessonMissionShape(lessonId);
  const packageShape = useLocalizedPackageMissionShape(localizedPackage);
  if (!isLocalizedPackagePage) return egyptianShape;
  return packageShape;
}

/** @deprecated Prefer loadLessonMission or useLessonMissionShape. */
export function getLessonMission(
  lessonId: string,
): LessonMissionShape | null {
  if (!hasIntroLessonContent(lessonId)) return null;
  return null;
}

export function useLessonMissionShape(
  lessonId: string,
): LessonMissionShape | null | undefined {
  const { data, isLoading } = useQuery({
    queryKey: ["lesson-mission-shape", lessonId],
    queryFn: () => loadLessonMission(lessonId),
    staleTime: Infinity,
  });
  if (isLoading) return undefined;
  return data ?? null;
}

export type MissionGateState =
  | { kind: "no-mission" }
  | { kind: "loading" }
  | { kind: "needs-mission"; missionId: string }
  | { kind: "passed"; missionId: string; score: number };

/**
 * Whether lesson navigation should be blocked by the mission gate.
 */
export function isLessonNavigationMissionLocked(
  missionGate: MissionGateState,
): boolean {
  return missionGate.kind === "needs-mission" || missionGate.kind === "loading";
}

const QK = ["mission-gate"] as const;

function useMissionGateWithShape(
  lessonId: string,
  missionShape: LessonMissionShape | null | undefined,
): MissionGateState {
  const { user } = useAuth();
  const { isAdmin } = useEntitlement();
  const qc = useQueryClient();
  const requiresMission = !!missionShape?.hasRubric && !isAdmin;
  const missionId = missionShape?.missionId ?? packageMissionId(lessonId);

  const { data, isLoading } = useQuery({
    queryKey: [...QK, missionId, user?.id ?? null],
    enabled: requiresMission && !!user?.id,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mission_submissions")
        .select("status, score")
        .eq("mission_id", missionId)
        .eq("user_id", user!.id)
        .eq("status", "passed")
        .order("evaluated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as { status: string; score: number | null } | null;
    },
  });

  const userId = user?.id ?? null;
  React.useEffect(() => {
    if (!requiresMission) return;
    const handler = (ev: Event) => {
      const detail = (ev as CustomEvent<{ missionId: string }>).detail;
      if (!detail || detail.missionId === missionId) {
        qc.invalidateQueries({ queryKey: [...QK, missionId, userId] });
      }
    };
    window.addEventListener(MISSION_PASSED_EVENT, handler);
    return () => window.removeEventListener(MISSION_PASSED_EVENT, handler);
  }, [requiresMission, missionId, qc, userId]);

  if (missionShape === undefined) return { kind: "loading" };
  if (!requiresMission) return { kind: "no-mission" };
  if (!user) return { kind: "needs-mission", missionId };
  if (isLoading) return { kind: "loading" };
  if (data?.status === "passed") {
    return { kind: "passed", missionId, score: Number(data.score ?? 0) };
  }
  return { kind: "needs-mission", missionId };
}

export function useMissionGate(lessonId: string): MissionGateState {
  const missionShape = useLessonMissionShape(lessonId);
  return useMissionGateWithShape(lessonId, missionShape);
}

export function useMissionGateForPage(
  lessonId: string,
  localizedPackage: LocalizedLessonPackage | null,
  isLocalizedPackagePage: boolean,
): MissionGateState {
  const missionShape = useLessonMissionShapeForPage(
    lessonId,
    localizedPackage,
    isLocalizedPackagePage,
  );
  return useMissionGateWithShape(lessonId, missionShape);
}
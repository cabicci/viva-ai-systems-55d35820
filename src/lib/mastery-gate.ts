import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { getLessonMission } from "@/lib/mission-gate";
import type { CurriculumModule } from "@/lib/curriculum-data";

/**
 * Mastery Gate — bridges single-lesson mission gating to module-level
 * "you can't move on until you actually passed the work" gating.
 *
 * Source of truth: `mission_submissions.status = 'passed'` for every
 * shipped lesson in the module that ships with a rubric-backed mission.
 */

export interface ModuleMastery {
  /** every gated mission in the module has a `passed` submission */
  isMastered: boolean;
  /** `${lessonId}::mission` ids still missing a passed submission */
  missingMissionIds: string[];
  /** total gated missions in the module (for UX copy) */
  totalGatedMissions: number;
  /** count of passed gated missions (for UX copy) */
  passedCount: number;
}

/** Pure — gated mission ids for shipped lessons inside a module. */
export function getModuleGatedMissionIds(module: CurriculumModule): string[] {
  const out: string[] = [];
  for (const lesson of module.lessons) {
    if (lesson.state !== "available") continue;
    const m = getLessonMission(lesson.id);
    if (m?.hasRubric) out.push(`${lesson.id}::mission`);
  }
  return out;
}

/**
 * Fetches passed-mission ids for the current user across every gated
 * mission in the supplied modules. One query for the whole curriculum
 * view — cheap and cached.
 */
export function useModulesMastery(modules: CurriculumModule[]): {
  mastery: Record<string, ModuleMastery>;
  isLoaded: boolean;
} {
  const { user, loading } = useAuth();
  const userId = user?.id ?? null;

  const allGatedMissionIds = React.useMemo(() => {
    const set = new Set<string>();
    for (const m of modules) {
      for (const id of getModuleGatedMissionIds(m)) set.add(id);
    }
    return Array.from(set);
  }, [modules]);

  const { data: passedSet = new Set<string>(), isSuccess } = useQuery({
    queryKey: ["mastery-gate", userId, allGatedMissionIds.length],
    enabled: !!userId && allGatedMissionIds.length > 0,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mission_submissions")
        .select("mission_id")
        .eq("user_id", userId!)
        .eq("status", "passed")
        .in("mission_id", allGatedMissionIds);
      if (error) throw error;
      return new Set((data ?? []).map((r) => r.mission_id as string));
    },
  });

  const mastery = React.useMemo(() => {
    const out: Record<string, ModuleMastery> = {};
    for (const m of modules) {
      const gated = getModuleGatedMissionIds(m);
      const missing = gated.filter((id) => !passedSet.has(id));
      out[m.id] = {
        isMastered: missing.length === 0,
        missingMissionIds: missing,
        totalGatedMissions: gated.length,
        passedCount: gated.length - missing.length,
      };
    }
    return out;
  }, [modules, passedSet]);

  const isLoaded =
    !loading && (!userId || allGatedMissionIds.length === 0 || isSuccess);

  return { mastery, isLoaded };
}
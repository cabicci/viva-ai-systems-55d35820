import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { loadLessonMission } from "@/lib/mission-gate";
import type { CurriculumModule } from "@/lib/curriculum-data";

/**
 * Mastery Gate — bridges single-lesson mission gating to module-level
 * "you can't move on until you actually passed the work" gating.
 *
 * Source of truth: `mission_submissions.status = 'passed'` for every
 * shipped lesson in the module that ships with a rubric-backed mission.
 * Skipped rows (`submission_metadata.skipped = true`) unlock the lesson
 * via mission-gate but do not count here.
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

/** Gated mission ids for shipped lessons inside a module (requires loaded shapes). */
function moduleGatedMissionIds(
  module: CurriculumModule,
  missionShapes: Map<string, Awaited<ReturnType<typeof loadLessonMission>>>,
): string[] {
  const out: string[] = [];
  for (const lesson of module.lessons) {
    if (lesson.state !== "available") continue;
    const m = missionShapes.get(lesson.id);
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

  const lessonIds = React.useMemo(() => {
    const ids = new Set<string>();
    for (const m of modules) {
      for (const lesson of m.lessons) {
        if (lesson.state === "available") ids.add(lesson.id);
      }
    }
    return Array.from(ids);
  }, [modules]);

  const { data: missionShapes = new Map(), isSuccess: shapesLoaded } = useQuery({
    queryKey: ["module-mission-shapes", lessonIds],
    enabled: lessonIds.length > 0,
    staleTime: Infinity,
    queryFn: async () => {
      const entries = await Promise.all(
        lessonIds.map(
          async (id) => [id, await loadLessonMission(id)] as const,
        ),
      );
      return new Map(entries);
    },
  });

  const allGatedMissionIds = React.useMemo(() => {
    const set = new Set<string>();
    for (const m of modules) {
      for (const id of moduleGatedMissionIds(m, missionShapes)) set.add(id);
    }
    return Array.from(set);
  }, [modules, missionShapes]);

  const { data: passedSet = new Set<string>(), isSuccess } = useQuery({
    // Array key — avoids the ambiguity of joining IDs into a string.
    queryKey: ["mastery-gate", userId, allGatedMissionIds],
    enabled: !!userId && allGatedMissionIds.length > 0,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mission_submissions")
        .select("mission_id, submission_metadata")
        .eq("user_id", userId!)
        .eq("status", "passed")
        .in("mission_id", allGatedMissionIds);
      if (error) throw error;
      return new Set(
        (data ?? [])
          .filter((r) => {
            const meta =
              (r.submission_metadata as Record<string, unknown> | null) ?? {};
            return meta.skipped !== true;
          })
          .map((r) => r.mission_id as string),
      );
    },
  });

  const mastery = React.useMemo(() => {
    const out: Record<string, ModuleMastery> = {};
    for (const m of modules) {
      const gated = moduleGatedMissionIds(m, missionShapes);
      const missing = gated.filter((id) => !passedSet.has(id));
      out[m.id] = {
        isMastered: missing.length === 0,
        missingMissionIds: missing,
        totalGatedMissions: gated.length,
        passedCount: gated.length - missing.length,
      };
    }
    return out;
  }, [modules, missionShapes, passedSet]);

  const isLoaded =
    !loading &&
    shapesLoaded &&
    (!userId || allGatedMissionIds.length === 0 || isSuccess);

  return { mastery, isLoaded };
}
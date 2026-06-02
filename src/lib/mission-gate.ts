import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { INTRO_LESSON_CONTENT } from "@/components/intro/lessons";

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
  prompt: string;
  intro: string;
  hasRubric: boolean;
}

/** Pure introspection — does this lesson ship with a gated mission? */
export function getLessonMission(
  lessonId: string,
): LessonMissionShape | null {
  const content = INTRO_LESSON_CONTENT[lessonId];
  if (!content) return null;
  for (const section of content) {
    if (section.block.kind === "mission") {
      const m = section.block;
      return {
        intro: m.intro,
        prompt: m.prompt,
        hasRubric: Array.isArray(m.rubric) && m.rubric.length > 0,
      };
    }
  }
  return null;
}

export type MissionGateState =
  | { kind: "no-mission" }
  | { kind: "loading" }
  | { kind: "needs-mission"; missionId: string }
  | { kind: "passed"; missionId: string; score: number };

const QK = ["mission-gate"] as const;

export function useMissionGate(lessonId: string): MissionGateState {
  const { user } = useAuth();
  const qc = useQueryClient();
  const missionShape = React.useMemo(
    () => getLessonMission(lessonId),
    [lessonId],
  );
  const requiresMission = !!missionShape?.hasRubric;
  const missionId = `${lessonId}::mission`;

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

  React.useEffect(() => {
    if (!requiresMission) return;
    const handler = (ev: Event) => {
      const detail = (ev as CustomEvent<{ missionId: string }>).detail;
      if (!detail || detail.missionId === missionId) {
        qc.invalidateQueries({ queryKey: [...QK, missionId] });
      }
    };
    window.addEventListener(MISSION_PASSED_EVENT, handler);
    return () => window.removeEventListener(MISSION_PASSED_EVENT, handler);
  }, [requiresMission, missionId, qc]);

  if (!requiresMission) return { kind: "no-mission" };
  if (!user) return { kind: "needs-mission", missionId };
  if (isLoading) return { kind: "loading" };
  if (data?.status === "passed") {
    return { kind: "passed", missionId, score: Number(data.score ?? 0) };
  }
  return { kind: "needs-mission", missionId };
}
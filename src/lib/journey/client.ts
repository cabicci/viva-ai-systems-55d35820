import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import type { SupportedLocale } from "@/lib/locale/types";
import type { LearningLine } from "@/lib/learning-lines";
import type { JourneyVisit } from "./model";
export const visitsKey = (user: string | undefined) => ["journey-visits", user] as const;
export function useJourneyVisits() {
  const { user } = useAuth();
  return useQuery({
    queryKey: visitsKey(user?.id),
    enabled: !!user?.id,
    staleTime: 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("journey_visits" as never)
        .select("line,course_id,subject_id,profile_id,lesson_id,locale,visited_at")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data as unknown as JourneyVisit[];
    },
  });
}
export function useRecordJourneyVisit(
  line: LearningLine,
  course: string,
  lesson: string,
  locale: SupportedLocale,
  allowed: boolean,
  profile?: string,
) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setFailed(false);
    if (!user?.id || !allowed || (line === "kids" && (!profile || profile === user.id))) return;
    void (async () =>
      supabase.from("journey_visits" as never).upsert(
        {
          user_id: user.id,
          line,
          course_id: course,
          subject_id: profile ?? user.id,
          profile_id: profile ?? null,
          lesson_id: lesson,
          locale,
        } as never,
        { onConflict: "user_id,line,course_id,subject_id" },
      ))()
      .then(({ error }) => {
        if (active) setFailed(!!error);
        if (!error) void qc.invalidateQueries({ queryKey: visitsKey(user.id) });
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [user?.id, line, course, lesson, locale, allowed, profile, qc, attempt]);
  return { failed, retry: () => setAttempt((n) => n + 1) };
}
export type KidsCompletion = {
  profile_id: string;
  level_id: string;
  lesson_number: number;
  locale: string;
};
export function useKidsCompletion(
  profile: string,
  level: string,
  locale: SupportedLocale,
  enabled = true,
) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["kids-completion", user?.id, profile, level, locale],
    enabled: !!user?.id && !!profile && profile !== user.id && enabled,
    staleTime: 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kids_lesson_progress" as never)
        .select("profile_id,level_id,lesson_number,locale")
        .eq("profile_id", profile)
        .eq("level_id", level)
        .eq("locale", locale);
      if (error) throw error;
      return data as unknown as KidsCompletion[];
    },
  });
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import type { SupportedLocale } from "@/lib/locale/types";
import type { TechnicalLesson } from "./types";
import type { PilotCopy } from "../../../scripts/technical-education/source/furniture-pilot/content";

export type TechnicalProgress = {
  read?: boolean;
  quizPassed?: boolean;
  practiceReviewed?: boolean;
  drafts?: Record<string, string[] | Record<string, string>>;
};
export type QuizResult = {
  allowed: boolean;
  score: number;
  total: number;
  passed: boolean;
  feedback: { id: string; correct: boolean; explanation?: string }[];
};
export type Delivery = {
  allowed: boolean;
  kind: "lesson" | "cabinet";
  lesson: TechnicalLesson | PilotCopy;
  video: string;
  files: { kind: string; path: string }[];
};
export async function technicalCommand<T>(
  action: string,
  lesson?: string,
  locale?: SupportedLocale,
  data: unknown = {},
) {
  const result = await supabase.rpc(
    "technical_command" as never,
    { p_action: action, p_lesson: lesson ?? null, p_locale: locale ?? null, p_data: data } as never,
  );
  if (result.error) throw new Error("TECHNICAL_UNAVAILABLE");
  return result.data as T;
}
export const progressKey = (user: string | undefined) => ["technical-progress", user];
export function useTechnicalProgress() {
  const { user } = useAuth();
  const client = useQueryClient();
  const query = useQuery({
    queryKey: progressKey(user?.id),
    enabled: !!user?.id,
    queryFn: () =>
      technicalCommand<{
        paid: boolean;
        stripe: boolean;
        progress: Record<string, TechnicalProgress>;
      }>("status"),
    staleTime: 30000,
  });
  const mutation = useMutation({
    mutationFn: async (input: {
      id: string;
      locale: SupportedLocale;
      action: string;
      data?: unknown;
    }) => {
      if (input.action === "refresh") return { allowed: true };
      const result = await technicalCommand<{ allowed: boolean }>(
        input.action,
        input.id,
        input.locale,
        input.data,
      );
      if (!result.allowed) throw new Error("TECHNICAL_ACCESS_REQUIRED");
      return result;
    },
    onSuccess: () => client.invalidateQueries({ queryKey: progressKey(user?.id) }),
  });
  return {
    progress: query.data?.progress ?? {},
    paid: query.data?.paid ?? false,
    stripe: query.data?.stripe ?? false,
    loading: query.isPending,
    error: query.isError,
    update: mutation.mutateAsync,
    busy: mutation.isPending,
  };
}
export function technicalCompleted(entry?: TechnicalProgress) {
  return (
    Number(entry?.read === true) +
    Number(entry?.quizPassed === true) +
    Number(entry?.practiceReviewed === true)
  );
}
export async function technicalDownload(path: string, name: string) {
  const result = await supabase.storage
    .from("technical-downloads")
    .createSignedUrl(path, 300, { download: name });
  if (result.error || !result.data?.signedUrl) throw new Error("TECHNICAL_DOWNLOAD_UNAVAILABLE");
  window.location.assign(result.data.signedUrl);
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import type { SupportedLocale } from "@/lib/locale/types";
import type { TechnicalLesson } from "./types";
import type { PilotCopy } from "../../../scripts/technical-education/source/furniture-pilot/content";

import { QuizCommandLane, TechnicalCommandError, validQuizIntent, validQuizRevision, type QuizAction, type QuizCommandResult } from "./quiz-command-intent";

export type TechnicalProgress = {
  quizRevision?: number;
  read?: boolean;
  quizPassed?: boolean;
  practiceReviewed?: boolean;
  drafts?: Record<string, string[] | Record<string, string>>;
};
export type QuizResult = QuizCommandResult & {
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
  if (action === "quiz" || action === "reset_quiz") {
    const body = data as Record<string, unknown> | null;
    const command = body?._technicalCommand as { actorId?: string } | undefined;
    const { _technicalCommand, ...payload } = body ?? {};
    if (!validQuizIntent({ action, lessonId: lesson, locale, data: payload, _technicalCommand }, command?.actorId ?? "", lesson ?? "")) {
      throw new TechnicalCommandError("TECHNICAL_COMMAND_REQUIRED");
    }
  }
  const result = await supabase.rpc(
    "technical_command" as never,
    { p_action: action, p_lesson: lesson ?? null, p_locale: locale ?? null, p_data: data } as never,
  );
  if (result.error) {
    const known = new Set(["TECHNICAL_COMMAND_REQUIRED", "TECHNICAL_COMMAND_INVALID", "TECHNICAL_COMMAND_ACTOR_MISMATCH", "TECHNICAL_COMMAND_CONFLICT", "LEARNING_REQUEST_MISMATCH"]);
    throw new TechnicalCommandError(known.has(result.error.message) ? result.error.message : "TECHNICAL_UNAVAILABLE");
  }
  return result.data as T;
}
export type TechnicalStatus = { paid: boolean; stripe: boolean; progress: Record<string, TechnicalProgress> };
const quizLanes = new Map<string, QuizCommandLane>();
function quizLane(actorId: string, lessonId: string) {
  const key=JSON.stringify([actorId,lessonId]);
  let lane=quizLanes.get(key);
  if (!lane) {
    lane=new QuizCommandLane({actorId,lessonId,
      storage:{getItem:key=>window.sessionStorage.getItem(key),setItem:(key,value)=>window.sessionStorage.setItem(key,value),removeItem:key=>window.sessionStorage.removeItem(key)},
      send:intent=>technicalCommand<QuizCommandResult>(intent.action,intent.lessonId,intent.locale,{...intent.data,_technicalCommand:intent._technicalCommand}),
      readRevision:async()=>{
        const status=await technicalCommand<TechnicalStatus>("status");
        if (!status?.progress || typeof status.progress!=="object" || Array.isArray(status.progress)) throw new TechnicalCommandError("TECHNICAL_COMMAND_INVALID_RESPONSE");
        const record=status.progress[lessonId];
        const revision=record===undefined?0:record.quizRevision;
        if (!validQuizRevision(revision)) throw new TechnicalCommandError("TECHNICAL_COMMAND_INVALID_RESPONSE");
        return revision;
      },
    });quizLanes.set(key,lane);
  }
  return lane;
}
export function technicalQuizCommand<T extends QuizCommandResult>(actorId:string,lessonId:string,locale:SupportedLocale,action:QuizAction,data:Record<string,unknown>,displayedRevision:number|null,current:()=>boolean):Promise<T> {
  return quizLane(actorId,lessonId).run<T>(action,locale,data,displayedRevision,current);
}
export function reconcileTechnicalQuiz(actorId:string,lessonId:string,current:()=>boolean):Promise<void> {
  return quizLane(actorId,lessonId).reconcile(current);
}
export function displayedQuizRevision(record:TechnicalProgress|undefined,confirmed:boolean):number|null {
  if(!confirmed) return null;
  const revision=record===undefined?0:record.quizRevision;
  return validQuizRevision(revision)?revision:null;
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
    onSuccess: () => client.invalidateQueries({ queryKey: progressKey(user?.id) }, { throwOnError: true }),
  });
  return {
    progress: query.data?.progress ?? {},
    confirmed: query.isSuccess && !query.isError && !!query.data?.progress && typeof query.data.progress==="object" && !Array.isArray(query.data.progress),
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

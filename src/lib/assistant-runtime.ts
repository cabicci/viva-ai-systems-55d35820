import { supabase } from "@/integrations/supabase/client";

/**
 * Assistant Runtime — frontend service.
 *
 * Calls the `assistant-runtime` Edge Function. No API keys are sent from the
 * frontend — all future model providers are reached from the backend only.
 */

export interface AssistantRuntimeRequestPayload {
  query: string;
  learnerContext: {
    currentPath?: string | null;
    currentModule?: string | null;
    currentLesson?: string | null;
    currentPathTitle?: string | null;
    currentModuleTitle?: string | null;
    currentLessonTitle?: string | null;
    completedLessonsCount?: number | null;
    totalLessonsCount?: number | null;
    nextLessonTitle?: string | null;
    currentMission?: {
      intro?: string | null;
      prompt?: string | null;
    } | null;
  };
  retrievalResults?: unknown[];
}

export interface AssistantRuntimeResponsePayload {
  ok: boolean;
  runtime: "connected" | "disconnected";
  receivedQuery: string;
  retrievalCount: number;
  contextDetected: boolean;
  learnerContext: {
    currentPath: string | null;
    currentModule: string | null;
    currentLesson: string | null;
  };
  message: string;
  ts: string;
  answer?: string;
}

export async function callAssistantRuntime(
  payload: AssistantRuntimeRequestPayload,
): Promise<AssistantRuntimeResponsePayload> {
  const { data, error } = await supabase.functions.invoke<
    AssistantRuntimeResponsePayload
  >("assistant-runtime", {
    body: payload,
  });

  if (error) {
    throw new Error(error.message || "Assistant runtime call failed");
  }
  if (!data) {
    throw new Error("Assistant runtime returned an empty response");
  }
  return data;
}
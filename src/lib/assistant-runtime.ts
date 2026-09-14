import { supabase } from "@/integrations/supabase/client";
import type { RagPackageLocale } from "@/lib/locale-lessons/types";
import { validateRuntimeLocale } from "@/lib/rag/assistant-grounding-security";

/**
 * Assistant Runtime — frontend service.
 *
 * Calls the `assistant-runtime` Edge Function. No API keys are sent from the
 * frontend — all future model providers are reached from the backend only.
 */

export interface AssistantRuntimeRequestPayload {
  query: string;
  learnerContext: {
    locale: RagPackageLocale;
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

function assertCanonicalRequestLocale(locale: unknown): asserts locale is RagPackageLocale {
  const result = validateRuntimeLocale(locale);
  if (!result.ok) {
    throw new Error(`Invalid assistant runtime locale: ${result.reason}`);
  }
}

export async function callAssistantRuntime(
  payload: AssistantRuntimeRequestPayload,
): Promise<AssistantRuntimeResponsePayload> {
  assertCanonicalRequestLocale(payload.learnerContext?.locale);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const accessToken = session?.access_token;
  if (!accessToken) {
    throw new Error("سجّل دخولك الأول عشان مساعد المنصة يقدر يساعدك.");
  }

  const { data, error } = await supabase.functions.invoke<AssistantRuntimeResponsePayload>(
    "assistant-runtime",
    {
      body: payload,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (error) {
    throw new Error(error.message || "Assistant runtime call failed");
  }
  if (!data) {
    throw new Error("Assistant runtime returned an empty response");
  }
  return data;
}

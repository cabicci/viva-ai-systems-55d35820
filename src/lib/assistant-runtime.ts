import { supabase } from "@/integrations/supabase/client";
import type { RagPackageLocale } from "@/lib/locale-lessons/types";
import { validateRuntimeLocale } from "@/lib/rag/assistant-grounding-security";
import { getUiString } from "@/lib/locale/ui-strings";
import type { AssistantCitation } from "@/lib/assistant-session-store";

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
  citations?: AssistantCitation[];
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
  const locale = payload.learnerContext.locale;
  if (!accessToken) {
    throw new Error(getUiString(locale, "assistant.panel.error.auth"));
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
    // Expected denials (no AI access / quota) come back as non-2xx with a JSON body.
    let code: string | undefined;
    let reason: string | undefined;
    try {
      const ctx = (error as { context?: Response }).context;
      if (ctx && typeof ctx.clone === "function") {
        const body = (await ctx.clone().json()) as { error?: string; reason?: string };
        code = body?.error;
        reason = body?.reason;
      }
    } catch {
      /* body not JSON — fall through */
    }
    const status = (error as { context?: Response }).context?.status;
    if (status === 401 || code === "UNAUTHORIZED") {
      throw new Error(getUiString(locale, "assistant.panel.error.auth"));
    }
    if (code === "AI_ACCESS_DENIED") {
      throw new Error(getUiString(locale, "assistant.panel.error.access"));
    }
    if (code?.includes("QUOTA_EXCEEDED") || status === 429) {
      throw new Error(getUiString(locale, "assistant.panel.error.quota"));
    }
    if (reason === "insufficient_grounding") {
      throw new Error(getUiString(locale, "assistant.panel.error.grounding"));
    }
    throw new Error(getUiString(locale, "assistant.panel.error.connection"));
  }
  if (!data) {
    throw new Error(getUiString(locale, "assistant.panel.error.connection"));
  }
  return data;
}

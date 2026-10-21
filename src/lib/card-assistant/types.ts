import type { SupportedLocale } from "@/lib/locale/types";

export type AssistantArea = "ai" | "kids" | "technical" | "academic";
export type AssistantScope = {
  area: AssistantArea;
  cardId: string;
  stepId?: string;
  locale: SupportedLocale;
  profileId?: string;
};
export type AssistantCitation = { id: string; label: string; stepId: string; sourceId: string; href?: string };
export type AssistantReply = {
  status: number;
  answer?: string;
  citations?: AssistantCitation[];
  error?: string;
};
export type AssistantExchange = { question: string; answer: string };
export type AssistantQuestion = { scope: AssistantScope; query: string; requestId: string; history?: AssistantExchange[] };
export type AssistantAdapter = (question: AssistantQuestion) => Promise<AssistantReply>;

export function assistantScopeKey(scope: AssistantScope, accountId?: string | null): string {
  return JSON.stringify([accountId ?? null, scope.area, scope.cardId, scope.stepId ?? null,
    scope.locale, scope.profileId ?? null]);
}

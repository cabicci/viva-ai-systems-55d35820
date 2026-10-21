import type { AssistantCitation, AssistantScope } from "./types";
export type ConversationTurn = { question: string; answer: string; citations: AssistantCitation[] };
export function historyKey(scope: AssistantScope, accountId: string): string {
  // Versioned namespace deliberately cannot load old unscoped assistant history.
  return `masaarat.card-assistant.v1:${JSON.stringify([accountId, scope.area, scope.cardId, scope.profileId ?? null, scope.locale])}`;
}
export function readHistory(key: string | null): ConversationTurn[] {
  if (!key || typeof window === "undefined") return [];
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(key) ?? "[]");
    if (!Array.isArray(value) || value.length > 20) return [];
    return value.filter((turn): turn is ConversationTurn => !!turn && typeof turn === "object" &&
      typeof turn.question === "string" && turn.question.length <= 1500 &&
      typeof turn.answer === "string" && turn.answer.length <= 16000 &&
      Array.isArray(turn.citations) && turn.citations.length <= 12 && turn.citations.every((c: AssistantCitation) =>
        c && [c.id, c.label, c.stepId, c.sourceId].every(s => typeof s === "string" && s.length <= 500) &&
        (c.href === undefined || (typeof c.href === "string" && c.href.length <= 2000))));
  } catch { return []; }
}
export function writeHistory(key: string | null, turns: ConversationTurn[]): void {
  if (!key || typeof window === "undefined") return;
  try {
    if (turns.length) window.localStorage.setItem(key, JSON.stringify(turns.slice(-20)));
    else window.localStorage.removeItem(key);
  } catch { /* Conversation still works when device storage is unavailable. */ }
}

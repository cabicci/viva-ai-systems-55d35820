import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { AssistantRuntimeResponsePayload } from "./assistant-runtime";

export type AssistantCitation = {
  lessonId: string;
  title: string;
  productionRoute: string | null;
  excerpt: string;
};

export type AssistantTurn = {
  query: string;
  answer: string;
  citations: AssistantCitation[];
};

export interface AssistantSessionState {
  query: string;
  loading: boolean;
  error: string | null;
  response: AssistantRuntimeResponsePayload | null;
  turns: AssistantTurn[];
}

const EMPTY_STATE: AssistantSessionState = {
  query: "",
  loading: false,
  error: null,
  response: null,
  turns: [],
};

const HISTORY_PREFIX = "masaarat-assistant-history:";
const MAX_TURNS = 20;

function historyKey(userId: string) {
  return `${HISTORY_PREFIX}${userId}`;
}

export function loadAssistantHistory(userId: string) {
  if (typeof window === "undefined") return;
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(historyKey(userId)) ?? "[]");
    if (!Array.isArray(parsed)) return;
    const turns = parsed
      .filter(
        (turn): turn is AssistantTurn =>
          typeof turn?.query === "string" &&
          typeof turn?.answer === "string" &&
          Array.isArray(turn?.citations) &&
          turn.citations.every(
            (citation: unknown) =>
              typeof citation === "object" &&
              citation !== null &&
              typeof (citation as AssistantCitation).lessonId === "string" &&
              typeof (citation as AssistantCitation).title === "string" &&
              typeof (citation as AssistantCitation).excerpt === "string" &&
              (typeof (citation as AssistantCitation).productionRoute === "string" ||
                (citation as AssistantCitation).productionRoute === null),
          ),
      )
      .slice(-MAX_TURNS);
    setAssistantSession({ turns });
  } catch {
    // Storage can be unavailable or contain stale data; keep the current session usable.
  }
}

export function appendAssistantTurn(userId: string, turn: AssistantTurn) {
  const turns = [...state.turns, turn].slice(-MAX_TURNS);
  setAssistantSession({ turns });
  try {
    localStorage.setItem(historyKey(userId), JSON.stringify(turns));
  } catch {
    // A full or disabled storage area must not block the answer.
  }
}

export function clearAssistantHistory(userId: string) {
  setAssistantSession({ turns: [], response: null, error: null });
  try {
    localStorage.removeItem(historyKey(userId));
  } catch {
    // In-memory history is still cleared.
  }
}

let state: AssistantSessionState = EMPTY_STATE;
let sessionVersion = 0;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function setAssistantSession(patch: Partial<AssistantSessionState>) {
  state = { ...state, ...patch };
  emit();
}

export function resetAssistantSession() {
  sessionVersion += 1;
  state = EMPTY_STATE;
  emit();
}

export function getAssistantSessionVersion() {
  return sessionVersion;
}

export function getAssistantSession() {
  return state;
}

export function useAssistantSession() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
    () => state,
  );
}

// Drop session state on sign-out so the next account on the same tab
// doesn't inherit the previous user's assistant query/response.
if (typeof window !== "undefined") {
  supabase.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT") resetAssistantSession();
  });
}

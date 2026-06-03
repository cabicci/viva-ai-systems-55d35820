import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RetrievalResult } from "./platform-retrieval";
import type { AssistantRuntimeResponsePayload } from "./assistant-runtime";

export interface AssistantSessionState {
  query: string;
  loading: boolean;
  error: string | null;
  response: AssistantRuntimeResponsePayload | null;
  matches: RetrievalResult[];
}

const EMPTY_STATE: AssistantSessionState = {
  query: "",
  loading: false,
  error: null,
  response: null,
  matches: [],
};

let state: AssistantSessionState = EMPTY_STATE;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function setAssistantSession(patch: Partial<AssistantSessionState>) {
  state = { ...state, ...patch };
  emit();
}

export function resetAssistantSession() {
  state = EMPTY_STATE;
  emit();
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
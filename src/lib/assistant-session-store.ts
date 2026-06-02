import { useSyncExternalStore } from "react";
import type { RetrievalResult } from "./platform-retrieval";
import type { AssistantRuntimeResponsePayload } from "./assistant-runtime";

export interface AssistantSessionState {
  query: string;
  loading: boolean;
  error: string | null;
  response: AssistantRuntimeResponsePayload | null;
  matches: RetrievalResult[];
}

let state: AssistantSessionState = {
  query: "",
  loading: false,
  error: null,
  response: null,
  matches: [],
};

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function setAssistantSession(patch: Partial<AssistantSessionState>) {
  state = { ...state, ...patch };
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
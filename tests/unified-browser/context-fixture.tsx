import { useSyncExternalStore } from "react";
import { PATHS } from "../../src/lib/curriculum-data";
const listeners = new Set<() => void>();
let state = { actor: "browser-fixture-a", locale: "en", denied: false,
  generation: Object.freeze({ value: 1 }), continuity: Object.freeze({ continuity: 1 }) };
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
const snapshot = () => state;
function observe() { return useSyncExternalStore(subscribe, snapshot); }
export function changeFixture(change: { actor?: string; locale?: string; denied?: boolean }) {
  const rotates = change.actor !== undefined && change.actor !== state.actor;
  state = { ...state, ...change, ...(rotates ? { generation: Object.freeze({ value: state.generation.value + 1 }),
    continuity: Object.freeze({ continuity: state.continuity.continuity + 1 }) } : {}) };
  document.dir = state.locale === "en" ? "ltr" : "rtl"; document.documentElement.lang = state.locale;
  for (const listener of listeners) listener();
}
export function useAuth() {
  const value = observe();
  return { user: { id: value.actor }, session: null, loading: false, authError: null,
    authGeneration: value.generation, authContinuity: value.continuity,
    isAuthGenerationCurrent: (captured: object) => captured === state.generation, signOut: async () => {} };
}
export function useLocale() {
  const value = observe(); return { locale: value.locale, dir: value.locale === "en" ? "ltr" : "rtl", lang: value.locale };
}
export function useLearnerContext() {
  const value = observe(), path = PATHS.find(path => path.id === "intro")!;
  return { currentUser: { id: value.actor, email: null, isAuthenticated: true }, currentRoute: "/learn/intro/browser-fixture",
    currentPath: path, currentModule: path.modules[0], currentLesson: null, currentLessonStatus: null,
    currentMission: null, completedLessonsCount: 0, totalLessonsCount: 1, overallCompletedLessonsCount: 0,
    overallTotalLessonsCount: 1, overallNextLesson: null, lastCompletedLesson: null, nextLesson: null,
    isReady: true, contentError: null, resolvedAt: "explicit-browser-fixture" };
}
export const fixtureCalls: unknown[] = [];
export const supabase = {
  auth: { getSession: async () => ({ data: { session: { access_token: "explicit-browser-fixture-token" } } }) },
  functions: { invoke: async (_name: string, options: { body: unknown }) => {
    fixtureCalls.push(options.body);
    await new Promise(resolve => setTimeout(resolve, 60));
    if (state.denied) return { data: null, error: { context: new Response(JSON.stringify({ error: "QUOTA_EXCEEDED" }), { status: 429 }) } };
    return { error: null, data: { ok: true, answer: "**Owned browser explanation**", citations: [
      { lessonId: "fixture-source", title: "Fixture source", chunkId: "fixture-source/s0/c0", citationId: "fixture-citation",
        productionRoute: "/learn/intro/fixture-source" } ] } };
  } },
};

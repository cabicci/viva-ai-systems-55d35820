import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";

export type JourneyReadStatus = "unavailable" | "loading" | "ready" | "error" | "retired";
export type JourneyCloudLog = Readonly<{
  id: string; type: string; lesson_id: string | null; title: string;
  short_description: string; created_at: string;
  metadata: Readonly<{ local_id?: string; module_id?: string | null; local_timestamp?: number }> | null;
}>;
export type JourneyCloudMission = Readonly<{ mission_id: string; state: string; created_at: string; updated_at: string }>;
export type JourneyReadData = Readonly<{ logs: readonly JourneyCloudLog[]; missions: readonly JourneyCloudMission[] }>;
export type JourneyReadView = Readonly<{
  then: undefined; status: JourneyReadStatus;
  logs: readonly JourneyCloudLog[] | undefined; missions: readonly JourneyCloudMission[] | undefined;
  error: unknown; logLimit: 500; completeHistory: false;
  retry: () => Promise<JourneyReadView>;
}>;
export type JourneyReadBox<T> = Readonly<{ then: undefined; value: T }>;
export const boxJourneyRead = <T,>(value: T): JourneyReadBox<T> => Object.freeze({ then: undefined, value });

// Only the ordinary same-realm, default-species, unchanged-intrinsic domain.
// A failed brand/attach check is NOT reported as successful observation.
export function observeJourneyNative(value: unknown): boolean {
  try { Reflect.apply(Promise.prototype.then, value, [() => undefined, () => undefined]); return true; }
  catch { return false; }
}
function adoptJourneyRead(pending: unknown, requireCurrent: () => void): Promise<JourneyReadBox<unknown>> {
  const task = new Promise<JourneyReadBox<unknown>>((resolve, reject) => {
    const seen = new Set<object>();
    const fail = (error: unknown) => { observeJourneyNative(pending); observeJourneyNative(error); reject(error); };
    const advance = (value: unknown) => {
      const native = observeJourneyNative(value);
      try {
        requireCurrent();
        if (value !== null && (typeof value === "object" || typeof value === "function")) {
          const then = native ? Promise.prototype.then : Reflect.get(value, "then"); observeJourneyNative(then); requireCurrent();
          if (typeof then === "function") {
            if (seen.has(value)) throw new Error("Cyclic owned cloud read");
            seen.add(value); let settled = false;
            const accept = (next: unknown) => {
              observeJourneyNative(next); if (settled) return;
              settled = true; queueMicrotask(() => advance(next));
            };
            const decline = (error: unknown) => { observeJourneyNative(error); if (!settled) { settled = true; fail(error); } };
            try { const derived = Reflect.apply(then, value, [accept, decline]); observeJourneyNative(derived); }
            catch (error) { observeJourneyNative(error); if (!settled) { settled = true; fail(error); } }
            return;
          }
        }
        requireCurrent(); resolve(boxJourneyRead(value));
      } catch (error) { fail(error); }
    };
    observeJourneyNative(pending); queueMicrotask(() => advance(pending));
  });
  observeJourneyNative(task); return task;
}
export interface JourneyReadOperation {
  readonly actor: string;
  requireCurrent: () => void;
  read: <T>(get: () => T) => T;
  adopt: (pending: unknown) => Promise<JourneyReadBox<unknown>>;
}
type Reader = (operation: JourneyReadOperation) => Promise<JourneyReadBox<JourneyReadData>>;
type Auth = ReturnType<typeof useAuth>;
type Input = Readonly<{
  actor: string | null; loading: boolean; generation: Auth["authGeneration"] | undefined;
  life: object | null; client: ReturnType<typeof useQueryClient>; enabled: boolean;
}>;
export interface JourneyReadController {
  readonly life: object | null;
  readonly input: Input;
  readonly view: JourneyReadView;
  readonly retired: () => boolean;
  retire: () => false;
  subscribe: (listener: () => void) => () => void;
  getRevision: () => number;
  installReader: (reader: Reader) => () => void;
}
function createController(input: Input, live: () => { auth: Auth; frame: JourneyReadController | null; life: object | null }): JourneyReadController {
  Object.freeze(input);
  let retired = false, checking = false, revision = 0;
  let reader: Reader | null = null, action: object | null = null, publishedAction: object | null = null;
  let status: JourneyReadStatus = "loading", data: JourneyReadData | undefined, error: unknown = null;
  const listeners = new Set<() => void>();
  const retire = () => { retired = true; reader = null; listeners.clear(); return false as const; };
  const owns = () => { const now = live(); return !retired && now.frame === controller && input.life !== null && now.life === input.life; };
  const current = () => {
    if (checking) return retire();
    if (!owns() || !input.enabled || !input.actor || input.loading !== false || !input.generation || typeof input.generation !== "object") return retire();
    checking = true;
    try {
      for (let attempt = 0; attempt < 2; attempt++) {
        const auth = live().auth;
        const matches = () => {
          if (!owns()) return retire();
          if (live().auth !== auth) return false;
          const generation = auth.authGeneration; observeJourneyNative(generation);
          if (!owns() || generation !== input.generation) return retire();
          if (live().auth !== auth) return false;
          const loading = auth.loading; observeJourneyNative(loading);
          if (!owns() || loading !== false) return retire();
          if (live().auth !== auth) return false;
          const user = auth.user; observeJourneyNative(user);
          if (!owns()) return retire();
          if (live().auth !== auth) return false;
          const id = user?.id; observeJourneyNative(id);
          if (!owns() || id !== input.actor) return retire();
          return live().auth === auth;
        };
        if (!matches()) { if (owns() && live().auth !== auth) continue; return false; }
        const predicate = auth.isAuthGenerationCurrent; observeJourneyNative(predicate);
        if (typeof predicate !== "function") return retire();
        if (!matches()) { if (owns() && live().auth !== auth) continue; return false; }
        const allowed = Reflect.apply(predicate, auth, [input.generation]); observeJourneyNative(allowed);
        if (allowed !== true) return retire();
        if (!matches()) { if (owns() && live().auth !== auth) continue; return false; }
        return true;
      }
      return false;
    } catch (caught) { observeJourneyNative(caught); return retire(); }
    finally { checking = false; }
  };
  const admits = (expected?: object | null) => current() && (expected === undefined || action === expected);
  const notify = (expected: object) => {
    if (!admits(expected)) return;
    revision++;
    for (const listener of listeners) {
      if (!admits(expected)) return;
      try { listener(); } catch (caught) { observeJourneyNative(caught); retire(); return; }
    }
  };
  const makeView = (expected?: object | null): JourneyReadView => Object.freeze({
    then: undefined,
    get status(): JourneyReadStatus {
      if (!input.enabled || !input.life || !input.actor || input.loading !== false || !input.generation) return "unavailable";
      if (!admits(expected)) return "retired";
      return publishedAction === action ? status : "loading";
    },
    get logs() { return admits(expected) && publishedAction === action && status === "ready" ? data?.logs : undefined; },
    get missions() { return admits(expected) && publishedAction === action && status === "ready" ? data?.missions : undefined; },
    get error() { return admits(expected) && publishedAction === action && status === "error" ? error : null; },
    logLimit: 500, completeHistory: false,
    retry: () => retry(expected),
  });
  const retry = (expected?: object | null): Promise<JourneyReadView> => {
    const run = async (): Promise<JourneyReadView> => {
      if (!admits(expected) || !reader || !input.actor) return makeView(expected);
      const selectedReader = reader, actor = input.actor, next = {}; action = next;
      const requireCurrent = () => { if (!admits(next)) throw new Error("Owned cloud read retired"); };
      const operation: JourneyReadOperation = {
        actor, requireCurrent,
        read: <T,>(get: () => T): T => {
          requireCurrent();
          try { const value = get(); observeJourneyNative(value); requireCurrent(); return value; }
          catch (caught) { observeJourneyNative(caught); throw caught; }
        },
        adopt: pending => adoptJourneyRead(pending, requireCurrent),
      };
      try {
        await new Promise<void>(resolve => queueMicrotask(resolve)); requireCurrent();
        status = "loading"; data = undefined; error = null; publishedAction = next; notify(next); requireCurrent();
        const pending = selectedReader(operation); observeJourneyNative(pending);
        // The only reader is the owned Cloud branch; its output has an OWN undefined then.
        const boxed = await pending; requireCurrent();
        const result = operation.read(() => boxed.value);
        data = result; error = null; status = "ready"; publishedAction = next; notify(next);
      } catch (caught) {
        observeJourneyNative(caught);
        if (admits(next)) { data = undefined; error = caught; status = "error"; publishedAction = next; notify(next); }
      }
      return makeView(next);
    };
    const task = run(); observeJourneyNative(task); return task;
  };
  const controller: JourneyReadController = {
    life: input.life, input, get view() { return makeView(); }, retired: () => retired, retire,
    subscribe: listener => { if (!current()) return () => {}; listeners.add(listener); return () => { listeners.delete(listener); }; },
    getRevision: () => current() ? revision : -1,
    installReader: next => {
      if (!current()) return () => {};
      reader = next; void retry();
      return () => { if (reader === next) reader = null; };
    },
  };
  return controller;
}
const Context = React.createContext<JourneyReadController | null>(null);
const unavailable: JourneyReadView = Object.freeze({
  then: undefined, status: "unavailable", logs: undefined, missions: undefined, error: null,
  logLimit: 500, completeHistory: false, retry: async () => unavailable,
});
export function JourneyReadProvider({ enabled, children }: { enabled: boolean; children: React.ReactNode }) {
  const auth = useAuth(), client = useQueryClient();
  const life = React.useRef<object | null>(null);
  const [committed, setCommitted] = React.useState<object | null>(null);
  const latest = React.useRef<{ auth: Auth; frame: JourneyReadController | null }>({ auth, frame: null });
  React.useLayoutEffect(() => {
    const token = {}; life.current = token;
    setCommitted(previous => life.current === token ? token : previous);
    return () => {
      if (latest.current.frame?.life === token) latest.current.frame.retire();
      if (life.current === token) life.current = null;
    };
  }, []);
  let actor: string | null = null, loading = true, generation: Auth["authGeneration"] | undefined;
  try {
    generation = auth.authGeneration; observeJourneyNative(generation);
    loading = auth.loading; observeJourneyNative(loading);
    const user = auth.user; observeJourneyNative(user);
    const id = user?.id; observeJourneyNative(id); actor = typeof id === "string" ? id : null;
  } catch (caught) { observeJourneyNative(caught); }
  const selected = React.useRef<JourneyReadController | null>(null), old = selected.current?.input;
  if (!selected.current || selected.current.retired() || !old || old.actor !== actor || old.loading !== loading || old.generation !== generation || old.life !== committed || old.client !== client || old.enabled !== enabled) {
    selected.current = createController({ actor, loading, generation, life: committed, client, enabled }, () => ({ ...latest.current, life: life.current }));
  }
  const frame = selected.current;
  latest.current = { auth, frame };
  return React.createElement(Context.Provider, { value: frame }, children);
}
export function useJourneyReadController() { return React.useContext(Context); }
export function useJourneyCurrentUserRead(): JourneyReadView {
  const frame = useJourneyReadController();
  const subscribe = React.useCallback((listener: () => void) => frame ? frame.subscribe(listener) : () => {}, [frame]);
  const snapshot = React.useCallback(() => frame ? frame.getRevision() : -1, [frame]);
  React.useSyncExternalStore(subscribe, snapshot, snapshot);
  return frame ? frame.view : unavailable;
}

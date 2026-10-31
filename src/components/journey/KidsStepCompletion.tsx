import { useLayoutEffect, useRef, useState } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useAuth, type AuthGeneration } from "@/lib/auth-context";
import { useKidsCompletion } from "@/lib/journey/client";
import { journeyCopy } from "@/lib/journey/copy";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { SupportedLocale } from "@/lib/locale/types";
import { Button } from "@/components/ui/button";

type Props = { profile: string; level: string; lesson: number; locale: SupportedLocale };
type Frame = Props & {
  actor: string | undefined;
  generation: AuthGeneration | undefined;
  loading: boolean;
  client: QueryClient;
  key: number;
  current: () => boolean;
};
type CompletionQuery = ReturnType<typeof useKidsCompletion>;
type Lifetime = { active: boolean };
type Action = { lifetime: Lifetime; pending: boolean };
type Outcome = { kind: "fulfilled"; value: unknown } | { kind: "rejected" } | { kind: "retired" };
const nativeThen = Promise.prototype.then;
const apply = Reflect.apply;

// Observe already-entered native promises without consulting an arbitrary own .then.
function observeNative(value: unknown, fulfilled: (value: unknown) => void = () => {}, rejected: () => void = () => {}): boolean {
  try {
    apply(nativeThen, value, [
      (result: unknown) => { fulfilled(result); },
      () => { rejected(); },
    ]);
    return true;
  } catch { return false; }
}

// This wrapper only resolves to plain outcomes. Retired lazy targets are never adopted.
function adopt(value: unknown, current: () => boolean): Promise<Outcome> {
  return new Promise((resolve) => {
    const receive = (target: unknown) => {
      if (observeNative(target, receive, () => resolve(current() ? { kind: "rejected" } : { kind: "retired" }))) return;
      queueMicrotask(() => {
        if (!current()) { resolve({ kind: "retired" }); return; }
        if ((typeof target !== "object" || target === null) && typeof target !== "function") {
          resolve({ kind: "fulfilled", value: target }); return;
        }
        let then: unknown;
        try { then = Reflect.get(target, "then"); }
        catch { resolve(current() ? { kind: "rejected" } : { kind: "retired" }); return; }
        observeNative(then);
        if (!current()) { resolve({ kind: "retired" }); return; }
        if (typeof then !== "function") { resolve({ kind: "fulfilled", value: target }); return; }
        let settled = false;
        try {
          const derived: unknown = apply(then, target, [
            (next: unknown) => {
              if (settled) { observeNative(next); return; }
              settled = true;
              if (next === target) { resolve({ kind: "rejected" }); return; }
              receive(next);
            },
            () => {
              if (settled) return;
              settled = true;
              resolve(current() ? { kind: "rejected" } : { kind: "retired" });
            },
          ]);
          observeNative(derived);
        } catch {
          if (!settled) { settled = true; resolve(current() ? { kind: "rejected" } : { kind: "retired" }); }
        }
      });
    };
    receive(value);
  });
}

type Observation = "pending" | "error" | "complete" | "ready" | "retired";
function observeQuery(query: CompletionQuery, frame: Frame, current: () => boolean): Observation {
  function read(target: object, key: PropertyKey): unknown {
    if (!current()) throw Error("RETIRED");
    const value: unknown = Reflect.get(target, key);
    observeNative(value);
    if (!current()) throw Error("RETIRED");
    return value;
  }
  try {
    const pending = read(query, "isPending");
    if (pending === true) return "pending";
    const error = read(query, "isError");
    if (error === true) return "error";
    if (pending !== false || error !== false) return "error";
    const data = read(query, "data");
    if (!Array.isArray(data)) return "error";
    const length = read(data, "length");
    if (typeof length !== "number" || !Number.isSafeInteger(length) || length < 0) return "error";
    let complete = false;
    for (let index = 0; index < length; index++) {
      const row = read(data, index);
      if (typeof row !== "object" || row === null) return "error";
      const values: unknown[] = [];
      for (const key of ["profile_id", "level_id", "lesson_number", "locale"]) {
        if (!current()) return "retired";
        const own = Object.hasOwn(row, key);
        if (!current()) return "retired";
        if (!own) return "error";
        values.push(read(row, key));
      }
      if (typeof values[0] !== "string" || typeof values[1] !== "string" || typeof values[2] !== "number" || typeof values[3] !== "string") return "error";
      if (values[0] === frame.profile && values[1] === frame.level && values[2] === frame.lesson && values[3] === frame.locale) complete = true;
    }
    return current() ? (complete ? "complete" : "ready") : "retired";
  } catch { return current() ? "error" : "retired"; }
}

export function KidsStepCompletion(props: Props) {
  const auth = useAuth();
  const client = useQueryClient();
  const snapshot = (() => {
    try {
      const user = auth.user;
      observeNative(user);
      const actor = user?.id;
      observeNative(actor);
      const generation = auth.authGeneration;
      observeNative(generation);
      const loading = auth.loading;
      observeNative(loading);
      return { actor, generation, loading };
    } catch { return null; }
  })();
  const actor = snapshot?.actor;
  const generation = snapshot?.generation;
  const loading = snapshot?.loading === true;
  const latest = useRef({ auth, actor });
  latest.current = { auth, actor };
  const frameRef = useRef<Frame | null>(null);
  const sequence = useRef(0);
  let frame = frameRef.current;
  if (!frame || frame.actor !== actor || frame.generation !== generation || frame.loading !== loading || frame.client !== client || frame.profile !== props.profile || frame.level !== props.level || frame.lesson !== props.lesson || frame.locale !== props.locale) {
    const captured: Frame = {
      ...props, actor, generation, loading, client, key: ++sequence.current,
      current: () => {
        function matches() {
          const currentAuth = latest.current.auth;
          const owns = () => frameRef.current === captured && latest.current.actor === captured.actor && latest.current.auth === currentAuth;
          const actorMatches = () => {
            if (!owns()) return false;
            const user = currentAuth.user;
            observeNative(user);
            if (!owns()) return false;
            const liveActor = user?.id;
            observeNative(liveActor);
            return owns() && typeof liveActor === "string" && liveActor === captured.actor;
          };
          if (!actorMatches()) return false;
          const liveGeneration = currentAuth.authGeneration;
          observeNative(liveGeneration);
          if (!actorMatches() || liveGeneration !== captured.generation) return false;
          const liveLoading = currentAuth.loading;
          observeNative(liveLoading);
          return liveLoading === false && actorMatches();
        }
        try {
          const generation = captured.generation;
          if (!matches() || !captured.actor || !generation || !Object.isFrozen(generation) || !matches()) return false;
          const currentAuth = latest.current.auth;
          const predicate = currentAuth.isAuthGenerationCurrent;
          observeNative(predicate);
          if (!matches() || latest.current.auth !== currentAuth || typeof predicate !== "function") return false;
          const valid: unknown = apply(predicate, currentAuth, [generation]);
          observeNative(valid);
          return valid === true && matches();
        } catch { return false; }
      },
    };
    frameRef.current = frame = captured;
  }
  const query = useKidsCompletion(props.profile, props.level, props.locale, frame.current() && props.profile !== actor);
  return <CompletionView {...props} key={frame.key} frame={frame} query={query} />;
}

function CompletionView({ frame, query }: Props & { frame: Frame; query: CompletionQuery }) {
  const copy = journeyCopy(frame.locale);
  const lifetimeRef = useRef<Lifetime | null>(null);
  const actionRef = useRef<Action | null>(null);
  const viewRef = useRef<object | null>(null);
  const view = {};
  viewRef.current = view;
  const [state, setState] = useState<{ owner: Lifetime | null; busy: boolean; failed: boolean }>({ owner: null, busy: false, failed: false });
  useLayoutEffect(() => {
    const lifetime: Lifetime = { active: true };
    lifetimeRef.current = lifetime;
    return () => {
      lifetime.active = false;
      if (lifetimeRef.current === lifetime) lifetimeRef.current = null;
    };
  }, [frame]);
  const viewCurrent = () => viewRef.current === view && frame.current() && viewRef.current === view;
  function begin(): { action: Action; current: () => boolean } | null {
    const lifetime = lifetimeRef.current;
    if (!lifetime || !lifetime.active || actionRef.current?.pending) return null;
    const action: Action = { lifetime, pending: true };
    actionRef.current = action;
    const current = () => {
      const owns = () => lifetime.active && lifetimeRef.current === lifetime && actionRef.current === action;
      return owns() && frame.current() && owns();
    };
    if (!viewCurrent() || !current()) { action.pending = false; return null; }
    return { action, current };
  }
  function update(action: Action, current: () => boolean, busy: boolean, failed: boolean) {
    if (!current()) return;
    setState((previous) => {
      if (!current()) return previous;
      const next = { owner: action.lifetime, busy, failed };
      return current() ? next : previous;
    });
  }
  async function run(retry: boolean) {
    const started = begin();
    if (!started) return;
    const { action, current } = started;
    const readCurrent = () => current() && viewRef.current === view;
    let failed = false;
    try {
      const observed = observeQuery(query, frame, readCurrent);
      if (!readCurrent() || (retry ? observed !== "error" : observed !== "ready")) return;
      if (retry) {
        const refetch = query.refetch;
        observeNative(refetch);
        if (!readCurrent() || typeof refetch !== "function") return;
        const target: ReturnType<typeof refetch> = apply(refetch, query, []);
        await adopt(target, current);
        return;
      }
      update(action, current, true, false);
      if (!current()) return;
      const rpc = supabase.rpc<"complete_kids_step", Database["public"]["Functions"]["complete_kids_step"]["Args"]>;
      observeNative(rpc);
      if (!current()) return;
      if (typeof rpc !== "function") throw Error("KIDS_COMPLETION_UNAVAILABLE");
      const args: Parameters<typeof rpc> = ["complete_kids_step", { p_profile: frame.profile, p_level: frame.level, p_lesson: frame.lesson, p_locale: frame.locale }];
      const target: ReturnType<typeof rpc> = apply(rpc, supabase, args);
      const outcome = await adopt(target, current);
      if (!current() || outcome.kind === "retired") return;
      if (outcome.kind !== "fulfilled" || typeof outcome.value !== "object" || outcome.value === null) throw Error("KIDS_COMPLETION_UNAVAILABLE");
      const response = outcome.value;
      for (const key of ["error", "data"]) {
        if (!current()) return;
        const own = Object.hasOwn(response, key);
        if (!current()) return;
        if (!own) throw Error("KIDS_COMPLETION_UNAVAILABLE");
      }
      const error: unknown = Reflect.get(response, "error");
      observeNative(error);
      if (!current()) return;
      const data: unknown = Reflect.get(response, "data");
      observeNative(data);
      if (!current()) return;
      if (error || data !== true) throw Error("KIDS_COMPLETION_UNAVAILABLE");
      const invalidate = frame.client.invalidateQueries;
      observeNative(invalidate);
      if (!current()) return;
      if (typeof invalidate !== "function") throw Error("KIDS_COMPLETION_UNAVAILABLE");
      for (const prefix of ["kids-completion", "kids-journey"]) {
        if (!current()) return;
        const options: Parameters<typeof invalidate> = [{ queryKey: [prefix, frame.actor, frame.profile] }];
        const target: ReturnType<typeof invalidate> = apply(invalidate, frame.client, options);
        const result = await adopt(target, current);
        if (!current() || result.kind === "retired") return;
        if (result.kind === "rejected") failed = true;
      }
    } catch { failed = true; }
    finally {
      if (!retry && current()) update(action, current, false, failed);
      if (current()) action.pending = false;
    }
  }
  if (!frame.current()) return <p className="text-xs text-muted-foreground" role={frame.loading ? "status" : "alert"}>{frame.loading ? copy.loading : copy.error}</p>;
  if (frame.profile === frame.actor) return <p className="text-xs text-muted-foreground">{copy.previewNote}</p>;
  const observation = observeQuery(query, frame, viewCurrent);
  const owned = state.owner === lifetimeRef.current && lifetimeRef.current?.active && frame.current();
  return <section className="mt-3 rounded-xl border bg-card p-3">
    <p className="mb-2 text-xs text-muted-foreground">{copy.markNote}</p>
    {observation === "pending" ? <p className="text-xs" role="status">{copy.loading}</p> : observation === "error" || observation === "retired" ?
      <p className="text-xs" role="alert">{copy.error} <button className="underline" onClick={() => void run(true)}>{copy.retry}</button></p> :
      <Button size="sm" variant="outline" disabled={!!(owned && state.busy) || observation === "complete"} onClick={() => void run(false)}>{observation === "complete" ? copy.marked : copy.mark}</Button>}
    {owned && state.failed && <p className="mt-2 text-xs text-destructive" role="alert">{copy.saveError}</p>}
  </section>;
}

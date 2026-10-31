import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { useQuery, useQueryClient, QueryObserver, notifyManager, useIsRestoring } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import type { SupportedLocale } from "@/lib/locale/types";
import type { LearningLine } from "@/lib/learning-lines";
import type { JourneyVisit } from "./model";
export const visitsKey = (user: string | undefined) => ["journey-visits", user] as const;
type JourneyReadFrame = {
  actor: string | undefined; loading: boolean;
  generation: ReturnType<typeof useAuth>["authGeneration"] | undefined;
  client: ReturnType<typeof useQueryClient>; life: object | null; hash: string;
  action: object | null; rows: WeakSet<object>; errors: Set<unknown>;
};
let nextJourneyRead = 0;
function observeJourneyRead(value: unknown) {
  try { Reflect.apply(Promise.prototype.then, value, [() => undefined, () => undefined]); }
  catch { /* Intrinsic brand check never reads an arbitrary own then. */ }
}
function adoptJourneyRead<T>(pending: T | PromiseLike<T>, requireCurrent: () => void): Promise<{ value: T }> {
  return new Promise((resolve, reject) => {
    const seen = new Set<object>();
    const fail = (error: unknown) => { observeJourneyRead(pending); observeJourneyRead(error); reject(error); };
    const advance = (value: unknown) => {
      observeJourneyRead(value);
      try {
        requireCurrent();
        if (value !== null && (typeof value === "object" || typeof value === "function")) {
          const then = Reflect.get(value, "then"); observeJourneyRead(then); requireCurrent();
          if (typeof then === "function") {
            if (seen.has(value)) throw new Error("Cyclic journey response");
            seen.add(value); let settled = false;
            const accept = (next: unknown) => {
              if (settled) { observeJourneyRead(next); return; }
              settled = true; observeJourneyRead(next); queueMicrotask(() => advance(next));
            };
            const decline = (error: unknown) => { if (!settled) { settled = true; fail(error); } else observeJourneyRead(error); };
            try {
              const derived = Reflect.apply(then, value, [accept, decline]); observeJourneyRead(derived);
            } catch (error) {
              // Promise settlement is first-wins, including a throw after fulfillment.
              if (!settled) { settled = true; fail(error); }
              else observeJourneyRead(error);
            }
            return;
          }
        }
        requireCurrent(); resolve({ value: value as T });
      } catch (error) { fail(error); }
    };
    // A native rejection must be observed before a queued retirement can run.
    observeJourneyRead(pending); queueMicrotask(() => advance(pending));
  });
}
export function useJourneyVisits() {
  const auth = useAuth(); const client = useQueryClient();
  const life = useRef<object | null>(null);
  const [mounted, setMounted] = useState<object | null>(null);
  useLayoutEffect(() => {
    const token = {}; life.current = token;
    setMounted((previous) => life.current === token ? token : previous);
    return () => { if (life.current === token) life.current = null; };
  }, []);
  let actor: string | undefined, generation: JourneyReadFrame["generation"], loading = true;
  try { generation = auth.authGeneration; loading = auth.loading; actor = auth.user?.id; }
  catch { /* Unreadable Auth cannot admit a read. */ }
  const selected = useRef<JourneyReadFrame | null>(null); const previous = selected.current;
  if (!previous || previous.actor !== actor || previous.loading !== loading ||
    previous.generation !== generation || previous.client !== client || previous.life !== mounted) {
    selected.current = { actor, loading, generation, client, life: mounted,
      hash: "journey-local-read:" + (++nextJourneyRead), action: null, rows: new WeakSet(), errors: new Set() };
  }
  const frame = selected.current!;
  const latest = useRef({ auth, frame }); latest.current = { auth, frame };
  const current = () => {
    const owns = () => latest.current.frame === frame && frame.life !== null && life.current === frame.life;
    if (!owns() || !frame.actor || frame.loading !== false || !frame.generation || typeof frame.generation !== "object") return false;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const live = latest.current.auth;
        const token = live.authGeneration; observeJourneyRead(token);
        if (!owns() || token !== frame.generation) return false;
        const busy = live.loading; observeJourneyRead(busy); if (!owns() || busy !== false) return false;
        const user = live.user; observeJourneyRead(user); if (!owns()) return false;
        const id = user?.id; observeJourneyRead(id); if (!owns() || id !== frame.actor) return false;
        const predicate = live.isAuthGenerationCurrent; observeJourneyRead(predicate);
        if (!owns() || typeof predicate !== "function") return false;
        const allowed = Reflect.apply(predicate, live, [frame.generation]); observeJourneyRead(allowed);
        if (!owns()) return false;
        if (latest.current.auth !== live) continue;
        return allowed === true;
      } catch { return false; }
    }
    return false;
  };
  const requireFrame = () => { if (!current()) throw new Error("Journey read is no longer current"); };
  const result = useQuery({
    queryKey: visitsKey(actor), queryHash: frame.hash,
    enabled: current(), staleTime: 0, structuralSharing: false,
    queryFn: async () => {
      const action = {}; frame.action = action;
      const requireAction = () => { requireFrame(); if (frame.action !== action) throw new Error("Journey read was replaced"); };
      const read = <T,>(get: () => T): T => { requireAction(); const value = get(); observeJourneyRead(value); requireAction(); return value; };
      try {
        await new Promise<void>((resolve) => queueMicrotask(resolve)); requireAction();
        const actorId = frame.actor; if (!actorId) throw new Error("Journey actor unavailable");
        const from = read(() => supabase.from); const bindFrom = read(() => from.bind<typeof from>);
        const boundFrom = read(() => bindFrom.call(from, supabase));
        const table = read(() => boundFrom("journey_visits"));
        const select = read(() => table.select); const bindSelect = read(() => select.bind<typeof select>);
        const boundSelect = read(() => bindSelect.call(select, table));
        const selectedRows = read(() => boundSelect("line,course_id,subject_id,profile_id,lesson_id,locale,visited_at"));
        const eq = read(() => selectedRows.eq); const bindEq = read(() => eq.bind<typeof eq>);
        const boundEq = read(() => bindEq.call(eq, selectedRows));
        requireAction(); const pending = boundEq("user_id", actorId);
        const { value: response } = await adoptJourneyRead(pending, requireAction);
        const error = read(() => response.error); if (error) throw error;
        const data = read(() => response.data);
        if (!Array.isArray(data)) throw new Error("Journey history response is not an array");
        const length = read(() => data.length);
        if (!Number.isSafeInteger(length) || length < 0) throw new Error("Invalid journey history length");
        const rows: JourneyVisit[] = [];
        for (let index = 0; index < length; index++) {
          const row = read(() => data[index]);
          if (row === null || typeof row !== "object") throw new Error("Invalid journey history row");
          // Database line is string; the existing JourneyVisit DTO narrows it.
          // Preserve its raw value without filtering or inventing a default.
          const snapshot: JourneyVisit = {
            line: read(() => row.line) as JourneyVisit["line"], course_id: read(() => row.course_id),
            subject_id: read(() => row.subject_id), profile_id: read(() => row.profile_id),
            lesson_id: read(() => row.lesson_id), locale: read(() => row.locale), visited_at: read(() => row.visited_at),
          };
          Object.freeze(snapshot); rows.push(snapshot);
        }
        requireAction(); Object.freeze(rows); frame.rows.add(rows); return rows;
      } catch (error) {
        observeJourneyRead(error);
        if (current() && frame.action === action) { frame.errors.add(error); throw error; }
        throw new Error("Retired journey read");
      }
    },
  });
  function project(snapshot: typeof result, action?: object | null, masked = false): typeof result {
    const owns = () => !masked && current() && (action === undefined || frame.action === action);
    const requireView = () => { if (!owns()) throw new Error("Journey view is no longer current"); };
    const neutral = (key: PropertyKey) => {
      if (key === "data") return undefined;
      if (key === "error" || key === "failureReason") return null;
      if (key === "status") return "pending";
      if (key === "fetchStatus") return "idle";
      if (key === "isPending" || key === "isStale") return true;
      if (typeof key === "string" && key.startsWith("is")) return false;
      if (typeof key === "string" && /Count$|UpdatedAt$/.test(key)) return 0;
      return undefined;
    };
    const readProperty = (key: PropertyKey) => {
      if (key === "refetch") return (...args: Parameters<typeof result.refetch>) => {
        const task = (async () => {
          let expected: object | null | undefined;
          try {
            if (!owns()) return project(snapshot, undefined, true);
            const method = snapshot.refetch; observeJourneyRead(method); requireView();
            const bind = method.bind<typeof method>; observeJourneyRead(bind); requireView();
            const bound = bind.call(method, snapshot); observeJourneyRead(bound); requireView();
            const pending = bound(...args); expected = frame.action;
            const requireRefetch = () => { requireFrame(); if (frame.action !== expected) throw new Error("Refetch was replaced"); };
            const { value } = await adoptJourneyRead(pending, requireRefetch);
            requireRefetch(); return project(value, expected);
          } catch (error) {
            observeJourneyRead(error);
            if (!current() || (expected === undefined ? !owns() : frame.action !== expected)) return project(snapshot, undefined, true);
            throw error;
          }
        })();
        observeJourneyRead(task); return task;
      };
      if (key === "promise") {
        const task = (async () => {
          if (!owns()) throw new Error("Retired journey result");
          const pending = snapshot.promise; observeJourneyRead(pending); requireView();
          const { value } = await adoptJourneyRead(pending, requireView);
          if (!owns() || !frame.rows.has(value)) throw new Error("Unowned journey result");
          return value;
        })(); observeJourneyRead(task); return task;
      }
      if (!owns()) return neutral(key);
      try {
        const status = snapshot.status; if (!owns()) return neutral(key);
        const data = snapshot.data; observeJourneyRead(data); if (!owns()) return neutral(key);
        const error = snapshot.error; observeJourneyRead(error); if (!owns()) return neutral(key);
        const trustedData = data !== undefined && frame.rows.has(data);
        if ((status === "success" && !trustedData) || (status === "error" && !frame.errors.has(error))) return neutral(key);
        if (key === "data") return trustedData ? data : undefined;
        if (key === "error") return status === "error" && frame.errors.has(error) ? error : null;
        const value = Reflect.get(snapshot, key, snapshot); observeJourneyRead(value);
        return owns() ? value : neutral(key);
      } catch { return neutral(key); }
    };
    return new Proxy(snapshot, { get: (_target, key) => readProperty(key) });
  }
  return project(result);
}

type VisitFrame = Readonly<{
  generation: ReturnType<typeof useAuth>["authGeneration"] | undefined;
  actor: string | undefined; loading: boolean;
  line: LearningLine; course: string; lesson: string; locale: SupportedLocale;
  allowed: boolean; profile: string | undefined; client: ReturnType<typeof useQueryClient>;
}>;
type VisitAction = {
  frame: VisitFrame; life: object; revision: object | null; active: boolean;
  pending: boolean; failed: boolean; retryQueued: object | null;
};

/** Observe only already-entered native work, never a lazy object's then. */
function observeVisitPromise(value: unknown) {
  try { Reflect.apply(Promise.prototype.then, value, [() => undefined, () => undefined]); }
  catch { /* Native brand check fails without adopting an arbitrary thenable. */ }
}
function awaitVisitResponse<T>(
  pending: T | PromiseLike<T>, requireCurrent: () => void,
): Promise<{ value: T }> {
  return new Promise((resolve, reject) => {
    const fail = (error: unknown) => { observeVisitPromise(pending); reject(error); };
    try { requireCurrent(); } catch (error) { fail(error); return; }
    queueMicrotask(() => {
      try {
        requireCurrent();
        const then = pending !== null && (typeof pending === "object" || typeof pending === "function")
          ? Reflect.get(pending, "then") : undefined;
        requireCurrent();
        if (typeof then === "function") {
          const derived = Reflect.apply(then, pending, [(value: T) => resolve({ value }), reject]);
          observeVisitPromise(derived);
        } else resolve({ value: pending as T });
      } catch (error) { fail(error); }
    });
  });
}

export function useRecordJourneyVisit(
  line: LearningLine,
  course: string,
  lesson: string,
  locale: SupportedLocale,
  allowed: boolean,
  profile?: string,
): { failed: boolean; retry: () => void } {
  const auth = useAuth();
  const qc = useQueryClient();
  let actor: string | undefined;
  let generation: VisitFrame["generation"];
  let loading = true;
  try { generation = auth.authGeneration; loading = auth.loading; actor = auth.user?.id; }
  catch { /* An unreadable Auth snapshot cannot admit a write. */ }
  // Remember every observed selection, including an abandoned suspended render.
  // Returning to the same values must not revive its former action or retry.
  const selection = useRef<VisitFrame | null>(null);
  const previous = selection.current;
  if (!previous || previous.generation !== generation || previous.actor !== actor ||
    previous.loading !== loading || previous.line !== line || previous.course !== course ||
    previous.lesson !== lesson || previous.locale !== locale || previous.allowed !== allowed ||
    previous.profile !== profile || previous.client !== qc) {
    selection.current = {
      generation, actor, loading, line, course, lesson, locale, allowed, profile, client: qc,
    };
  }
  const frame = selection.current!;
  const [retry, setRetry] = useState<{ frame: VisitFrame; token: object } | null>(null);
  const revision = retry?.frame === frame ? retry.token : null;
  const latest = useRef({ auth, frame, revision });
  latest.current = { auth, frame, revision };
  const life = useRef<object | null>(null);
  const owner = useRef<VisitAction | null>(null);
  const [view, setView] = useState<{ owner: VisitAction; failed: boolean } | null>(null);
  const isCurrent = useCallback((action: VisitAction) => {
    const owns = () => action.active && owner.current === action &&
      life.current === action.life && latest.current.frame === action.frame &&
      latest.current.revision === action.revision;
    const scope = action.frame;
    if (!owns() || !scope.actor || scope.loading !== false || !scope.allowed ||
      !scope.generation || typeof scope.generation !== "object" ||
      (scope.line === "kids" && (!scope.profile || scope.profile === scope.actor))) return false;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const current = latest.current.auth;
        const token = current.authGeneration;
        if (!owns() || token !== scope.generation) return false;
        const busy = current.loading;
        if (!owns() || busy !== false) return false;
        const user = current.user;
        if (!owns()) return false;
        const id = user?.id;
        if (!owns() || id !== scope.actor) return false;
        const predicate = current.isAuthGenerationCurrent;
        if (!owns() || typeof predicate !== "function") return false;
        const admitted = Reflect.apply(predicate, current, [scope.generation]);
        observeVisitPromise(admitted);
        if (!owns()) return false;
        if (latest.current.auth !== current) continue;
        return admitted === true;
      } catch { return false; }
    }
    return false;
  }, []);
  const publish = useCallback((action: VisitAction) => {
    if (!isCurrent(action)) return;
    setView((previous) => {
      if (!isCurrent(action)) return previous;
      // Read latest owned state when this updater actually runs.
      return { owner: action, failed: action.failed };
    });
  }, [isCurrent]);
  const record = useCallback(async (action: VisitAction) => {
    const current = () => { if (!isCurrent(action)) throw new Error("Journey visit is no longer current"); };
    try {
      current();
      const scope = action.frame;
      const actorId = scope.actor;
      if (!actorId) throw new Error("Journey actor is unavailable");
      const row = {
        user_id: actorId, line: scope.line, course_id: scope.course,
        subject_id: scope.profile ?? actorId, profile_id: scope.profile ?? null,
        lesson_id: scope.lesson, locale: scope.locale,
      };
      current();
      const from = supabase.from;
      observeVisitPromise(from); current();
      const bindFrom = from.bind<typeof from>;
      observeVisitPromise(bindFrom); current();
      const boundFrom = bindFrom.call(from, supabase);
      observeVisitPromise(boundFrom); current();
      const table = boundFrom("journey_visits");
      observeVisitPromise(table); current();
      const upsert = table.upsert;
      observeVisitPromise(upsert); current();
      const bindUpsert = upsert.bind<typeof upsert>;
      observeVisitPromise(bindUpsert); current();
      const boundUpsert = bindUpsert.call(upsert, table);
      observeVisitPromise(boundUpsert); current();
      const pending = boundUpsert(row, { onConflict: "user_id,line,course_id,subject_id" });
      // Always pass already-entered work through the guarded intrinsic observer.
      const { value: response } = await awaitVisitResponse(pending, current);
      current();
      const error = response.error;
      observeVisitPromise(error); current();
      if (error) throw new Error("Journey visit could not be saved");
      const invalidate = scope.client.invalidateQueries;
      observeVisitPromise(invalidate); current();
      const bindInvalidate = invalidate.bind<typeof invalidate>;
      observeVisitPromise(bindInvalidate); current();
      const boundInvalidate = bindInvalidate.call(invalidate, scope.client);
      observeVisitPromise(boundInvalidate); current();
      const invalidating = boundInvalidate({ queryKey: visitsKey(actorId) });
      await awaitVisitResponse(invalidating, current);
      current();
      action.failed = false;
      publish(action);
    } catch {
      if (isCurrent(action)) { action.failed = true; publish(action); }
    } finally {
      if (isCurrent(action)) { action.pending = false; publish(action); }
    }
  }, [isCurrent, publish]);
  useEffect(() => {
    const mounted = {};
    life.current = mounted;
    return () => {
      if (life.current !== mounted) return;
      life.current = null;
      const action = owner.current;
      if (action?.life === mounted) { action.active = false; owner.current = null; }
    };
  }, []);
  useEffect(() => {
    const mounted = life.current;
    if (!mounted) return;
    const action: VisitAction = { frame, life: mounted, revision, active: true,
      pending: true, failed: false, retryQueued: null };
    owner.current = action;
    if (isCurrent(action)) {
      publish(action);
      // A replayed/retired setup is denied before any SDK entry, including StrictMode.
      queueMicrotask(() => {
        if (!isCurrent(action)) return;
        observeVisitPromise(record(action));
      });
    }
    return () => {
      action.active = false;
      if (owner.current === action) owner.current = null;
    };
  }, [frame, revision, isCurrent, publish, record]);
  const exposed = view?.owner.frame === frame ? view : null;
  return {
    get failed() { return !!(exposed && isCurrent(exposed.owner) && exposed.failed); },
    retry: () => {
      const action = exposed?.owner;
      if (!action || !isCurrent(action) || action.pending || action.retryQueued) return;
      const queued = {};
      action.retryQueued = queued;
      setRetry((previous) => isCurrent(action) && action.retryQueued === queued
        ? { frame: action.frame, token: queued } : previous);
    },
  };
}

export type KidsCompletion = {
  profile_id: string;
  level_id: string;
  lesson_number: number;
  locale: string;
};
type KidsCompletionReadFrame = {
  actor: string | undefined; loading: boolean;
  generation: ReturnType<typeof useAuth>["authGeneration"] | undefined;
  client: ReturnType<typeof useQueryClient>; life: object | null; hash: string;
  profile: string; level: string; locale: SupportedLocale; enabled: boolean;
  retired: boolean; action: object | null; rows: WeakSet<object>; errors: Set<unknown>;
};
let nextKidsCompletionRead = 0;
function observeKidsCompletionRead(value: unknown) {
  try { Reflect.apply(Promise.prototype.then, value, [() => undefined, () => undefined]); }
  catch { /* Intrinsic brand check never reads an arbitrary own then. */ }
}
function adoptKidsCompletionRead<T>(pending: T | PromiseLike<T>, requireCurrent: () => void): Promise<{ value: T }> {
  return new Promise((resolve, reject) => {
    const seen = new Set<object>();
    const fail = (error: unknown) => { observeKidsCompletionRead(pending); observeKidsCompletionRead(error); reject(error); };
    const advance = (value: unknown) => {
      observeKidsCompletionRead(value);
      try {
        requireCurrent();
        if (value !== null && (typeof value === "object" || typeof value === "function")) {
          const then = Reflect.get(value, "then"); observeKidsCompletionRead(then); requireCurrent();
          if (typeof then === "function") {
            if (seen.has(value)) throw new Error("Cyclic journey response");
            seen.add(value); let settled = false;
            const accept = (next: unknown) => {
              if (settled) { observeKidsCompletionRead(next); return; }
              settled = true; observeKidsCompletionRead(next); queueMicrotask(() => advance(next));
            };
            const decline = (error: unknown) => { if (!settled) { settled = true; fail(error); } else observeKidsCompletionRead(error); };
            try {
              const derived = Reflect.apply(then, value, [accept, decline]); observeKidsCompletionRead(derived);
            } catch (error) {
              // Promise settlement is first-wins, including a throw after fulfillment.
              if (!settled) { settled = true; fail(error); }
              else observeKidsCompletionRead(error);
            }
            return;
          }
        }
        requireCurrent(); resolve({ value: value as T });
      } catch (error) { fail(error); }
    };
    // A native rejection must be observed before a queued retirement can run.
    observeKidsCompletionRead(pending); queueMicrotask(() => advance(pending));
  });
}
export function useKidsCompletion(
  profile: string,
  level: string,
  locale: SupportedLocale,
  enabled = true,
) {
  const auth = useAuth(); const client = useQueryClient();
  const life = useRef<object | null>(null);
  const [mounted, setMounted] = useState<object | null>(null);
  useLayoutEffect(() => {
    const token = {}; life.current = token;
    setMounted((previous) => life.current === token ? token : previous);
    return () => { if (life.current === token) life.current = null; };
  }, []);
  let actor: string | undefined, generation: KidsCompletionReadFrame["generation"], loading = true;
  try { generation = auth.authGeneration; loading = auth.loading; actor = auth.user?.id; }
  catch { /* Unreadable Auth cannot admit a completion read. */ }
  const selected = useRef<KidsCompletionReadFrame | null>(null); const previous = selected.current;
  if (!previous || previous.retired || previous.actor !== actor || previous.loading !== loading ||
    previous.generation !== generation || previous.client !== client || previous.life !== mounted ||
    previous.profile !== profile || previous.level !== level || previous.locale !== locale || previous.enabled !== enabled) {
    selected.current = { actor, loading, generation, client, life: mounted, profile, level, locale, enabled,
      retired: false, hash: "kids-completion-local-read:" + (++nextKidsCompletionRead), action: null, rows: new WeakSet(), errors: new Set() };
  }
  const frame = selected.current!;
  const latest = useRef({ auth, frame }); latest.current = { auth, frame };
  const current = () => {
    const retire = () => { frame.retired = true; return false; };
    const owns = () => !frame.retired && latest.current.frame === frame && frame.life !== null && life.current === frame.life;
    if (!owns() || !frame.actor || frame.loading !== false || !frame.generation || typeof frame.generation !== "object" ||
      !frame.profile || frame.profile === frame.actor || frame.enabled !== true) return retire();
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const live = latest.current.auth;
        // A semantic mismatch retires this frame permanently, even before React renders.
        // Auth-object churn alone can retry without retiring equal live semantics.
        const matches = () => {
          if (!owns()) return retire();
          if (latest.current.auth !== live) return false;
          const token = live.authGeneration; observeKidsCompletionRead(token);
          if (!owns() || token !== frame.generation) return retire();
          if (latest.current.auth !== live) return false;
          const busy = live.loading; observeKidsCompletionRead(busy);
          if (!owns() || busy !== false) return retire();
          if (latest.current.auth !== live) return false;
          const user = live.user; observeKidsCompletionRead(user);
          if (!owns()) return retire();
          if (latest.current.auth !== live) return false;
          const id = user?.id; observeKidsCompletionRead(id);
          if (!owns() || id !== frame.actor) return retire();
          return latest.current.auth === live;
        };
        if (!matches()) { if (owns() && latest.current.auth !== live) continue; return false; }
        const predicate = live.isAuthGenerationCurrent; observeKidsCompletionRead(predicate);
        if (typeof predicate !== "function") return retire();
        if (!matches()) { if (owns() && latest.current.auth !== live) continue; return false; }
        const allowed = Reflect.apply(predicate, live, [frame.generation]); observeKidsCompletionRead(allowed);
        if (allowed !== true) return retire();
        if (!matches()) { if (owns() && latest.current.auth !== live) continue; return false; }
        return matches();
      } catch (error) { observeKidsCompletionRead(error); return retire(); }
    }
    return false;
  };
  const requireFrame = () => { if (!current()) throw new Error("Kids completion read is no longer current"); };
  const isRestoring = useIsRestoring();
  const options = client.defaultQueryOptions({
    queryKey: ["kids-completion", actor, profile, level, locale], queryHash: frame.hash,
    enabled: current(), staleTime: 0, structuralSharing: false,
    queryFn: async () => {
      const action = {}; frame.action = action;
      const requireAction = () => { requireFrame(); if (frame.action !== action) throw new Error("Kids completion read was replaced"); };
      const read = <T,>(get: () => T): T => { requireAction(); const value = get(); observeKidsCompletionRead(value); requireAction(); return value; };
      try {
        await new Promise<void>((resolve) => queueMicrotask(resolve)); requireAction();
        const from = read(() => supabase.from); const bindFrom = read(() => from.bind<typeof from>);
        const boundFrom = read(() => bindFrom.call(from, supabase));
        const table = read(() => boundFrom("kids_lesson_progress"));
        const select = read(() => table.select); const bindSelect = read(() => select.bind<typeof select>);
        const boundSelect = read(() => bindSelect.call(select, table));
        const selectedRows = read(() => boundSelect("profile_id,level_id,lesson_number,locale"));
        const eqProfile = read(() => selectedRows.eq); const bindProfile = read(() => eqProfile.bind<typeof eqProfile>);
        const boundProfile = read(() => bindProfile.call(eqProfile, selectedRows));
        const forProfile = read(() => boundProfile("profile_id", frame.profile));
        const eqLevel = read(() => forProfile.eq); const bindLevel = read(() => eqLevel.bind<typeof eqLevel>);
        const boundLevel = read(() => bindLevel.call(eqLevel, forProfile));
        const forLevel = read(() => boundLevel("level_id", frame.level));
        const eqLocale = read(() => forLevel.eq); const bindLocale = read(() => eqLocale.bind<typeof eqLocale>);
        const boundLocale = read(() => bindLocale.call(eqLocale, forLevel));
        requireAction(); const pending = boundLocale("locale", frame.locale);
        const { value: response } = await adoptKidsCompletionRead(pending, requireAction);
        const error = read(() => response.error); if (error) throw error;
        const data = read(() => response.data);
        if (!Array.isArray(data)) throw new Error("Kids completion response is not an array");
        const length = read(() => data.length);
        if (!Number.isSafeInteger(length) || length < 0) throw new Error("Invalid kids completion length");
        const rows: KidsCompletion[] = [];
        for (let index = 0; index < length; index++) {
          const row = read(() => data[index]);
          if (row === null || typeof row !== "object") throw new Error("Invalid kids completion row");
          const snapshot: KidsCompletion = {
            profile_id: read(() => row.profile_id), level_id: read(() => row.level_id),
            lesson_number: read(() => row.lesson_number), locale: read(() => row.locale),
          };
          if (typeof snapshot.profile_id !== "string" || typeof snapshot.level_id !== "string" ||
            typeof snapshot.lesson_number !== "number" || typeof snapshot.locale !== "string") throw new Error("Malformed kids completion fields");
          Object.freeze(snapshot); rows.push(snapshot);
        }
        requireAction(); Object.freeze(rows); frame.rows.add(rows); return rows;
      } catch (error) {
        observeKidsCompletionRead(error);
        if (current() && frame.action === action) { frame.errors.add(error); throw error; }
        throw new Error("Retired kids completion read");
      }
    },
  });
  // Query's React observer is initially bound to one client. A fresh genuine
  // observer per owned frame keeps provider/client changes in the actual cache.
  options._optimisticResults = isRestoring ? "isRestoring" : "optimistic";
  const createObserver = () => new QueryObserver(client, options);
  const observerSlot = useRef<{ frame: KidsCompletionReadFrame; value: ReturnType<typeof createObserver> } | null>(null);
  if (!observerSlot.current || observerSlot.current.frame !== frame) {
    observerSlot.current = { frame, value: createObserver() };
  }
  const observer = observerSlot.current.value;
  const optimistic = observer.getOptimisticResult(options);
  useSyncExternalStore(useCallback((onChange) => {
    const unsubscribe = isRestoring ? () => undefined : observer.subscribe(notifyManager.batchCalls(onChange));
    observer.updateResult(); return unsubscribe;
  }, [observer, isRestoring]), () => observer.getCurrentResult(), () => observer.getCurrentResult());
  useEffect(() => { observer.setOptions(options); }, [observer, options]);
  const result = options.notifyOnChangeProps ? optimistic : observer.trackResult(optimistic);
  function project(snapshot: typeof result, action?: object | null, masked = false): typeof result {
    const owns = () => !masked && current() && (action === undefined || frame.action === action);
    const requireView = () => { if (!owns()) throw new Error("Journey view is no longer current"); };
    const neutral = (key: PropertyKey) => {
      if (key === "data") return undefined;
      if (key === "error" || key === "failureReason") return null;
      if (key === "status") return "pending";
      if (key === "fetchStatus") return "idle";
      if (key === "isPending" || key === "isStale") return true;
      if (typeof key === "string" && key.startsWith("is")) return false;
      if (typeof key === "string" && /Count$|UpdatedAt$/.test(key)) return 0;
      return undefined;
    };
    const readProperty = (key: PropertyKey) => {
      if (key === "refetch") return (...args: Parameters<typeof result.refetch>) => {
        const task = (async () => {
          let expected: object | null | undefined;
          try {
            if (!owns()) return project(snapshot, undefined, true);
            const method = snapshot.refetch; observeKidsCompletionRead(method); requireView();
            const bind = method.bind<typeof method>; observeKidsCompletionRead(bind); requireView();
            const bound = bind.call(method, snapshot); observeKidsCompletionRead(bound); requireView();
            const pending = bound(...args); expected = frame.action;
            const requireRefetch = () => { requireFrame(); if (frame.action !== expected) throw new Error("Refetch was replaced"); };
            const { value } = await adoptKidsCompletionRead(pending, requireRefetch);
            requireRefetch(); return project(value, expected);
          } catch (error) {
            observeKidsCompletionRead(error);
            if (!current() || (expected === undefined ? !owns() : frame.action !== expected)) return project(snapshot, undefined, true);
            throw error;
          }
        })();
        observeKidsCompletionRead(task); return task;
      };
      if (key === "promise") {
        const task = (async () => {
          if (!owns()) throw new Error("Retired journey result");
          const pending = snapshot.promise; observeKidsCompletionRead(pending); requireView();
          const { value } = await adoptKidsCompletionRead(pending, requireView);
          if (!owns() || !frame.rows.has(value)) throw new Error("Unowned journey result");
          return value;
        })(); observeKidsCompletionRead(task); return task;
      }
      if (!owns()) return neutral(key);
      try {
        const status = snapshot.status; if (!owns()) return neutral(key);
        const data = snapshot.data; observeKidsCompletionRead(data); if (!owns()) return neutral(key);
        const error = snapshot.error; observeKidsCompletionRead(error); if (!owns()) return neutral(key);
        const trustedData = data !== undefined && frame.rows.has(data);
        if ((status === "success" && !trustedData) || (status === "error" && !frame.errors.has(error))) return neutral(key);
        if (key === "data") return trustedData ? data : undefined;
        if (key === "error") return status === "error" && frame.errors.has(error) ? error : null;
        const value = Reflect.get(snapshot, key, snapshot); observeKidsCompletionRead(value);
        return owns() ? value : neutral(key);
      } catch { return neutral(key); }
    };
    return new Proxy(snapshot, { get: (_target, key) => readProperty(key) });
  }
  return project(result);
}

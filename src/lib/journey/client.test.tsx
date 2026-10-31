import { StrictMode, Suspense, startTransition, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor, act, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { useRecordJourneyVisit } from "./client";
const state = vi.hoisted(() => ({
  user: "parent-a", loading: false, upsert: vi.fn(), from: vi.fn(),
  authRef: { current: Object.freeze({ value: 0 }) as Readonly<{ value: number }> },
  predicate: (captured: { value: number }) => captured === state.authRef.current,
  actorRead: undefined as (() => void) | undefined,
  fromRead: undefined as (() => void) | undefined,
}));
vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({
    user: state.user ? { get id() { state.actorRead?.(); return state.user; } } : null,
    loading: state.loading, session: null, authError: null, signOut: async () => {},
    authGeneration: state.authRef.current, isAuthGenerationCurrent: state.predicate,
  }),
}));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { get from() { state.fromRead?.(); return state.from; } } }));
function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      {children}
    </QueryClientProvider>
  );
}
beforeEach(() => {
  state.user = "parent-a"; state.loading = false;
  state.authRef.current = Object.freeze({ value: 0 });
  state.predicate = (captured) => captured === state.authRef.current;
  state.actorRead = state.fromRead = undefined;
  state.upsert.mockReset().mockResolvedValue({ error: null });
  state.from.mockReset().mockReturnValue({ upsert: state.upsert });
});
it("records authorized visits without changing completion or entitlement", async () => {
  renderHook(() => useRecordJourneyVisit("academic", "AC-BUS", "AC-BUS-M01-L02", "en", true), {
    wrapper,
  });
  await waitFor(() => expect(state.upsert).toHaveBeenCalledTimes(1));
  expect(state.from).toHaveBeenCalledWith("journey_visits");
  expect(state.upsert.mock.calls[0][0]).toEqual({
    user_id: "parent-a",
    line: "academic",
    course_id: "AC-BUS",
    subject_id: "parent-a",
    profile_id: null,
    lesson_id: "AC-BUS-M01-L02",
    locale: "en",
  });
});
it("does not record denied lessons or admin child previews", () => {
  renderHook(() => useRecordJourneyVisit("ai", "ai", "one", "en", false), { wrapper });
  renderHook(() => useRecordJourneyVisit("kids", "level-1", "1", "en", true, "parent-a"), {
    wrapper,
  });
  expect(state.upsert).not.toHaveBeenCalled();
});
it("scopes child bookmarks to the selected child and parent", async () => {
  renderHook(() => useRecordJourneyVisit("kids", "level-1", "2", "ar-EG", true, "child-b"), {
    wrapper,
  });
  await waitFor(() => expect(state.upsert).toHaveBeenCalledTimes(1));
  expect(state.upsert.mock.calls[0][0]).toMatchObject({
    user_id: "parent-a",
    subject_id: "child-b",
    profile_id: "child-b",
  });
});
it("exposes a save failure and supports retry without crashing the lesson", async () => {
  state.from.mockImplementationOnce(() => {
    throw new Error("offline");
  });
  const { result } = renderHook(() => useRecordJourneyVisit("ai", "ai", "one", "en", true), {
    wrapper,
  });
  await waitFor(() => expect(result.current.failed).toBe(true));
  await act(async () => result.current.retry());
  await waitFor(() => expect(result.current.failed).toBe(false));
  expect(state.upsert).toHaveBeenCalledTimes(1);
});

import type { LearningLine } from "@/lib/learning-lines";
import type { SupportedLocale } from "@/lib/locale/types";
import { supabase as bookmarkSdk } from "@/integrations/supabase/client";

type BookmarkProps = { line: LearningLine; course: string; lesson: string; locale: SupportedLocale; allowed: boolean; profile?: string };
const bookmarkStart: BookmarkProps = { line: "academic", course: "AC-BUS", lesson: "AC-BUS-M01-L02", locale: "en", allowed: true };
type WriteReply = { error: unknown };
function bookmarkDeferred<T = WriteReply>() {
  let resolve!: (value: T) => void, reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes,no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
function bookmarkRotate(actor = "parent-a", loading = false) {
  state.authRef.current = Object.freeze({ value: state.authRef.current.value + 1 });
  state.user = actor; state.loading = loading;
}
async function bookmarkTurn(work: () => void = () => undefined) {
  await act(async () => {
    work(); for (let n = 0; n < 16; n += 1) await Promise.resolve();
    await new Promise<void>((resolve) => setImmediate(resolve));
    await new Promise<void>((resolve) => setImmediate(resolve));
  });
}
const bookmarkClients: QueryClient[] = [];
afterEach(() => { cleanup(); for (const client of bookmarkClients) client.clear(); bookmarkClients.length = 0; });
function bookmarkFixture(strict = false, initial: BookmarkProps = bookmarkStart) {
  const trace = {
    from: [] as string[], writes: [] as Array<{ row: Record<string, unknown>; options: Record<string, unknown>; receiver: boolean }>,
    invalidations: [] as Array<{ client: string; filters: unknown; receiver: boolean }>,
    thenReads: 0, lazyDispatches: 0,
  };
  const controls: {
    write: (row: Record<string, unknown>, options: Record<string, unknown>) => unknown;
    fromCall?: () => void; upsertRead?: () => void; invalidateRead?: () => void;
    invalidate?: (original: () => Promise<void>) => unknown;
    suspended?: Promise<void>;
  } = { write: () => Promise.resolve({ error: null }) };
  const upsert = function (this: object, row: Record<string, unknown>, options: Record<string, unknown>) {
    trace.writes.push({ row: { ...row }, options: { ...options }, receiver: this === table });
    return controls.write(row, options);
  };
  const table = { get upsert() { controls.upsertRead?.(); return upsert; } };
  expect(vi.isMockFunction(upsert)).toBe(false);
  state.from.mockImplementation(function (this: object, name: string) {
    expect(this).toBe(bookmarkSdk); trace.from.push(name); controls.fromCall?.(); return table;
  });
  function client(label: string) {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } } });
    bookmarkClients.push(qc); qc.setQueryData(["journey-visits", "parent-a"], { privateFixture: true });
    const original = qc.invalidateQueries;
    const invalidate = function (this: QueryClient, filters: Parameters<QueryClient["invalidateQueries"]>[0]) {
      trace.invalidations.push({ client: label, filters, receiver: this === qc });
      const run = () => Reflect.apply(original, qc, [filters]);
      return controls.invalidate ? controls.invalidate(run) : run();
    };
    expect(vi.isMockFunction(invalidate)).toBe(false);
    Object.defineProperty(qc, "invalidateQueries", { configurable: true, get() { controls.invalidateRead?.(); return invalidate; } });
    return qc;
  }
  const qc = client("first"); let activeClient = qc;
  function PrivateProvider({ children }: { children: ReactNode }) {
    const content = <QueryClientProvider client={activeClient}>{children}</QueryClientProvider>;
    const boundary = <Suspense fallback={<span>Bookmark scope opening</span>}>{content}</Suspense>;
    return strict ? <StrictMode>{boundary}</StrictMode> : boundary;
  }
  const mount = () => renderHook((props: BookmarkProps) => {
    const visit = useRecordJourneyVisit(props.line, props.course, props.lesson, props.locale, props.allowed, props.profile);
    if (controls.suspended) throw controls.suspended;
    return visit;
  }, { wrapper: PrivateProvider, initialProps: initial });
  return { trace, controls, qc, client, mount, changeClient: (next: QueryClient) => { activeClient = next; } };
}
function bookmarkWatch(label: string) {
  const events: string[] = [];
  const listener = (reason: unknown) => { events.push(reason instanceof Error ? reason.message : String(reason)); };
  process.on("unhandledRejection", listener);
  return { events, close(trace: { thenReads: number; lazyDispatches: number }) {
    console.info("BOOKMARK_NATIVE_EVENTS " + JSON.stringify({ label, events, thenReads: trace.thenReads, lazyDispatches: trace.lazyDispatches,
      targetReturningFunctionsPlain: true, targetObservedByFixture: false }));
    process.off("unhandledRejection", listener);
  } };
}

describe("Journey bookmark decisive", () => {
  it("JB01 same UUID replacement before cleanup denies successful stale invalidation", async () => {
    const f = bookmarkFixture(), pending = bookmarkDeferred(); f.controls.write = () => pending.promise;
    const watch = bookmarkWatch("JB01");
    try {
      const hook = f.mount(); await bookmarkTurn(); expect(f.trace.writes).toHaveLength(1);
      bookmarkRotate(); await bookmarkTurn(() => pending.resolve({ error: null }));
      expect(f.trace.invalidations).toHaveLength(0);
      expect(f.qc.getQueryState(["journey-visits", "parent-a"])?.isInvalidated).toBe(false);
      expect(hook.result.current.failed).toBe(false); expect(watch.events).toEqual([]);
    } finally { watch.close(f.trace); }
  });
  it("JB02 reentrant upsert retirement does not assimilate a returned lazy write", async () => {
    const f = bookmarkFixture(); const watch = bookmarkWatch("JB02");
    const lazy = { get then() { f.trace.thenReads += 1; return function (this: object, fulfill: (reply: WriteReply) => void) {
      expect(this).toBe(lazy); f.trace.lazyDispatches += 1; fulfill({ error: null });
    }; } };
    f.controls.write = () => { bookmarkRotate(); return lazy; };
    try {
      const hook = f.mount(); await bookmarkTurn();
      expect(f.trace.writes).toHaveLength(1); expect(f.trace.thenReads).toBe(0); expect(f.trace.lazyDispatches).toBe(0);
      expect(f.trace.invalidations).toHaveLength(0); expect(hook.result.current.failed).toBe(false); expect(watch.events).toEqual([]);
    } finally { watch.close(f.trace); }
  });
});

async function bookmarkChecked(label: string, fixture: ReturnType<typeof bookmarkFixture>, work: () => Promise<void>) {
  const watch = bookmarkWatch(label);
  try { await work(); expect(watch.events).toEqual([]); }
  finally { watch.close(fixture.trace); }
}
function bookmarkUnreadThen(promise: object, fixture: ReturnType<typeof bookmarkFixture>) {
  Object.defineProperty(promise, "then", { configurable: true, get() {
    fixture.trace.thenReads += 1; throw new Error("Retired bookmark own then was read");
  } });
}
describe("Journey bookmark closure", () => {
  it("JB03 current success preserves payload/options/receivers and real cache invalidation once", async () => {
    const f = bookmarkFixture();
    await bookmarkChecked("JB03", f, async () => {
      const hook = f.mount(); await bookmarkTurn();
      expect(f.trace.from).toEqual(["journey_visits"]);
      expect(f.trace.writes).toEqual([{ receiver: true, row: {
        user_id: "parent-a", line: "academic", course_id: "AC-BUS", subject_id: "parent-a", profile_id: null,
        lesson_id: "AC-BUS-M01-L02", locale: "en",
      }, options: { onConflict: "user_id,line,course_id,subject_id" } }]);
      expect(f.trace.invalidations).toEqual([{ client: "first", filters: { queryKey: ["journey-visits", "parent-a"] }, receiver: true }]);
      expect(f.qc.getQueryState(["journey-visits", "parent-a"])?.isInvalidated).toBe(true);
      expect(hook.result.current.failed).toBe(false);
    });
  });
  it("JB04 harmless Auth callback/user object churn retains one write and current failure", async () => {
    const f = bookmarkFixture(); f.controls.write = () => Promise.resolve({ error: { message: "synthetic save failure" } });
    await bookmarkChecked("JB04", f, async () => {
      const hook = f.mount(); await bookmarkTurn(); expect(hook.result.current.failed).toBe(true);
      state.predicate = (captured) => captured === state.authRef.current;
      hook.rerender({ ...bookmarkStart }); await bookmarkTurn();
      expect(f.trace.writes).toHaveLength(1); expect(hook.result.current.failed).toBe(true);
    });
  });
  it.each(["signedout", "loading", "not-current", "not-allowed", "missing-child", "self-child"])(
    "JB05 %s does not write or enqueue retry", async (mode) => {
      if (mode === "signedout") state.user = "";
      if (mode === "loading") state.loading = true;
      if (mode === "not-current") state.predicate = () => false;
      const props = { ...bookmarkStart, ...(mode === "not-allowed" ? { allowed: false } : {}),
        ...(["missing-child","self-child"].includes(mode) ? { line: "kids" as const, profile: mode === "self-child" ? "parent-a" : undefined } : {}) };
      const f = bookmarkFixture(false, props);
      await bookmarkChecked("JB05-" + mode, f, async () => {
        const hook = f.mount(); await bookmarkTurn(); act(() => { hook.result.current.retry(); hook.result.current.retry(); }); await bookmarkTurn();
        expect(f.trace.from).toHaveLength(0); expect(f.trace.writes).toHaveLength(0); expect(f.trace.invalidations).toHaveLength(0);
        expect(hook.result.current.failed).toBe(false);
      });
    });
  it.each(["replace", "logout", "loading"])("JB06 live %s hides old failure and denies saved retry before rerender", async (mode) => {
    const f = bookmarkFixture(); f.controls.write = () => Promise.resolve({ error: { message: "synthetic failure" } });
    await bookmarkChecked("JB06-" + mode, f, async () => {
      const hook = f.mount(); await bookmarkTurn(); const old = hook.result.current;
      expect(old.failed).toBe(true); bookmarkRotate(mode === "logout" ? "" : "parent-a", mode === "loading");
      expect(old.failed).toBe(false); act(() => old.retry()); await bookmarkTurn();
      expect(f.trace.writes).toHaveLength(1); expect(f.trace.invalidations).toHaveLength(0);
    });
  });
  it("JB07 reentrant actor snapshot retirement prevents payload dispatch and allows a fresh frame", async () => {
    const f = bookmarkFixture(); state.actorRead = () => { state.actorRead = undefined; bookmarkRotate(); };
    await bookmarkChecked("JB07", f, async () => {
      const hook = f.mount(); await bookmarkTurn(); expect(f.trace.from).toHaveLength(0);
      hook.rerender({ ...bookmarkStart }); await bookmarkTurn();
      expect(f.trace.writes).toHaveLength(1); expect(hook.result.current.failed).toBe(false);
    });
  });
  it.each(["from-getter", "from-call", "upsert-getter"])("JB08 %s retirement skips subsequent SDK entry", async (boundary) => {
    const f = bookmarkFixture();
    if (boundary === "from-getter") state.fromRead = () => bookmarkRotate();
    if (boundary === "from-call") f.controls.fromCall = () => bookmarkRotate();
    if (boundary === "upsert-getter") f.controls.upsertRead = () => bookmarkRotate();
    await bookmarkChecked("JB08-" + boundary, f, async () => {
      const hook = f.mount(); await bookmarkTurn();
      expect(f.trace.from).toHaveLength(boundary === "from-getter" ? 0 : 1);
      expect(f.trace.writes).toHaveLength(0); expect(f.trace.invalidations).toHaveLength(0); expect(hook.result.current.failed).toBe(false);
    });
  });
  it("JB09 already-entered rejected native upsert is observed intrinsically after retirement", async () => {
    const f = bookmarkFixture();
    f.controls.write = () => { const pending = Promise.reject(new Error("Bookmark eager retired write")); bookmarkUnreadThen(pending, f); bookmarkRotate(); return pending; };
    await bookmarkChecked("JB09", f, async () => {
      const hook = f.mount(); await bookmarkTurn();
      expect(f.trace.writes).toHaveLength(1); expect(f.trace.thenReads).toBe(0); expect(f.trace.invalidations).toHaveLength(0);
      expect(hook.result.current.failed).toBe(false);
    });
  });
  it("JB10 queued retirement denies lazy then lookup and dispatch", async () => {
    const f = bookmarkFixture();
    const lazy = { get then() { f.trace.thenReads += 1; return () => { f.trace.lazyDispatches += 1; }; } };
    f.controls.write = () => { queueMicrotask(() => bookmarkRotate()); return lazy; };
    await bookmarkChecked("JB10", f, async () => {
      f.mount(); await bookmarkTurn(); expect(f.trace.writes).toHaveLength(1);
      expect(f.trace.thenReads).toBe(0); expect(f.trace.lazyDispatches).toBe(0); expect(f.trace.invalidations).toHaveLength(0);
    });
  });
  it("JB11 reentrant then getter retires before lazy dispatch", async () => {
    const f = bookmarkFixture();
    const lazy = { get then() { f.trace.thenReads += 1; bookmarkRotate(); return () => { f.trace.lazyDispatches += 1; }; } };
    f.controls.write = () => lazy;
    await bookmarkChecked("JB11", f, async () => {
      const hook = f.mount(); await bookmarkTurn(); expect(f.trace.thenReads).toBe(1); expect(f.trace.lazyDispatches).toBe(0);
      expect(f.trace.invalidations).toHaveLength(0); expect(hook.result.current.failed).toBe(false);
    });
  });
  it("JB12 response error getter retirement denies failure publication and invalidation", async () => {
    const f = bookmarkFixture(); const response = { get error() { bookmarkRotate(); return null; } };
    f.controls.write = () => ({ then(fulfill: (value: WriteReply) => void) { fulfill(response); } });
    await bookmarkChecked("JB12", f, async () => {
      const hook = f.mount(); await bookmarkTurn(); expect(hook.result.current.failed).toBe(false); expect(f.trace.invalidations).toHaveLength(0);
    });
  });
  it("JB13 boxed response avoids incidental then assimilation and keeps current success", async () => {
    const f = bookmarkFixture(); const response = { error: null, get then() { f.trace.thenReads += 1; throw new Error("Incidental response then"); } };
    const lazy = { then(this: object, fulfill: (value: WriteReply) => void) { expect(this).toBe(lazy); f.trace.lazyDispatches += 1; fulfill(response); } };
    f.controls.write = () => lazy;
    await bookmarkChecked("JB13", f, async () => {
      const hook = f.mount(); await bookmarkTurn(); expect(f.trace.thenReads).toBe(0); expect(f.trace.lazyDispatches).toBe(1);
      expect(f.trace.invalidations).toHaveLength(1); expect(hook.result.current.failed).toBe(false);
    });
  });
  it.each(["error", "reject", "throw"])("JB14 current write %s exposes failure and one explicit retry", async (mode) => {
    const f = bookmarkFixture();
    f.controls.write = () => {
      if (mode === "throw") throw new Error("synthetic write throw");
      return mode === "reject" ? Promise.reject(new Error("synthetic write rejection")) : Promise.resolve({ error: { message: "synthetic SDK error" } });
    };
    await bookmarkChecked("JB14-" + mode, f, async () => {
      const hook = f.mount(); await bookmarkTurn(); expect(hook.result.current.failed).toBe(true);
      await bookmarkTurn(); expect(f.trace.writes).toHaveLength(1); expect(f.trace.invalidations).toHaveLength(0);
      f.controls.write = () => Promise.resolve({ error: null }); const retry = hook.result.current.retry;
      act(() => { retry(); retry(); }); await bookmarkTurn();
      expect(f.trace.writes).toHaveLength(2); expect(f.trace.invalidations).toHaveLength(1); expect(hook.result.current.failed).toBe(false);
      act(() => retry()); await bookmarkTurn(); expect(f.trace.writes).toHaveLength(2);
    });
  });
  it("JB15 pending retry does not double-submit", async () => {
    const f = bookmarkFixture(), pending = bookmarkDeferred(); f.controls.write = () => pending.promise;
    await bookmarkChecked("JB15", f, async () => {
      const hook = f.mount(); await bookmarkTurn(); act(() => { hook.result.current.retry(); hook.result.current.retry(); }); await bookmarkTurn();
      expect(f.trace.writes).toHaveLength(1); await bookmarkTurn(() => pending.resolve({ error: null }));
      expect(f.trace.invalidations).toHaveLength(1);
    });
  });
  it.each(["throw", "reject"])("JB16 current invalidation %s is observed and exposes retry", async (mode) => {
    const f = bookmarkFixture(); f.controls.invalidate = () => { if (mode === "throw") throw new Error("synthetic invalidate throw"); return Promise.reject(new Error("synthetic invalidate rejection")); };
    await bookmarkChecked("JB16-" + mode, f, async () => {
      const hook = f.mount(); await bookmarkTurn(); expect(hook.result.current.failed).toBe(true); expect(f.trace.invalidations).toHaveLength(1);
      f.controls.invalidate = undefined; act(() => hook.result.current.retry()); await bookmarkTurn();
      expect(f.trace.writes).toHaveLength(2); expect(f.trace.invalidations).toHaveLength(2); expect(hook.result.current.failed).toBe(false);
      expect(f.qc.getQueryState(["journey-visits", "parent-a"])?.isInvalidated).toBe(true);
    });
  });
  it("JB17 invalidation getter retirement prevents invoking the method", async () => {
    const f = bookmarkFixture(); f.controls.invalidateRead = () => bookmarkRotate();
    await bookmarkChecked("JB17", f, async () => {
      const hook = f.mount(); await bookmarkTurn(); expect(f.trace.writes).toHaveLength(1); expect(f.trace.invalidations).toHaveLength(0);
      expect(hook.result.current.failed).toBe(false);
    });
  });
  it("JB18 entered invalidation may finish but retired native rejection stays observed", async () => {
    const f = bookmarkFixture();
    f.controls.invalidate = (original) => { original(); const pending = Promise.reject(new Error("retired invalidate rejection")); bookmarkUnreadThen(pending, f); bookmarkRotate(); return pending; };
    await bookmarkChecked("JB18", f, async () => {
      const hook = f.mount(); await bookmarkTurn(); expect(f.trace.invalidations).toHaveLength(1); expect(f.trace.thenReads).toBe(0);
      expect(f.qc.getQueryState(["journey-visits", "parent-a"])?.isInvalidated).toBe(true); expect(hook.result.current.failed).toBe(false);
    });
  });
  it("JB19 invalidation then getter retirement denies lazy callback", async () => {
    const f = bookmarkFixture();
    f.controls.invalidate = () => ({ get then() { f.trace.thenReads += 1; bookmarkRotate(); return () => { f.trace.lazyDispatches += 1; }; } });
    await bookmarkChecked("JB19", f, async () => {
      const hook = f.mount(); await bookmarkTurn(); expect(f.trace.invalidations).toHaveLength(1);
      expect(f.trace.thenReads).toBe(1); expect(f.trace.lazyDispatches).toBe(0); expect(hook.result.current.failed).toBe(false);
    });
  });
  it("JB20 native rejection returned by a then method is observed without adopting arbitrary derived work", async () => {
    const f = bookmarkFixture();
    f.controls.invalidate = () => ({ then(fulfill: (value: undefined) => void) { fulfill(undefined); return Promise.reject(new Error("derived invalidation rejection")); } });
    await bookmarkChecked("JB20", f, async () => {
      const hook = f.mount(); await bookmarkTurn(); expect(f.trace.invalidations).toHaveLength(1); expect(hook.result.current.failed).toBe(false);
    });
  });
  it.each(["line", "course", "lesson", "locale", "allowed", "profile"] as const)(
    "JB21 selected %s ABA retires saved callbacks and late completion", async (field) => {
      const f = bookmarkFixture(), old = bookmarkDeferred(); f.controls.write = () => old.promise;
      await bookmarkChecked("JB21-" + field, f, async () => {
        const hook = f.mount(); await bookmarkTurn(); const saved = hook.result.current.retry;
        f.controls.write = () => Promise.resolve({ error: { message: "new selection failure" } });
        const changed: BookmarkProps = { ...bookmarkStart };
        if (field === "line") changed.line = "ai";
        if (field === "course") changed.course = "Another course";
        if (field === "lesson") changed.lesson = "Another lesson";
        if (field === "locale") changed.locale = "ar-EG";
        if (field === "allowed") changed.allowed = false;
        if (field === "profile") changed.profile = "child-profile";
        hook.rerender(changed); await bookmarkTurn(); hook.rerender({ ...bookmarkStart }); await bookmarkTurn();
        const expected = field === "allowed" ? 2 : 3;
        expect(hook.result.current.failed).toBe(true); act(() => saved()); await bookmarkTurn(() => old.resolve({ error: null }));
        expect(f.trace.writes).toHaveLength(expected); expect(f.trace.invalidations).toHaveLength(0); expect(hook.result.current.failed).toBe(true);
        f.controls.write = () => Promise.resolve({ error: null }); act(() => hook.result.current.retry()); await bookmarkTurn();
        expect(f.trace.writes).toHaveLength(expected + 1); expect(f.trace.invalidations).toHaveLength(1); expect(hook.result.current.failed).toBe(false);
      });
    });
  it("JB22 QueryClient frame replacement denies old effects and keeps fresh cache independent", async () => {
    const f = bookmarkFixture(), old = bookmarkDeferred(); f.controls.write = () => old.promise;
    await bookmarkChecked("JB22", f, async () => {
      const hook = f.mount(); await bookmarkTurn(); const saved = hook.result.current.retry;
      f.controls.write = () => Promise.resolve({ error: { message: "new cache failure" } });
      const second = f.client("second"); f.changeClient(second); hook.rerender({ ...bookmarkStart }); await bookmarkTurn();
      act(() => saved()); await bookmarkTurn(() => old.resolve({ error: null }));
      expect(f.trace.writes).toHaveLength(2); expect(f.trace.invalidations).toHaveLength(0); expect(hook.result.current.failed).toBe(true);
      f.controls.write = () => Promise.resolve({ error: null }); act(() => hook.result.current.retry()); await bookmarkTurn();
      expect(f.trace.invalidations).toEqual([{ client: "second", filters: { queryKey: ["journey-visits", "parent-a"] }, receiver: true }]);
      expect(f.qc.getQueryState(["journey-visits", "parent-a"])?.isInvalidated).toBe(false);
      expect(second.getQueryState(["journey-visits", "parent-a"])?.isInvalidated).toBe(true);
    });
  });
  it("JB23 unmount retires displayed failure and saved retry", async () => {
    const f = bookmarkFixture(); f.controls.write = () => Promise.resolve({ error: { message: "failed mount" } });
    await bookmarkChecked("JB23", f, async () => {
      const hook = f.mount(); await bookmarkTurn(); const saved = hook.result.current; expect(saved.failed).toBe(true);
      hook.unmount(); expect(saved.failed).toBe(false); act(() => saved.retry()); await bookmarkTurn();
      expect(f.trace.writes).toHaveLength(1); expect(f.trace.invalidations).toHaveLength(0);
    });
  });
  it("JB24 StrictMode retires replayed setup before write and duplicate retry submits once", async () => {
    const f = bookmarkFixture(true);
    await bookmarkChecked("JB24", f, async () => {
      const hook = f.mount(); await bookmarkTurn(); expect(f.trace.writes).toHaveLength(1); expect(f.trace.invalidations).toHaveLength(1);
      f.controls.write = () => Promise.resolve({ error: { message: "strict retry failure" } }); const saved = hook.result.current.retry;
      act(() => { saved(); saved(); }); await bookmarkTurn(); expect(f.trace.writes).toHaveLength(2); expect(hook.result.current.failed).toBe(true);
      act(() => saved()); await bookmarkTurn(); expect(f.trace.writes).toHaveLength(2); expect(hook.result.current.failed).toBe(true);
    });
  });
  it("JB25 a queued old retry update cannot create a second write or clear a fresh actor failure", async () => {
    const f = bookmarkFixture(); f.controls.write = () => Promise.resolve({ error: { message: "owned failure" } });
    await bookmarkChecked("JB25", f, async () => {
      const hook = f.mount(); await bookmarkTurn(); const saved = hook.result.current.retry;
      act(() => { startTransition(() => saved()); bookmarkRotate("parent-b"); hook.rerender({ ...bookmarkStart }); });
      await bookmarkTurn(); expect(f.trace.writes).toHaveLength(2); expect(f.trace.writes[1].row.user_id).toBe("parent-b");
      expect(hook.result.current.failed).toBe(true); act(() => saved()); await bookmarkTurn();
      expect(f.trace.writes).toHaveLength(2); expect(hook.result.current.failed).toBe(true);
    });
  });
});


describe("Journey bookmark suspended scope", () => {
  it("JB26 suspended selection ABA cannot revive an old retry or skip a fresh action", async () => {
    const f = bookmarkFixture(), resource = bookmarkDeferred<void>();
    f.controls.write = () => Promise.resolve({ error: { message: "selected failure" } });
    await bookmarkChecked("JB26", f, async () => {
      const hook = f.mount(); await bookmarkTurn(); const saved = hook.result.current.retry;
      expect(hook.result.current.failed).toBe(true); expect(f.trace.writes).toHaveLength(1);
      f.controls.suspended = resource.promise;
      hook.rerender({ ...bookmarkStart, lesson: "Suspended different lesson" }); await bookmarkTurn();
      act(() => saved()); await bookmarkTurn(); expect(f.trace.writes).toHaveLength(1);
      f.controls.suspended = undefined; hook.rerender({ ...bookmarkStart }); await bookmarkTurn();
      expect(f.trace.writes).toHaveLength(2); expect(hook.result.current.failed).toBe(true);
      act(() => saved()); await bookmarkTurn();
      expect(f.trace.writes).toHaveLength(2); expect(hook.result.current.failed).toBe(true);
    });
  });
});

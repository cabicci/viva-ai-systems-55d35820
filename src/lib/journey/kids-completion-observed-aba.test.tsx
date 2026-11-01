import React, { StrictMode, useEffect } from "react";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const f = vi.hoisted(() => {
  const fixed = Object.freeze({ value: 0 });
  let actor = "actor-A", busy = false, token = fixed;
  let throwing = "", hook: (() => void) | undefined;
  let predicate: (captured: object) => boolean = captured => captured === fixed;
  const owners = new WeakSet<object>();
  const user = Object.freeze({ get id() { if (this !== user) throw new Error("user receiver"); if (throwing === "id") throw new Error("id getter"); return actor; } });
  const descriptors = {
    user: { get: function(this: object) { if (!owners.has(this)) throw new Error("Auth receiver"); if (throwing === "user") throw new Error("user getter"); return user; } },
    loading: { get: function(this: object) { if (!owners.has(this)) throw new Error("Auth receiver"); if (throwing === "loading") throw new Error("loading getter"); return busy; } },
    authGeneration: { get: function(this: object) { if (!owners.has(this)) throw new Error("Auth receiver"); return token; } },
    isAuthGenerationCurrent: { get: function(this: object) { if (!owners.has(this)) throw new Error("Auth receiver"); const run = hook; hook = undefined; run?.(); if (throwing === "predicate") throw new Error("predicate getter"); return predicate; } },
  };
  const makeAuth = () => { const a = Object.freeze(Object.defineProperties({}, descriptors)); owners.add(a); return a; };
  let auth = makeAuth(), reads = 0;
  let next: () => unknown = () => ({ data: [], error: null });
  const calls: Array<readonly unknown[]> = [];
  const sdk = { from(table: string): object {
    if (this !== sdk) throw new Error("from receiver"); calls.push(["from", table]);
    let index = 0;
    const builder = {
      select(fields: string): object { if (this !== builder) throw new Error("select receiver"); calls.push(["select", fields]); return builder; },
      eq(field: string, value: unknown): unknown { if (this !== builder) throw new Error("eq receiver"); calls.push(["eq", field, value]); if (++index === 3) { reads++; return next(); } return builder; },
    }; return builder;
  } };
  return {
    fixed, user, descriptors, sdk, calls, makeAuth,
    get auth() { return auth; }, set auth(a: object) { auth = a; },
    get actor() { return actor; }, set actor(a: string) { actor = a; },
    get busy() { return busy; }, set busy(b: boolean) { busy = b; },
    get token() { return token; }, set token(t: typeof fixed) { token = t; },
    get reads() { return reads; }, set next(n: () => unknown) { next = n; },
    set throwing(s: string) { throwing = s; }, set hook(h: (() => void) | undefined) { hook = h; },
    set predicate(p: (captured: object) => boolean) { predicate = p; },
    reset() { actor = "actor-A"; busy = false; token = fixed; throwing = ""; hook = undefined; predicate = captured => captured === fixed; auth = makeAuth(); reads = 0; calls.length = 0; next = () => ({ data: [], error: null }); },
  };
});
vi.mock("@/lib/auth-context", () => ({ useAuth: () => f.auth }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: f.sdk }));
import { useKidsCompletion } from "./client";

type View = ReturnType<typeof useKidsCompletion>;
type Response = { data: unknown; error: unknown };
const row = (lesson: number) => ({ profile_id: "child", level_id: "level", lesson_number: lesson, locale: "raw-locale", get private_extra() { throw new Error("private field read"); } });
const response = (lesson: number): Response => ({ data: [row(lesson)], error: null });
function deferred() { let resolve!: (value: Response) => void; const promise = new Promise<Response>(r => { resolve = r; }); return { promise, resolve }; }
const prefix = ["kids-completion", "actor-A", "child"];
let clients: QueryClient[] = [], events: string[] = [], record: Record<string, unknown>;
const unhandled = (reason: unknown) => { events.push("unhandledRejection:" + String(reason)); };
const handled = () => { events.push("rejectionHandled"); };
beforeEach(() => { f.reset(); events = []; record = {}; process.on("unhandledRejection", unhandled); process.on("rejectionHandled", handled); });
afterEach(async (context) => {
  cleanup(); clients.forEach(c => c.clear()); clients = [];
  await new Promise<void>(resolve => setTimeout(resolve, 20));
  process.removeListener("unhandledRejection", unhandled); process.removeListener("rejectionHandled", handled);
  console.log("OABA_CASE_RECORD " + JSON.stringify({ id: context.task.name, ...record, events }));
  expect(events).toEqual([]);
});
function mount(strict = false, level = "level", enabled?: boolean) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } }); clients.push(qc);
  const counts = { render: 0, cleanup: 0 };
  const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={qc}>{strict ? <StrictMode>{children}</StrictMode> : children}</QueryClientProvider>;
  const h = renderHook(() => { counts.render++; useEffect(() => () => { counts.cleanup++; }, []); const q = useKidsCompletion("child", level, "en", enabled); void q.data; void q.status; return q; }, { wrapper });
  return { ...h, qc, counts };
}
const neutral = (q: View) => { expect(q.data).toBeUndefined(); expect(q.status).toBe("pending"); expect(q.isSuccess).toBe(false); expect(q.error).toBeNull(); };
const success = async (h: ReturnType<typeof mount>, lesson: number) => { await waitFor(() => expect(h.result.current.data?.[0]?.lesson_number).toBe(lesson)); expect(h.result.current.isSuccess).toBe(true); };
function observed(kind: "actor" | "loading", h: ReturnType<typeof mount>, views: View[]) {
  const auth = f.auth, user = f.user, gen = f.token, before = { ...h.counts };
  if (kind === "actor") f.actor = "actor-B"; else f.busy = true;
  views.forEach(neutral); const middle = { ...h.counts };
  if (kind === "actor") f.actor = "actor-A"; else f.busy = false;
  views.forEach(neutral); const after = { ...h.counts };
  expect(middle).toEqual(before); expect(after).toEqual(before);
  expect(f.auth).toBe(auth); expect(f.user).toBe(user); expect(f.token).toBe(gen);
  expect(Reflect.apply(Reflect.get(auth, "isAuthGenerationCurrent"), auth, [gen])).toBe(true);
  record = { ...record, middle_observed: kind, render_cleanup: [before, middle, after], same_frozen_Auth_user_getters_generation: Object.isFrozen(auth) && Object.isFrozen(user) && gen === f.fixed && Object.getOwnPropertyDescriptor(auth, "user")?.get === f.descriptors.user.get, predicate: "captured === fixedGeneration" };
}

describe("observed KIDS retirement r33", () => {
  for (const kind of ["actor", "loading"] as const) {
    it("OABA-F01 pending " + kind + " observed ABA cannot publish old query; fresh render owns new read", async () => {
      const old = deferred(), fresh = deferred(); f.next = () => f.reads === 1 ? old.promise : fresh.promise;
      const h = mount(); await waitFor(() => expect(f.reads).toBe(1));
      const saved = h.result.current, callback = saved.refetch;
      const oldQuery = h.qc.getQueryCache().findAll({ queryKey: prefix }).find(q => q.getObserversCount() > 0)!;
      expect(oldQuery).toBeDefined(); observed(kind, h, [saved]);
      neutral(await callback()); expect(f.reads).toBe(1);
      await act(async () => { old.resolve(response(11)); }); h.rerender();
      await waitFor(() => expect(f.reads).toBe(2));
      expect(oldQuery.state.data).toBeUndefined(); expect(oldQuery.state.status).not.toBe("success");
      neutral(saved); neutral(await callback()); expect(f.reads).toBe(2);
      await act(async () => { fresh.resolve(response(91)); }); await success(h, 91);
      expect(h.qc.getQueryCache().get(oldQuery.queryHash)).toBe(oldQuery);
      const active = h.qc.getQueryCache().findAll({ queryKey: prefix }).find(q => q.getObserversCount() > 0)!;
      expect(active.queryHash).not.toBe(oldQuery.queryHash); record.old_query_status = oldQuery.state.status; record.fresh_hash_differs = true;
    });
    it("OABA-F02 settled ROOT and returned refetch " + kind + " never revive; prefix refresh preserves history", async () => {
      f.next = () => response(f.reads === 1 ? 51 : f.reads === 2 ? 52 : 99);
      const h = mount(); await success(h, 51);
      let returned!: View; await act(async () => { returned = await h.result.current.refetch(); }); await success(h, 52);
      const root = h.result.current, rootCallback = root.refetch, returnedCallback = returned.refetch;
      expect(returned.data?.[0]?.lesson_number).toBe(52);
      const old = h.qc.getQueryCache().findAll({ queryKey: prefix }).find(q => q.getObserversCount() > 0)!;
      h.qc.setQueryData(["unrelated", "r33"], "retained");
      observed(kind, h, [root, returned]); neutral(await rootCallback()); neutral(await returnedCallback()); expect(f.reads).toBe(2);
      h.rerender(); await success(h, 99); expect(f.reads).toBe(3);
      expect(old.state.data).toEqual([expect.objectContaining({ lesson_number: 52 })]); expect(h.qc.getQueryCache().get(old.queryHash)).toBe(old);
      neutral(root); neutral(returned); neutral(await rootCallback()); neutral(await returnedCallback()); expect(f.reads).toBe(3);
      await act(async () => { await h.qc.invalidateQueries({ queryKey: prefix }); }); expect(f.reads).toBe(4); await success(h, 99);
      expect(h.qc.getQueryData(["unrelated", "r33"])).toBe("retained"); expect(old.state.data).toEqual([expect.objectContaining({ lesson_number: 52 })]); record.cache_retained_masked = true;
    });
  }
  it("OABA-C01 current exact select/order/raw values/empty level/default enabled/manual refetch", async () => {
    f.next = () => ({ data: [row(-1.5), row(0), row(7.25)], error: null }); const h = mount(false, "");
    await waitFor(() => expect(h.result.current.data?.length).toBe(3));
    expect(h.result.current.data?.map(r => r.lesson_number)).toEqual([-1.5, 0, 7.25]); expect(h.result.current.data?.[0]?.locale).toBe("raw-locale");
    expect(f.calls).toEqual([["from", "kids_lesson_progress"], ["select", "profile_id,level_id,lesson_number,locale"], ["eq", "profile_id", "child"], ["eq", "level_id", ""], ["eq", "locale", "en"]]);
    expect(Object.isFrozen(h.result.current.data)).toBe(true); expect(Object.keys(h.result.current.data![0])).toEqual(["profile_id", "level_id", "lesson_number", "locale"]);
    await act(async () => { const view = await h.result.current.refetch(); expect(view.isSuccess).toBe(true); }); expect(f.reads).toBe(2);
    expect(h.qc.getQueryCache().findAll({ queryKey: ["kids-completion", "actor-A", "child"] }).find(q => q.getObserversCount() > 0)?.queryKey).toEqual(["kids-completion", "actor-A", "child", "", "en"]);
  });
  it("OABA-C02 current SDK error and throwOnError remain honest", async () => {
    const error = new Error("current SDK failure"); f.next = () => ({ data: null, error }); const h = mount();
    await waitFor(() => expect(h.result.current.error).toBe(error)); expect(h.result.current.isError).toBe(true);
    await act(async () => { await expect(h.result.current.refetch({ throwOnError: true })).rejects.toBe(error); }); expect(f.reads).toBe(2);
  });
  it("OABA-C03 malformed current rows fail honestly", async () => {
    f.next = () => ({ data: [{ profile_id: "child", level_id: "level", lesson_number: "wrong", locale: "en" }], error: null }); const h = mount();
    await waitFor(() => expect(h.result.current.isError).toBe(true)); expect(h.result.current.data).toBeUndefined(); expect(h.result.current.error?.message).toContain("Malformed");
  });
  it("OABA-C04 same-semantics Auth and predicate identity churn retains hash and read", async () => {
    f.next = () => response(21); const h = mount(); await success(h, 21);
    const q = h.qc.getQueryCache().findAll({ queryKey: prefix }).find(q => q.getObserversCount() > 0)!;
    for (let n = 0; n < 3; n++) { f.auth = f.makeAuth(); f.predicate = captured => captured === f.fixed; h.rerender(); await success(h, 21); }
    expect(f.reads).toBe(1); expect(h.qc.getQueryCache().findAll({ queryKey: prefix }).find(q => q.getObserversCount() > 0)).toBe(q);
    await act(async () => { await h.result.current.refetch(); }); expect(f.reads).toBe(2);
  });
  it("OABA-C05 equal numeric generation replacement observed then restored cannot revive", async () => {
    f.next = () => response(22); const h = mount(); await success(h, 22); const saved = h.result.current, callback = saved.refetch, before = { ...h.counts };
    f.token = Object.freeze({ value: 0 }); neutral(saved); f.token = f.fixed; neutral(saved); expect(h.counts).toEqual(before); neutral(await callback()); expect(f.reads).toBe(1);
    h.rerender(); await success(h, 22); expect(f.reads).toBe(2); neutral(saved); record.same_numeric_generation_object_replacement = true;
  });
  for (const getter of ["user", "id", "loading", "predicate"] as const) {
    it("OABA-C06 observed " + getter + " getter throw repaired before render stays retired", async () => {
      f.next = () => response(23); const h = mount(); await success(h, 23); const saved = h.result.current, before = { ...h.counts };
      f.throwing = getter; neutral(saved); f.throwing = ""; neutral(saved); expect(h.counts).toEqual(before); neutral(await saved.refetch()); expect(f.reads).toBe(1);
      h.rerender(); await success(h, 23); expect(f.reads).toBe(2); neutral(saved);
    });
  }
  for (const kind of ["actor", "loading"] as const) {
    it("OABA-C07 predicate getter reentry observes " + kind + " and restore cannot revive", async () => {
      f.next = () => response(24); const h = mount(); await success(h, 24); const saved = h.result.current, before = { ...h.counts };
      f.hook = () => { if (kind === "actor") f.actor = "actor-B"; else f.busy = true; neutral(saved); if (kind === "actor") f.actor = "actor-A"; else f.busy = false; };
      neutral(saved); expect(h.counts).toEqual(before); neutral(await saved.refetch()); expect(f.reads).toBe(1); h.rerender(); await success(h, 24); expect(f.reads).toBe(2);
    });
  }
  it("OABA-C08 observed non-literal-true predicate stays retired after repair", async () => {
    f.next = () => response(25); const h = mount(); await success(h, 25); const saved = h.result.current;
    f.predicate = () => false; neutral(saved); f.predicate = captured => captured === f.fixed; neutral(saved); neutral(await saved.refetch()); expect(f.reads).toBe(1);
    h.rerender(); await success(h, 25); expect(f.reads).toBe(2);
  });
  it("OABA-C09 wholly unobserved transient ABA is outside the guarantee", async () => {
    f.next = () => response(26); const h = mount(); await success(h, 26); const saved = h.result.current, before = { ...h.counts };
    f.actor = "actor-B"; f.busy = true; f.busy = false; f.actor = "actor-A";
    expect(h.counts).toEqual(before); expect(saved.data?.[0]?.lesson_number).toBe(26); expect(saved.isSuccess).toBe(true); expect(f.reads).toBe(1); record.unobserved_ABA_detection_not_certified = true;
  });
  it("OABA-C10 entered native rejection observed before retired denial with ownthen zero", async () => {
    f.next = () => response(31); const h = mount(); await success(h, 31); let ownThen = 0; const saved = h.result.current;
    f.next = () => { if (f.reads !== 2) return response(100); f.actor = "actor-B"; neutral(saved); f.actor = "actor-A"; const p = new Promise<Response>((_resolve, reject) => reject(new Error("retired native"))); Object.defineProperty(p, "then", { get() { ownThen++; throw new Error("own then read"); } }); return p; };
    let returned!: View; await act(async () => { returned = await saved.refetch(); }); neutral(returned); neutral(saved);
    expect(ownThen).toBe(0); record.native_own_then_reads = ownThen;
  });
  it("OABA-C11 then getter observes ABA before lazy function adoption", async () => {
    let saved: View | undefined, gets = 0, adopts = 0; const gate = deferred();
    f.next = () => f.reads === 1 ? gate.promise : f.reads === 2 ? Object.defineProperty({}, "then", { get() { gets++; f.actor = "actor-B"; if (saved) neutral(saved); f.actor = "actor-A"; return function() { adopts++; }; } }) : response(100);
    const h = mount(); await waitFor(() => expect(f.reads).toBe(1)); await act(async () => { gate.resolve(response(27)); }); await success(h, 27); saved = h.result.current;
    let returned!: View; await act(async () => { returned = await saved!.refetch(); }); neutral(returned); expect(gets).toBe(1); expect(adopts).toBe(0); neutral(saved); record.lazy_then_gets = gets; record.lazy_adoptions = adopts;
  });
  it("OABA-C12 entered derived rejection observed intrinsically after callback retirement", async () => {
    let saved: View | undefined, derivedOwnThen = 0; f.next = () => f.reads === 1 ? response(28) : {
      then(resolve: (value: Response) => void) { f.busy = true; if (saved) neutral(saved); f.busy = false; resolve(response(29)); const p = new Promise<void>((_resolve, reject) => reject(new Error("derived retired"))); Object.defineProperty(p, "then", { get() { derivedOwnThen++; throw new Error("derived own then"); } }); return p; },
    };
    const h = mount(); await success(h, 28); saved = h.result.current; let returned!: View;
    await act(async () => { returned = await saved!.refetch(); }); neutral(returned); neutral(saved); expect(derivedOwnThen).toBe(0); record.derived_own_then_reads = derivedOwnThen;
  });
  it("OABA-C13 StrictMode and genuinely new lifetime work; old callbacks remain denied", async () => {
    f.next = () => response(30); const h = mount(true); await success(h, 30); const saved = h.result.current, callback = saved.refetch, before = f.reads;
    h.unmount(); neutral(saved); neutral(await callback()); expect(f.reads).toBe(before);
    const fresh = mount(true); await success(fresh, 30); expect(f.reads).toBe(before + 1); neutral(saved); neutral(await callback()); record.strict_mode_counts = [h.counts, fresh.counts];
  });
});

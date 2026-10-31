import { blockBrowserIO } from "@/test/blocked-browser-io";
import React, { useEffect } from "react";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
declare global { var __r36IO: { network: number; storage: number }; }

const f = vi.hoisted(() => {
  const generation = Object.freeze({ value: 0 });
  let target = "", kind = "", entries = 0, ownThen = 0, lazyGets = 0, lazyAdopts = 0, receiver: object | undefined;
  function native(derived: boolean) {
    const error = new Error("entered native fault");
    // Derivation is part of the actual fault CALL, not a fixture observer of a rejected SDK target.
    const p = derived ? new Promise<number>(resolve => resolve(0)).then<number>(() => { throw error; }) : new Promise<number>((_resolve, reject) => reject(error));
    Object.defineProperty(p, "then", { get() { ownThen++; throw new Error("native own-then read"); } });
    return p;
  }
  function enter(at: string, actualReceiver: object): unknown {
    if (target !== at) return undefined;
    target = ""; entries++; receiver = actualReceiver;
    if (kind === "error") throw new Error("ordinary caught fault");
    if (kind === "lazy") throw Object.defineProperty({}, "then", { get() { lazyGets++; return function() { lazyAdopts++; }; } });
    const p = native(kind === "derived");
    if (kind === "returned") return p;
    throw p;
  }
  const user = Object.freeze({ get id() { enter("id", this); return "actor"; } });
  const auth = Object.freeze({
    get user() { enter("user", this); return user; },
    get loading() { enter("loading", this); return false; },
    get authGeneration() { enter("generation", this); return generation; },
    get isAuthGenerationCurrent() {
      enter("predicate-get", this);
      return function(this: object, captured: object) { const value = enter("predicate-call", this); return value === undefined ? captured === generation : value; };
    },
  });
  let reads = 0, nativeSDK = false;
  let next: () => unknown = () => ({ data: [], error: null });
  const calls: unknown[][] = [];
  const sdk = { from(table: string): object {
    if (this !== sdk) throw new Error("from receiver"); calls.push(["from", table]); let n = 0;
    const builder = {
      select(fields: string): object { if (this !== builder) throw new Error("select receiver"); calls.push(["select", fields]); return builder; },
      eq(field: string, value: unknown): unknown { if (this !== builder) throw new Error("eq receiver"); calls.push(["eq", field, value]); if (++n !== 3) return builder; reads++; const result = next(); return nativeSDK ? new Promise<unknown>(resolve => resolve(result)) : result; },
    }; return builder;
  } };
  return { auth, user, generation, sdk, calls,
    get entries() { return entries; }, get ownThen() { return ownThen; }, get lazyGets() { return lazyGets; }, get lazyAdopts() { return lazyAdopts; }, get receiver() { return receiver; }, get reads() { return reads; },
    set next(fn: () => unknown) { next = fn; }, set nativeSDK(b: boolean) { nativeSDK = b; },
    arm(at: string, fault: string) { target = at; kind = fault; },
    reset() { target = ""; kind = ""; entries = 0; ownThen = 0; lazyGets = 0; lazyAdopts = 0; receiver = undefined; reads = 0; nativeSDK = false; next = () => ({ data: [], error: null }); calls.length = 0; },
  };
});
vi.mock("@/lib/auth-context", () => ({ useAuth: () => f.auth }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: f.sdk }));
import { useKidsCompletion } from "./client";
type View = ReturnType<typeof useKidsCompletion>;
const response = (lesson: number) => ({ data: [{ profile_id: "child", level_id: "raw-level", lesson_number: lesson, locale: "raw-locale", get private_extra() { throw new Error("private field read"); } }], error: null });
let clients: QueryClient[] = [], events: string[] = [], trace: Record<string, unknown>;
let io: ReturnType<typeof blockBrowserIO>;
const onUnhandled = (reason: unknown) => { events.push("unhandledRejection:" + String(reason)); };
const onHandled = () => { events.push("rejectionHandled"); };
beforeEach(() => { f.reset(); events = []; trace = {}; io = blockBrowserIO(); globalThis.__r36IO = io.counts; process.on("unhandledRejection", onUnhandled); process.on("rejectionHandled", onHandled); });
afterEach(async context => {
  cleanup(); clients.forEach(c => c.clear()); clients = [];
  await new Promise<void>(resolve => setTimeout(resolve, 30));
  process.removeListener("unhandledRejection", onUnhandled); process.removeListener("rejectionHandled", onHandled);
  console.log("R36_CASE_RECORD " + JSON.stringify({ id: context.task.name, ...trace, events, blocked_io: globalThis.__r36IO, io_guard_installed: io.installed, io_guard_absent: io.absent }));
  try {
  expect(events).toEqual([]); expect(globalThis.__r36IO).toEqual({ network: 0, storage: 0 });
  } finally { io.restore(); }
});
function mount(level = "raw-level") {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } }); clients.push(qc);
  const counts = { renders: 0, cleanups: 0 };
  const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  const h = renderHook(() => { counts.renders++; useEffect(() => () => { counts.cleanups++; }, []); const q = useKidsCompletion("child", level, "en"); void q.data; void q.status; return q; }, { wrapper });
  return { ...h, qc, counts };
}
const neutral = (q: View) => { expect(q.data).toBeUndefined(); expect(q.error).toBeNull(); expect(q.status).toBe("pending"); expect(q.isSuccess).toBe(false); };
const ready = async (h: ReturnType<typeof mount>, value: number) => { await waitFor(() => expect(h.result.current.data?.[0]?.lesson_number).toBe(value)); expect(h.result.current.isSuccess).toBe(true); };
describe("r36 caught native exception observation", () => {
  const faults = [
    ["NTF01 predicate CALL throws rejected native", "predicate-call", "native"],
    ["NTF02 predicate CALL throws derived native", "predicate-call", "derived"],
    ["NTF03 live user getter throws rejected native", "user", "native"],
    ["NTF04 live id getter throws rejected native", "id", "native"],
    ["NTF05 live loading getter throws rejected native", "loading", "native"],
    ["NTF06 live generation getter throws rejected native", "generation", "native"],
    ["NTF07 predicate getter throws rejected native", "predicate-get", "native"],
    ["NTF08 ordinary predicate Error remains closed", "predicate-call", "error"],
    ["NTF09 arbitrary thrown lazy value is not adopted", "predicate-call", "lazy"],
    ["NTF10 returned rejected native predicate is observed and denied", "predicate-call", "returned"],
  ] as const;
  for (const [name, target, kind] of faults) it(name, async () => {
    f.next = () => response(f.reads === 1 ? 51 : f.reads === 2 ? 52 : 99);
    const h = mount(); await ready(h, 51); let returned!: View;
    await act(async () => { returned = await h.result.current.refetch(); }); await ready(h, 52);
    const root = h.result.current, rootRefetch = root.refetch, returnedRefetch = returned.refetch;
    const old = h.qc.getQueryCache().findAll({ queryKey: ["kids-completion", "actor", "child"] }).find(q => q.getObserversCount() > 0)!;
    const before = { ...h.counts }, auth = f.auth, gen = f.generation;
    f.arm(target, kind); neutral(root); const middle = { ...h.counts };
    // Fault is consumed inside the actual getter/CALL; normal semantics have already returned.
    neutral(root); neutral(returned); const after = { ...h.counts };
    expect(middle).toEqual(before); expect(after).toEqual(before); expect(f.auth).toBe(auth); expect(f.generation).toBe(gen);
    expect(f.entries).toBe(1); expect(f.receiver).toBe(target === "id" ? f.user : auth);
    expect(f.ownThen).toBe(0); expect(f.lazyGets).toBe(0); expect(f.lazyAdopts).toBe(0);
    neutral(await rootRefetch()); neutral(await returnedRefetch()); expect(f.reads).toBe(2);
    h.rerender(); await ready(h, 99); expect(f.reads).toBe(3);
    neutral(root); neutral(returned); neutral(await rootRefetch()); neutral(await returnedRefetch()); expect(f.reads).toBe(3);
    expect(old.state.data).toEqual([expect.objectContaining({ lesson_number: 52 })]); expect(h.qc.getQueryCache().get(old.queryHash)).toBe(old);
    trace = { fault_created_inside_actual_entry: true, target, kind, fault_entries: f.entries, original_receiver: true, native_own_then_reads: f.ownThen, lazy_gets: f.lazyGets, lazy_adoptions: f.lazyAdopts, render_cleanup: [before, middle, after], frozen_Auth_generation: Object.isFrozen(auth) && Object.isFrozen(gen), later_render_reads: f.reads, old_cache_retained_masked: true };
  });
  it("NTF11 current native SDK result, raw fields, empty level, key and prefix remain usable", async () => {
    f.nativeSDK = true; f.next = () => response(-1.25); const h = mount(""); await ready(h, -1.25);
    expect(f.calls).toEqual([["from", "kids_lesson_progress"], ["select", "profile_id,level_id,lesson_number,locale"], ["eq", "profile_id", "child"], ["eq", "level_id", ""], ["eq", "locale", "en"]]);
    expect(h.result.current.data?.[0]?.locale).toBe("raw-locale"); expect(Object.keys(h.result.current.data![0])).toEqual(["profile_id", "level_id", "lesson_number", "locale"]);
    expect(h.qc.getQueryCache().findAll({ queryKey: ["kids-completion", "actor", "child"] }).find(q => q.getObserversCount() > 0)?.queryKey).toEqual(["kids-completion", "actor", "child", "", "en"]);
    await act(async () => { const returned = await h.result.current.refetch(); expect(returned.data?.[0]?.lesson_number).toBe(-1.25); }); expect(f.reads).toBe(2);
    await act(async () => { await h.qc.invalidateQueries({ queryKey: ["kids-completion", "actor", "child"] }); }); expect(f.reads).toBe(3); await ready(h, -1.25);
    trace = { current_native_SDK: true, genuine_prefix_invalidation: true, reads: f.reads };
  });
  it("NTF12 genuine current SDK error and throwOnError remain honest", async () => {
    const error = new Error("current database-shaped error"); f.next = () => ({ data: null, error }); const h = mount(); await waitFor(() => expect(h.result.current.error).toBe(error));
    await act(async () => { await expect(h.result.current.refetch({ throwOnError: true })).rejects.toBe(error); });
    f.next = () => response(61); await act(async () => { await h.result.current.refetch(); }); await ready(h, 61); expect(f.reads).toBe(3);
  });
  it("NTF13 genuinely new mounted lifetime works after fault and old callbacks stay denied", async () => {
    f.next = () => response(71); const old = mount(); await ready(old, 71); const saved = old.result.current, callback = saved.refetch;
    f.arm("predicate-call", "native"); neutral(saved); old.unmount(); neutral(await callback()); expect(f.reads).toBe(1);
    const fresh = mount(); await ready(fresh, 71); expect(f.reads).toBe(2); neutral(saved); neutral(await callback()); expect(f.reads).toBe(2);
    trace = { fault_entries: f.entries, native_own_then_reads: f.ownThen, fresh_lifetime_usable: true };
  });
});

import React from "react";
import { render, cleanup, act, waitFor } from "@testing-library/react";
import { QueryClient } from "@tanstack/react-query";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import type { JourneyReadView, JourneyReadController } from "@/lib/journey-current-user-context";
declare global {
  var __r39IO: { network: number; storage: number };
  var __r39Sentinels: ReadonlyArray<readonly [string, string]>;
  var __r39ReadSyntheticRaw: (key: string) => string | null;
}
const f = vi.hoisted(() => {
  const fixed = Object.freeze({ value: 0 }); let actor: string | null = "actor-A", loading = false, generation = fixed;
  let predicate: (this: object, captured: object) => unknown = captured => captured === fixed;
  let predicateHook: (() => void) | undefined, fromHook: (() => void) | undefined;
  const owners = new WeakSet<object>();
  const user = Object.freeze({ get id() { if (this !== user) throw new Error("user receiver"); return actor; } });
  const descriptors = {
    user: { get: function(this: object) { if (!owners.has(this)) throw new Error("Auth user receiver"); return actor === null ? null : user; } },
    loading: { get: function(this: object) { if (!owners.has(this)) throw new Error("Auth loading receiver"); return loading; } },
    authGeneration: { get: function(this: object) { if (!owners.has(this)) throw new Error("Auth generation receiver"); return generation; } },
    isAuthGenerationCurrent: { get: function(this: object) { if (!owners.has(this)) throw new Error("Auth predicate receiver"); const h = predicateHook; predicateHook = undefined; h?.(); return predicate; } },
  };
  const makeAuth = () => { const a = Object.freeze(Object.defineProperties({}, descriptors)); owners.add(a); return a; };
  let auth = makeAuth(), mode: unknown = "read-only-shadow", client: object | null = null, reads = 0, fromGets = 0, privateReads = 0, ownThen = 0, lazyGets = 0, lazyCalls = 0;
  let handle: (table: string, actor: string) => unknown = () => ({ data: [], error: null });
  const calls: unknown[][] = [], entries: Array<{ table: string; actor: string; read: number }> = [], order: string[] = [];
  const sdk = { get from() { fromGets++; const h = fromHook; fromHook = undefined; h?.(); return from; } };
  function from(this: object, table: string): object {
    if (this !== sdk) throw new Error("SDK receiver"); calls.push(["from", table]); let selectedActor = "";
    const builder = {
      select(fields: string): object { if (this !== builder) throw new Error("select receiver"); calls.push(["select", fields]); return builder; },
      eq(field: string, value: string): unknown { if (this !== builder) throw new Error("eq receiver"); calls.push(["eq", field, value]); selectedActor = value; if (table === "user_mission_state") return enter(); return builder; },
      order(field: string, options: object): object { if (this !== builder) throw new Error("order receiver"); calls.push(["order", field, options]); return builder; },
      limit(limit: number): unknown { if (this !== builder) throw new Error("limit receiver"); calls.push(["limit", limit]); return enter(); },
    };
    function enter() { reads++; entries.push({ table, actor: selectedActor, read: reads }); return handle(table, selectedActor); }
    return builder;
  }
  const updaters: Array<{ argument: unknown; forward: () => void }> = [];
  return {
    fixed, user, descriptors, makeAuth, sdk, calls, entries, order, updaters,
    holdCommit: false, childRetry: false, legacyCalls: 0, warnings: 0, renders: 0, cleanups: 0,
    get actor() { return actor; }, set actor(v: string | null) { actor = v; }, get loading() { return loading; }, set loading(v: boolean) { loading = v; },
    get generation() { return generation; }, set generation(v: typeof fixed) { generation = v; },
    get auth() { return auth; }, set auth(v: object) { auth = v; }, set predicate(v: (this: object, captured: object) => unknown) { predicate = v; },
    set predicateHook(v: (() => void) | undefined) { predicateHook = v; }, set fromHook(v: (() => void) | undefined) { fromHook = v; },
    get root() { return { queryClient: client, journeyReadMode: mode }; }, set mode(v: unknown) { mode = v; }, set client(v: object) { client = v; },
    get reads() { return reads; }, get fromGets() { return fromGets; }, get privateReads() { return privateReads; },
    get ownThen() { return ownThen; }, get lazyGets() { return lazyGets; }, get lazyCalls() { return lazyCalls; },
    set handle(v: (table: string, actor: string) => unknown) { handle = v; },
    privateRead() { privateReads++; throw new Error("private extra traversed"); },
    rejectNative() { const p = new Promise<never>((_resolve, reject) => reject(new Error("entered ordinary native fault"))); Object.defineProperty(p, "then", { get() { ownThen++; throw new Error("own-then read"); } }); return p; },
    lazy() { return Object.defineProperty({}, "then", { get() { lazyGets++; return function() { lazyCalls++; }; } }); },
    reset() { actor = "actor-A"; loading = false; generation = fixed; predicate = captured => captured === fixed; predicateHook = undefined; fromHook = undefined; auth = makeAuth(); mode = "read-only-shadow"; client = null; reads = 0; fromGets = 0; privateReads = 0; ownThen = 0; lazyGets = 0; lazyCalls = 0; calls.length = 0; entries.length = 0; order.length = 0; updaters.length = 0; this.holdCommit = false; this.childRetry = false; this.legacyCalls = 0; this.warnings = 0; this.renders = 0; this.cleanups = 0; },
  };
});
// Only genuine React dispatch is forwarded; one dedicated scheduling case holds
// ORIGINAL updater arguments without invoking/replacing their algorithm.
vi.mock("react", async () => {
  const original = await vi.importActual<typeof import("react")>("react");
  function useState(initial: unknown) {
    const [state, dispatch] = original.useState(initial);
    return [state, (argument: unknown) => {
      if (f.holdCommit && typeof argument === "function") f.updaters.push({ argument, forward: () => dispatch(argument) });
      else dispatch(argument);
    }];
  }
  return { ...original, useState, default: { ...original, useState } };
});
vi.mock("@/integrations/supabase/client", () => ({ supabase: f.sdk }));
vi.mock("@/lib/auth-context", () => ({ useAuth: () => f.auth, AuthProvider: ({ children }: { children: React.ReactNode }) => children }));
vi.mock("@/lib/error-capture", () => ({ captureWarn: () => { f.warnings++; } }));
vi.mock("@tanstack/react-router", () => ({
  createRootRouteWithContext: () => (options: object) => ({ options, useRouteContext: () => f.root, useLoaderData: () => ({ effectiveLocale: "en" }) }),
  Outlet: () => { f.order.push("outlet"); return React.createElement(Probe); }, HeadContent: () => null, Scripts: () => null,
}));
vi.mock("@/components/site/CloudHydration", async () => {
  const actual = await vi.importActual<typeof import("@/components/site/CloudHydration")>("@/components/site/CloudHydration");
  return { ...actual, CloudHydration: () => { f.legacyCalls++; throw new Error("Forbidden legacy writer entry"); } };
});
vi.mock("@/components/site/AnalyticsConsent", () => ({ AnalyticsConsentGate: () => { f.order.push("analytics"); return null; } }));
vi.mock("@/components/site/BackToDashboard", () => ({ BackToDashboard: () => { f.order.push("back"); return null; } }));
vi.mock("@/components/ui/sonner", () => ({ Toaster: () => { f.order.push("toaster"); return null; } }));
vi.mock("@/components/site/route-boundaries", () => ({ RouteError: () => null, RouteNotFound: () => null }));
vi.mock("@/lib/locale/locale-router-provider", () => ({ LocaleRouterProvider: ({ children }: { children: React.ReactNode }) => children }));
vi.mock("@/lib/locale/locale-context", () => ({ useLocale: () => ({ dir: "ltr" }) }));
vi.mock("@/lib/seo/site-structured-data", () => ({ SITE_STRUCTURED_DATA: [] }));
vi.mock("@/lib/locale/locale-search", () => ({ parseLocaleSearchParam: () => ({}) }));
vi.mock("@/lib/locale/read-locale-runtime-inputs", () => ({ readLocaleRuntimeInputs: () => { throw new Error("Loader must not execute"); } }));
vi.mock("@/lib/locale/resolve-public-locale", () => ({ resolvePublicLocale: () => ({ locale: "en" }) }));
vi.mock("@/lib/locale/build-localized-public-meta", () => ({ buildLocalizedPublicMeta: () => ({ meta: [] }) }));
vi.mock("@/lib/locale/resolve-route-head-locale", () => ({ resolveRouteHeadLocale: () => "en" }));
vi.mock("@/lib/locale/ui-strings", () => ({ getUiString: () => "" }));
vi.mock("@/lib/locale/types", () => ({ LOCALE_META: { en: { dir: "ltr", lang: "en" } } }));
import { Route } from "@/routes/__root";
import { useJourneyCurrentUserRead, useJourneyReadController } from "@/lib/journey-current-user-context";

let view: JourneyReadView, controller: JourneyReadController | null;
let childPhases: Array<{ status: string; reads: number; renders: number; cleanups: number }> = [];
let record: Record<string, unknown> = {}, events: string[] = [], clients: QueryClient[] = [];
function Probe() {
  view = useJourneyCurrentUserRead(); controller = useJourneyReadController(); f.renders++;
  const status = view.status;
  React.useLayoutEffect(() => {
    childPhases.push({ status: view.status, reads: f.reads, renders: f.renders, cleanups: f.cleanups });
    if (f.childRetry) void view.retry();
  }, [controller]);
  React.useEffect(() => () => { f.cleanups++; }, []);
  return <span data-testid="shadow-state">{status}</span>;
}
function logRow(actor: string, id = "log") { return { id: actor + ":" + id, type: "mission_started", lesson_id: null, title: "raw title", short_description: "raw description", created_at: "raw-created-at", metadata: { local_id: "raw-local", module_id: null, local_timestamp: -1.25, get private_extra() { return f.privateRead(); } }, get private_extra() { return f.privateRead(); } }; }
function response(table: string, actor: string) { return { data: table === "build_logs" ? [logRow(actor)] : [{ mission_id: actor + ":mission", state: "completed", created_at: "raw-start", updated_at: "raw-end", get private_extra() { return f.privateRead(); } }], error: null }; }
function deferred() { let resolve!: (value: unknown) => void, reject!: (reason: unknown) => void; const promise = new Promise<unknown>((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; }
function mount(strict = false) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } }); clients.push(qc); f.client = qc;
  const Component = Route.options.component; if (!Component) throw new Error("Actual RootComponent missing");
  const tree = () => strict ? <React.StrictMode><Component /></React.StrictMode> : <Component />;
  const h = render(tree()); return { ...h, qc, refresh: () => h.rerender(tree()) };
}
const ready = async (actor = "actor-A") => { await waitFor(() => expect(view.status).toBe("ready")); expect(view.logs?.[0]?.id).toBe(actor + ":log"); expect(view.missions?.[0]?.mission_id).toBe(actor + ":mission"); };
const denied = (saved: JourneyReadView) => { expect(saved.logs).toBeUndefined(); expect(saved.missions).toBeUndefined(); expect(saved.error).toBeNull(); expect(["retired", "unavailable"]).toContain(saved.status); };
const onUnhandled = (reason: unknown) => { events.push("unhandledRejection:" + String(reason)); };
const onHandled = () => { events.push("rejectionHandled"); };
beforeEach(() => { f.reset(); f.handle = (table, actor) => new Promise(resolve => resolve(response(table, actor))); childPhases = []; record = {}; events = []; globalThis.__r39IO.network = 0; globalThis.__r39IO.storage = 0; process.on("unhandledRejection", onUnhandled); process.on("rejectionHandled", onHandled); });
afterEach(async context => {
  cleanup(); clients.forEach(c => c.clear()); clients = []; f.holdCommit = false;
  await new Promise<void>(resolve => setTimeout(resolve, 25));
  process.removeListener("unhandledRejection", onUnhandled); process.removeListener("rejectionHandled", onHandled);
  const sentinels = globalThis.__r39Sentinels.every(([key, raw]) => globalThis.__r39ReadSyntheticRaw(key) === raw);
  console.log("R39_CASE_RECORD " + JSON.stringify({ id: context.task.name, ...record, events, SDK_entries: f.entries, from_gets: f.fromGets, forbidden_io: globalThis.__r39IO, legacy_export_trap_calls: f.legacyCalls, warnings: f.warnings, private_reads: f.privateReads, own_then_reads: f.ownThen, synthetic_raw_sentinels_unchanged: sentinels }));
  expect(events).toEqual([]); expect(globalThis.__r39IO).toEqual({ network: 0, storage: 0 }); expect(f.legacyCalls).toBe(0); expect(f.privateReads).toBe(0); expect(sentinels).toBe(true);
});
describe("r39 actual root owned read shadow", () => {
  it("SH01 current exact SELECTs/projection/receivers; child-before-parent neutral then reconciliation", async () => {
    f.childRetry = true; mount(); await ready();
    expect(f.calls).toEqual([["from", "build_logs"], ["select", "id, type, lesson_id, title, short_description, created_at, metadata"], ["eq", "user_id", "actor-A"], ["order", "created_at", { ascending: false }], ["limit", 500], ["from", "user_mission_state"], ["select", "mission_id, state, created_at, updated_at"], ["eq", "user_id", "actor-A"]]);
    expect(childPhases[0]?.status).toBe("unavailable"); expect(childPhases[0]?.reads).toBe(0); expect(childPhases.some(p => p.status !== "unavailable")).toBe(true);
    expect(f.order.slice(0, 4)).toEqual(["analytics", "outlet", "back", "toaster"]);
    expect(view.logs?.[0]?.created_at).toBe("raw-created-at"); expect(view.logs?.[0]?.metadata).toEqual({ local_id: "raw-local", module_id: null, local_timestamp: -1.25 });
    expect(Object.keys(view.logs![0])).toEqual(["id", "type", "lesson_id", "title", "short_description", "created_at", "metadata"]);
    expect(Object.isFrozen(view.logs)).toBe(true); expect(view.completeHistory).toBe(false); expect(view.logLimit).toBe(500); expect(view.then).toBeUndefined(); record.child_phases = childPhases;
  });
  it("SH02 server limit and bounded public500 view do not claim full history", async () => {
    f.handle = (table, actor) => ({ data: table === "build_logs" ? Array.from({ length: 501 }, (_, i) => logRow(actor, String(i))) : [], error: null }); mount();
    await waitFor(() => expect(view.status).toBe("ready")); expect(view.logs?.length).toBe(500); expect(view.logs?.[499]?.id).toBe("actor-A:499"); expect(view.missions).toEqual([]); expect(view.completeHistory).toBe(false);
  });
  it("SH03 current SDK error is honest and current retry succeeds", async () => {
    const error = new Error("current cloud error"); f.handle = () => ({ data: null, error }); mount(); await waitFor(() => expect(view.status).toBe("error")); expect(view.error).toBe(error);
    f.handle = (table, actor) => response(table, actor); let returned!: JourneyReadView; await act(async () => { returned = await view.retry(); }); await ready(); expect(returned.status).toBe("ready"); expect(returned.error).toBeNull();
  });
  for (const kind of ["actor", "loading"] as const) for (const boundary of ["pending", "settled"] as const) {
    it("SH04 observed pre-render " + kind + " ABA at " + boundary + " retires ROOT/returned/actions", async () => {
      let pending: ReturnType<typeof deferred> | undefined;
      if (boundary === "pending") f.handle = (table, actor) => { if (!pending && table === "build_logs") { pending = deferred(); return pending.promise; } return response(table, actor); };
      const h = mount(); let returned: JourneyReadView | undefined;
      if (boundary === "pending") await waitFor(() => expect(f.reads).toBe(1));
      else { await ready(); await act(async () => { returned = await view.retry(); }); await ready(); }
      const root = view, callback = root.retry, returnedCallback = returned?.retry, auth = f.auth, generation = f.generation;
      const before = { renders: f.renders, cleanups: f.cleanups, reads: f.reads };
      if (kind === "actor") f.actor = "actor-B"; else f.loading = true;
      denied(root); if (returned) denied(returned);
      const middle = { renders: f.renders, cleanups: f.cleanups, reads: f.reads };
      if (kind === "actor") f.actor = "actor-A"; else f.loading = false;
      denied(root); if (returned) denied(returned);
      const after = { renders: f.renders, cleanups: f.cleanups, reads: f.reads };
      expect(middle).toEqual(before); expect(after).toEqual(before); expect(f.auth).toBe(auth); expect(f.generation).toBe(generation);
      denied(await callback()); if (returnedCallback) denied(await returnedCallback()); expect(f.reads).toBe(before.reads);
      if (pending) await act(async () => { pending!.resolve(response("build_logs", "actor-A")); });
      expect(f.reads).toBe(before.reads); h.refresh(); await ready(); expect(f.reads).toBe(before.reads + 2);
      denied(root); denied(await callback()); if (returnedCallback) denied(await returnedCallback()); expect(f.reads).toBe(before.reads + 2);
      record = { boundary, observed_middle: kind, phases: [before, middle, after], same_frozen_Auth_user_generation: Object.isFrozen(auth) && Object.isFrozen(f.user) && generation === f.fixed, predicate: "captured === fixedGeneration", no_retired_mission_entry: boundary !== "pending" || before.reads === 1 };
    });
  }
  it("SH05 A entered log read cannot publish after B; fresh B reads are distinct", async () => {
    let old: ReturnType<typeof deferred> | undefined; f.handle = (table, actor) => { if (actor === "actor-A" && !old) { old = deferred(); return old.promise; } return response(table, actor); };
    const h = mount(); await waitFor(() => expect(f.reads).toBe(1)); const saved = view; f.actor = "actor-B"; h.refresh(); await ready("actor-B");
    await act(async () => { old!.resolve(response("build_logs", "actor-A")); }); denied(saved); expect(view.logs?.[0]?.id).toBe("actor-B:log"); expect(f.entries.filter(e => e.actor === "actor-A").length).toBe(1);
  });
  it("SH06 logout masks old view and quiets late entered rejection", async () => {
    let old: ReturnType<typeof deferred> | undefined; f.handle = () => { old = deferred(); return old.promise; }; const h = mount(); await waitFor(() => expect(f.reads).toBe(1)); const saved = view;
    f.actor = null; h.refresh(); denied(saved); expect(view.status).toBe("unavailable"); await act(async () => { old!.reject(new Error("late retired rejection")); }); expect(f.reads).toBe(1); expect(f.warnings).toBe(0);
  });
  it("SH07 equal numeric generation OBJECT replacement/restoration remains retired", async () => {
    const h = mount(); await ready(); const saved = view, before = { renders: f.renders, cleanups: f.cleanups };
    f.generation = Object.freeze({ value: 0 }); denied(saved); const middle = { renders: f.renders, cleanups: f.cleanups }; f.generation = f.fixed; denied(saved); const after = { renders: f.renders, cleanups: f.cleanups };
    expect(middle).toEqual(before); expect(after).toEqual(before); denied(await saved.retry()); expect(f.reads).toBe(2); h.refresh(); await ready(); expect(f.reads).toBe(4); record.phases = [before, middle, after];
  });
  it("SH08 harmless equivalent Auth/predicate churn does not refetch or retire", async () => {
    const h = mount(); await ready(); const saved = view;
    for (let i = 0; i < 3; i++) { f.auth = f.makeAuth(); f.predicate = captured => captured === f.fixed; h.refresh(); await ready(); }
    expect(f.reads).toBe(2); expect(saved.status).toBe("ready"); await act(async () => { await saved.retry(); }); expect(f.reads).toBe(4);
  });
  it("SH09 before-entry retirement starts no SDK call", async () => {
    const h = mount(); await ready(); const saved = view, count = f.reads; const api = saved.retry(); f.loading = true; denied(saved); f.loading = false;
    await act(async () => { denied(await api); }); expect(f.reads).toBe(count); h.refresh(); await ready(); expect(f.reads).toBe(count + 2);
  });
  it("SH10 unmount retires pending old life; genuinely new mounted life works", async () => {
    let old: ReturnType<typeof deferred> | undefined; f.handle = (table, actor) => { if (!old) { old = deferred(); return old.promise; } return response(table, actor); };
    const h = mount(); await waitFor(() => expect(f.reads).toBe(1)); const saved = view; h.unmount(); denied(saved); denied(await saved.retry());
    mount(); await ready(); await act(async () => { old!.reject(new Error("old life rejection")); }); denied(saved); expect(f.reads).toBe(3);
  });
  it("SH11 genuine StrictMode replay reaches current view and cleanup denies old callbacks", async () => {
    const h = mount(true); await ready(); const saved = view, before = { renders: f.renders, cleanups: f.cleanups, reads: f.reads }; h.unmount(); denied(saved); denied(await saved.retry());
    expect(f.reads).toBe(before.reads); record = { before_unmount: before, after_unmount: { renders: f.renders, cleanups: f.cleanups, reads: f.reads }, child_phases: childPhases };
  });
  it("SH12 actual QueryClient affinity creates fresh owner without cache promotion", async () => {
    const h = mount(); await ready(); const old = view; h.qc.setQueryData(["unrelated", "old"], "retained"); const second = new QueryClient(); clients.push(second); second.setQueryData(["unrelated", "new"], "new retained");
    f.client = second; h.refresh(); await ready(); denied(old); denied(await old.retry()); expect(f.reads).toBe(4); expect(h.qc.getQueryData(["unrelated", "old"])).toBe("retained"); expect(second.getQueryData(["unrelated", "new"])).toBe("new retained");
  });
  it("SH13 selected field getter reentry observes invalidity and prevents stale apply", async () => {
    const h = mount(); await ready(); const saved = view; let once = true;
    f.handle = (table, actor) => { if (table !== "build_logs" || !once) return response(table, actor); once = false; const row = logRow(actor); Object.defineProperty(row, "title", { get() { f.loading = true; denied(saved); f.loading = false; return "late title"; } }); return { data: [row], error: null }; };
    let returned!: JourneyReadView; await act(async () => { returned = await saved.retry(); }); denied(saved); denied(returned); expect(f.reads).toBe(3); h.refresh(); await ready(); expect(f.reads).toBe(5);
  });
  it("SH14 predicate CALL throws entered rejected native, ownthen0 and old view stays retired", async () => {
    const h = mount(); await ready(); const saved = view; let entries = 0, receiver: object | undefined;
    f.predicate = function(captured) { if (entries++ === 0) { receiver = this; throw f.rejectNative(); } return captured === f.fixed; };
    denied(saved); denied(await saved.retry()); expect(receiver).toBe(f.auth); expect(entries).toBe(1); expect(f.ownThen).toBe(0); expect(f.reads).toBe(2); f.predicate = captured => captured === f.fixed; h.refresh(); await ready(); expect(f.reads).toBe(4); record.fault_calls = entries;
  });
  it("SH15 entered SDK getter throw is observed before retired denial", async () => {
    const h = mount(); await ready(); const saved = view; let calls = 0;
    f.fromHook = () => { calls++; f.loading = true; denied(saved); f.loading = false; throw f.rejectNative(); };
    let returned!: JourneyReadView; await act(async () => { returned = await saved.retry(); }); denied(returned); denied(saved); expect(f.ownThen).toBe(0); expect(calls).toBe(1); expect(f.reads).toBe(2); h.refresh(); await ready();
  });
  it("SH16 retired arbitrary lazy query target has ownthen0 and no adoption", async () => {
    const h = mount(); await ready(); const saved = view; let once = true;
    f.handle = (table, actor) => { if (!once) return response(table, actor); once = false; f.loading = true; denied(saved); f.loading = false; return f.lazy(); };
    let returned!: JourneyReadView; await act(async () => { returned = await saved.retry(); }); denied(returned); expect(f.lazyGets).toBe(0); expect(f.lazyCalls).toBe(0); h.refresh(); await ready();
  });
  it("SH17 lazy first settlement and then-call returned native rejection remain observed", async () => {
    const h = mount(); await ready(); const saved = view; let once = true;
    f.handle = (table, actor) => { if (!once) return response(table, actor); once = false; return { then(resolve: (value: unknown) => void) { f.loading = true; denied(saved); f.loading = false; resolve(response(table, actor)); resolve(response(table, actor)); return f.rejectNative(); } }; };
    let returned!: JourneyReadView; await act(async () => { returned = await saved.retry(); }); denied(returned); denied(saved); expect(f.ownThen).toBe(0); h.refresh(); await ready();
  });
  it("SH18 old subscriber is not notified by stale success/error completion", async () => {
    const h = mount(); await ready(); const saved = view; let notifications = 0; const unsubscribe = controller!.subscribe(() => { notifications++; }); let pending: ReturnType<typeof deferred> | undefined;
    f.handle = () => { pending = deferred(); return pending.promise; }; const api = saved.retry(); await waitFor(() => expect(f.reads).toBe(3)); const before = notifications;
    f.loading = true; denied(saved); f.loading = false; await act(async () => { pending!.reject(new Error("stale operation error")); denied(await api); }); expect(notifications).toBe(before); unsubscribe(); f.handle = (table, actor) => response(table, actor); h.refresh(); await ready();
  });
  it("SH19 ORIGINAL React functional updater forwarded unchanged after old life expires", async () => {
    f.holdCommit = true; const h = mount(); expect(f.updaters.length).toBeGreaterThan(0); expect(f.updaters.every(u => typeof u.argument === "function")).toBe(true); expect(f.reads).toBe(0);
    const original = [...f.updaters]; const before = { renders: f.renders, cleanups: f.cleanups, reads: f.reads }; h.unmount(); const middle = { renders: f.renders, cleanups: f.cleanups, reads: f.reads }; f.holdCommit = false;
    await act(async () => { for (const updater of original) updater.forward(); }); const after = { renders: f.renders, cleanups: f.cleanups, reads: f.reads }; expect(f.reads).toBe(0); mount(); await ready();
    record = { phases: [before, middle, after], original_argument_references_forwarded: original.every((u, i) => u.argument === f.updaters[i]?.argument), scheduling_qualification: "Plain setter wrapper held original argument and later called original genuine dispatch with same argument, never invoked/replaced updater algorithm." };
  });
  it("SH20 invalid private selector is unavailable and never falls through to legacy", async () => {
    f.mode = "invalid-selector"; mount(); await act(async () => { denied(await view.retry()); }); expect(view.status).toBe("unavailable"); expect(f.reads).toBe(0); expect(f.legacyCalls).toBe(0);
  });
  it("SH21 wholly unobserved transient ABA is explicitly outside guarantee", async () => {
    mount(); await ready(); const saved = view, before = { renders: f.renders, cleanups: f.cleanups }; f.actor = "actor-B"; f.loading = true; f.loading = false; f.actor = "actor-A";
    expect({ renders: f.renders, cleanups: f.cleanups }).toEqual(before); expect(saved.status).toBe("ready"); expect(f.reads).toBe(2); record.unobserved_ABA_not_certified = true;
  });
  it("SH22 rendered loading transition denies old view and fresh false lifetime reconciles", async () => {
    const h = mount(); await ready(); const saved = view; f.loading = true; h.refresh(); denied(saved); expect(view.status).toBe("unavailable"); expect(f.reads).toBe(2);
    f.loading = false; h.refresh(); await ready(); expect(f.reads).toBe(4); denied(saved);
  });
  it("SH23 current field getter Error is honest and retry repairs current read", async () => {
    const error = new Error("current projection field failure"); let once = true;
    f.handle = (table, actor) => { if (table !== "build_logs" || !once) return response(table, actor); once = false; const row = logRow(actor); Object.defineProperty(row, "title", { get() { throw error; } }); return { data: [row], error: null }; };
    mount(); await waitFor(() => expect(view.status).toBe("error")); expect(view.error).toBe(error); expect(view.logs).toBeUndefined(); await act(async () => { await view.retry(); }); await ready();
  });
  it("SH24 returned native predicate is observed but never admitted as literal true", async () => {
    const h = mount(); await ready(); const saved = view; let entries = 0;
    f.predicate = () => { entries++; return f.rejectNative(); }; denied(saved); denied(await saved.retry()); expect(entries).toBe(1); expect(f.ownThen).toBe(0); expect(f.reads).toBe(2);
    f.predicate = captured => captured === f.fixed; h.refresh(); await ready();
  });
  it("SH25 captured ownership input is immutable and cannot be relabelled", async () => {
    const h = mount(); await ready(); const saved = view, captured = controller!.input;
    expect(Object.isFrozen(captured)).toBe(true); expect(Reflect.set(captured, "actor", "actor-B")).toBe(false); expect(captured.actor).toBe("actor-A"); expect(saved.status).toBe("ready");
    f.actor = "actor-B"; denied(saved); h.refresh(); await ready("actor-B"); denied(saved); expect(f.reads).toBe(4);
    record = { captured_input_frozen: true, relabel_attempt_denied: true };
  });
});

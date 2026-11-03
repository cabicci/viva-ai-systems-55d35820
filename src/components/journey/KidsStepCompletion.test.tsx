import { StrictMode, startTransition, type ButtonHTMLAttributes } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider, QueryObserver } from "@tanstack/react-query";
import type { useAuth, AuthGeneration } from "@/lib/auth-context";
import type { useKidsCompletion, KidsCompletion } from "@/lib/journey/client";
import { journeyCopy } from "@/lib/journey/copy";
import type { SupportedLocale } from "@/lib/locale/types";

type Auth = ReturnType<typeof useAuth>;
type Query = ReturnType<typeof useKidsCompletion>;
type Props = { profile: string; level: string; lesson: number; locale: SupportedLocale };
const boundary = vi.hoisted(() => ({
  auth: undefined as Auth | undefined,
  query: undefined as Query | undefined,
  hookCalls: [] as unknown[][],
  rpcRead: () : unknown => undefined,
  authFactory: false, hookFactory: false, sdkFactory: false,
}));
vi.mock("@/lib/auth-context", () => {
  boundary.authFactory = true;
  return { useAuth: function () { if (!boundary.auth) throw Error("AUTH_FIXTURE"); return boundary.auth; } };
});
vi.mock("@/lib/journey/client", () => {
  boundary.hookFactory = true;
  return { useKidsCompletion: function (...args: Parameters<typeof useKidsCompletion>): Query {
    boundary.hookCalls.push(args);
    if (!boundary.query) throw Error("QUERY_FIXTURE");
    return boundary.query;
  } };
});
const sdk = vi.hoisted(() => ({ get rpc() { return boundary.rpcRead(); } }));
vi.mock("@/integrations/supabase/client", () => { boundary.sdkFactory = true; return { supabase: sdk }; });
vi.mock("@/components/ui/button", () => ({ Button: function ({ size, variant, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { size?: string; variant?: string }) {
  void size; void variant;
  return <button {...props} />;
} }));
import { KidsStepCompletion } from "./KidsStepCompletion";

const selected: Props = { profile: "child-a", level: "level-a", lesson: 3, locale: "en" };
const actor = "adult-a";
let liveGeneration: AuthGeneration;
let qc: QueryClient;
let rpcCalls: { receiver: unknown; args: unknown[] }[];
let invalidations: { receiver: unknown; args: unknown[] }[];
let refetchCalls: unknown[];
let rpcResult: () => unknown;
let invalidationResult: ((index: number) => unknown) | null;
let retryResult: () => unknown;
let functions: Function[];
let unhandled: unknown[];
let ownListener: (reason: unknown) => void;
let querySequence: number;
const traces: unknown[] = [];
const denied: string[] = [];
const restored: { target: object; key: PropertyKey; descriptor: PropertyDescriptor | undefined }[] = [];
function protect(target: object, key: PropertyKey, replacement: PropertyDescriptor) {
  restored.push({ target, key, descriptor: Object.getOwnPropertyDescriptor(target, key) });
  Object.defineProperty(target, key, { configurable: true, ...replacement });
}
beforeAll(() => {
  expect(boundary.authFactory && boundary.hookFactory && boundary.sdkFactory).toBe(true);
  for (const key of ["fetch", "WebSocket", "XMLHttpRequest"]) protect(globalThis, key, { value: function () { denied.push(key); throw Error("NO_NETWORK"); } });
  for (const key of ["localStorage", "sessionStorage"]) protect(window, key, { get: function () { denied.push(key); throw Error("NO_USER_STORAGE"); } });
  const environment = process.env;
  protect(process, "env", { value: new Proxy(environment, { get: function (target, key) {
    if (typeof key === "string" && /^(VITE_)?SUPABASE_/.test(key)) { denied.push(key); throw Error("NO_SERVICE_ENV"); }
    return Reflect.get(target, key);
  } }) });
});
afterAll(() => {
  for (const item of restored.reverse()) {
    if (item.descriptor) Object.defineProperty(item.target, item.key, item.descriptor);
    else Reflect.deleteProperty(item.target, item.key);
  }
  console.log("R25_ACTUAL_BOUNDARY_TRACES", JSON.stringify({ traces, denied }));
  expect(denied).toEqual([]);
});
function fulfilled(value: unknown) { return new Promise((resolve) => { resolve(value); }); }
function rejected() { return new Promise((_resolve, reject) => { reject(Error("PLAIN_TARGET_REJECTION")); }); }
function deferred() {
  let resolve!: (value: unknown) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
function turn() { return new Promise<void>((resolve) => { setTimeout(resolve, 0); }); }
async function flush() { await act(async () => { await turn(); await turn(); }); }
function auth(userId: string | null = actor): Auth {
  return {
    user: userId === null ? null : { id: userId, aud: "authenticated", app_metadata: {}, user_metadata: {}, created_at: "2026-10-24T00:00:00Z" },
    session: null, loading: false, authError: null, authContinuity: Object.freeze({ continuity: 0 }), authGeneration: liveGeneration,
    signOut: async function () {},
    isAuthGenerationCurrent: function (captured) { return captured === liveGeneration; },
  };
}
function retire() { liveGeneration = Object.freeze({ value: liveGeneration.value }); }
function plainQuery(data: KidsCompletion[] = []): Query {
  const observer = new QueryObserver<KidsCompletion[], Error>(qc, { queryKey: ["private-r25-observer", ++querySequence], initialData: data, enabled: false, retry: false });
  const query = observer.getCurrentResult();
  const refetch = function (this: unknown) { refetchCalls.push(this); return retryResult(); };
  functions.push(refetch);
  Object.defineProperty(query, "refetch", { configurable: true, value: refetch });
  return query;
}
function installClient(client: QueryClient) {
  const invalidate = function (this: QueryClient, ...args: Parameters<QueryClient["invalidateQueries"]>) {
    invalidations.push({ receiver: this, args });
    if (invalidationResult) return invalidationResult(invalidations.length);
    return Reflect.apply(QueryClient.prototype.invalidateQueries, this, args);
  };
  functions.push(invalidate);
  Object.defineProperty(client, "invalidateQueries", { configurable: true, value: invalidate });
}
beforeEach(() => {
  liveGeneration = Object.freeze({ value: 7 });
  rpcCalls = []; invalidations = []; refetchCalls = []; functions = []; unhandled = []; querySequence = 0;
  ownListener = function (reason) { unhandled.push(reason); };
  process.on("unhandledRejection", ownListener);
  qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } } });
  installClient(qc);
  rpcResult = function () { return fulfilled({ error: null, data: true }); };
  invalidationResult = null;
  retryResult = function () { return fulfilled(boundary.query); };
  const rpc = function (this: unknown, ...args: unknown[]) { rpcCalls.push({ receiver: this, args }); return rpcResult(); };
  const lookup = function () { return rpc; };
  functions.push(rpc, lookup, rpcResult, retryResult, fulfilled, rejected);
  boundary.rpcRead = lookup;
  boundary.auth = auth(); boundary.query = plainQuery(); boundary.hookCalls = [];
});
afterEach(async (context) => {
  cleanup(); qc.clear();
  await turn(); await turn();
  process.removeListener("unhandledRejection", ownListener);
  functions.push(rpcResult, retryResult, boundary.rpcRead);
  if (invalidationResult) functions.push(invalidationResult);
  const mockTargets = functions.filter((fn) => vi.isMockFunction(fn)).length;
  traces.push({ case: context.task.name, rpc: rpcCalls.length, invalidations: invalidations.length, refetch: refetchCalls.length, unhandled: unhandled.length, mockTargets });
  expect(mockTargets).toBe(0);
  expect(unhandled).toEqual([]);
});

function lazy(body: (resolve: (value: unknown) => void, reject: (reason?: unknown) => void) => unknown) {
  const then = function (this: unknown, resolve: (value: unknown) => void, reject: (reason?: unknown) => void) { return body(resolve, reject); };
  functions.push(then, body);
  return { then };
}
function ownThenTrap(promise: Promise<unknown>, count: { reads: number }) {
  Object.defineProperty(promise, "then", { configurable: true, get: function () { count.reads++; throw Error("OWN_THEN_MUST_NOT_BE_READ"); } });
  return promise;
}
function queryError() {
  const query = plainQuery();
  Object.defineProperty(query, "isError", { configurable: true, value: true });
  boundary.query = query;
  return query;
}
function setQueryRead(query: Query, key: string, get: () => unknown) {
  functions.push(get);
  Object.defineProperty(query, key, { configurable: true, get });
}
function row(): KidsCompletion { return { profile_id: selected.profile, level_id: selected.level, lesson_number: selected.lesson, locale: selected.locale }; }
function hasSaveError(locale: SupportedLocale = "en") { return screen.queryByText(journeyCopy(locale).saveError) !== null; }
describe("r25 focused current controls and retirement boundaries", () => {
  for (const method of ["rpc", "invalidation"] as const) it(`T01 malformed current ${method} method reports unavailable`, async () => {
    if (method === "rpc") boundary.rpcRead = function () { return undefined; };
    else Object.defineProperty(qc, "invalidateQueries", { configurable: true, value: undefined });
    mount(); fireEvent.click(mark()); await flush(); expect(hasSaveError()).toBe(true); expect(invalidations).toHaveLength(0);
  });
  for (const field of ["profile_id", "level_id", "lesson_number", "locale"] as const) it(`T02 malformed own row ${field} denies marking`, () => {
    const data = row(); Object.defineProperty(data, field, { enumerable: true, value: null }); boundary.query = plainQuery([data]);
    mount(); expect(screen.queryByRole("button", { name: journeyCopy("en").mark })).toBeNull(); expect(rpcCalls).toHaveLength(0);
  });
  it("T03 current RPC and invalidation method getters are each captured once", async () => {
    let rpcGets = 0, cacheGets = 0;
    const rpc = function (this: unknown, ...args: unknown[]) { rpcCalls.push({ receiver: this, args }); return fulfilled({ error: null, data: true }); };
    const invalidate = function (this: QueryClient, ...args: Parameters<QueryClient["invalidateQueries"]>) { invalidations.push({ receiver: this, args }); return fulfilled(undefined); };
    functions.push(rpc, invalidate); boundary.rpcRead = function () { rpcGets++; return rpc; };
    Object.defineProperty(qc, "invalidateQueries", { configurable: true, get: function () { cacheGets++; return invalidate; } });
    mount(); fireEvent.click(mark()); await flush(); expect(rpcGets).toBe(1); expect(cacheGets).toBe(1); expect(invalidations).toHaveLength(2);
  });
  for (const locale of ["ar-EG", "ar-MSA", "ar-Gulf", "en"] as const) it(`P01 exact RPC and both captured cache prefixes ${locale}`, async () => {
    mount({ ...selected, locale }); fireEvent.click(mark(locale)); await flush();
    expect(rpcCalls).toEqual([{ receiver: sdk, args: ["complete_kids_step", { p_profile: selected.profile, p_level: selected.level, p_lesson: selected.lesson, p_locale: locale }] }]);
    expect(invalidations).toEqual([
      { receiver: qc, args: [{ queryKey: ["kids-completion", actor, selected.profile] }] },
      { receiver: qc, args: [{ queryKey: ["kids-journey", actor, selected.profile] }] },
    ]);
    expect(hasSaveError(locale)).toBe(false); expect(mark(locale).hasAttribute("disabled")).toBe(false);
  });
  for (const variant of ["false", "error", "reject", "throw", "malformed", "inherited"] as const) it(`P02 current RPC failure ${variant} uses existing save error`, async () => {
    rpcResult = function () {
      if (variant === "throw") throw Error("RPC_THROW");
      if (variant === "reject") return rejected();
      if (variant === "inherited") return fulfilled(Object.create({ error: null, data: true }));
      return fulfilled(variant === "false" ? { error: null, data: false } : variant === "error" ? { error: Error("RPC_ERROR"), data: true } : {});
    };
    mount(); fireEvent.click(mark()); await flush();
    expect(rpcCalls).toHaveLength(1); expect(invalidations).toHaveLength(0); expect(hasSaveError()).toBe(true); expect(mark().hasAttribute("disabled")).toBe(false);
  });
  it("P03 a current first invalidation rejection still enters second prefix and reports failure", async () => {
    invalidationResult = function (index) { return index === 1 ? rejected() : fulfilled(undefined); };
    mount(); fireEvent.click(mark()); await flush(); expect(invalidations).toHaveLength(2); expect(hasSaveError()).toBe(true);
  });
  for (const field of ["profile_id", "level_id", "lesson_number", "locale"] as const) it(`P04 row must match selected ${field}`, () => {
    const data = row(); Object.defineProperty(data, field, { value: field === "lesson_number" ? 4 : "other", enumerable: true });
    boundary.query = plainQuery([data]); mount(); expect(mark().hasAttribute("disabled")).toBe(false);
  });
  it("P05 exact selected own row is complete and does not enter RPC", () => {
    boundary.query = plainQuery([row()]); mount(); const button = screen.getByRole("button", { name: journeyCopy("en").marked });
    expect(button.hasAttribute("disabled")).toBe(true); fireEvent.click(button); expect(rpcCalls).toHaveLength(0);
  });
  it("P06 inherited selected row fields fail closed", () => {
    boundary.query = plainQuery([Object.create(row())]); mount(); expect(screen.queryByRole("button", { name: journeyCopy("en").mark })).toBeNull(); expect(rpcCalls).toHaveLength(0);
  });
  it("P07 current self preview disables external hook and never reads observer data", () => {
    let reads = 0; setQueryRead(boundary.query!, "data", function () { reads++; throw Error("PREVIEW_READ"); });
    mount({ ...selected, profile: actor }); expect(screen.getByText(journeyCopy("en").previewNote)).toBeTruthy();
    expect(boundary.hookCalls.at(-1)?.[3]).toBe(false); expect(reads).toBe(0); expect(rpcCalls).toHaveLength(0);
  });
  for (const condition of ["signed-out", "loading", "retired", "missing-predicate", "truthy-predicate"] as const) it(`P08 Auth ${condition} denies local operation`, () => {
    if (condition === "signed-out") boundary.auth = auth(null);
    if (condition === "loading") boundary.auth = { ...auth(), loading: true };
    if (condition === "retired") retire();
    if (condition === "missing-predicate") Object.defineProperty(boundary.auth, "isAuthGenerationCurrent", { value: undefined });
    if (condition === "truthy-predicate") Object.defineProperty(boundary.auth, "isAuthGenerationCurrent", { value: function () { return 1; } });
    mount(); expect(boundary.hookCalls.at(-1)?.[3]).toBe(false); expect(screen.queryByRole("button", { name: journeyCopy("en").mark })).toBeNull(); expect(rpcCalls).toHaveLength(0);
  });
  it("P09 caller private frame and query props cannot bypass denied Auth", () => {
    boundary.auth = auth(null); const injected = { ...selected, frame: { current: function () { return true; }, actor: "injected" }, query: plainQuery() };
    mount(injected); expect(boundary.hookCalls.at(-1)?.[3]).toBe(false); expect(screen.queryByRole("button", { name: journeyCopy("en").mark })).toBeNull(); expect(rpcCalls).toHaveLength(0);
  });
  for (const field of ["profile", "level", "lesson", "locale"] as const) it(`R01 pending response retired across ${field} ABA`, async () => {
    const request = deferred(); rpcResult = function () { return request.promise; }; const view = mount(); fireEvent.click(mark());
    const next = { ...selected }; Object.defineProperty(next, field, { value: field === "lesson" ? 4 : field === "locale" ? "ar-EG" : "other" });
    view.change(next); view.change(selected); request.resolve({ error: null, data: true }); await flush();
    expect(invalidations).toHaveLength(0); expect(hasSaveError()).toBe(false); expect(mark().hasAttribute("disabled")).toBe(false);
  });
  for (const transition of ["actor", "logout", "loading", "generation"] as const) it(`R02 pending response retired after Auth ${transition}`, async () => {
    const request = deferred(); rpcResult = function () { return request.promise; }; const view = mount(); fireEvent.click(mark());
    retire(); boundary.auth = transition === "actor" ? auth("adult-b") : transition === "logout" ? auth(null) : transition === "loading" ? { ...auth(), loading: true } : auth();
    view.change(); request.resolve({ error: null, data: true }); await flush(); expect(invalidations).toHaveLength(0); expect(hasSaveError()).toBe(false);
  });
  it("R03 QueryClient replacement retires old pending response", async () => {
    const request = deferred(); rpcResult = function () { return request.promise; }; const view = mount(); fireEvent.click(mark());
    const next = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } }); installClient(next); view.change(selected, next);
    request.resolve({ error: null, data: true }); await flush(); expect(invalidations).toHaveLength(0); expect(mark().hasAttribute("disabled")).toBe(false); next.clear();
  });
  it("R04 old failure and finally cannot overwrite fresh pending busy state", async () => {
    const old = deferred(), fresh = deferred(); let calls = 0;
    rpcResult = function () { return ++calls === 1 ? old.promise : fresh.promise; };
    const view = mount(); fireEvent.click(mark()); view.change({ ...selected, profile: "child-b" }); view.change(selected); fireEvent.click(mark());
    old.reject(Error("OLD")); await flush(); expect(mark().hasAttribute("disabled")).toBe(true); expect(hasSaveError()).toBe(false); expect(invalidations).toHaveLength(0);
    fresh.resolve({ error: null, data: true }); await flush(); expect(mark().hasAttribute("disabled")).toBe(false); expect(invalidations).toHaveLength(2);
  });
  it("R05 callback identity and observer churn preserve the current pending action", async () => {
    const request = deferred(); rpcResult = function () { return request.promise; }; const view = mount(); fireEvent.click(mark());
    boundary.auth = auth(); boundary.query = plainQuery(); view.change(); expect(mark().hasAttribute("disabled")).toBe(true);
    request.resolve({ error: null, data: true }); await flush(); expect(invalidations).toHaveLength(2);
  });
  it("R06 saved click is retired after a same-scope render", async () => {
    const view = mount(); const saved = clickSaved(mark()); view.change(); act(() => { saved(); }); await flush(); expect(rpcCalls).toHaveLength(0);
  });
  it("R07 StrictMode replay uses a fresh lifetime and current operations work", async () => {
    mount(selected, true); fireEvent.click(mark()); await flush(); expect(rpcCalls).toHaveLength(1); expect(invalidations).toHaveLength(2);
  });
  it("R08 unmounted request cannot affect a remounted current instance", async () => {
    const old = deferred(), fresh = deferred(); let calls = 0; rpcResult = function () { return ++calls === 1 ? old.promise : fresh.promise; };
    const previous = mount(selected, true); fireEvent.click(mark()); previous.unmount(); mount(selected, true); fireEvent.click(mark());
    old.resolve({ error: null, data: true }); await flush(); expect(invalidations).toHaveLength(0); expect(mark().hasAttribute("disabled")).toBe(true);
    fresh.resolve({ error: null, data: true }); await flush(); expect(invalidations).toHaveLength(2);
  });
  it("R09 genuine React transition updater cannot commit old state into a new generation", async () => {
    const request = deferred(); rpcResult = function () { return request.promise; }; const view = mount(); const saved = clickSaved(mark());
    act(() => { startTransition(() => { saved(); retire(); boundary.auth = auth(); view.change(); }); });
    request.reject(Error("RETIRED_TRANSITION")); await flush(); expect(hasSaveError()).toBe(false); expect(mark().hasAttribute("disabled")).toBe(false); expect(invalidations).toHaveLength(0);
  });
  it("G01 RPC method getter retirement prevents actual invocation", async () => {
    let invokes = 0; const method = function () { invokes++; return fulfilled({ error: null, data: true }); }; functions.push(method);
    boundary.rpcRead = function () { retire(); return method; };
    mount(); fireEvent.click(mark()); await flush(); expect(invokes).toBe(0); expect(invalidations).toHaveLength(0);
  });
  it("G02 eagerly rejected native value from retiring RPC getter is intrinsically observed", async () => {
    const trap = { reads: 0 }; boundary.rpcRead = function () { retire(); return ownThenTrap(rejected(), trap); };
    mount(); fireEvent.click(mark()); await flush(); expect(trap.reads).toBe(0); expect(rpcCalls).toHaveLength(0);
  });
  for (const retired of [false, true]) it(`G03 native RPC rejection own then is never read retired=${retired}`, async () => {
    const trap = { reads: 0 }; rpcResult = function () { if (retired) retire(); return ownThenTrap(rejected(), trap); };
    mount(); fireEvent.click(mark()); await flush(); expect(trap.reads).toBe(0); expect(rpcCalls).toHaveLength(1); expect(hasSaveError()).toBe(!retired);
  });
  for (const timing of ["inside-call", "queued"] as const) it(`G04 retired RPC lazy then is not read ${timing}`, async () => {
    let reads = 0; const target = Object.create(null); Object.defineProperty(target, "then", { get: function () { reads++; throw Error("RETIRED_LAZY_READ"); } });
    rpcResult = function () { if (timing === "inside-call") retire(); return target; };
    mount(); fireEvent.click(mark()); if (timing === "queued") retire(); await flush(); expect(reads).toBe(0); expect(invalidations).toHaveLength(0);
  });
  it("G05 retiring lazy then getter observes its rejected native value without calling it", async () => {
    const trap = { reads: 0 }; let gets = 0;
    const target = Object.create(null); Object.defineProperty(target, "then", { get: function () { gets++; retire(); return ownThenTrap(rejected(), trap); } });
    rpcResult = function () { return target; }; mount(); fireEvent.click(mark()); await flush(); expect(gets).toBe(1); expect(trap.reads).toBe(0); expect(invalidations).toHaveLength(0);
  });
  it("G06 retiring then invocation observes its derived rejected native return", async () => {
    const trap = { reads: 0 }; let invokes = 0;
    rpcResult = function () { return lazy(function () { invokes++; retire(); return ownThenTrap(rejected(), trap); }); };
    mount(); fireEvent.click(mark()); await flush(); expect(invokes).toBe(1); expect(trap.reads).toBe(0); expect(invalidations).toHaveLength(0);
  });
  for (const nested of ["lazy", "native-reject"] as const) it(`G07 nested adoption retirement ${nested}`, async () => {
    let reads = 0; const trap = { reads: 0 }; const target = Object.create(null); Object.defineProperty(target, "then", { get: function () { reads++; throw Error("NESTED_RETIRED"); } });
    rpcResult = function () { return lazy(function (resolve) { retire(); resolve(nested === "lazy" ? target : ownThenTrap(rejected(), trap)); }); };
    mount(); fireEvent.click(mark()); await flush(); expect(reads).toBe(0); expect(trap.reads).toBe(0); expect(invalidations).toHaveLength(0);
  });
  it("G08 current plain nested thenables preserve their actual receiver and complete once", async () => {
    const receivers: unknown[] = []; let first: object, second: object;
    const one = function (this: unknown, resolve: (v: unknown) => void) { receivers.push(this); resolve(second); };
    const two = function (this: unknown, resolve: (v: unknown) => void) { receivers.push(this); resolve({ error: null, data: true }); resolve({ error: null, data: false }); };
    functions.push(one, two); first = { then: one }; second = { then: two }; rpcResult = function () { return first; };
    mount(); fireEvent.click(mark()); await flush(); expect(receivers).toEqual([first, second]); expect(invalidations).toHaveLength(2); expect(hasSaveError()).toBe(false);
  });
  for (const key of ["error", "data"] as const) it(`G09 response ${key} getter retirement denies cache effects and later reads`, async () => {
    let later = 0; const response = { error: null, data: true };
    Object.defineProperty(response, key, { get: function () { retire(); return key === "error" ? null : true; } });
    if (key === "error") Object.defineProperty(response, "data", { get: function () { later++; return true; } });
    rpcResult = function () { return fulfilled(response); }; mount(); fireEvent.click(mark()); await flush(); expect(invalidations).toHaveLength(0); expect(later).toBe(0); expect(hasSaveError()).toBe(false);
  });
  it("G10 invalidation method getter retirement observes eager rejection and enters no cache call", async () => {
    const trap = { reads: 0 }; Object.defineProperty(qc, "invalidateQueries", { get: function () { retire(); return ownThenTrap(rejected(), trap); } });
    mount(); fireEvent.click(mark()); await flush(); expect(invalidations).toHaveLength(0); expect(trap.reads).toBe(0);
  });
  for (const target of ["native-reject", "lazy", "pending"] as const) it(`G11 first invalidation retirement blocks second prefix ${target}`, async () => {
    const pending = deferred(); const trap = { reads: 0 }; let thenReads = 0;
    invalidationResult = function () {
      if (target === "native-reject") { retire(); return ownThenTrap(rejected(), trap); }
      if (target === "lazy") return lazy(function () { thenReads++; retire(); return ownThenTrap(rejected(), trap); });
      return pending.promise;
    };
    mount(); fireEvent.click(mark()); await flush();
    if (target === "pending") { retire(); pending.reject(Error("RETIRED_CACHE")); await flush(); }
    expect(invalidations).toHaveLength(1); expect(trap.reads).toBe(0); expect(thenReads).toBe(target === "lazy" ? 1 : 0);
  });
  it("G12 readiness getter retirement at click stops RPC before any later observer reads", async () => {
    const query = boundary.query!; let armed = false, later = 0;
    setQueryRead(query, "isPending", function () { if (armed) retire(); return false; });
    setQueryRead(query, "isError", function () { if (armed) later++; return false; });
    mount(); armed = true; fireEvent.click(mark()); await flush(); expect(rpcCalls).toHaveLength(0); expect(later).toBe(0);
  });
  for (const layer of ["observer", "array", "row", "own-field"] as const) it(`G13 render snapshot retirement at ${layer} blocks later getters`, () => {
    let later = 0; const data = row();
    Object.defineProperty(data, "level_id", { get: function () { later++; return selected.level; } });
    let values: KidsCompletion[] = [data];
    if (layer === "observer") setQueryRead(boundary.query!, "data", function () { retire(); return values; });
    if (layer === "array") Object.defineProperty(values, "0", { get: function () { retire(); return data; } });
    if (layer === "row") Object.defineProperty(data, "profile_id", { get: function () { retire(); return selected.profile; } });
    if (layer === "own-field") values = [new Proxy(data, { getOwnPropertyDescriptor: function (target, key) { if (key === "profile_id") retire(); return Reflect.getOwnPropertyDescriptor(target, key); } })];
    if (layer !== "observer") boundary.query = plainQuery(values);
    mount(); expect(later).toBe(0); expect(screen.queryByRole("button", { name: journeyCopy("en").mark })).toBeNull(); expect(rpcCalls).toHaveLength(0);
  });
  it("Q01 current query error retry invokes plain refetch with actual observer receiver and observes rejection", async () => {
    const query = queryError(); retryResult = function () { return rejected(); };
    mount(); fireEvent.click(screen.getByRole("button", { name: journeyCopy("en").retry })); await flush(); expect(refetchCalls).toEqual([query]); expect(rpcCalls).toHaveLength(0); expect(hasSaveError()).toBe(false);
  });
  it("Q02 saved retry is retired across query view and selection ABA", async () => {
    queryError(); const view = mount(); const saved = clickSaved(screen.getByRole("button", { name: journeyCopy("en").retry }));
    view.change({ ...selected, lesson: 4 }); view.change(selected); act(() => { saved(); }); await flush(); expect(refetchCalls).toHaveLength(0);
  });
  it("Q03 retiring refetch getter observes eager rejection without invocation", async () => {
    const query = queryError(); const trap = { reads: 0 };
    setQueryRead(query, "refetch", function () { retire(); return ownThenTrap(rejected(), trap); });
    mount(); fireEvent.click(screen.getByRole("button", { name: journeyCopy("en").retry })); await flush(); expect(refetchCalls).toHaveLength(0); expect(trap.reads).toBe(0);
  });
  for (const target of ["native-reject", "lazy"] as const) it(`Q04 retiring refetch result ${target} is observed without retired lazy reads`, async () => {
    queryError(); const trap = { reads: 0 }; let reads = 0; const lazyTarget = Object.create(null);
    Object.defineProperty(lazyTarget, "then", { get: function () { reads++; throw Error("RETIRED_RETRY_LAZY"); } });
    retryResult = function () { retire(); return target === "native-reject" ? ownThenTrap(rejected(), trap) : lazyTarget; };
    mount(); fireEvent.click(screen.getByRole("button", { name: journeyCopy("en").retry })); await flush(); expect(refetchCalls).toHaveLength(1); expect(reads).toBe(0); expect(trap.reads).toBe(0);
  });
  it("Q05 current loading preserves loading copy and never enters RPC", () => {
    Object.defineProperty(boundary.query, "isPending", { value: true }); mount(); expect(screen.getByRole("status").textContent).toBe(journeyCopy("en").loading); expect(rpcCalls).toHaveLength(0);
  });
  it("Q06 query retry preserves an existing current save error", async () => {
    rpcResult = function () { return fulfilled({ error: null, data: false }); };
    const view = mount(); fireEvent.click(mark()); await flush(); expect(hasSaveError()).toBe(true);
    queryError(); retryResult = function () { return rejected(); }; view.change();
    fireEvent.click(screen.getByRole("button", { name: journeyCopy("en").retry })); await flush(); expect(hasSaveError()).toBe(true); expect(refetchCalls).toHaveLength(1);
  });
});
function mount(initial: Props = selected, strict = false) {
  let props = initial;
  let client = qc;
  const tree = () => <QueryClientProvider client={client}>{strict ? <StrictMode><KidsStepCompletion {...props} /></StrictMode> : <KidsStepCompletion {...props} />}</QueryClientProvider>;
  const rendered = render(tree());
  return {
    unmount: rendered.unmount,
    change(next: Props = props, nextClient: QueryClient = client) { props = next; client = nextClient; rendered.rerender(tree()); },
  };
}
function mark(locale: SupportedLocale = "en") { return screen.getByRole("button", { name: journeyCopy(locale).mark }); }
function clickSaved(button: HTMLElement) {
  const key = Object.getOwnPropertyNames(button).find((name) => name.startsWith("__reactProps$"));
  if (!key) throw Error("ACTUAL_REACT_DOM_PROPS_MISSING");
  const props: unknown = Reflect.get(button, key);
  if (typeof props !== "object" || props === null) throw Error("ACTUAL_PROPS_MISSING");
  const callback: unknown = Reflect.get(props, "onClick");
  if (typeof callback !== "function") throw Error("ACTUAL_HANDLER_MISSING");
  return function () { Reflect.apply(callback, props, []); };
}
describe("r25 decisive original preimage counterexamples", () => {
  it("B01 same UUID Auth retirement before rerender blocks response cache effects", async () => {
    const request = deferred(); rpcResult = function () { return request.promise; };
    mount(); fireEvent.click(mark()); retire();
    request.resolve({ error: null, data: true }); await flush();
    expect(rpcCalls).toHaveLength(1); expect(invalidations).toHaveLength(0);
  });
  it("B02 saved mark handler cannot cross profile selection ABA", async () => {
    const view = mount(); const saved = clickSaved(mark());
    view.change({ ...selected, profile: "child-b" }); view.change(selected);
    act(() => { saved(); }); await flush(); expect(rpcCalls).toHaveLength(0);
  });
  it("B03 wrong selected row cannot mark matching lesson complete", () => {
    boundary.query = plainQuery([{ profile_id: "other-child", level_id: selected.level, lesson_number: selected.lesson, locale: selected.locale }]);
    mount(); expect(mark().hasAttribute("disabled")).toBe(false);
  });
  it("B04 same turn duplicate saved click enters one plain RPC", async () => {
    const request = deferred(); rpcResult = function () { return request.promise; };
    mount(); const click = clickSaved(mark());
    act(() => { click(); click(); });
    expect(rpcCalls).toHaveLength(1);
    request.resolve({ error: null, data: true }); await flush();
  });
});

type R28Field = "user" | "id" | "generation" | "loading" | "predicate";
type R28Live = {
  actor: string | null;
  loading: boolean;
  generation: AuthGeneration;
  phase: string;
  onRead: ((field: R28Field) => void) | null;
  predicateEffect: (() => void) | null;
  reads: Record<R28Field, number>;
  events: { phase: string; field: string; value: unknown }[];
  auth: Auth;
  originalGeneration: AuthGeneration;
  originalPredicate: (captured: AuthGeneration) => boolean;
};
const r28Traces: unknown[] = [];
let r28: R28Live;
function r28Fixture(): R28Live {
  const generation = Object.freeze({ value: 43 });
  const seed = auth();
  const user = seed.user;
  if (!user) throw Error("R28_USER_FIXTURE");
  const state: R28Live = {
    actor, loading: false, generation, phase: "mount", onRead: null, predicateEffect: null,
    reads: { user: 0, id: 0, generation: 0, loading: 0, predicate: 0 }, events: [],
    auth: seed, originalGeneration: generation,
    originalPredicate: function (captured) {
      const valid = captured === state.generation;
      state.events.push({ phase: state.phase, field: "predicate-call", value: valid });
      if (state.predicateEffect) state.predicateEffect();
      return valid;
    },
  };
  function record(field: R28Field, value: unknown) {
    state.reads[field]++;
    state.events.push({ phase: state.phase, field, value });
    if (state.onRead) state.onRead(field);
  }
  const userGet = function () { const result = state.actor === null ? null : user; record("user", state.actor); return result; };
  const idGet = function () { const result = state.actor ?? undefined; record("id", result); return result; };
  const generationGet = function () { const result = state.generation; record("generation", result.value); return result; };
  const loadingGet = function () { const result = state.loading; record("loading", result); return result; };
  const predicateGet = function () { record("predicate", "same-identity-only-function"); return state.originalPredicate; };
  functions.push(userGet, idGet, generationGet, loadingGet, predicateGet, state.originalPredicate);
  Object.defineProperty(user, "id", { configurable: true, get: idGet });
  Object.freeze(user);
  Object.defineProperties(seed, {
    user: { configurable: true, get: userGet },
    authGeneration: { configurable: true, get: generationGet },
    loading: { configurable: true, get: loadingGet },
    isAuthGenerationCurrent: { configurable: true, get: predicateGet },
  });
  Object.freeze(seed);
  return state;
}
function r28Flags() {
  return ["kids-completion", "kids-journey"].flatMap((prefix) => [actor, "adult-b"].map((who) => qc.getQueryState([prefix, who, selected.profile])?.isInvalidated === true));
}
function r28Callback(saved: () => void) {
  r28.phase = "callback";
  act(() => { saved(); });
}
describe("R28 live Auth actor correction — new cases only", () => {
  beforeEach(() => {
    r28 = r28Fixture(); boundary.auth = r28.auth;
    for (const prefix of ["kids-completion", "kids-journey"]) for (const who of [actor, "adult-b"]) qc.setQueryData([prefix, who, selected.profile], []);
  });
  afterEach((context) => {
    r28.onRead = null; r28.predicateEffect = null;
    r28Traces.push({ case: context.task.name, sameFrozenAuth: Object.isFrozen(r28.auth), sameGeneration: r28.generation === r28.originalGeneration, generationValue: r28.generation.value, reads: r28.reads, events: r28.events, rpc: rpcCalls, invalidations: invalidations.map((call) => ({ sameActualClient: call.receiver === qc, args: call.args })), refetch: refetchCalls.length });
  });
  afterAll(() => { console.log("R28_ACTUAL_ACTOR_EVENTS", JSON.stringify(r28Traces)); });
  for (const next of ["adult-b", null] as const) it(`R28A01 fixed generation live actor ${next} denies saved callback without rerender`, async () => {
    mount(); const saved = clickSaved(mark()); const before = r28.reads.user;
    r28.actor = next; r28Callback(saved); await flush();
    expect(r28.generation).toBe(r28.originalGeneration); expect(Object.isFrozen(r28.auth)).toBe(true);
    expect(r28.reads.user).toBeGreaterThan(before); expect(rpcCalls).toHaveLength(0); expect(invalidations).toHaveLength(0); expect(r28Flags()).toEqual([false, false, false, false]);
  });
  it("R28A02 same User object live id change independently denies callback", async () => {
    mount(); const saved = clickSaved(mark()); const before = r28.reads.id;
    r28.actor = "adult-b"; r28Callback(saved); await flush();
    expect(r28.reads.id).toBeGreaterThan(before); expect(rpcCalls).toHaveLength(0); expect(invalidations).toHaveLength(0);
  });
  it("R28A03 unchanged frozen live Auth admits exact RPC and genuine selected private cache effects", async () => {
    mount(); const saved = clickSaved(mark()); const before = r28.reads.user; r28Callback(saved); await flush();
    expect(r28.reads.user).toBeGreaterThan(before); expect(rpcCalls).toEqual([{ receiver: sdk, args: ["complete_kids_step", { p_profile: selected.profile, p_level: selected.level, p_lesson: selected.lesson, p_locale: selected.locale }] }]);
    expect(invalidations.map((entry) => entry.args)).toEqual([[{ queryKey: ["kids-completion", actor, selected.profile] }], [{ queryKey: ["kids-journey", actor, selected.profile] }]]);
    expect(invalidations.every((entry) => entry.receiver === qc)).toBe(true); expect(r28Flags()).toEqual([true, false, true, false]); expect(hasSaveError()).toBe(false);
  });
  for (const control of ["loading", "new-generation", "equal-value-new-object"] as const) it(`R28A04 independent live ${control} control denies without rerender`, async () => {
    mount(); const saved = clickSaved(mark());
    if (control === "loading") r28.loading = true;
    else r28.generation = Object.freeze({ value: control === "new-generation" ? 44 : 43 });
    r28Callback(saved); await flush(); expect(rpcCalls).toHaveLength(0); expect(invalidations).toHaveLength(0);
  });
  for (const field of ["user", "id", "generation", "loading", "predicate"] as const) it(`R28G01 callback ${field} getter throw fails closed`, async () => {
    mount(); const saved = clickSaved(mark());
    r28.onRead = function (observed) { if (observed === field) throw Error("R28_GETTER_UNAVAILABLE"); };
    r28Callback(saved); await flush(); expect(rpcCalls).toHaveLength(0); expect(invalidations).toHaveLength(0);
  });
  for (const field of ["user", "id", "generation", "loading"] as const) it(`R28G02 render ${field} getter throw uses existing error copy`, () => {
    r28.onRead = function (observed) { if (observed === field) throw Error("R28_RENDER_GETTER_UNAVAILABLE"); };
    mount(); expect(screen.getByRole("alert").textContent).toBe(journeyCopy("en").error); expect(boundary.hookCalls.at(-1)?.[3]).toBe(false); expect(rpcCalls).toHaveLength(0);
  });
  for (const field of ["user", "id", "generation", "loading", "predicate"] as const) it(`R28G03 ${field} getter changes actor after capturing its return value`, async () => {
    mount(); const saved = clickSaved(mark()); let changes = 0;
    r28.onRead = function (observed) { if (observed === field && changes++ === 0) r28.actor = "adult-b"; };
    r28Callback(saved); await flush(); expect(changes).toBeGreaterThan(0); expect(rpcCalls).toHaveLength(0); expect(invalidations).toHaveLength(0); expect(r28.generation).toBe(r28.originalGeneration);
  });
  it("R28G04 literal-true predicate reentry changes actor and is checked again", async () => {
    mount(); const saved = clickSaved(mark()); let calls = 0;
    r28.predicateEffect = function () { calls++; r28.actor = "adult-b"; };
    r28Callback(saved); await flush(); expect(calls).toBe(1); expect(rpcCalls).toHaveLength(0); expect(invalidations).toHaveLength(0);
  });
  it("R28E01 retiring RPC lookup eagerly rejected native value is observed with own then untouched", async () => {
    const trap = { reads: 0 }; boundary.rpcRead = function () { r28.actor = "adult-b"; return ownThenTrap(rejected(), trap); };
    mount(); r28Callback(clickSaved(mark())); await flush(); expect(rpcCalls).toHaveLength(0); expect(invalidations).toHaveLength(0); expect(trap.reads).toBe(0);
  });
  it("R28E02 entered RPC native rejection after actor-only change has no cache effects", async () => {
    const trap = { reads: 0 }; rpcResult = function () { r28.actor = "adult-b"; return ownThenTrap(rejected(), trap); };
    mount(); r28Callback(clickSaved(mark())); await flush(); expect(rpcCalls).toHaveLength(1); expect(invalidations).toHaveLength(0); expect(trap.reads).toBe(0); expect(hasSaveError()).toBe(false);
  });
  it("R28E03 actor changes while entered RPC is pending before any outer rerender", async () => {
    const request = deferred(); rpcResult = function () { return request.promise; };
    mount(); r28Callback(clickSaved(mark())); r28.actor = "adult-b"; request.resolve({ error: null, data: true }); await flush();
    expect(rpcCalls).toHaveLength(1); expect(invalidations).toHaveLength(0); expect(r28.generation).toBe(r28.originalGeneration); expect(hasSaveError()).toBe(false);
  });
  it("R28E04 actor-only retirement during lazy then invocation observes derived rejection", async () => {
    const trap = { reads: 0 }; let entered = 0;
    rpcResult = function () { return lazy(function () { entered++; r28.actor = null; return ownThenTrap(rejected(), trap); }); };
    mount(); r28Callback(clickSaved(mark())); await flush(); expect(entered).toBe(1); expect(invalidations).toHaveLength(0); expect(trap.reads).toBe(0);
  });
  it("R28E05 refetch method getter actor-only retirement observes eager rejection", async () => {
    const query = queryError(); const trap = { reads: 0 };
    setQueryRead(query, "refetch", function () { r28.actor = "adult-b"; return ownThenTrap(rejected(), trap); });
    mount(); r28Callback(clickSaved(screen.getByRole("button", { name: journeyCopy("en").retry }))); await flush(); expect(refetchCalls).toHaveLength(0); expect(trap.reads).toBe(0); expect(invalidations).toHaveLength(0);
  });
  it("R28E06 entered refetch actor-only retirement observes native rejection", async () => {
    queryError(); const trap = { reads: 0 }; retryResult = function () { r28.actor = null; return ownThenTrap(rejected(), trap); };
    mount(); r28Callback(clickSaved(screen.getByRole("button", { name: journeyCopy("en").retry }))); await flush(); expect(refetchCalls).toHaveLength(1); expect(trap.reads).toBe(0); expect(hasSaveError()).toBe(false);
  });
  it("R28E07 invalidation method getter actor-only change prevents cache invocation", async () => {
    let invoked = 0;
    const invalidate = function (this: QueryClient, ...args: Parameters<QueryClient["invalidateQueries"]>) { invoked++; return Reflect.apply(QueryClient.prototype.invalidateQueries, this, args); };
    functions.push(invalidate); Object.defineProperty(qc, "invalidateQueries", { configurable: true, get: function () { r28.actor = "adult-b"; return invalidate; } });
    mount(); r28Callback(clickSaved(mark())); await flush(); expect(rpcCalls).toHaveLength(1); expect(invoked).toBe(0); expect(r28Flags()).toEqual([false, false, false, false]);
  });
  it("R28E08 first genuine invalidation enters then actor change blocks second prefix", async () => {
    const trap = { reads: 0 };
    const invalidate = function (this: QueryClient, ...args: Parameters<QueryClient["invalidateQueries"]>) {
      invalidations.push({ receiver: this, args });
      const pending = Reflect.apply(QueryClient.prototype.invalidateQueries, this, args);
      r28.actor = "adult-b"; return ownThenTrap(pending, trap);
    };
    functions.push(invalidate); Object.defineProperty(qc, "invalidateQueries", { configurable: true, value: invalidate });
    mount(); r28Callback(clickSaved(mark())); await flush(); expect(invalidations).toHaveLength(1); expect(invalidations[0].receiver).toBe(qc); expect(r28Flags()).toEqual([true, false, false, false]); expect(trap.reads).toBe(0);
  });
  it("R28S01 genuine React transition setter cannot render stale actor busy or failure state", async () => {
    const request = deferred(); rpcResult = function () { return request.promise; };
    mount(); const saved = clickSaved(mark());
    act(() => { startTransition(() => { saved(); r28.actor = "adult-b"; }); });
    request.reject(Error("R28_OLD_ACTOR")); await flush();
    expect(screen.queryByRole("button", { name: journeyCopy("en").mark })).toBeNull(); expect(screen.getByRole("alert").textContent).toBe(journeyCopy("en").error); expect(hasSaveError()).toBe(false); expect(invalidations).toHaveLength(0);
  });
  it("R28S02 query readiness getter actor-only change denies new RPC", async () => {
    let armed = false; setQueryRead(boundary.query!, "isPending", function () { if (armed) r28.actor = "adult-b"; return false; });
    mount(); const saved = clickSaved(mark()); armed = true; r28Callback(saved); await flush(); expect(rpcCalls).toHaveLength(0); expect(invalidations).toHaveLength(0);
  });
});

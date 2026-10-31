import { StrictMode } from "react";
import { act, cleanup, render, screen } from "@testing-library/react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import type { Session, AuthChangeEvent } from "@supabase/supabase-js";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(), onAuth: vi.fn(), signOut: vi.fn(), rpc: vi.fn(), from: vi.fn(),
  channel: vi.fn(), removeChannel: vi.fn(), cookie: vi.fn(), welcome: vi.fn(),
  error: vi.fn(), warn: vi.fn(), insideAuth: false, illegal: [] as string[],
}));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {
  auth: { getSession: mocks.getSession, onAuthStateChange: mocks.onAuth, signOut: mocks.signOut },
  rpc: mocks.rpc, from: mocks.from, channel: mocks.channel, removeChannel: mocks.removeChannel,
} }));
vi.mock("@/lib/auth-access-token-cookie", () => ({ syncAccessTokenCookie: mocks.cookie }));
vi.mock("@/lib/account-welcome.functions", () => ({ requestAccountWelcome: mocks.welcome }));
vi.mock("@/lib/error-capture", () => ({ captureError: mocks.error, captureWarn: mocks.warn }));
import { AuthProvider, useAuth } from "@/lib/auth-context";

function deferred<T>() {
  let resolve!: (value: T) => void, reject!: (error: unknown) => void;
  const promise = new Promise<T>((a, b) => { resolve = a; reject = b; });
  return { promise, resolve, reject };
}
type SessionResult = { data: { session: Session | null }; error: unknown };
type Listener = { callback: (event: AuthChangeEvent, session: Session | null) => void; unsubscribe: ReturnType<typeof vi.fn> };
type Query = { result: ReturnType<typeof deferred<{ data: { device_id: string } | null; error: unknown }>>; userId?: string };
type Channel = { callback?: (payload: { new: { device_id: string }; old?: undefined }) => void;
  on: ReturnType<typeof vi.fn>; subscribe: ReturnType<typeof vi.fn> };
let boots: ReturnType<typeof deferred<SessionResult>>[];
let claims: ReturnType<typeof deferred<{ error: unknown }>>[];
let welcomes: ReturnType<typeof deferred<unknown>>[];
let signouts: ReturnType<typeof deferred<{ error: unknown }>>[];
let listeners: Listener[], queries: Query[], channels: Channel[];
let latest: ReturnType<typeof useAuth>;
function Probe() {
  latest = useAuth();
  return <div><span data-testid="user">{latest.user?.id ?? "anonymous"}</span>
    <span data-testid="loading">{String(latest.loading)}</span>
    <span data-testid="error">{latest.authError ?? "none"}</span></div>;
}
const UID_A = "11111111-1111-4111-8111-111111111111", UID_B = "22222222-2222-4222-8222-222222222222";
// Synthetic fixture strings only. No JWT decoding, real credentials or SDK evaluation.
function session(id = UID_A, version = "one", confirmed = true): Session {
  return { access_token: `${id}.${version}.synthetic`, refresh_token: `synthetic-refresh-${version}`,
    token_type: "bearer", expires_in: 3600, user: { id, aud: "authenticated", app_metadata: {}, user_metadata: {},
      created_at: "2026-10-24T00:00:00Z", email_confirmed_at: confirmed ? "2026-10-24T00:00:00Z" : undefined } };
}
function sdkBoundary(name: string) { if (mocks.insideAuth) { mocks.illegal.push(name); throw new Error("SDK work inside auth callback"); } }
function mount(strict = false) { return render(strict ? <StrictMode><AuthProvider><Probe /></AuthProvider></StrictMode> : <AuthProvider><Probe /></AuthProvider>); }
function emit(event: AuthChangeEvent, value: Session | null, listener = listeners.at(-1)!) {
  act(() => { mocks.insideAuth = true; try { expect(listener.callback(event, value)).toBeUndefined(); } finally { mocks.insideAuth = false; } });
}
async function jobs() { await act(async () => { await vi.runOnlyPendingTimersAsync(); }); }
async function settle<T>(job: ReturnType<typeof deferred<T>>, value: T) { await act(async () => { job.resolve(value); }); }
async function fail<T>(job: ReturnType<typeof deferred<T>>, error = new Error("synthetic failure")) { await act(async () => { job.reject(error); }); }
async function login(value = session()) { emit("SIGNED_IN", value); await jobs(); }
const actor = () => screen.getByTestId("user").textContent;
const token = () => mocks.cookie.mock.calls.at(-1)?.[0];

beforeEach(() => {
  vi.useFakeTimers(); vi.clearAllMocks(); mocks.insideAuth = false; mocks.illegal = [];
  boots = []; claims = []; welcomes = []; signouts = []; listeners = []; queries = []; channels = [];
  window.localStorage.setItem("lovable.device_id", "synthetic-current-device");
  mocks.getSession.mockImplementation(() => { sdkBoundary("getSession"); const d = deferred<SessionResult>(); boots.push(d); return d.promise; });
  mocks.onAuth.mockImplementation((callback: Listener["callback"]) => {
    const listener: Listener = { callback, unsubscribe: vi.fn() }; listeners.push(listener);
    return { data: { subscription: { unsubscribe: listener.unsubscribe } } };
  });
  mocks.rpc.mockImplementation(() => { sdkBoundary("claim"); const d = deferred<{ error: unknown }>(); claims.push(d); return d.promise; });
  mocks.welcome.mockImplementation(() => { sdkBoundary("welcome"); const d = deferred<unknown>(); welcomes.push(d); return d.promise; });
  mocks.signOut.mockImplementation(() => { sdkBoundary("signOut"); const d = deferred<{ error: unknown }>(); signouts.push(d); return d.promise; });
  mocks.from.mockImplementation(() => {
    sdkBoundary("device-query"); const q: Query = { result: deferred() }; queries.push(q);
    const builder = { select: vi.fn(() => builder), eq: vi.fn((_key, id: string) => { q.userId = id; return builder; }),
      maybeSingle: vi.fn(() => q.result.promise) }; return builder;
  });
  mocks.channel.mockImplementation(() => {
    sdkBoundary("channel"); const channel: Channel = { on: vi.fn(), subscribe: vi.fn() };
    channel.on.mockImplementation((_event, _filter, callback: Channel["callback"]) => { sdkBoundary("channel.on"); channel.callback = callback; return channel; });
    channel.subscribe.mockImplementation(() => { sdkBoundary("channel.subscribe"); return channel; });
    channels.push(channel); return channel;
  });
  mocks.removeChannel.mockImplementation(() => Promise.resolve("ok"));
  mocks.cookie.mockImplementation(() => {});
});
afterEach(() => {
  cleanup(); vi.clearAllTimers(); vi.useRealTimers();
  expect(mocks.illegal).toEqual([]);
  expect((globalThis as { __authNetworkAttempts?: string[] }).__authNetworkAttempts ?? []).toEqual([]);
});

describe("actual AuthProvider observation/incarnation fences", () => {
  it("initial session preserves API, confirmed welcome and claim-before-device-check without blocking UI", async () => {
    mount(); expect(actor()).toBe("anonymous"); expect(latest.loading).toBe(true);
    const value = session(); await settle(boots[0], { data: { session: value }, error: null });
    expect(latest.user?.id).toBe(UID_A); expect(latest.session).toBe(value); expect(latest.loading).toBe(false);
    expect(latest.authError).toBeNull(); expect(typeof latest.signOut).toBe("function");
    expect(token()).toBe(value.access_token); expect(mocks.rpc).not.toHaveBeenCalled();
    await jobs(); expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith("claim_active_device", { p_device_id: "synthetic-current-device" });
    expect(mocks.from).not.toHaveBeenCalled(); expect(mocks.welcome).toHaveBeenCalledTimes(1);
    await settle(claims[0], { error: null }); expect(queries).toHaveLength(1); expect(queries[0].userId).toBe(UID_A);
  });
  it("anonymous startup finishes loading without claims, welcome or signout", async () => {
    mount(); await settle(boots[0], { data: { session: null }, error: null }); await jobs();
    expect(actor()).toBe("anonymous"); expect(latest.loading).toBe(false); expect(latest.authError).toBeNull();
    expect(token()).toBeNull(); expect(mocks.rpc).not.toHaveBeenCalled(); expect(mocks.welcome).not.toHaveBeenCalled(); expect(mocks.signOut).not.toHaveBeenCalled();
  });
  it.each(["rejected", "returned_error", "sync_throw"])("current getSession %s has defined loading/error state", async mode => {
    if (mode === "sync_throw") mocks.getSession.mockImplementation(() => { throw new Error("synthetic"); });
    mount();
    if (mode === "rejected") await fail(boots[0]);
    if (mode === "returned_error") await settle(boots[0], { data: { session: session() }, error: new Error("synthetic") });
    expect(latest.loading).toBe(false); expect(latest.authError).toBe("session_unavailable"); expect(actor()).toBe("anonymous");
    await jobs(); expect(mocks.rpc).not.toHaveBeenCalled(); expect(mocks.signOut).not.toHaveBeenCalled();
  });
  it.each(["valid", "malformed", "rejected", "returned_error"])("late %s bootstrap cannot overwrite/clear/signout/log after newer actor", async kind => {
    mount(); await login(session(UID_B)); const before = { cookies: mocks.cookie.mock.calls.length, claims: mocks.rpc.mock.calls.length, welcome: mocks.welcome.mock.calls.length };
    if (kind === "rejected") await fail(boots[0]);
    else await settle(boots[0], { data: { session: kind === "malformed" ? { ...session(), access_token: "malformed" } : session() }, error: kind === "returned_error" ? new Error("synthetic") : null });
    await jobs(); expect(actor()).toBe(UID_B); expect(token()).toBe(session(UID_B).access_token);
    expect(mocks.cookie).toHaveBeenCalledTimes(before.cookies); expect(mocks.rpc).toHaveBeenCalledTimes(before.claims); expect(mocks.welcome).toHaveBeenCalledTimes(before.welcome);
    expect(mocks.signOut).not.toHaveBeenCalled(); expect(mocks.warn).not.toHaveBeenCalled(); expect(mocks.error).not.toHaveBeenCalled();
  });
  it("late bootstrap cannot revive the prior same-UUID out/in incarnation", async () => {
    mount(); await login(); const prior = latest.authGeneration, priorCheck = latest.isAuthGenerationCurrent;
    emit("SIGNED_OUT", null); emit("SIGNED_IN", session(UID_A, "fresh")); await jobs();
    const fresh = latest.authGeneration; expect(priorCheck(prior)).toBe(false); expect(latest.isAuthGenerationCurrent(fresh)).toBe(true);
    const calls = mocks.cookie.mock.calls.length; await settle(boots[0], { data: { session: session(UID_A, "old") }, error: null });
    expect(token()).toBe(session(UID_A, "fresh").access_token); expect(mocks.cookie).toHaveBeenCalledTimes(calls); expect(latest.authGeneration).toBe(fresh);
  });
  it("new TOKEN_REFRESHED observation retires bootstrap and same-current refresh does not rotate or duplicate claims", async () => {
    mount(); emit("TOKEN_REFRESHED", session(UID_B, "refresh")); await jobs(); const generation = latest.authGeneration;
    await settle(boots[0], { data: { session: session() }, error: null });
    emit("TOKEN_REFRESHED", session(UID_B, "refresh-again")); await jobs();
    expect(actor()).toBe(UID_B); expect(token()).toBe(session(UID_B, "refresh-again").access_token);
    expect(latest.authGeneration).toBe(generation); expect(mocks.rpc).toHaveBeenCalledTimes(1); expect(mocks.welcome).toHaveBeenCalledTimes(1);
  });
  it("late INITIAL_SESSION cannot roll back a newer SIGNED_IN observation", async () => {
    mount(); await login(session(UID_B)); const generation = latest.authGeneration, calls = mocks.cookie.mock.calls.length;
    emit("INITIAL_SESSION", session()); await jobs(); expect(actor()).toBe(UID_B); expect(latest.authGeneration).toBe(generation);
    expect(mocks.cookie).toHaveBeenCalledTimes(calls); expect(mocks.rpc).toHaveBeenCalledTimes(1);
  });
  it("logout intent invalidates synchronously; a new login before deferred invocation prevents old SDK signOut", async () => {
    mount(); await login(); const old = latest.authGeneration; let pending!: Promise<void>;
    act(() => { pending = latest.signOut(); expect(latest.isAuthGenerationCurrent(old)).toBe(false); });
    expect(actor()).toBe("anonymous"); expect(token()).toBeNull(); expect(mocks.signOut).not.toHaveBeenCalled();
    emit("SIGNED_IN", session(UID_B)); await jobs(); await pending;
    expect(mocks.signOut).not.toHaveBeenCalled(); expect(actor()).toBe(UID_B); expect(token()).toBe(session(UID_B).access_token);
  });
  it.each(["resolve", "reject"])("old ordinary signOut %s continuation cannot clear newer login cookie/state", async mode => {
    mount(); await login(); let pending!: Promise<void>;
    act(() => { pending = latest.signOut(); }); const observed = pending.then(() => "ok", () => "failed");
    await jobs(); expect(mocks.signOut).toHaveBeenCalledExactlyOnceWith();
    await login(session(UID_B)); const calls = mocks.cookie.mock.calls.length;
    if (mode === "resolve") await settle(signouts[0], { error: null }); else await fail(signouts[0]);
    expect(await observed).toBe(mode === "resolve" ? "ok" : "failed");
    expect(actor()).toBe(UID_B); expect(token()).toBe(session(UID_B).access_token); expect(mocks.cookie).toHaveBeenCalledTimes(calls);
  });
  it("a refresh cannot silently undo pending local logout; ordinary SDK scope remains default", async () => {
    mount(); await login(); let pending!: Promise<void>; act(() => { pending = latest.signOut(); });
    emit("TOKEN_REFRESHED", session(UID_A, "late-refresh")); await jobs();
    expect(actor()).toBe("anonymous"); expect(token()).toBeNull(); expect(mocks.signOut).toHaveBeenCalledExactlyOnceWith();
    await settle(signouts[0], { error: null }); await pending;
  });
  it("current malformed bootstrap closes locally and defers existing default SDK cleanup", async () => {
    mount(); await settle(boots[0], { data: { session: { ...session(), access_token: "malformed" } }, error: null });
    expect(actor()).toBe("anonymous"); expect(latest.authError).toBe("invalid_session"); expect(latest.loading).toBe(false);
    expect(mocks.signOut).not.toHaveBeenCalled(); await jobs(); expect(mocks.signOut).toHaveBeenCalledExactlyOnceWith();
    expect(mocks.rpc).not.toHaveBeenCalled(); await settle(signouts[0], { error: null });
  });
  it("malformed current event cleanup is cancelled by a newer login before its SDK work", async () => {
    mount(); emit("SIGNED_IN", { ...session(), access_token: "bad" }); expect(latest.authError).toBe("invalid_session");
    emit("SIGNED_IN", session(UID_B)); await jobs(); expect(actor()).toBe(UID_B); expect(mocks.signOut).not.toHaveBeenCalled();
  });
  it("repeated SIGNED_IN before/after claim invocation and refresh do not duplicate claims or welcome", async () => {
    mount(); emit("SIGNED_IN", session()); emit("SIGNED_IN", session()); emit("SIGNED_IN", session());
    await jobs(); expect(mocks.rpc).toHaveBeenCalledTimes(1); expect(mocks.welcome).toHaveBeenCalledTimes(1);
    const first = latest.authGeneration; emit("SIGNED_IN", session()); expect(latest.isAuthGenerationCurrent(first)).toBe(false);
    emit("TOKEN_REFRESHED", session(UID_A, "refreshed")); await jobs();
    expect(mocks.rpc).toHaveBeenCalledTimes(1); expect(mocks.welcome).toHaveBeenCalledTimes(1);
    await settle(claims[0], { error: null }); expect(queries).toHaveLength(1);
  });
  it("current mismatch waits for claim and performs local-only signout exactly once", async () => {
    mount(); await login(); expect(channels).toHaveLength(1);
    act(() => channels[0].callback!({ new: { device_id: "different-device" } })); expect(mocks.signOut).not.toHaveBeenCalled();
    await settle(claims[0], { error: null }); expect(queries).toHaveLength(1);
    await settle(queries[0].result, { data: { device_id: "different-device" }, error: null });
    expect(actor()).toBe("anonymous"); expect(mocks.signOut).not.toHaveBeenCalled();
    act(() => channels[0].callback!({ new: { device_id: "different-device" } })); await jobs();
    expect(mocks.signOut).toHaveBeenCalledExactlyOnceWith({ scope: "local" });
    expect(mocks.warn).toHaveBeenCalledExactlyOnceWith("auth:active_device_mismatch", { reason: "another device claimed the session — signing out" });
    await settle(signouts[0], { error: null });
  });
  it("old same-UUID device row/subscription and welcome errors cannot act on a new incarnation", async () => {
    mount(); await login(); await settle(claims[0], { error: null }); const oldQuery = queries[0], oldChannel = channels[0], oldWelcome = welcomes[0];
    emit("SIGNED_OUT", null); await login(session(UID_A, "fresh")); const calls = mocks.cookie.mock.calls.length;
    await settle(oldQuery.result, { data: { device_id: "different-device" }, error: null });
    act(() => oldChannel.callback!({ new: { device_id: "different-device" } })); await fail(oldWelcome); await jobs();
    expect(actor()).toBe(UID_A); expect(token()).toBe(session(UID_A, "fresh").access_token); expect(mocks.cookie).toHaveBeenCalledTimes(calls);
    expect(mocks.signOut).not.toHaveBeenCalled(); expect(mocks.warn).not.toHaveBeenCalled();
  });
  it("stale claim failure cannot log or launch an old device query after same-UUID out/in", async () => {
    mount(); await login(); const oldClaim = claims[0]; emit("SIGNED_OUT", null); await login(session(UID_A, "fresh"));
    await fail(oldClaim); expect(mocks.error).not.toHaveBeenCalled(); expect(mocks.from).not.toHaveBeenCalled();
    await settle(claims[1], { error: null }); expect(queries).toHaveLength(1);
  });
  it("unmount and remount fence all old callbacks, bootstrap, row and welcome completions", async () => {
    const first = mount(); await login(); await settle(claims[0], { error: null });
    const old = { boot: boots[0], listener: listeners[0], query: queries[0], channel: channels[0], welcome: welcomes[0], generation: latest.authGeneration, check: latest.isAuthGenerationCurrent };
    first.unmount(); expect(old.check(old.generation)).toBe(false); expect(old.listener.unsubscribe).toHaveBeenCalledTimes(1);
    mount(); await login(session(UID_B)); const calls = mocks.cookie.mock.calls.length;
    emit("SIGNED_IN", session(), old.listener); await fail(old.boot); await fail(old.welcome);
    await settle(old.query.result, { data: { device_id: "other-device" }, error: null });
    act(() => old.channel.callback!({ new: { device_id: "other-device" } })); await jobs();
    expect(actor()).toBe(UID_B); expect(token()).toBe(session(UID_B).access_token); expect(mocks.cookie).toHaveBeenCalledTimes(calls);
    expect(mocks.signOut).not.toHaveBeenCalled(); expect(mocks.warn).not.toHaveBeenCalled(); expect(mocks.error).not.toHaveBeenCalled();
  });
  it("real StrictMode replay isolates the first lifecycle from the current bootstrap", async () => {
    mount(true); expect(boots).toHaveLength(2); expect(listeners[0].unsubscribe).toHaveBeenCalledTimes(1);
    await settle(boots[1], { data: { session: session(UID_B) }, error: null }); await jobs();
    const calls = mocks.cookie.mock.calls.length;
    await settle(boots[0], { data: { session: { ...session(), access_token: "bad" } }, error: null });
    emit("SIGNED_OUT", null, listeners[0]); await jobs();
    expect(actor()).toBe(UID_B); expect(mocks.cookie).toHaveBeenCalledTimes(calls); expect(mocks.signOut).not.toHaveBeenCalled(); expect(mocks.rpc).toHaveBeenCalledTimes(1);
  });
  it("reentrant cookie publication cannot let the outer session/state/claim overwrite a newer actor", async () => {
    mount(); let once = true;
    mocks.cookie.mockImplementation(value => { if (once && value === session().access_token) { once = false; listeners.at(-1)!.callback("SIGNED_IN", session(UID_B)); } });
    await settle(boots[0], { data: { session: session() }, error: null }); await jobs();
    expect(actor()).toBe(UID_B); expect(token()).toBe(session(UID_B).access_token);
    expect(mocks.rpc).toHaveBeenCalledTimes(1); expect(mocks.welcome).toHaveBeenCalledTimes(1);
  });
  it("confirmation update welcomes once and does not reclaim on USER_UPDATED", async () => {
    mount(); await login(session(UID_A, "one", false)); expect(mocks.welcome).not.toHaveBeenCalled();
    emit("USER_UPDATED", session()); await jobs(); emit("USER_UPDATED", session()); await jobs();
    expect(mocks.welcome).toHaveBeenCalledTimes(1); expect(mocks.rpc).toHaveBeenCalledTimes(1);
  });
  it("generation surface is immutable, instance-bound, and a stale signOut function cannot log out a new user", async () => {
    mount(); await login(); const generation = latest.authGeneration, oldSignOut = latest.signOut;
    expect(() => (generation as { value: number }).value = 99).toThrow();
    expect(latest.isAuthGenerationCurrent({ value: generation.value })).toBe(false);
    await login(session(UID_B)); await oldSignOut(); await jobs(); expect(actor()).toBe(UID_B); expect(mocks.signOut).not.toHaveBeenCalled();
  });
});

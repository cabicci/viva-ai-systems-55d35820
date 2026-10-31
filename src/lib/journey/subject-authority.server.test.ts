// @vitest-environment node
import assert from "node:assert/strict";
import http from "node:http";
import https from "node:https";
import net from "node:net";
import tls from "node:tls";
import dns from "node:dns";
import dgram from "node:dgram";
import { syncBuiltinESMExports } from "node:module";
import type { PersonalBookmarkAuthorityResult } from "./subject-authority.server.ts";

// Default project path remains Vitest. The explicitly selected offline Node
// runner uses the same cases, mocking the actual module BEFORE adapter import.
const runnerName = process.env.MASAARAT_BOOKMARK_TEST_RUNNER === "node" ? "node:test" : "vitest";
const runner = runnerName === "node:test" ? await import("node:test") : await import("vitest");
// Both runners expose this shared registration surface; Node-only and
// Vitest-only APIs below are imported from their actual runtime explicitly.
type SharedRunner = {
  describe(name: string, body: () => void): unknown;
  it(name: string, body: () => unknown): unknown;
  beforeEach(body: () => unknown): unknown;
};
const { describe, it, beforeEach } = runner as SharedRunner;
const captureProjectionEvidence = runnerName === "node:test" && process.env.MASAARAT_BOOKMARK_SCHEMA_SAMPLES === "1";
let projectionInvocations = 0;
if (captureProjectionEvidence) (await import("node:test")).after(() => console.log("# MASAARAT_PROJECTION_INVOCATIONS " + projectionInvocations));
let identityCalls = 0;
let identity: () => Promise<unknown> = async () => null;
const resolver = async () => { identityCalls++; return identity(); };
if (runnerName === "node:test") {
  const { mock } = await import("node:test");
  mock.module(new URL("../ssr-request-auth.server.ts", import.meta.url), {
    namedExports: { resolveVerifiedRequestUser: resolver },
  });
} else {
  (await import("vitest")).vi.doMock("../ssr-request-auth.server.ts", () => ({ resolveVerifiedRequestUser: resolver }));
}

let externalAttempts: string[] = [];
const runtimeEnvironmentKeys = new Set([
  "FORCE_COLOR", "NO_COLOR", "NODE_DISABLE_COLORS", "NODE_V8_COVERAGE",
  "WATCH_REPORT_DEPENDENCIES", "NODE_TEST_CONTEXT",
]);

async function offline<T>(run: () => Promise<T>): Promise<T> {
  const originalEnvironment = process.env;
  const restore: Array<() => void> = [];
  const blocked = (name: string) => () => {
    externalAttempts.push(name);
    throw new Error("Offline test forbids external access");
  };
  function replace(target: object, key: string, replacement: unknown) {
    const descriptor = Object.getOwnPropertyDescriptor(target, key);
    Object.defineProperty(target, key, { configurable: true, writable: true, value: replacement });
    restore.push(() => {
      if (descriptor) Object.defineProperty(target, key, descriptor);
      else Reflect.deleteProperty(target, key);
    });
  }
  process.env = new Proxy(Object.create(null) as NodeJS.ProcessEnv, {
    get(_target, key) {
      // Closed Node diagnostic keys return constants, never real configuration.
      if (typeof key === "string" && runtimeEnvironmentKeys.has(key)) return undefined;
      externalAttempts.push("env:" + String(key));
      throw new Error("Offline test forbids environment access");
    },
    set: blocked("env:set"),
    has: blocked("env:has"),
    ownKeys: blocked("env:enumerate"),
    getOwnPropertyDescriptor: blocked("env:descriptor"),
  });
  for (const key of ["fetch", "XMLHttpRequest", "WebSocket", "EventSource"]) replace(globalThis, key, blocked(key));
  for (const [target, names] of [
    [http, ["request", "get"]], [https, ["request", "get"]],
    [net, ["connect", "createConnection"]], [tls, ["connect"]],
  ] as const) for (const key of names) replace(target, key, blocked(key));
  replace(net.Socket.prototype, "connect", blocked("socket:connect"));
  replace(dgram, "createSocket", blocked("udp:createSocket"));
  replace(dgram.Socket.prototype, "send", blocked("udp:send"));
  for (const key of Object.keys(dns).filter(name => /^(lookup|resolve)/.test(name))) {
    replace(dns, key, blocked("dns:" + key));
  }
  for (const key of Object.keys(dns.promises).filter(name => /^(lookup|resolve)/.test(name))) {
    replace(dns.promises, key, blocked("dns.promises:" + key));
  }
  syncBuiltinESMExports();
  try {
    return await run();
  } finally {
    process.env = originalEnvironment;
    for (const undo of restore.reverse()) undo();
    syncBuiltinESMExports();
    assert.deepEqual(externalAttempts, [], "Adapter/import attempted external access");
  }
}

const { authorizePersonalBookmarkSubject: authorize, readPersonalBookmarkSource: readBookmark,
  readPersonalBookmarkProjection: projectBookmark } = await offline(
  () => import("./subject-authority.server.ts"),
);
const ACTOR = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const CHILD = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const OTHER = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const adult = (id = ACTOR) => ({ kind: "auth_user", id });
const child = (id = CHILD) => ({ kind: "kids_profile", id });
const allow = (relationship: "self" | "parent"): PersonalBookmarkAuthorityResult => ({
  status: "authorized", scope: "personal_bookmark_read", relationship, permissionEpoch: null,
});
const response = (data: unknown) => ({ data, error: null });
type Chain = {
  select(columns: string): Chain;
  eq(column: string, value: string): Chain;
  is(column: string, value: null): Chain;
  maybeSingle(): Promise<unknown>;
};
function client() {
  const calls: unknown[][] = [];
  const state = {
    active: response(true) as unknown,
    manage: response(true) as unknown,
    profile: response({ id: CHILD, parent_id: ACTOR }) as unknown,
    visit: response(visitRow()) as unknown,
  };
  async function read(value: unknown) {
    if (value instanceof Error) throw value;
    return typeof value === "function" ? value() : value;
  }
  const chain: Chain = {
    select(columns) { assert.equal(this, chain); calls.push(["select", columns]); return chain; },
    eq(column, value) { assert.equal(this, chain); calls.push(["eq", column, value]); return chain; },
    is(column, value) { assert.equal(this, chain); calls.push(["is", column, value]); return chain; },
    async maybeSingle() { assert.equal(this, chain); calls.push(["maybeSingle"]); return read(state.profile); },
  };
  const visitChain: Chain = {
    select(columns) { assert.equal(this, visitChain); calls.push(["select", columns]); return visitChain; },
    eq(column, value) { assert.equal(this, visitChain); calls.push(["eq", column, value]); return visitChain; },
    is(column, value) { assert.equal(this, visitChain); calls.push(["is", column, value]); return visitChain; },
    async maybeSingle() { assert.equal(this, visitChain); calls.push(["maybeSingle"]); return read(state.visit); },
  };
  const invoker = {
    async rpc(...args: unknown[]) {
      assert.equal(this, invoker);
      calls.push(["rpc", ...args]);
      assert.equal(args.length, 1, "No user/role/extra RPC parameters");
      if (args[0] === "lc09_account_active") return read(state.active);
      assert.equal(args[0], "kids_parent_can_manage_profiles");
      return read(state.manage);
    },
    from(table: string) {
      assert.equal(this, invoker);
      calls.push(["from", table]);
      if (table === "kids_profiles") return chain;
      assert.equal(table, "journey_visits");
      return visitChain;
    },
  };
  return { invoker, state, calls };
}
type Fixture = ReturnType<typeof client>;
let fixture: Fixture;
async function run(subject: unknown) { return offline(() => authorize(subject)); }
function fullChildCalls(id = CHILD, parent = ACTOR) {
  return [["rpc", "lc09_account_active"], ["rpc", "kids_parent_can_manage_profiles"],
    ["from", "kids_profiles"], ["select", "id,parent_id"], ["eq", "id", id],
    ["eq", "parent_id", parent], ["maybeSingle"]];
}

describe("default personal bookmark authority adapter (all external boundaries mocked)", () => {
  beforeEach(() => {
    externalAttempts = [];
    identityCalls = 0;
    fixture = client();
    identity = async () => ({ userId: ACTOR, supabase: fixture.invoker });
  });

  it("missing verified request identity is unauthenticated with no database access", async () => {
    identity = async () => null;
    assert.deepEqual(await run(adult()), { status: "unauthenticated", code: "no_request_identity" });
    assert.equal(identityCalls, 1);
    assert.deepEqual(fixture.calls, []);
  });
  it("resolver failures never leak raw environment/token/request errors", async () => {
    identity = async () => { throw new Error("secret-token cookie person@example.test"); };
    assert.deepEqual(await run(adult()), { status: "unavailable", code: "request_identity_unavailable" });
    assert.deepEqual(fixture.calls, []);
  });
  for (const [label, value] of [
    ["undefined", undefined], ["false", false], ["empty object", {}],
    ["invalid actor", { userId: "admin", supabase: {} }],
    ["missing client", { userId: ACTOR }], ["boolean grant", { verified: true, userId: ACTOR }],
  ] as const) it("malformed identity: " + label, async () => {
    identity = async () => value;
    assert.deepEqual(await run(adult()), { status: "unavailable", code: "request_identity_unavailable" });
    assert.deepEqual(fixture.calls, []);
  });
  it("adult self requires current literal account-active truth", async () => {
    assert.deepEqual(await run(adult()), allow("self"));
    assert.equal(identityCalls, 1);
    assert.deepEqual(fixture.calls, [["rpc", "lc09_account_active"]]);
  });
  it("another adult is denied even if the resolver carries privileged role fields", async () => {
    identity = async () => ({ userId: ACTOR, supabase: fixture.invoker, role: "admin", teacher: true, paid: true });
    assert.deepEqual(await run(adult(OTHER)), { status: "denied", code: "different_actor" });
    assert.deepEqual(fixture.calls, []);
  });
  for (const [label, subject] of [
    ["null", null], ["array", []], ["unknown kind", { kind: "school", id: CHILD }],
    ["invalid UUID", { kind: "kids_profile", id: "" }],
    ["actor spoof", { ...child(), actorId: ACTOR }],
    ["client spoof", { ...child(), supabase: {} }],
    ["role spoof", { ...child(), role: "parent" }],
    ["inherited fields", Object.create(child())],
    ["getter", { kind: "kids_profile", get id() { throw new Error("selector getter must not execute"); } }],
    ["symbol grant", { ...child(), [Symbol("verified")]: true }],
  ] as const) it("rejects malformed or authority-bearing selector: " + label, async () => {
    assert.deepEqual(await run(subject), { status: "denied", code: "invalid_subject" });
    assert.deepEqual(fixture.calls, []);
  });
  for (const [label, active, status, code] of [
    ["false", response(false), "denied", "account_inactive"],
    ["null", response(null), "unavailable", "account_check_unavailable"],
    ["error with true data", { data: true, error: { message: "secret" } }, "unavailable", "account_check_unavailable"],
    ["truthy string", response("true"), "unavailable", "account_check_unavailable"],
    ["missing error", { data: true }, "unavailable", "account_check_unavailable"],
    ["missing data", { error: null }, "unavailable", "account_check_unavailable"],
    ["malformed error", { data: true, error: false }, "unavailable", "account_check_unavailable"],
    ["thrown RPC", new Error("sensitive SDK details"), "unavailable", "account_check_unavailable"],
  ] as const) it("account-active " + label + " stops before any protected child lookup", async () => {
    fixture.state.active = active;
    assert.deepEqual(await run(child()), { status, code });
    assert.deepEqual(fixture.calls, [["rpc", "lc09_account_active"]]);
  });
  for (const [label, manage, status, code] of [
    ["false", response(false), "denied", "parent_manage_denied"],
    ["null", response(null), "unavailable", "parent_manage_unavailable"],
    ["error", { data: true, error: { message: "secret" } }, "unavailable", "parent_manage_unavailable"],
    ["truthy object", response({ allowed: true }), "unavailable", "parent_manage_unavailable"],
    ["missing error", { data: true }, "unavailable", "parent_manage_unavailable"],
    ["throw", new Error("secret"), "unavailable", "parent_manage_unavailable"],
  ] as const) it("parent-manage " + label + " stops before profile selection", async () => {
    fixture.state.manage = manage;
    assert.deepEqual(await run(child()), { status, code });
    assert.deepEqual(fixture.calls, [["rpc", "lc09_account_active"], ["rpc", "kids_parent_can_manage_profiles"]]);
  });
  it("uses the resolver's same invoker for both RPCs and the exact minimal current child relation", async () => {
    assert.deepEqual(await run(child()), allow("parent"));
    assert.deepEqual(fixture.calls, fullChildCalls());
    assert.equal(identityCalls, 1);
  });
  for (const [label, profile, status, code] of [
    ["missing", response(null), "denied", "profile_missing"],
    ["wrong parent", response({ id: CHILD, parent_id: OTHER }), "denied", "profile_not_owned"],
    ["wrong child", response({ id: OTHER, parent_id: ACTOR }), "denied", "profile_not_owned"],
    ["missing parent", response({ id: CHILD }), "unavailable", "profile_lookup_unavailable"],
    ["malformed UUID", response({ id: CHILD, parent_id: "parent" }), "unavailable", "profile_lookup_unavailable"],
    ["array", response([{ id: CHILD, parent_id: ACTOR }]), "unavailable", "profile_lookup_unavailable"],
    ["SDK error", { data: { id: CHILD, parent_id: ACTOR }, error: { details: "private" } }, "unavailable", "profile_lookup_unavailable"],
    ["missing response error", { data: { id: CHILD, parent_id: ACTOR } }, "unavailable", "profile_lookup_unavailable"],
    ["throw", new Error("private SDK row"), "unavailable", "profile_lookup_unavailable"],
  ] as const) it("current child row " + label + " is fail-closed", async () => {
    fixture.state.profile = profile;
    assert.deepEqual(await run(child()), { status, code });
    assert.deepEqual(fixture.calls, fullChildCalls());
  });
  it("allows equal UUID text for genuinely related typed child and actor entities", async () => {
    fixture.state.profile = response({ id: ACTOR, parent_id: ACTOR });
    assert.deepEqual(await run(child(ACTOR)), allow("parent"));
    assert.deepEqual(fixture.calls, fullChildCalls(ACTOR));
  });
  it("equal UUID text grants nothing without the actual child-parent row", async () => {
    fixture.state.profile = response(null);
    assert.deepEqual(await run(child(ACTOR)), { status: "denied", code: "profile_missing" });
    assert.deepEqual(fixture.calls, fullChildCalls(ACTOR));
  });
  it("validates UUID text before normalizing case, preserving typed identity", async () => {
    assert.deepEqual(await run(adult(ACTOR.toUpperCase())), allow("self"));
    assert.deepEqual(fixture.calls, [["rpc", "lc09_account_active"]]);
  });
  it("returns only bounded relationship metadata, never row/actor/client/token/PII or an invented epoch", async () => {
    fixture.state.profile = response({ id: CHILD, parent_id: ACTOR, display_name: "Private Person", consent: "secret" });
    const result = await run(child());
    assert.deepEqual(result, allow("parent"));
    assert.equal(JSON.stringify(result).includes(ACTOR), false);
    assert.equal(JSON.stringify(result).includes(CHILD), false);
    assert.equal(JSON.stringify(result).includes("Private"), false);
  });
  it("does not cache account grants across calls", async () => {
    assert.deepEqual(await run(child()), allow("parent"));
    fixture.calls.length = 0;
    fixture.state.active = response(false);
    assert.deepEqual(await run(child()), { status: "denied", code: "account_inactive" });
    assert.equal(identityCalls, 2);
    assert.deepEqual(fixture.calls, [["rpc", "lc09_account_active"]]);
  });
  it("does not cache parent-manage permission across calls", async () => {
    assert.deepEqual(await run(child()), allow("parent"));
    fixture.calls.length = 0;
    fixture.state.manage = response(false);
    assert.deepEqual(await run(child()), { status: "denied", code: "parent_manage_denied" });
    assert.deepEqual(fixture.calls, [["rpc", "lc09_account_active"], ["rpc", "kids_parent_can_manage_profiles"]]);
  });
  it("reads a changed child-parent relation again rather than reusing success", async () => {
    assert.deepEqual(await run(child()), allow("parent"));
    fixture.calls.length = 0;
    fixture.state.profile = response({ id: CHILD, parent_id: OTHER });
    assert.deepEqual(await run(child()), { status: "denied", code: "profile_not_owned" });
    assert.deepEqual(fixture.calls, fullChildCalls());
  });
  it("resolves a new request client and actor for every invocation", async () => {
    assert.deepEqual(await run(child()), allow("parent"));
    const first = fixture;
    fixture = client();
    identity = async () => ({ userId: OTHER, supabase: fixture.invoker });
    fixture.state.profile = response({ id: CHILD, parent_id: OTHER });
    assert.deepEqual(await run(child()), allow("parent"));
    assert.deepEqual(first.calls, fullChildCalls());
    assert.deepEqual(fixture.calls, fullChildCalls(CHILD, OTHER));
    assert.equal(identityCalls, 2);
  });
  it("losing request identity invalidates a prior adult grant", async () => {
    assert.deepEqual(await run(adult()), allow("self"));
    fixture.calls.length = 0;
    identity = async () => null;
    assert.deepEqual(await run(adult()), { status: "unauthenticated", code: "no_request_identity" });
    assert.deepEqual(fixture.calls, []);
  });
});

const VISIT_COLUMNS = "user_id,line,course_id,subject_id,profile_id,lesson_id,locale,visited_at";
const COURSE = "Archived Course / exact CASE";
function visitRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return { user_id: ACTOR, line: "technical", course_id: COURSE, subject_id: ACTOR,
    profile_id: null, lesson_id: "historical-lesson/17", locale: "ar-Gulf",
    visited_at: "2024-02-29T23:59:59.123456+03:00", ...overrides };
}
function input(subject = adult(), area = "technical", course_id = COURSE) {
  return { subject, area, course_id };
}
function succeeded(row: unknown) {
  return { status: "succeeded", row, selectedSourceComplete: true, permissionEpoch: null, sourceFreshness: null };
}
const sourceUnavailable = { status: "unavailable", code: "bookmark_source_unavailable" };
async function runBookmark(value: unknown = input()) { return offline(() => readBookmark(value)); }
function bookmarkCalls(kids = false, actor = ACTOR, subject = kids ? CHILD : actor, area = kids ? "kids" : "technical", course = COURSE) {
  const policy = kids ? fullChildCalls(subject, actor) : [["rpc", "lc09_account_active"]];
  return [...policy, ["from", "journey_visits"], ["select", VISIT_COLUMNS],
    ["eq", "user_id", actor], ["eq", "line", area], ["eq", "course_id", course],
    ["eq", "subject_id", subject], kids ? ["eq", "profile_id", subject] : ["is", "profile_id", null],
    ["maybeSingle"], ...policy];
}
function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

describe("request-bound single bookmark source read", () => {
  beforeEach(() => {
    externalAttempts = [];
    identityCalls = 0;
    fixture = client();
    identity = async () => ({ userId: ACTOR, supabase: fixture.invoker });
  });
  for (const area of ["ai", "technical", "academic"]) it(`[BR01.${area}] exact adult key, null profile, one request and same invoker through final check`, async () => {
    const row = visitRow({ line: area });
    fixture.state.visit = response(row);
    assert.deepEqual(await runBookmark(input(adult(), area)), succeeded(row));
    assert.equal(identityCalls, 1);
    assert.deepEqual(fixture.calls, bookmarkCalls(false, ACTOR, ACTOR, area));
  });
  for (const id of [CHILD, ACTOR]) it(`[BR02.${id === ACTOR ? "equalUUID" : "childUUID"}] typed child current relationship preserves historical course`, async () => {
    fixture.state.profile = response({ id, parent_id: ACTOR, level_id: "NEW-current-level" });
    const row = visitRow({ line: "kids", subject_id: id, profile_id: id });
    fixture.state.visit = response(row);
    assert.deepEqual(await runBookmark(input(child(id), "kids")), succeeded(row));
    assert.equal(identityCalls, 1);
    assert.deepEqual(fixture.calls, bookmarkCalls(true, ACTOR, id));
  });
  it("[BR03] missing request identity cannot read a source", async () => {
    identity = async () => null;
    assert.deepEqual(await runBookmark(), { status: "unauthenticated", code: "no_request_identity" });
    assert.equal(identityCalls, 1);
    assert.deepEqual(fixture.calls, []);
  });
  for (const key of ["userId", "supabase"]) it(`[BR04.${key}] identity accessors are never executed`, async () => {
    let reads = 0;
    const request = { userId: ACTOR, supabase: fixture.invoker };
    Object.defineProperty(request, key, { get() { reads++; throw new Error("private identity accessor"); } });
    identity = async () => request;
    assert.deepEqual(await runBookmark(), { status: "unavailable", code: "request_identity_unavailable" });
    assert.equal(reads, 0);
    assert.deepEqual(fixture.calls, []);
  });
  for (const [label, malformed] of [
    ["missingActor", { supabase: {} }], ["verifiedFlag", { verified: true, userId: ACTOR }],
    ["malformedActor", { userId: 1, supabase: {} }],
  ] as const) it(`[BR05.${label}] malformed resolver identity fails closed`, async () => {
    identity = async () => malformed;
    assert.deepEqual(await runBookmark(), { status: "unavailable", code: "request_identity_unavailable" });
    assert.deepEqual(fixture.calls, []);
  });
  const invalidSelectors: Array<[string, unknown]> = [
    ["null", null], ["array", []], ["inherited", Object.create(input())],
    ["actor", { ...input(), actorId: OTHER }], ["client", { ...input(), client: {} }],
    ["verified", { ...input(), verified: true }], ["role", { ...input(), role: "admin" }],
    ["dependencies", { ...input(), dependencies: {} }], ["policy", { ...input(), policy: () => true }],
    ["symbol", { ...input(), [Symbol("grant")]: true }], ["foreignAdult", input(adult(OTHER))],
    ["adultKids", input(adult(), "kids")], ["childTechnical", input(child(), "technical")],
    ["childAcademic", input(child(), "academic")], ["childAI", input(child(), "ai")],
    ["areaCase", input(adult(), "Technical")], ["unknownArea", input(adult(), "school")],
    ["emptyCourse", input(adult(), "technical", "")], ["longCourse", input(adult(), "technical", "x".repeat(81))],
    ["courseNUL", input(adult(), "technical", "a\0b")], ["courseSurrogate", input(adult(), "technical", "\ud800")],
    ["courseCoercion", { ...input(), course_id: { toString() { throw new Error("must not coerce"); } } }],
  ];
  for (const [label, selector] of invalidSelectors) it(`[BR06.${label}] contradictory or authority-bearing selector never reaches bookmark lookup`, async () => {
    const result = await runBookmark(selector);
    assert.deepEqual(result, label === "foreignAdult" ? { status: "denied", code: "different_actor" } : { status: "denied", code: "invalid_bookmark_selector" });
    assert.equal(identityCalls, 1);
    assert.deepEqual(fixture.calls, []);
  });
  for (const key of ["subject", "area", "course_id", "subject.id"]) it(`[BR07.${key}] selector getters are not invoked`, async () => {
    let count = 0;
    const selector = input();
    Object.defineProperty(key === "subject.id" ? selector.subject : selector, key === "subject.id" ? "id" : key,
      { get() { count++; throw new Error("selector getter"); } });
    assert.deepEqual(await runBookmark(selector), { status: "denied", code: "invalid_bookmark_selector" });
    assert.equal(count, 0);
    assert.deepEqual(fixture.calls, []);
  });
  for (const course of [" ", "CaseSensitive", "x".repeat(80), "😀".repeat(80)]) it(`[BR08.${course === " " ? "space" : course.startsWith("😀") ? "80scalars" : course.length === 80 ? "80ASCII" : "case"}] preserve exact historical SQL course identity`, async () => {
    const row = visitRow({ course_id: course }); fixture.state.visit = response(row);
    assert.deepEqual(await runBookmark(input(adult(), "technical", course)), succeeded(row));
    assert.deepEqual(fixture.calls, bookmarkCalls(false, ACTOR, ACTOR, "technical", course));
  });
  for (const [label, value, expected] of [
    ["false", response(false), { status: "denied", code: "account_inactive" }],
    ["null", response(null), { status: "unavailable", code: "account_check_unavailable" }],
    ["error", { data: true, error: { message: "secret" } }, { status: "unavailable", code: "account_check_unavailable" }],
    ["malformed", response("true"), { status: "unavailable", code: "account_check_unavailable" }],
  ] as const) it(`[BR09.${label}] initial account denial/unavailability prevents source lookup`, async () => {
    fixture.state.active = value;
    assert.deepEqual(await runBookmark(input(child(), "kids")), expected);
    assert.deepEqual(fixture.calls, [["rpc", "lc09_account_active"]]);
  });
  for (const [label, value, expected] of [
    ["false", response(false), { status: "denied", code: "parent_manage_denied" }],
    ["null", response(null), { status: "unavailable", code: "parent_manage_unavailable" }],
    ["error", { data: true, error: { message: "secret" } }, { status: "unavailable", code: "parent_manage_unavailable" }],
    ["malformed", {}, { status: "unavailable", code: "parent_manage_unavailable" }],
  ] as const) it(`[BR10.${label}] initial parent-manage failure prevents profile and visit lookup`, async () => {
    fixture.state.manage = value;
    assert.deepEqual(await runBookmark(input(child(), "kids")), expected);
    assert.deepEqual(fixture.calls, [["rpc", "lc09_account_active"], ["rpc", "kids_parent_can_manage_profiles"]]);
  });
  for (const [label, profile, expected] of [
    ["missing", null, { status: "denied", code: "profile_missing" }],
    ["wrong", { id: CHILD, parent_id: OTHER }, { status: "denied", code: "profile_not_owned" }],
  ] as const) it(`[BR11.${label}] initial parent row prevents bookmark lookup`, async () => {
    fixture.state.profile = response(profile);
    assert.deepEqual(await runBookmark(input(child(), "kids")), expected);
    assert.deepEqual(fixture.calls, fullChildCalls());
  });
  for (const [key, value] of [
    ["user_id", OTHER], ["line", "academic"], ["course_id", COURSE.toLowerCase()],
    ["subject_id", OTHER], ["profile_id", CHILD],
  ] as const) it(`[BR12.${key}] validates every echoed adult composite/profile field after filtering`, async () => {
    fixture.state.visit = response(visitRow({ [key]: value }));
    assert.deepEqual(await runBookmark(), sourceUnavailable);
    assert.deepEqual(fixture.calls, bookmarkCalls());
  });
  for (const [key, value] of [["profile_id", null], ["profile_id", OTHER], ["subject_id", ACTOR]] as const) it(`[BR13.${key}.${value ?? "null"}] child typed echo cannot be borrowed from adult or other profile`, async () => {
    fixture.state.visit = response(visitRow({ line: "kids", subject_id: CHILD, profile_id: CHILD, [key]: value }));
    assert.deepEqual(await runBookmark(input(child(), "kids")), sourceUnavailable);
    assert.deepEqual(fixture.calls, bookmarkCalls(true));
  });
  for (const key of VISIT_COLUMNS.split(",")) it(`[BR14.${key}] selected row accessors cannot execute or become a successful empty`, async () => {
    let count = 0; const row = visitRow();
    Object.defineProperty(row, key, { get() { count++; throw new Error("private row getter"); } });
    fixture.state.visit = response(row);
    assert.deepEqual(await runBookmark(), sourceUnavailable);
    assert.equal(count, 0);
    assert.deepEqual(fixture.calls, bookmarkCalls());
  });
  const malformedSources: Array<[string, unknown]> = [
    ["undefinedResponse", undefined], ["nullResponse", null], ["missingData", { error: null }],
    ["missingError", { data: null }], ["falseError", { data: null, error: false }],
    ["sdkError", { data: null, error: { message: "token secret", url: "https://private.invalid" } }],
    ["duplicateRows", response([visitRow(), visitRow()])], ["emptyArray", response([])],
    ["badRow", response(false)], ["inheritedRow", response(Object.create(visitRow()))],
    ["rejection", new Error("SDK token/URL/PII private")],
  ];
  for (const [label, source] of malformedSources) it(`[BR15.${label}] source failure/cardinality/malformed is unavailable after final policy check`, async () => {
    fixture.state.visit = source;
    assert.deepEqual(await runBookmark(), sourceUnavailable);
    assert.deepEqual(fixture.calls, bookmarkCalls());
  });
  for (const key of ["data", "error"]) it(`[BR16.${key}] result accessors fail without invocation and still recheck`, async () => {
    let count = 0; const value = response(null);
    Object.defineProperty(value, key, { get() { count++; throw new Error("SDK getter"); } });
    fixture.state.visit = value;
    assert.deepEqual(await runBookmark(), sourceUnavailable);
    assert.equal(count, 0);
    assert.deepEqual(fixture.calls, bookmarkCalls());
  });
  it("[BR17] genuine maybeSingle zero is complete for this selected key only", async () => {
    fixture.state.visit = response(null);
    assert.deepEqual(await runBookmark(), succeeded(null));
    assert.deepEqual(fixture.calls, bookmarkCalls());
  });
  const finalPolicies = ["accountFalse", "accountUnavailable", "manageFalse", "manageUnavailable", "parentWrong", "parentUnavailable"] as const;
  for (const outcome of ["row", "zero", "error", "rejection"] as const) for (const policy of finalPolicies) {
    it(`[BR18.${outcome}.${policy}] deferred source outcome cannot escape a later failed policy observation`, async () => {
      const kids = !policy.startsWith("account");
      const entered = deferred<void>(), completion = deferred<unknown>();
      fixture.state.visit = async () => { entered.resolve(); return completion.promise; };
      const pending = runBookmark(input(kids ? child() : adult(), kids ? "kids" : "technical"));
      await entered.promise;
      let expected: { status: string; code: string };
      if (policy === "accountFalse") { fixture.state.active = response(false); expected = { status: "denied", code: "account_inactive" }; }
      else if (policy === "accountUnavailable") { fixture.state.active = response(null); expected = { status: "unavailable", code: "account_check_unavailable" }; }
      else if (policy === "manageFalse") { fixture.state.manage = response(false); expected = { status: "denied", code: "parent_manage_denied" }; }
      else if (policy === "manageUnavailable") { fixture.state.manage = new Error("private revoked"); expected = { status: "unavailable", code: "parent_manage_unavailable" }; }
      else if (policy === "parentWrong") { fixture.state.profile = response({ id: CHILD, parent_id: OTHER }); expected = { status: "denied", code: "profile_not_owned" }; }
      else { fixture.state.profile = { data: null, error: { message: "private" } }; expected = { status: "unavailable", code: "profile_lookup_unavailable" }; }
      if (outcome === "rejection") completion.reject(new Error("private query failure"));
      else if (outcome === "error") completion.resolve({ data: null, error: { message: "private SDK error" } });
      else completion.resolve(response(outcome === "zero" ? null : visitRow(kids ? { line: "kids", subject_id: CHILD, profile_id: CHILD } : {})));
      const result = await pending;
      assert.deepEqual(result, expected);
      assert.equal(identityCalls, 1);
      assert.equal(Object.hasOwn(result, "row"), false);
      assert.equal(Object.hasOwn(result, "selectedSourceComplete"), false);
      assert.equal(fixture.calls.filter(call => call[0] === "from" && call[1] === "journey_visits").length, 1);
      assert.equal(fixture.calls.filter(call => call[0] === "rpc" && call[1] === "lc09_account_active").length, 2);
    });
  }
  for (const [label, field, value] of [
    ["lessonEmpty", "lesson_id", ""], ["lessonLong", "lesson_id", "x".repeat(161)],
    ["lessonObject", "lesson_id", {}], ["lessonNUL", "lesson_id", "x\0y"],
    ["localeUnknown", "locale", "ar"], ["localeObject", "locale", {}],
    ["timeEmpty", "visited_at", ""], ["timeNumber", "visited_at", 1],
    ["timeGarbage", "visited_at", "yesterday"], ["timeNoOffset", "visited_at", "2024-02-29T23:59:59"],
    ["timeBadCalendar", "visited_at", "2023-02-29T23:59:59Z"], ["timeBadOffset", "visited_at", "2024-02-29T23:59:59+16:00"],
  ] as const) it(`[BR19.${label}] malformed observation is unavailable, not an invented default`, async () => {
    fixture.state.visit = response(visitRow({ [field]: value }));
    assert.deepEqual(await runBookmark(), sourceUnavailable);
    assert.deepEqual(fixture.calls, bookmarkCalls());
  });
  for (const locale of ["ar-EG", "ar-MSA", "ar-Gulf", "en"]) it(`[BR20.${locale}] keeps the raw visit locale and source time without provenance upgrade`, async () => {
    const row = visitRow({ locale, lesson_id: "😀".repeat(160) }); fixture.state.visit = response(row);
    assert.deepEqual(await runBookmark(), succeeded(row));
  });
  for (const visited_at of ["infinity", "-infinity", "294276-01-01T00:00:00+00:00", "0001-01-01T00:00:00+00:00 BC"]) it(`[BR21.${visited_at}] PostgreSQL observation is preserved without a Date/freshness conversion`, async () => {
    const row = visitRow({ visited_at });fixture.state.visit = response(row);
    assert.deepEqual(await runBookmark(), succeeded(row));
  });
  it("[BR22] returns exactly eight own copied fields and no SDK/extra data or locator", async () => {
    const row = visitRow();
    const raw = { ...row, display_name: "Private", token: "secret", url: "https://private.invalid", enrollment: true };
    Object.defineProperty(raw, "privateAnswer", { get() { throw new Error("unselected getter"); } });
    fixture.state.visit = { data: raw, error: null, metadata: { token: "secret" }, url: "https://private.invalid" };
    const result = await runBookmark();
    assert.deepEqual(result, succeeded(row));
    if (result.status !== "succeeded" || !result.row) assert.fail("Expected actual row");
    assert.deepEqual(Object.keys(result.row), VISIT_COLUMNS.split(","));
    assert.notEqual(result.row, raw);
    assert.equal(JSON.stringify(result).includes("private.invalid"), false);
  });
  it("[BR23] freezes selected fields before awaiting the final policy check", async () => {
    const raw = visitRow(); const expected = { ...raw };
    fixture.state.visit = response(raw);
    let calls = 0;
    fixture.state.active = () => { calls++; if (calls === 2) { raw.lesson_id = "changed"; raw.locale = "en"; } return response(true); };
    assert.deepEqual(await runBookmark(), succeeded(expected));
  });
  it("[BR24] each new read captures its fresh actor/client while one read never re-resolves", async () => {
    assert.deepEqual(await runBookmark(), succeeded(visitRow()));
    const first = fixture; fixture = client();
    identity = async () => ({ userId: OTHER, supabase: fixture.invoker });
    const row = visitRow({ user_id: OTHER, subject_id: OTHER }); fixture.state.visit = response(row);
    assert.deepEqual(await runBookmark(input(adult(OTHER))), succeeded(row));
    assert.equal(identityCalls, 2);
    assert.deepEqual(first.calls, bookmarkCalls());
    assert.deepEqual(fixture.calls, bookmarkCalls(false, OTHER, OTHER));
  });
  it("[BR25] captures input key values before asynchronous source work", async () => {
    const selector = input(); const entered = deferred<void>(), completion = deferred<unknown>();
    fixture.state.visit = async () => { entered.resolve(); return completion.promise; };
    const pending = runBookmark(selector); await entered.promise;
    selector.course_id = "changed"; selector.subject.id = OTHER; selector.area = "academic";
    completion.resolve(response(visitRow()));
    assert.deepEqual(await pending, succeeded(visitRow()));
    assert.deepEqual(fixture.calls, bookmarkCalls());
  });
});

const OBSERVED = "2026-10-24T18:30:00.000Z";
const VISITED_UTC = "2024-02-29T20:59:59.123456+00:00";
const KNOWN_LOCATOR = "jv1_751ad6a240284baaef935b039bde014b64956d6826bc106f2f382fc1ac22eeb6";
const KNOWN_TUPLE_HEX = "5b226d617361617261742e6a6f75726e65795f7669736974732e626f6f6b6d61726b2e7631222c2261616161616161612d616161612d346161612d386161612d616161616161616161616161222c22746563686e6963616c222c22417263686976656420436f75727365202f2065786163742043415345222c22617574685f75736572222c2261616161616161612d616161612d346161612d386161612d616161616161616161616161225d";
const REAL_DIGEST = globalThis.crypto.subtle.digest.bind(globalThis.crypto.subtle);
type Digest = typeof globalThis.crypto.subtle.digest;
async function withDigest<T>(replacement: Digest, action: () => Promise<T>): Promise<T> {
  const target = globalThis.crypto.subtle;
  const original = Object.getOwnPropertyDescriptor(target, "digest");
  Object.defineProperty(target, "digest", { configurable: true, writable: true, value: replacement });
  try { return await action(); }
  finally { if (original) Object.defineProperty(target, "digest", original); else Reflect.deleteProperty(target, "digest"); }
}
async function withClock<T>(action: () => Promise<T>, fail = false): Promise<T> {
  const OriginalDate = globalThis.Date;
  class FixedDate extends OriginalDate {
    constructor() { super(OBSERVED); }
    toISOString() { if (fail) throw new Error("private clock failure"); return super.toISOString(); }
  }
  globalThis.Date = FixedDate as DateConstructor;
  try { return await action(); } finally { globalThis.Date = OriginalDate; }
}
function projectionRow(extra: Record<string, unknown> = {}) { return visitRow({ visited_at: VISITED_UTC, ...extra }); }
async function runProjection(value: unknown = input()) {
  projectionInvocations++;
  const result = await withClock(() => offline(() => projectBookmark(value)));
  if (captureProjectionEvidence && result.status === "succeeded") for (const item of result.projection.records) {
    if (item.record_type === "bookmark") console.log("# MASAARAT_SCHEMA_BOOKMARK " + JSON.stringify(item.record));
  }
  return result;
}
function bookmarkRecord(result: Awaited<ReturnType<typeof projectBookmark>>) {
  assert.equal(result.status, "succeeded");
  if (result.status !== "succeeded") assert.fail("Expected real successful projection");
  assert.equal(result.projection.records.length, 1);
  const record = result.projection.records[0];
  if (record.record_type !== "bookmark") assert.fail("Expected actual mapper bookmark");
  return record.record;
}
function unknownFacts(record: ReturnType<typeof bookmarkRecord>) {
  for (const key of ["enrollment_id", "curriculum_manifest_id", "curriculum_manifest_sha256", "content_version", "policy_version",
    "locale_registry_version", "actual_content_locale_id", "requested_content_locale_id", "equivalence_version", "fallback_rule_version"] as const) {
    assert.deepEqual(record.learning[key], { state: "unknown", value: null, reason: "not_recorded_legacy" });
  }
  assert.deepEqual(record.logical_key.enrollment_id, { state: "unknown", value: null, reason: "not_recorded_legacy" });
  assert.deepEqual(record.provenance.source_revision, { state: "unknown", value: null, reason: "not_recorded_legacy" });
  assert.equal(record.resume_status, "reference_unknown");
  assert.equal(record.receipt, null);
  assert.equal(record.identity_kind, "opaque_bookmark_not_write_uuid");
  assert.equal(record.provenance.provenance_status, "unknown_legacy");
  assert.equal(record.provenance.observed_at, OBSERVED);
  assert.deepEqual(record.last_visited_at, { state: "known", value: "2024-02-29T20:59:59.123456Z" });
  assert.notEqual(record.provenance.observed_at, record.last_visited_at.value);
}

describe("actual authenticated source to real historical bookmark projection", () => {
  beforeEach(() => {
    externalAttempts = []; identityCalls = 0; fixture = client();
    identity = async () => ({ userId: ACTOR, supabase: fixture.invoker });
    fixture.state.visit = response(projectionRow());
  });
  it("[BP01] independently fixed UTF8 tuple bytes and real WebCrypto known digest, before final policy", async () => {
    let digests = 0;
    const result = await withDigest(async (algorithm, data) => {
      digests++; assert.equal(algorithm, "SHA-256"); assert.ok(data instanceof Uint8Array);
      assert.equal(Buffer.from(data).toString("hex"), KNOWN_TUPLE_HEX);
      fixture.calls.push(["digest:start"]); const bytes = await REAL_DIGEST(algorithm, data);
      fixture.calls.push(["digest:end"]); return bytes;
    }, () => runProjection());
    const record = bookmarkRecord(result);
    assert.equal(record.bookmark_id, KNOWN_LOCATOR);
    assert.deepEqual(record.provenance.source, { source_kind: "legacy_bookmark", locator: KNOWN_LOCATOR });
    unknownFacts(record);
    assert.equal(identityCalls, 1); assert.equal(digests, 1);
    assert.deepEqual(fixture.calls, [...bookmarkCalls().slice(0, -1), ["digest:start"], ["digest:end"], ["rpc", "lc09_account_active"]]);
    if (result.status !== "succeeded") assert.fail();
    assert.equal(result.selectedSourceComplete, true); assert.equal(result.permissionEpoch, null); assert.equal(result.sourceFreshness, null);
    assert.deepEqual(result.selection, input());
    assert.equal(Object.isFrozen(result.selection), true); assert.equal(Object.isFrozen(result.selection.subject), true);
    assert.equal(result.projection.coverage.freshness, "unknown");
    assert.deepEqual(result.projection.coverage.source_as_of, { state: "unknown", value: null, reason: "not_retrievable" });
    assert.equal(result.projection.coverage.sources[0].source_id, "journey_visits_selected_key");
    assert.deepEqual(result.projection.coverage.sources[0].watermark, { state: "unknown", value: null, reason: "not_recorded_legacy" });
  });
  for (const id of [CHILD, ACTOR]) it(`[BP02.${id === ACTOR ? "equalUUID" : "childUUID"}] real mapper receives currently authorized typed child and historical course`, async () => {
    fixture.state.profile = response({ id, parent_id: ACTOR, level_id: "different-current-level" });
    fixture.state.visit = response(projectionRow({ line: "kids", subject_id: id, profile_id: id }));
    const result = await runProjection(input(child(id), "kids"));const record = bookmarkRecord(result);
    assert.deepEqual(record.logical_key.subject, child(id));
    assert.deepEqual(record.logical_key.area, "kids");assert.equal(record.logical_key.course_id, COURSE);
    assert.match(record.bookmark_id, /^jv1_[0-9a-f]{64}$/);unknownFacts(record);
    assert.equal(identityCalls, 1);assert.deepEqual(fixture.calls, bookmarkCalls(true, ACTOR, id));
  });
  for (const kids of [false, true]) it(`[BP03.${kids ? "child" : "adult"}] true selected-key zero maps an actual empty batch using captured actor`, async () => {
    fixture.state.visit = response(null);let digests = 0;
    const result = await withDigest(async (algorithm, data) => {
      digests++;assert.ok(data instanceof Uint8Array);
      const tuple = JSON.parse(new TextDecoder().decode(data));
      assert.equal(tuple[1], ACTOR);assert.equal(tuple[4], kids ? "kids_profile" : "auth_user");assert.equal(tuple[5], kids ? CHILD : ACTOR);
      return REAL_DIGEST(algorithm, data);
    }, () => runProjection(input(kids ? child() : adult(), kids ? "kids" : "technical")));
    if (result.status !== "succeeded") assert.fail("Expected true zero projection");
    assert.deepEqual(result.projection.records, []);assert.equal(result.projection.empty_confirmed, true);
    assert.equal(result.projection.coverage.completeness, "complete");assert.equal(result.selectedSourceComplete, true);
    assert.equal(result.projection.coverage.sources.length, 1);assert.equal(digests, 1);assert.equal(identityCalls, 1);
    assert.deepEqual(result.selection, input(kids ? child() : adult(), kids ? "kids" : "technical"));
    assert.deepEqual(fixture.calls, bookmarkCalls(kids));
  });
  it("[BP04] locator is stable across item/visit locale/time and fresh auth incarnation, not a new grant", async () => {
    const first = bookmarkRecord(await runProjection()).bookmark_id;
    fixture = client();identity = async () => ({ userId: ACTOR, supabase: fixture.invoker, authGeneration: "next" });
    fixture.state.visit = response(projectionRow({ lesson_id: "different-item", locale: "en", visited_at: "2025-01-01T00:00:00Z" }));
    assert.equal(bookmarkRecord(await runProjection()).bookmark_id, first);assert.equal(identityCalls, 2);
  });
  it("[BP05] locators distinguish actual actor, typed subject, area and exact case/Unicode course", async () => {
    const values = new Set<string>();
    for (const [actor, subject, area, course] of [
      [ACTOR, adult(), "technical", COURSE], [OTHER, adult(OTHER), "technical", COURSE],
      [ACTOR, child(ACTOR), "kids", COURSE], [ACTOR, child(CHILD), "kids", COURSE],
      [ACTOR, adult(), "academic", COURSE], [ACTOR, adult(), "ai", COURSE],
      [ACTOR, adult(), "technical", COURSE.toLowerCase()], [ACTOR, adult(), "technical", "é"],
      [ACTOR, adult(), "technical", "e\u0301"], [ACTOR, adult(), "technical", "😀"]
    ] as const) {
      fixture = client();identity = async () => ({ userId: actor, supabase: fixture.invoker });
      const kids = area === "kids";fixture.state.profile = response({ id: subject.id, parent_id: actor });
      fixture.state.visit = response(projectionRow({ user_id: actor, subject_id: subject.id, line: area, course_id: course, profile_id: kids ? subject.id : null }));
      const record = bookmarkRecord(await runProjection(input(subject, area, course)));
      assert.equal(record.logical_key.course_id, course);assert.equal(values.has(record.bookmark_id), false);values.add(record.bookmark_id);
    }
    assert.equal(values.size, 10);assert.equal(identityCalls, 10);
  });
  it("[BP06] caller and raw SDK row mutation during digest cannot retarget captured scope or mapped facts", async () => {
    const selector = input();const raw = projectionRow();fixture.state.visit = response(raw);
    const entered = deferred<Uint8Array<ArrayBuffer>>(), done = deferred<ArrayBuffer>();
    const result = await withDigest(async (algorithm, data) => {
      assert.ok(data instanceof Uint8Array);entered.resolve(data.slice());return done.promise;
    }, async () => {
      const pending = runProjection(selector);const bytes = await entered.promise;
      selector.subject.id = OTHER;selector.area = "academic";selector.course_id = "retargeted";
      Object.assign(raw, { user_id: OTHER, subject_id: OTHER, line: "academic", course_id: "changed", lesson_id: "changed", locale: "en", visited_at: "malformed" });
      done.resolve(await REAL_DIGEST("SHA-256", bytes));return pending;
    });
    const record = bookmarkRecord(result);assert.equal(record.bookmark_id, KNOWN_LOCATOR);
    assert.deepEqual(record.item_id, { state: "known", value: "historical-lesson/17" });unknownFacts(record);
    if (result.status !== "succeeded") assert.fail();assert.deepEqual(result.selection, input());assert.deepEqual(fixture.calls, bookmarkCalls());
  });
  for (const extra of ["rows", "actor_user_id", "verified", "client", "projection", "observed_at", "mode", "callback"]) it(`[BP07.${extra}] no caller source/authority/mode/clock injection`, async () => {
    assert.deepEqual(await runProjection({ ...input(), [extra]: extra === "mode" ? "source" : true }), { status: "denied", code: "invalid_bookmark_selector" });
    assert.deepEqual(fixture.calls, []);assert.equal(identityCalls, 1);
  });
  for (const key of ["subject", "course_id"]) it(`[BP08.${key}] selector accessors are never evaluated by composition`, async () => {
    let calls = 0;const selector = input();Object.defineProperty(selector, key, { get() { calls++;throw new Error("private getter"); } });
    assert.deepEqual(await runProjection(selector), { status: "denied", code: "invalid_bookmark_selector" });assert.equal(calls, 0);assert.deepEqual(fixture.calls, []);
  });
  for (const [label, source] of [
    ["sdkError", { data: null, error: { message: "secret" } }], ["rejection", new Error("private SDK")],
    ["mismatchedRow", response(projectionRow({ user_id: OTHER }))], ["multipleRows", response([projectionRow(), projectionRow()])],
    ["missingResponse", undefined]
  ] as const) it(`[BP09.${label}] failed/malformed selected source never becomes a projected empty and performs final policy`, async () => {
    fixture.state.visit = source;let hashes = 0;
    const result = await withDigest(async () => { hashes++;throw new Error("must not hash unavailable source"); }, () => runProjection());
    assert.deepEqual(result, sourceUnavailable);assert.equal(hashes, 0);assert.deepEqual(fixture.calls, bookmarkCalls());
  });
  for (const label of ["noIdentity", "inactive", "manageUnavailable", "missingParent"] as const) it(`[BP10.${label}] source policy failure is not a successful projection`, async () => {
    let expected;
    const kids = label === "manageUnavailable" || label === "missingParent";
    if (label === "noIdentity") { identity = async () => null;expected = { status: "unauthenticated", code: "no_request_identity" }; }
    else if (label === "inactive") { fixture.state.active = response(false);expected = { status: "denied", code: "account_inactive" }; }
    else if (label === "manageUnavailable") { fixture.state.manage = response(null);expected = { status: "unavailable", code: "parent_manage_unavailable" }; }
    else { fixture.state.profile = response(null);expected = { status: "denied", code: "profile_missing" }; }
    assert.deepEqual(await runProjection(input(kids ? child() : adult(), kids ? "kids" : "technical")), expected);
    assert.equal(fixture.calls.some(x => x[0] === "from" && x[1] === "journey_visits"), false);
  });
  for (const zero of [false, true]) for (const failure of ["hash", "clock", "malformedDigest"] as const) it(`[BP11.${zero ? "zero" : "row"}.${failure}] prep failure is bounded unavailable after final policy`, async () => {
    if (zero) fixture.state.visit = response(null);
    let result;
    if (failure === "hash") result = await withDigest(async () => { throw new Error("private hash"); }, () => runProjection());
    else if (failure === "malformedDigest") result = await withDigest(async () => new ArrayBuffer(1), () => runProjection());
    else {
      projectionInvocations++;
      result = await withClock(() => offline(() => projectBookmark(input())), true);
    }
    assert.deepEqual(result, { status: "unavailable", code: "bookmark_projection_unavailable" });assert.deepEqual(fixture.calls, bookmarkCalls());
  });
  for (const zero of [false, true]) for (const failedDigest of [false, true]) for (const policy of ["accountFalse", "accountUnavailable", "manageFalse", "manageUnavailable", "parentWrong", "parentMissing", "parentUnavailable"] as const) {
    it(`[BP12.${zero ? "zero" : "row"}.${failedDigest ? "hashReject" : "hashResolve"}.${policy}] final same-invoker policy wins after deferred work`, async () => {
      const kids = !policy.startsWith("account");fixture.state.visit = response(zero ? null : projectionRow(kids ? { line: "kids", subject_id: CHILD, profile_id: CHILD } : {}));
      const entered = deferred<Uint8Array<ArrayBuffer>>(), done = deferred<ArrayBuffer>();let expected: { status: string; code: string };
      const result = await withDigest(async (_algorithm, data) => { assert.ok(data instanceof Uint8Array);entered.resolve(data.slice());return done.promise; }, async () => {
        const pending = runProjection(input(kids ? child() : adult(), kids ? "kids" : "technical"));const bytes = await entered.promise;
        if (policy === "accountFalse") { fixture.state.active = response(false);expected = { status: "denied", code: "account_inactive" }; }
        else if (policy === "accountUnavailable") { fixture.state.active = response(null);expected = { status: "unavailable", code: "account_check_unavailable" }; }
        else if (policy === "manageFalse") { fixture.state.manage = response(false);expected = { status: "denied", code: "parent_manage_denied" }; }
        else if (policy === "manageUnavailable") { fixture.state.manage = new Error("private");expected = { status: "unavailable", code: "parent_manage_unavailable" }; }
        else if (policy === "parentWrong") { fixture.state.profile = response({ id: CHILD, parent_id: OTHER });expected = { status: "denied", code: "profile_not_owned" }; }
        else if (policy === "parentMissing") { fixture.state.profile = response(null);expected = { status: "denied", code: "profile_missing" }; }
        else { fixture.state.profile = { data: null, error: { message: "private" } };expected = { status: "unavailable", code: "profile_lookup_unavailable" }; }
        if (failedDigest) done.reject(new Error("private digest rejection"));else done.resolve(await REAL_DIGEST("SHA-256", bytes));
        return pending;
      });
      assert.deepEqual(result, expected!);assert.equal(identityCalls, 1);
      assert.equal(Object.hasOwn(result, "projection"), false);assert.equal(Object.hasOwn(result, "selection"), false);
      assert.equal(fixture.calls.filter(x => x[0] === "rpc" && x[1] === "lc09_account_active").length, 2);
    });
  }
  for (const zero of [false, true]) it(`[BP13.${zero ? "zero" : "row"}] final denial also precedes a clock failure`, async () => {
    if (zero) fixture.state.visit = response(null);
    const result = await withDigest(async (algorithm, data) => { fixture.state.active = response(false);return REAL_DIGEST(algorithm, data); }, async () => {
      projectionInvocations++;return withClock(() => offline(() => projectBookmark(input())), true);
    });
    assert.deepEqual(result, { status: "denied", code: "account_inactive" });assert.equal(identityCalls, 1);
  });
  it("[BP14] unselected extras/getters never reach actual mapper output", async () => {
    const raw = projectionRow({ token: "private", url: "https://private.invalid", enrollment_id: OTHER, content_version: "fake" });
    Object.defineProperty(raw, "private_answer", { get() { throw new Error("unselected getter"); } });fixture.state.visit = response(raw);
    const result = await runProjection();const record = bookmarkRecord(result);unknownFacts(record);
    assert.equal(JSON.stringify(result).includes("private.invalid"), false);assert.equal(JSON.stringify(result).includes("fake"), false);
    assert.deepEqual(Object.keys(result).sort(), ["permissionEpoch", "projection", "selectedSourceComplete", "selection", "sourceFreshness", "status"].sort());
  });
  it("[BP15] raw-source timestamp semantics remain intact when actual mapper cannot represent an observation", async () => {
    const raw = visitRow();fixture.state.visit = response(raw);
    assert.deepEqual(await runBookmark(), succeeded(raw));
    assert.deepEqual(await runProjection(), { status: "unavailable", code: "bookmark_projection_unavailable" });
    assert.equal(identityCalls, 2);
  });
});

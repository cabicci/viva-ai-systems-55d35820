import assert from "node:assert/strict";
import http from "node:http";
import https from "node:https";
import net from "node:net";
import tls from "node:tls";
import dns from "node:dns";
import dgram from "node:dgram";
import { syncBuiltinESMExports } from "node:module";

const runnerName = process.env.MASAARAT_LEGACY_FACT_TEST_RUNNER === "node" ? "node:test" : "vitest";
const runner = await import(runnerName);
const { describe, it, beforeEach } = runner;
const captureEvidence = runnerName === "node:test" && process.env.MASAARAT_LEGACY_FACT_SCHEMA_SAMPLES === "1";
let invocations = 0, identityCalls = 0;
let identity: () => Promise<unknown> = async () => null;
const resolver = async () => { identityCalls++;return identity(); };
if (runnerName === "node:test") {
  const { mock } = await import("node:test");
  mock.module(new URL("../ssr-request-auth.server.ts", import.meta.url), {
    namedExports: { resolveVerifiedRequestUser: resolver },
  });
} else runner.vi.doMock("../ssr-request-auth.server.ts", () => ({ resolveVerifiedRequestUser: resolver }));
if (captureEvidence) runner.after(() => console.log("# MASAARAT_LEGACY_FACT_INVOCATIONS " + invocations));

let forbidden: string[] = [];
const diagnosticKeys = new Set(["FORCE_COLOR", "NO_COLOR", "NODE_DISABLE_COLORS", "NODE_V8_COVERAGE", "WATCH_REPORT_DEPENDENCIES", "NODE_TEST_CONTEXT"]);
async function offline<T>(action: () => Promise<T>): Promise<T> {
  const environment = process.env;
  const restore: Array<() => void> = [];
  const block = (name: string) => () => { forbidden.push(name);throw new Error("Offline boundary forbids external access"); };
  function replace(target: object, key: string, value: unknown, getter = false) {
    const original = Object.getOwnPropertyDescriptor(target, key);
    Object.defineProperty(target, key, getter ? { configurable: true, get: value as () => unknown } : { configurable: true, writable: true, value });
    restore.push(() => { if (original) Object.defineProperty(target, key, original);else Reflect.deleteProperty(target, key); });
  }
  process.env = new Proxy(Object.create(null) as NodeJS.ProcessEnv, {
    get(_target, key) { if (typeof key === "string" && diagnosticKeys.has(key)) return undefined;forbidden.push("env:" + String(key));throw new Error("No production environment"); },
    set: block("env:set"), has: block("env:has"), ownKeys: block("env:keys"), getOwnPropertyDescriptor: block("env:descriptor"),
  });
  for (const key of ["fetch", "XMLHttpRequest", "WebSocket", "EventSource"]) replace(globalThis, key, block(key));
  for (const key of ["localStorage", "sessionStorage", "indexedDB"]) replace(globalThis, key, block("storage:" + key), true);
  for (const target of [http, https]) for (const key of ["request", "get"]) replace(target, key, block(key));
  for (const key of ["connect", "createConnection"]) replace(net, key, block(key));
  replace(net.Socket.prototype, "connect", block("socket:connect"));replace(tls, "connect", block("tls:connect"));
  replace(dgram, "createSocket", block("udp:createSocket"));replace(dgram.Socket.prototype, "send", block("udp:send"));
  for (const target of [dns, dns.promises]) for (const key of Object.keys(target).filter(k => /^(lookup|resolve)/.test(k))) replace(target, key, block("dns:" + key));
  syncBuiltinESMExports();
  try { return await action(); }
  finally { process.env = environment;for (const undo of restore.reverse()) undo();syncBuiltinESMExports();assert.deepEqual(forbidden, []); }
}
const { readPersonalLegacyFactProjection: readFact } = await offline(() => import("./personal-legacy-fact.server.ts"));
const ACTOR = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const OTHER = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const MISSION = "a1111111-a111-4a11-8a11-a11111111111";
const QUIZ = "b2222222-b222-4b22-8b22-b22222222222";
const WRONG = "c3333333-c333-4c33-8c33-c33333333333";
const OBSERVED = "2026-10-24T20:00:00.000Z";
const RECORDED = "2024-01-02T03:04:05.123456+00:00";
type Kind = "mission" | "quiz";
const reply = (data: unknown) => ({ data, error: null });
function input(kind: Kind = "mission", actor = ACTOR, id = kind === "mission" ? MISSION : QUIZ) {
  return { subject: { kind: "auth_user", id: actor }, source: { kind, id } };
}
function mission(extra: Record<string, unknown> = {}) { return { id: MISSION, user_id: ACTOR, lesson_id: "legacy-item", status: "submitted", score: null, created_at: RECORDED, ...extra }; }
function quiz(extra: Record<string, unknown> = {}) { return { id: QUIZ, user_id: ACTOR, lesson_id: "legacy-item", is_correct: true, attempted_at: RECORDED, ...extra }; }
const columns = { mission: "id,user_id,lesson_id,status,score,created_at", quiz: "id,user_id,lesson_id,is_correct,attempted_at" };
const table = { mission: "mission_submissions", quiz: "lesson_quiz_attempts" };
const sourceUnavailable = { status: "unavailable", code: "legacy_fact_source_unavailable" };
const projectionUnavailable = { status: "unavailable", code: "legacy_fact_projection_unavailable" };
type Chain = { select(value: string): Chain; eq(key: string, value: string): Chain; maybeSingle(): Promise<unknown> };
function fixture() {
  const calls: unknown[][] = [];
  const state: { active: unknown; mission: unknown; quiz: unknown; fromError?: Error } = { active: reply(true), mission: reply(mission()), quiz: reply(quiz()) };
  async function result(value: unknown) { if (value instanceof Error) throw value;return typeof value === "function" ? value() : value; }
  function chain(kind: Kind): Chain {
    const query: Chain = {
      select(value) { assert.equal(this, query);assert.equal(value, columns[kind]);calls.push(["select", value]);return query; },
      eq(key, value) { assert.equal(this, query);calls.push(["eq", key, value]);return query; },
      async maybeSingle() { assert.equal(this, query);calls.push(["maybeSingle"]);return result(state[kind]); },
    };
    return query;
  }
  const client = {
    async rpc(...args: unknown[]) { assert.equal(this, client);assert.deepEqual(args, ["lc09_account_active"]);calls.push(["rpc", ...args]);return result(state.active); },
    from(name: string) { assert.equal(this, client);calls.push(["from", name]);if (state.fromError) throw state.fromError;
      assert.ok(name === table.mission || name === table.quiz);return chain(name === table.mission ? "mission" : "quiz"); },
  };
  return { client, calls, state };
}
let f: ReturnType<typeof fixture>;
let clockFailure = false, onClock: (() => void) | undefined;
async function run(value: unknown = input()) {
  invocations++;
  const Original = globalThis.Date;
  class Fixed extends Original {
    constructor() { super(OBSERVED);onClock?.(); }
    toISOString() { if (clockFailure) throw new Error("private clock detail");return super.toISOString(); }
  }
  globalThis.Date = Fixed as DateConstructor;
  let result: Awaited<ReturnType<typeof readFact>>;
  try { result = await offline(() => readFact(value)); } finally { globalThis.Date = Original; }
  if (captureEvidence && result.status === "succeeded") for (const item of result.projection.records) {
    if (item.record_type === "legacy_fact") console.log("# MASAARAT_LEGACY_FACT_DTO " + JSON.stringify(item.record));
  }
  return result;
}
function calls(kind: Kind = "mission", actor = ACTOR, id = kind === "mission" ? MISSION : QUIZ) {
  return [["rpc", "lc09_account_active"], ["from", table[kind]], ["select", columns[kind]], ["eq", "id", id], ["eq", "user_id", actor], ["maybeSingle"], ["rpc", "lc09_account_active"]];
}
function fact(result: Awaited<ReturnType<typeof readFact>>) {
  if (result.status !== "succeeded") assert.fail("Expected actual mapper result");
  assert.equal(result.projection.records.length, 1);const item = result.projection.records[0];
  if (item.record_type !== "legacy_fact") assert.fail("Wrong real mapper record type");
  return item.record;
}
function assertUnknown(record: ReturnType<typeof fact>) {
  for (const key of ["area", "course_id", "enrollment_id", "curriculum_manifest_id", "curriculum_manifest_sha256", "content_version", "policy_version", "locale_registry_version", "actual_content_locale_id", "requested_content_locale_id", "equivalence_version", "fallback_rule_version"] as const) {
    assert.deepEqual(record.learning[key], { state: "unknown", value: null, reason: "not_recorded_legacy" });
  }
  for (const value of [record.score_scale_ref, record.actual_assessment_locale_id, record.provenance.source_revision]) assert.deepEqual(value, { state: "unknown", value: null, reason: "not_recorded_legacy" });
  assert.deepEqual(record.original_response, { status: "not_requested", value: null });assert.equal(record.grading_provenance, "unknown_legacy");
  assert.equal(record.provenance.observed_at, OBSERVED);assert.deepEqual(record.provenance.recorded_at, { state: "known", value: "2024-01-02T03:04:05.123456Z" });
  assert.equal(Object.hasOwn(record, "receipt"), false);
}
function deferred<T>() { let resolve!: (value: T | PromiseLike<T>) => void;let reject!: (reason: unknown) => void;const promise = new Promise<T>((yes, no) => { resolve = yes;reject = no; });return { promise, resolve, reject }; }

describe("default personal actor-only legacy fact projection (new domain cases)", () => {
  beforeEach(() => { forbidden = [];identityCalls = 0;f = fixture();clockFailure = false;onClock = undefined;identity = async () => ({ userId: ACTOR, supabase: f.client }); });
  for (const kind of ["mission", "quiz"] as const) it(`[LF01.${kind}] one request/same receiver, exact PK+actor query and final active check`, async () => {
    const result = await run(input(kind));const record = fact(result);assertUnknown(record);
    assert.equal(identityCalls, 1);assert.deepEqual(f.calls, calls(kind));assert.equal(record.source.locator, kind === "mission" ? MISSION : QUIZ);
    assert.equal(record.source.locator.startsWith("jv1_"), false);
    if (result.status !== "succeeded") assert.fail();assert.deepEqual(result.selection, input(kind));
    assert.equal(Object.isFrozen(result.selection), true);assert.equal(Object.isFrozen(result.selection.subject), true);assert.equal(Object.isFrozen(result.selection.source), true);
    assert.equal(result.selectedSourceComplete, true);assert.equal(result.permissionEpoch, null);assert.equal(result.sourceFreshness, null);
    assert.equal(result.projection.coverage.sources[0].source_id, table[kind] + "_selected_key");assert.equal(result.projection.coverage.freshness, "unknown");
  });
  for (const status of ["draft", "submitted", "evaluating", "needs_revision", "passed", "failed"]) it(`[LF02.${status}] stored enum remains observed only, actual mapper derives draft`, async () => {
    f.state.mission = reply(mission({ status }));const record = fact(await run());
    assert.equal(record.source.source_kind, status === "draft" ? "legacy_draft" : "legacy_mission");
    assert.equal(record.fact_kind, status === "draft" ? "draft" : "mission_submission");
    assert.deepEqual(record.observed_status, { state: "known", value: status });assertUnknown(record);
  });
  for (const [name, score, expected] of [
    ["null", null, null], ["precision", "123456789012345678901234567890.000000000123", "123456789012345678901234567890.000000000123"],
    ["negativeString", "-1.2300", "-1.2300"], ["zero", 0, "0"], ["negativeZero", -0, "-0"],
    ["smallJS", 1e-7, "0.0000001"], ["largeJS", 1e21, "1000000000000000000000"],
  ] as const) it(`[LF03.${name}] actual score observation preserves supplied precision/value without scale or range inference`, async () => {
    f.state.mission = reply(mission({ score }));const record = fact(await run());
    assert.deepEqual(record.score, expected === null ? { state: "unknown", value: null, reason: "not_recorded_legacy" } : { state: "known", value: expected });assertUnknown(record);
  });
  it("[LF04] nullable mission item stays unknown without mission/catalogue substitution", async () => {
    f.state.mission = reply(mission({ lesson_id: null, mission_id: "not-selected" }));const record = fact(await run());
    assert.deepEqual(record.learning.item_id, { state: "unknown", value: null, reason: "not_recorded_legacy" });assertUnknown(record);
  });
  for (const correct of [true, false]) it(`[LF05.${correct}] quiz practice boolean is observed only, no official score/original answer`, async () => {
    f.state.quiz = reply(quiz({ is_correct: correct }));const record = fact(await run(input("quiz")));
    assert.equal(record.source.source_kind, "legacy_quiz_attempt");assert.equal(record.fact_kind, "quiz_attempt");
    assert.deepEqual(record.observed_status, { state: "known", value: "is_correct=" + correct });
    assert.deepEqual(record.score, { state: "unknown", value: null, reason: "not_recorded_legacy" });assertUnknown(record);
  });
  for (const kind of ["mission", "quiz"] as const) it(`[LF06.${kind}] genuine selected query zero maps empty only for that selected source`, async () => {
    f.state[kind] = reply(null);const result = await run(input(kind));if (result.status !== "succeeded") assert.fail();
    assert.deepEqual(result.projection.records, []);assert.equal(result.projection.empty_confirmed, true);assert.equal(result.projection.coverage.sources.length, 1);
    assert.equal(result.projection.coverage.completeness, "complete");assert.deepEqual(result.selection, input(kind));assert.deepEqual(f.calls, calls(kind));
  });
  it("[LF07] UUID text case canonicalizes input/verified identity, preserving actual stored locator", async () => {
    identity = async () => ({ userId: ACTOR.toUpperCase(), supabase: f.client });
    const value = input();value.subject.id = ACTOR.toUpperCase();value.source.id = MISSION.toUpperCase();
    assert.equal(fact(await run(value)).source.locator, MISSION);assert.deepEqual(f.calls, calls());
  });
  for (const id of [ACTOR, OTHER]) it(`[LF08.${id === ACTOR ? "equalUUID" : "differentUUID"}] child subject cannot borrow adult historical work`, async () => {
    const value = { ...input(), subject: { kind: "kids_profile", id } };
    assert.deepEqual(await run(value), { status: "denied", code: "actor_only" });assert.equal(identityCalls, 1);assert.deepEqual(f.calls, []);
  });
  it("[LF09] foreign adult/privileged role fields cannot bypass self ownership", async () => {
    identity = async () => ({ userId: ACTOR, supabase: f.client, role: "admin", teacher: true, paid: true });
    assert.deepEqual(await run(input("mission", OTHER)), { status: "denied", code: "different_actor" });assert.equal(identityCalls, 1);assert.deepEqual(f.calls, []);
  });
  for (const extra of ["actor", "client", "verified", "rows", "clock", "grant", "observed_at", "callback"]) it(`[LF10.${extra}] caller authority/source/clock injection rejected before request dispatch`, async () => {
    assert.deepEqual(await run({ ...input(), [extra]: true }), { status: "denied", code: "invalid_selector" });assert.equal(identityCalls, 0);assert.deepEqual(f.calls, []);
  });
  for (const [label, value] of [
    ["null", null], ["array", []], ["inherited", Object.create(input())],
    ["sourceKind", { ...input(), source: { kind: "mission_submissions", id: MISSION } }],
    ["sourceUUID", { ...input(), source: { kind: "mission", id: "not-an-id" } }],
    ["sourceExtra", { ...input(), source: { kind: "mission", id: MISSION, table: "other" } }],
    ["subjectExtra", { ...input(), subject: { kind: "auth_user", id: ACTOR, parent: true } }],
    ["symbol", { ...input(), [Symbol("grant")]: true }],
  ] as const) it(`[LF11.${label}] exact own-data selector only`, async () => {
    assert.deepEqual(await run(value), { status: "denied", code: "invalid_selector" });assert.equal(identityCalls, 0);assert.deepEqual(f.calls, []);
  });
  for (const key of ["subject", "source", "source.id", "subject.id"]) it(`[LF12.${key}] selector getters are never invoked`, async () => {
    let count = 0;const value = input();const pair = key.split(".");const target = pair.length === 1 ? value : pair[0] === "source" ? value.source : value.subject;
    Object.defineProperty(target, pair.at(-1)!, { get() { count++;throw new Error("private getter"); } });
    assert.deepEqual(await run(value), { status: "denied", code: "invalid_selector" });assert.equal(count, 0);assert.equal(identityCalls, 0);
  });
  it("[LF13] missing identity is unauthenticated, resolver errors are bounded", async () => {
    identity = async () => null;assert.deepEqual(await run(), { status: "unauthenticated", code: "no_request_identity" });
    identity = async () => { throw new Error("secret token/cookie/env"); };assert.deepEqual(await run(), { status: "unavailable", code: "request_identity_unavailable" });assert.deepEqual(f.calls, []);
  });
  for (const [label, value] of [["array", Object.assign([], { userId: ACTOR, supabase: fixture().client })], ["empty", {}], ["flagOnly", { verified: true, userId: ACTOR }], ["badActor", { userId: 1, supabase: {} }]] as const) it(`[LF14.${label}] malformed actual boundary result fails closed`, async () => {
    identity = async () => value;assert.deepEqual(await run(), { status: "unavailable", code: "request_identity_unavailable" });assert.deepEqual(f.calls, []);
  });
  for (const key of ["userId", "supabase"]) it(`[LF15.${key}] identity accessors cannot run`, async () => {
    let count = 0;const request = { userId: ACTOR, supabase: f.client };Object.defineProperty(request, key, { get() { count++;throw new Error("private identity"); } });
    identity = async () => request;assert.deepEqual(await run(), { status: "unavailable", code: "request_identity_unavailable" });assert.equal(count, 0);
  });
  for (const [label, active, expected] of [
    ["array", Object.assign([], reply(true)), { status: "unavailable", code: "account_check_unavailable" }],
    ["false", reply(false), { status: "denied", code: "account_inactive" }], ["null", reply(null), { status: "unavailable", code: "account_check_unavailable" }],
    ["error", { data: true, error: { message: "private" } }, { status: "unavailable", code: "account_check_unavailable" }],
    ["malformed", reply("true"), { status: "unavailable", code: "account_check_unavailable" }], ["missingError", { data: true }, { status: "unavailable", code: "account_check_unavailable" }],
    ["throw", new Error("private"), { status: "unavailable", code: "account_check_unavailable" }],
  ] as const) it(`[LF16.${label}] initial literal account predicate prevents all source dispatch on failure`, async () => {
    f.state.active = active;assert.deepEqual(await run(), expected);assert.deepEqual(f.calls, [["rpc", "lc09_account_active"]]);
  });
  for (const kind of ["mission", "quiz"] as const) {
    const fields = columns[kind].split(",");
    for (const key of fields) for (const accessor of [false, true]) it(`[LF17.${kind}.${key}.${accessor ? "getter" : "missing"}] malformed selected data cannot become empty`, async () => {
      let count = 0;const row: Record<string, unknown> = kind === "mission" ? mission() : quiz();
      if (accessor) Object.defineProperty(row, key, { get() { count++;throw new Error("private row getter"); } });else Reflect.deleteProperty(row, key);
      f.state[kind] = reply(row);assert.deepEqual(await run(input(kind)), sourceUnavailable);assert.equal(count, 0);assert.deepEqual(f.calls, calls(kind));
    });
    for (const [key, value] of [["id", WRONG], ["user_id", OTHER]] as const) it(`[LF18.${kind}.${key}] every PK/actor echo revalidated after filtered lookup`, async () => {
      f.state[kind] = reply(kind === "mission" ? mission({ [key]: value }) : quiz({ [key]: value }));assert.deepEqual(await run(input(kind)), sourceUnavailable);assert.deepEqual(f.calls, calls(kind));
    });
    for (const [label, value] of [
      ["arrayResponse", Object.assign([], reply(null))],
      ["undefinedResponse", undefined], ["missingError", { data: null }], ["missingData", { error: null }],
      ["falseError", { data: null, error: false }], ["sdkError", { data: null, error: { message: "private token", url: "https://private.invalid" } }],
      ["multiple", reply([mission(), quiz()])], ["emptyArray", reply([])], ["badRow", reply(false)], ["rejection", new Error("private SDK error")],
    ] as const) it(`[LF19.${kind}.${label}] cardinality/error/malformed/rejection never becomes successful empty`, async () => {
      f.state[kind] = value;assert.deepEqual(await run(input(kind)), sourceUnavailable);assert.deepEqual(f.calls, calls(kind));
    });
    it(`[LF20.${kind}] synchronous query dispatch failure still precedes final active check`, async () => {
      f.state.fromError = new Error("private builder");assert.deepEqual(await run(input(kind)), sourceUnavailable);
      assert.deepEqual(f.calls, [["rpc", "lc09_account_active"], ["from", table[kind]], ["rpc", "lc09_account_active"]]);
    });
  }
  for (const [label, value] of [["NaN", NaN], ["infinity", Infinity], ["boolean", true], ["object", {}]] as const) it(`[LF21.${label}] non-scalar/non-finite score fails without coercion`, async () => {
    f.state.mission = reply(mission({ score: value }));assert.deepEqual(await run(), sourceUnavailable);assert.deepEqual(f.calls, calls());
  });
  for (const [label, value] of [["decimalString", "01.1"], ["emptyString", ""], ["nonNumeric", "NaN"]] as const) it(`[LF22.${label}] actual mapper rejects incompatible numeric observation, never defaults score`, async () => {
    f.state.mission = reply(mission({ score: value }));assert.deepEqual(await run(), projectionUnavailable);assert.deepEqual(f.calls, calls());
  });
  it("[LF23] non-enum mission status and nullable quiz item/boolean cannot invent source facts", async () => {
    f.state.mission = reply(mission({ status: "approved" }));assert.deepEqual(await run(), sourceUnavailable);
    f.state.quiz = reply(quiz({ lesson_id: null }));assert.deepEqual(await run(input("quiz")), sourceUnavailable);
    f.state.quiz = reply(quiz({ is_correct: "true" }));assert.deepEqual(await run(input("quiz")), sourceUnavailable);
  });
  for (const kind of ["mission", "quiz"] as const) for (const zero of [false, true]) it(`[LF24.${kind}.${zero ? "zero" : "row"}] clock failure is bounded only after final observed policy`, async () => {
    if (zero) f.state[kind] = reply(null);clockFailure = true;assert.deepEqual(await run(input(kind)), projectionUnavailable);assert.deepEqual(f.calls, calls(kind));
  });
  for (const kind of ["mission", "quiz"] as const) it(`[LF25.${kind}] incompatible source timestamp stays unavailable, never normalized or empty`, async () => {
    f.state[kind] = reply(kind === "mission" ? mission({ created_at: "2024-01-02T03:04:05+03:00" }) : quiz({ attempted_at: "2024-01-02T03:04:05+03:00" }));
    assert.deepEqual(await run(input(kind)), projectionUnavailable);assert.deepEqual(f.calls, calls(kind));
  });
  for (const kind of ["mission", "quiz"] as const) for (const outcome of ["row", "zero", "rejection", "mapper", "clock"] as const) for (const revoked of [true, false]) {
    it(`[LF26.${kind}.${outcome}.${revoked ? "denied" : "unavailable"}] deferred source/preparation cannot escape final account failure`, async () => {
      const entered = deferred<void>(), done = deferred<unknown>();f.state[kind] = async () => { entered.resolve();return done.promise; };
      clockFailure = outcome === "clock";const pending = run(input(kind));await entered.promise;
      f.state.active = revoked ? reply(false) : outcome === "row" ? reply(null) : outcome === "zero" ? { data: true, error: {} } : outcome === "rejection" ? new Error("private") : outcome === "mapper" ? reply("true") : { data: true };
      if (outcome === "rejection") done.reject(new Error("private query rejection"));
      else if (outcome === "zero") done.resolve(reply(null));
      else done.resolve(reply(kind === "mission" ? mission(outcome === "mapper" ? { created_at: "malformed" } : {}) : quiz(outcome === "mapper" ? { attempted_at: "malformed" } : {})));
      const result = await pending;assert.deepEqual(result, revoked ? { status: "denied", code: "account_inactive" } : { status: "unavailable", code: "account_check_unavailable" });
      assert.equal(identityCalls, 1);assert.equal(Object.hasOwn(result, "projection"), false);assert.equal(Object.hasOwn(result, "selection"), false);assert.equal(f.calls.filter(c => c[0] === "rpc").length, 2);
    });
  }
  for (const kind of ["mission", "quiz"] as const) for (const zero of [false, true]) it(`[LF27.${kind}.${zero ? "zero" : "row"}] final check follows reentrant clock/real-mapper work`, async () => {
    if (zero) f.state[kind] = reply(null);onClock = () => { f.state.active = reply(false);f.calls.push(["clock"]); };
    assert.deepEqual(await run(input(kind)), { status: "denied", code: "account_inactive" });assert.deepEqual(f.calls.slice(-2), [["clock"], ["rpc", "lc09_account_active"]]);
  });
  it("[LF28] input captured before asynchronous identity cannot retarget selector", async () => {
    const value = input();const entered = deferred<void>(), done = deferred<unknown>();identity = async () => { entered.resolve();return done.promise; };
    const pending = run(value);await entered.promise;value.subject.id = OTHER;value.source.kind = "quiz";value.source.id = QUIZ;
    done.resolve({ userId: ACTOR, supabase: f.client });const result = await pending;assert.equal(fact(result).source.locator, MISSION);if (result.status !== "succeeded") assert.fail();assert.deepEqual(result.selection, input());assert.deepEqual(f.calls, calls());
  });
  it("[LF29] caller/raw row mutation during clock cannot change owned snapshot/locator", async () => {
    const value = input();const raw = mission({ score: "42.000" });f.state.mission = reply(raw);
    onClock = () => { value.source.id = WRONG;value.source.kind = "quiz";Object.assign(raw, { id: WRONG, user_id: OTHER, status: "draft", score: "999", lesson_id: "changed" }); };
    const result = await run(value);const record = fact(result);assert.equal(record.source.locator, MISSION);assert.equal(record.source.source_kind, "legacy_mission");assert.deepEqual(record.score, { state: "known", value: "42.000" });
    assert.deepEqual(record.learning.item_id, { state: "known", value: "legacy-item" });if (result.status !== "succeeded") assert.fail();assert.deepEqual(result.selection, input());
  });
  for (const kind of ["mission", "quiz"] as const) it(`[LF30.${kind}] private/unselected fields/getters never reach real mapper DTO`, async () => {
    const raw = kind === "mission" ? mission() : quiz();
    for (const name of ["submission_text", "submission_url", "submission_metadata", "feedback", "question_id", "selected_index", "bloom_level", "model_answer"]) Object.defineProperty(raw, name, { get() { throw new Error("unselected private field"); } });
    f.state[kind] = { data: raw, error: null, url: "https://private.invalid", metadata: { token: "secret" } };
    const result = await run(input(kind));assertUnknown(fact(result));assert.equal(JSON.stringify(result).includes("private.invalid"), false);assert.equal(JSON.stringify(result).includes("secret"), false);
    assert.deepEqual(f.calls, calls(kind));
  });
  it("[LF31] later calls capture fresh actor/client, no reusable success after identity loss", async () => {
    const first = f;assert.equal(fact(await run()).source.locator, MISSION);
    f = fixture();identity = async () => ({ userId: OTHER, supabase: f.client });f.state.quiz = reply(quiz({ user_id: OTHER }));
    assert.equal(fact(await run(input("quiz", OTHER))).source.locator, QUIZ);assert.deepEqual(first.calls, calls());assert.deepEqual(f.calls, calls("quiz", OTHER));
    f.calls.length = 0;identity = async () => null;assert.deepEqual(await run(input("quiz", OTHER)), { status: "unauthenticated", code: "no_request_identity" });assert.deepEqual(f.calls, []);assert.equal(identityCalls, 3);
  });
  it("[LF32] identical stored row UUIDs in separate tables retain actual typed source identity", async () => {
    const m = fact(await run());f.state.quiz = reply(quiz({ id: MISSION }));
    const q = fact(await run(input("quiz", ACTOR, MISSION)));
    assert.equal(m.source.locator, MISSION);assert.equal(q.source.locator, MISSION);
    assert.equal(m.source.source_kind, "legacy_mission");assert.equal(q.source.source_kind, "legacy_quiz_attempt");
    assert.deepEqual(f.calls, [...calls(), ...calls("quiz", ACTOR, MISSION)]);assert.equal(identityCalls, 2);
  });
  for (const kind of ["mission", "quiz"] as const) it(`[LF33.${kind}] final array-shaped active response cannot release prepared record`, async () => {
    onClock = () => { f.state.active = Object.assign([], reply(true)); };
    assert.deepEqual(await run(input(kind)), { status: "unavailable", code: "account_check_unavailable" });
    assert.deepEqual(f.calls, calls(kind));assert.equal(identityCalls, 1);
  });
});

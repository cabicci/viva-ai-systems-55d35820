import { describe, it, expect, vi } from "vitest";
import { createReadContextLedger, type ReadContextLedger, type ReadRequest, type ReadMethod,
  type LocalContext, type JsonObject, type CursorChain } from "./read-context";
import { createReadCoordinator, type ReadCompletion, type Verification } from "./read-coordinator";

const local = (): LocalContext => ({ backend: "transport-A", actor_user_id: "22222222-2222-4222-8222-222222222222",
  subject: { kind: "auth_user", id: "11111111-1111-4111-8111-111111111111" }, context: { kind: "personal", organization_id: null } });
const HASH = "a".repeat(64);
let counter = 0;
function request(method: ReadMethod = "read_journey_snapshot", payload?: JsonObject): ReadRequest {
  return { contract_version: "masarat-foundation-read-v1-candidate1", read_revision: 1, method,
    request_id: `33333333-3333-4333-8333-${String(++counter).padStart(12, "0")}`,
    subject: { ...local().subject }, context: { ...local().context }, ui_locale: "ar-EG",
    filters: { areas: [], course_ids: [], enrollment_selection: { mode: "all_authorized_history" }, include_legacy: true },
    evidence: { original_response: "omit", public_rubric: "omit" },
    payload: payload ?? { requested_projection_version: null, page_size_hint: null } };
}
const binding = () => ({ backend_namespace: "verified-A", actor_user_id: local().actor_user_id, subject: { ...local().subject },
  context: { ...local().context }, permission_epoch: "epoch-A", scope_sha256: "b".repeat(64) });
const snap = () => ({ snapshot_id: "44444444-4444-4444-8444-444444444444", projection_version: "projection-A",
  projection_generation: "generation-A", filter_sha256: HASH, source_watermarks_sha256: "c".repeat(64),
  stable_sort_version: "sort-A", captured_at: "2026-10-24T13:00:00Z", read_budget_version: "supplied-test-budget" });
const row = (id: string) => ({ record_type: "bookmark", record: { bookmark_id: id } });
/** External schema/auth/field/cursor verifiers are explicitly mocked. These module
 * tests exercise their required inputs and local relations, not real grants/schema validity. */
const verification = (): Verification => ({ responseVerified: true, schemaValid: true, correlationValid: true,
  targetValid: true, evidencePermitted: true, authorizationCurrent: true, serverContextVerified: true });
function response(q: ReadRequest, outcome = "ok"): JsonObject {
  const denied = outcome === "denied" || outcome === "restart_required", unavailable = outcome === "unavailable";
  return { contract_version: q.contract_version, read_revision: q.read_revision, method: q.method, request_id: q.request_id,
    outcome, server_time: "2026-10-24T13:01:00Z", server_context: denied ? null : { ...binding(), permission_checked_at: "2026-10-24T13:01:00Z", authorization_decision_ref: "mocked-external-decision" },
    snapshot: denied || unavailable ? null : snap(), coverage: denied ? null : {
      completeness: unavailable ? "unavailable" : outcome === "partial" ? "partial" : "complete",
      freshness: unavailable ? "unknown" : "current", sources: [{ load_state: unavailable ? "failed" : "succeeded" }] },
    result: denied || unavailable ? null : { records: [row("known-A")], next_cursor: "cursor-A", empty_confirmed: false },
    error: outcome === "ok" ? null : { code: outcome === "denied" ? "SCOPE_REVOKED" : outcome === "restart_required" ? "CURSOR_STALE" : outcome === "partial" ? "SOURCE_PARTIAL" : "SOURCE_UNAVAILABLE", retryable: true, resolution: "mocked-schema-checked-resolution" } };
}
const work = () => ({ pending_original: "العربية e\u0301 👩🏽‍💻 code\n原文", timer_reference: { opaque: "original-timer" },
  attempt_reference: { opaque: "original-attempt", response_language: "recorded-language" }, save_acknowledgements: ["original-ack"] });
function setup() {
  const ledger = createReadContextLedger(local()), original = work(), coordinator = createReadCoordinator({ ledger, local_work: original });
  function begin(slot = "journey", q = request(), chain?: CursorChain) {
    return { q, token: ledger.beginRead(slot, q, { filter_sha256: HASH, ...(chain ? { cursor_chain: chain } : {}) }) };
  }
  function seed(slot = "journey") {
    const { q, token } = begin(slot); expect(coordinator.completeRead(token, { response: response(q), verification: verification() }).status).toBe("applied");
  }
  return { ledger, coordinator, original, begin, seed };
}
const changes: Record<string, (ledger: ReadContextLedger, q: ReadRequest) => void> = {
  backend: l => l.replaceContext({ ...local(), backend: "transport-B" }),
  actor: l => l.replaceContext({ ...local(), actor_user_id: "another-actor" }),
  typed_subject: l => l.replaceContext({ ...local(), subject: { ...local().subject, kind: "kids_profile" } }),
  fresh_same_UUID_session: l => l.replaceContext(local()),
  observed_permission_revocation: l => l.observeRevocation(),
  replaced_request_generation: (l, q) => { l.beginRead("journey", q, { filter_sha256: HASH }); },
};
describe("read coordinator: internal synchronous commits only", () => {
  it.each(["ok", "partial", "unavailable", "denied", "restart_required", "local_error"].flatMap(outcome => Object.keys(changes).map(axis => ({ outcome, axis }))))(
    "NEXT-01 drops late $outcome after $axis before data/error/clear/finally effects", ({ outcome, axis }) => {
      const s = setup(); s.seed(); const pending = s.begin();
      changes[axis](s.ledger, pending.q);
      const before = s.coordinator.snapshot("journey");
      const result = outcome === "local_error" ? s.coordinator.completeLocalFailure(pending.token, { code: "transport" }) :
        s.coordinator.completeRead(pending.token, { response: response(pending.q, outcome), verification: verification() });
      expect(result.status).toBe("dropped"); expect(s.coordinator.snapshot("journey")).toEqual(before);
      expect(s.coordinator.snapshot("journey").local_work).toBe(before.local_work);
    });
  it("stale input is not traversed, and a late result cannot clear an already populated B view", () => {
    const s = setup(), a = s.begin(); s.ledger.replaceContext(local()); s.seed();
    const b = s.coordinator.snapshot("journey"); let calls = 0;
    const input = { get response(): JsonObject { calls++; throw new Error("must not run"); }, verification: verification() };
    expect(s.coordinator.completeRead(a.token, input).status).toBe("dropped");
    expect(calls).toBe(0); expect(s.coordinator.snapshot("journey")).toBe(b);
  });
  it("NEXT-03 different slots commit independently and only the replaced slot's old completion drops", () => {
    const s = setup(), a = s.begin("draft"), b = s.begin("material"), replacement = s.begin("draft");
    expect(s.coordinator.completeRead(b.token, { response: response(b.q), verification: verification() }).status).toBe("applied");
    expect(s.coordinator.completeRead(a.token, { response: response(a.q), verification: verification() }).status).toBe("dropped");
    expect(s.coordinator.completeRead(replacement.token, { response: response(replacement.q), verification: verification() }).status).toBe("applied");
    expect(s.coordinator.snapshot("material").history).toHaveLength(1);
  });
  it("NEXT-04 bootstrap, revocation, late reply and explicit fresh authorization form one real sequence", () => {
    const s = setup(), initial = s.begin(), parallel = s.begin("other");
    expect(s.ledger.snapshot().server_binding).toBeNull();
    expect(s.coordinator.completeRead(initial.token, { response: response(initial.q), verification: verification() }).status).toBe("applied");
    expect(s.ledger.isCurrent(parallel.token)).toBe(true);
    const denial = s.begin(); expect(s.coordinator.completeRead(denial.token, { response: response(denial.q, "denied"), verification: verification() }).status).toBe("applied");
    expect(s.coordinator.snapshot("journey").status).toBe("denied");
    expect(s.coordinator.completeRead(parallel.token, { response: response(parallel.q), verification: verification() }).status).toBe("dropped");
    s.ledger.beginReauthorization(); expect(s.ledger.snapshot().server_binding).toBeNull();
    const fresh = s.begin(), r = response(fresh.q);
    const next = { ...r, server_context: { ...(r.server_context as JsonObject), permission_epoch: "observed-new" } };
    expect(s.coordinator.completeRead(fresh.token, { response: next, verification: verification() }).status).toBe("applied");
    expect(s.ledger.snapshot().server_binding!.permission_epoch).toBe("observed-new");
  });
  it.each(["partial", "unavailable", "stale", "local_error"])("NEXT-06 preserves nonempty last-known history for %s", outcome => {
    const s = setup(); s.seed(); const original = s.coordinator.snapshot("journey"), b = s.begin();
    let r = response(b.q, outcome === "stale" ? "ok" : outcome);
    if (outcome === "partial") r = { ...r, result: { records: [], next_cursor: null, empty_confirmed: false } };
    if (outcome === "stale") r = { ...r, coverage: { ...(r.coverage as JsonObject), freshness: "stale" } };
    const result = outcome === "local_error" ? s.coordinator.completeLocalFailure(b.token, { code: "network" }) : s.coordinator.completeRead(b.token, { response: r, verification: verification() });
    expect(result.status).toBe("applied");
    expect(s.coordinator.snapshot("journey").history).toEqual(original.history);
    expect(s.coordinator.snapshot("journey").status).toBe(outcome === "local_error" ? "error" : outcome);
    expect(s.coordinator.snapshot("journey").local_work).toBe(original.local_work);
  });
  it("NEXT-06 only genuine complete-confirmed-empty clears selected history", () => {
    const s = setup(); s.seed(); const b = s.begin();
    const r = { ...response(b.q), result: { records: [], next_cursor: null, empty_confirmed: true } };
    expect(s.coordinator.completeRead(b.token, { response: r, verification: verification() }).status).toBe("applied");
    expect(s.coordinator.snapshot("journey").status).toBe("confirmed_empty"); expect(s.coordinator.snapshot("journey").history).toEqual([]);
  });
  it.each(["partial", "unavailable", "failed_source", "has_cursor"])("rejects a false-empty claim: %s", kind => {
    const s = setup(); s.seed(); const b = s.begin(), before = s.coordinator.snapshot("journey");
    let r: JsonObject = { ...response(b.q, kind === "partial" || kind === "unavailable" ? kind : "ok"), result: { records: [], next_cursor: kind === "has_cursor" ? "next" : null, empty_confirmed: true } };
    if (kind === "failed_source") r = { ...r, coverage: { ...(r.coverage as JsonObject), sources: [{ load_state: "failed" }] } };
    expect(s.coordinator.completeRead(b.token, { response: r, verification: verification() }).status).toBe("gated");
    expect(s.coordinator.snapshot("journey")).toBe(before);
  });
  it("empty but unconfirmed snapshot preserves prior facts and labels them stale", () => {
    const s = setup(); s.seed(); const b = s.begin(), before = s.coordinator.snapshot("journey");
    expect(s.coordinator.completeRead(b.token, { response: { ...response(b.q), result: { records: [], next_cursor: null, empty_confirmed: false } }, verification: verification() }).status).toBe("applied");
    expect(s.coordinator.snapshot("journey").history).toBe(before.history); expect(s.coordinator.snapshot("journey").status).toBe("stale");
  });
  it.each(["responseVerified", "schemaValid", "correlationValid", "targetValid", "evidencePermitted", "authorizationCurrent", "serverContextVerified"])("false/missing external trust gates %s without binding or committing", flag => {
    for (const value of [false, undefined]) {
      const s = setup(), b = s.begin();
      const v = { ...verification(), [flag]: value };
      expect(s.coordinator.completeRead(b.token, { response: response(b.q), verification: v }).status).toBe("gated");
      expect(s.ledger.snapshot().server_binding).toBeNull(); expect(s.coordinator.snapshot("journey").status).toBe("idle");
    }
  });
  it("correlation mismatch and wrong server subject cannot bind even with mocked true verifier flags", () => {
    const s = setup(), b = s.begin(), r = response(b.q);
    expect(s.coordinator.completeRead(b.token, { response: { ...r, request_id: "other" }, verification: verification() }).status).toBe("gated");
    const foreign = { ...r, server_context: { ...(r.server_context as JsonObject), subject: { kind: "kids_profile", id: local().subject.id } } };
    expect(s.coordinator.completeRead(b.token, { response: foreign, verification: verification() }).status).toBe("gated");
    expect(s.ledger.snapshot().server_binding).toBeNull();
  });
  it("an observed new server epoch clears current projection and invalidates other slots without accepting old work", () => {
    const s = setup(); s.seed(); const a = s.begin(), other = s.begin("other");
    const r = response(a.q); expect(s.coordinator.completeRead(a.token, { response: { ...r, server_context: { ...(r.server_context as JsonObject), permission_epoch: "new-epoch" } }, verification: verification() }).reason).toBe("scope_refresh_required");
    expect(s.coordinator.snapshot("journey").history).toEqual([]); expect(s.ledger.isCurrent(other.token)).toBe(false);
    expect(s.ledger.snapshot().mode).toBe("blocked");
  });
  it.each(["sync", "async", "reentrant"])("rejects %s sinks without invoking them; no public apply/setter exists", kind => {
    const s = setup(), called = vi.fn();
    const sink = kind === "async" ? async () => { called(); } : () => { called(); if (kind === "reentrant") s.ledger.replaceContext(local()); };
    expect(() => createReadCoordinator({ ledger: s.ledger, local_work: work(), sink } as Parameters<typeof createReadCoordinator>[0])).toThrow();
    const b = s.begin();
    expect(s.coordinator.completeRead(b.token, { response: response(b.q), verification: verification(), sink } as ReadCompletion).status).toBe("gated");
    expect(called).not.toHaveBeenCalled();
    expect(Object.keys(s.coordinator).sort()).toEqual(["completeLocalFailure", "completeRead", "snapshot"]);
  });
  it("Promise completion, malformed input and reentrant caller traps cannot escape the final fence", () => {
    const s = setup(), b = s.begin();
    expect(s.coordinator.completeRead(b.token, Promise.resolve(response(b.q)) as unknown as ReadCompletion).status).toBe("gated");
    expect(s.coordinator.completeRead(b.token, { response: null, verification: verification() } as unknown as ReadCompletion).status).toBe("gated");
    let once = true;
    const hostile = new Proxy({ response: response(b.q), verification: verification() }, { ownKeys(target) {
      if (once) { once = false; s.ledger.replaceContext(local()); }
      return Reflect.ownKeys(target);
    } });
    expect(s.coordinator.completeRead(b.token, hostile).status).toBe("dropped");
    expect(s.coordinator.snapshot("journey").history).toEqual([]);
  });
  it("NEXT-08 preserves exact Unicode, work owner and frozen timer/attempt references across all read updates", () => {
    const s = setup(); s.seed(); const first = s.coordinator.snapshot("journey");
    s.original.pending_original = "caller mutation";
    const q = { ...request(), ui_locale: "en" as const }, b = s.begin("journey", q);
    expect(s.coordinator.completeRead(b.token, { response: response(q), verification: verification() }).status).toBe("applied");
    const next = s.coordinator.snapshot("journey");
    expect(next.local_work).toBe(first.local_work); expect(next.local_work.pending_original).toBe("العربية e\u0301 👩🏽‍💻 code\n原文");
    expect(next.local_work.timer_reference).toBe(first.local_work.timer_reference);
    expect(next.local_work.attempt_reference).toBe(first.local_work.attempt_reference);
    expect(next.local_work.save_acknowledgements).toBe(first.local_work.save_acknowledgements);
    expect(() => (next.local_work as Record<string, unknown>).pending_original = "overwrite").toThrow();
    s.ledger.replaceContext({ ...local(), subject: { kind: "kids_profile", id: local().subject.id } });
    expect(s.coordinator.snapshot("journey").local_work_owner).toBe(first.local_work_owner);
    expect(s.coordinator.snapshot("journey").history).toEqual([]);
  });
  it("requires public-safe producer evidence for affected material and explicit requested original access", () => {
    const s = setup(), q = request("read_attempt_material", { target: { kind: "attempt", id: "attempt" } }), b = s.begin("material", q);
    const r = { ...response(q), result: { target: q.payload.target, material: { status: "available", value: { snapshot_sha256: "persisted-original" } }, public_rubric_view: { status: "not_requested", value: null } } };
    expect(s.coordinator.completeRead(b.token, { response: r, verification: verification() }).reason).toBe("public_safe_producer_required");
    expect(s.coordinator.completeRead(b.token, { response: r, verification: { ...verification(), producerVerified: true } }).status).toBe("applied");
    const d = s.begin(); const rr = { ...response(d.q), result: { records: [{ ...row("x"), original_response: { status: "available", value: "original" } }], next_cursor: null, empty_confirmed: false } };
    expect(s.coordinator.completeRead(d.token, { response: rr, verification: verification() }).reason).toBe("evidence_not_requested");
  });
  it("NEXT-07 verified continuation appends same-chain rows; an empty terminal page is not empty history", () => {
    const s = setup(); s.seed(); const chain = { ...binding(), ...snap(), cursor: "cursor-A" } as CursorChain;
    const q = request("read_journey_page", { snapshot_id: chain.snapshot_id, cursor: chain.cursor, page_size_hint: null }), b = s.begin("journey", q, chain);
    const r = { ...response(q), result: { records: [row("known-B")], next_cursor: "cursor-B", empty_confirmed: false } };
    const v = { ...verification(), cursorVerified: true, verified_cursor_chain: chain };
    expect(s.coordinator.completeRead(b.token, { response: r, verification: v }).status).toBe("applied");
    expect(s.coordinator.snapshot("journey").history).toEqual([row("known-A"), row("known-B")]);
    const nextChain = { ...chain, cursor: "cursor-B" }, nextQ = request("read_journey_page", { snapshot_id: chain.snapshot_id, cursor: "cursor-B", page_size_hint: null }), next = s.begin("journey", nextQ, nextChain);
    expect(s.coordinator.completeRead(next.token, { response: { ...response(nextQ), result: { records: [], next_cursor: null, empty_confirmed: true } }, verification: { ...v, verified_cursor_chain: nextChain } }).status).toBe("applied");
    expect(s.coordinator.snapshot("journey").history).toHaveLength(2); expect(s.coordinator.snapshot("journey").status).toBe("ready");
  });
  it.each(["snapshot_id", "projection_version", "projection_generation", "filter_sha256", "source_watermarks_sha256", "stable_sort_version", "permission_epoch", "scope_sha256"])("NEXT-07 rejects cursor-chain mismatch %s without committing", key => {
    const s = setup(); s.seed(); const chain = { ...binding(), ...snap(), cursor: "cursor-A" } as CursorChain;
    const q = request("read_journey_page", { snapshot_id: chain.snapshot_id, cursor: chain.cursor, page_size_hint: null }), b = s.begin("journey", q, chain);
    const r = response(q), where = key === "permission_epoch" || key === "scope_sha256" ? "server_context" : "snapshot";
    const changed = { ...r, [where]: { ...(r[where] as JsonObject), [key]: "different" } };
    const before = s.coordinator.snapshot("journey");
    expect(s.coordinator.completeRead(b.token, { response: changed, verification: { ...verification(), cursorVerified: true, verified_cursor_chain: chain } }).status).toBe("gated");
    expect(s.coordinator.snapshot("journey")).toBe(before);
  });
  it("rejects a valid foreign page chain instead of merging it into an older local snapshot", () => {
    const s = setup(); s.seed(); const chain = { ...binding(), ...snap(), snapshot_id: "other-snapshot", cursor: "other-cursor" } as CursorChain;
    const q = request("read_journey_page", { snapshot_id: chain.snapshot_id, cursor: chain.cursor, page_size_hint: null }), b = s.begin("journey", q, chain);
    const r = { ...response(q), snapshot: { ...snap(), snapshot_id: chain.snapshot_id } };
    expect(s.coordinator.completeRead(b.token, { response: r, verification: { ...verification(), cursorVerified: true, verified_cursor_chain: chain } }).reason).toBe("local_snapshot_chain_required");
  });
  it("current cursor restart retires its slot; scope restart invalidates all older slots", () => {
    const s = setup(); s.seed(); const a = s.begin(), other = s.begin("other");
    expect(s.coordinator.completeRead(a.token, { response: response(a.q, "restart_required"), verification: verification() }).status).toBe("applied");
    expect(s.ledger.isCurrent(other.token)).toBe(true); expect(s.ledger.isCurrent(a.token)).toBe(false);
    const fresh = s.begin(), r = response(fresh.q, "restart_required");
    expect(s.coordinator.completeRead(fresh.token, { response: { ...r, error: { code: "CURSOR_SCOPE_CHANGED" } }, verification: verification() }).status).toBe("applied");
    expect(s.ledger.isCurrent(other.token)).toBe(false); expect(s.ledger.snapshot().mode).toBe("blocked");
  });
  it("NEXT-09 imports and exercises actual modules without network, storage, DOM or institutional dependencies", async () => {
    const forbidden = vi.fn(() => { throw new Error("External access forbidden"); });
    vi.stubGlobal("fetch", forbidden); vi.stubGlobal("localStorage", { getItem: forbidden, setItem: forbidden });
    vi.stubGlobal("window", undefined); vi.stubGlobal("document", undefined);
    try {
      vi.resetModules();
      const ctx = await import("./read-context"), module = await import("./read-coordinator");
      const ledger = ctx.createReadContextLedger(local()), coordinator = module.createReadCoordinator({ ledger, local_work: work() });
      const q = request(), token = ledger.beginRead("personal", q, { filter_sha256: HASH });
      expect(coordinator.completeLocalFailure(token, { code: "offline" }).status).toBe("applied");
      expect(coordinator.snapshot("personal").context.context.organization_id).toBeNull();
      expect(forbidden).not.toHaveBeenCalled();
    } finally { vi.unstubAllGlobals(); }
  });
});

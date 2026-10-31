import { describe, it, expect } from "vitest";
import { createReadContextLedger, immutableJson, type LocalContext, type ReadRequest,
  type ReadTicket, type ServerBinding, type ReadOptions } from "./read-context";

const subject = { kind: "auth_user" as const, id: "11111111-1111-4111-8111-111111111111" };
const context = (): LocalContext => ({ backend: "transport-A", actor_user_id: "22222222-2222-4222-8222-222222222222",
  subject: { ...subject }, context: { kind: "personal", organization_id: null } });
const request = (): ReadRequest => ({ contract_version: "masarat-foundation-read-v1-candidate1", read_revision: 1,
  method: "read_journey_snapshot", request_id: "33333333-3333-4333-8333-333333333333", subject: { ...subject },
  context: { kind: "personal", organization_id: null }, ui_locale: "ar-EG",
  filters: { areas: [], course_ids: [], enrollment_selection: { mode: "all_authorized_history" }, include_legacy: true },
  evidence: { original_response: "omit", public_rubric: "omit" }, payload: { requested_projection_version: null, page_size_hint: null } });
const options = (): ReadOptions => ({ filter_sha256: "a".repeat(64) });
const server = (): ServerBinding => ({ backend_namespace: "verified-server-A", actor_user_id: context().actor_user_id,
  subject: { ...subject }, context: { kind: "personal", organization_id: null }, permission_epoch: "observed-A", scope_sha256: "b".repeat(64) });

describe("read context ledger: real issued capabilities", () => {
  it("NEXT-02 same UUID fresh session invalidates old requests and advances all local generations", () => {
    const ledger = createReadContextLedger(context()), a = ledger.beginRead("journey", request(), options());
    const before = ledger.snapshot(); ledger.replaceContext(context()); const after = ledger.snapshot();
    expect(ledger.isCurrent(a)).toBe(false);
    expect(after.auth_generation).toBeGreaterThan(before.auth_generation);
    expect(after.permission_generation).toBeGreaterThan(before.permission_generation);
    expect(after.root_generation).toBeGreaterThan(before.root_generation);
    expect(ledger.isCurrent(ledger.beginRead("journey", request(), options()))).toBe(true);
  });
  it("NEXT-03 parallel slots survive; same-slot replacement invalidates only that slot", () => {
    const ledger = createReadContextLedger(context());
    const draft = ledger.beginRead("draft", request(), options());
    const material = ledger.beginRead("material", request(), options());
    const watermarks = ledger.beginRead("watermarks", request(), options());
    const replacement = ledger.beginRead("draft", request(), options());
    expect([draft, material, watermarks, replacement].map(x => ledger.isCurrent(x))).toEqual([false, true, true, true]);
    const generation = ledger.inspectTicket(replacement)!.request_generation;
    ledger.replaceContext(context());
    expect([material, watermarks, replacement].every(x => !ledger.isCurrent(x))).toBe(true);
    expect(ledger.inspectTicket(ledger.beginRead("draft", request(), options()))!.request_generation).toBeGreaterThan(generation);
  });
  it.each(["actor", "subject-type", "backend"])("NEXT-05 root change isolates %s even when subject text stays equal", axis => {
    const ledger = createReadContextLedger(context()), token = ledger.beginRead("one", request(), options());
    let changed = context();
    if (axis === "actor") changed = { ...changed, actor_user_id: "another-guardian" };
    if (axis === "subject-type") changed = { ...changed, subject: { kind: "kids_profile", id: subject.id } };
    if (axis === "backend") changed = { ...changed, backend: "transport-B" };
    ledger.replaceContext(changed); expect(ledger.isCurrent(token)).toBe(false);
  });
  it("rejects forged, cloned, proxy and foreign-ledger tickets", () => {
    const a = createReadContextLedger(context()), b = createReadContextLedger(context());
    const token = a.beginRead("one", request(), options());
    expect(b.isCurrent(token)).toBe(false);
    for (const fake of [{}, { ...token }, Object.create(Object.getPrototypeOf(token)), new Proxy(token, {})])
      expect(a.isCurrent(fake)).toBe(false);
    expect(a.inspectTicket({})).toBeNull();
    expect(a.retireRead({} as ReadTicket)).toBe(false);
    expect(a.isCurrent(token)).toBe(true);
  });
  it("copies and deeply freezes caller contexts, requests, options and captured server references", () => {
    const c = context(), q = request(), o = options();
    const ledger = createReadContextLedger(c), token = ledger.beginRead("one", q, o);
    (c.subject as { id: string }).id = "mutated";
    (q.filters.areas as string[]).push("injected");
    (o as { filter_sha256: string }).filter_sha256 = "changed";
    const saved = ledger.inspectTicket(token)!;
    expect(saved.captured.context.subject.id).toBe(subject.id);
    expect(saved.request.filters.areas).toEqual([]);
    expect(saved.options.filter_sha256).toBe("a".repeat(64));
    expect(() => (saved.request.subject as { id: string }).id = "forged").toThrow();
    expect(() => (saved.options as { filter_sha256: string }).filter_sha256 = "forged").toThrow();
    const binding = server(); expect(ledger.bindObservedServerContext(token, binding, true)).toBe("bound");
    (binding as { permission_epoch: string }).permission_epoch = "mutated";
    expect(ledger.snapshot().server_binding!.permission_epoch).toBe("observed-A");
    expect(ledger.isCurrent(token)).toBe(true);
  });
  it("NEXT-04 bootstrap never predicts an epoch and missing verification never binds one", () => {
    const ledger = createReadContextLedger(context()), token = ledger.beginRead("one", request(), options());
    expect(ledger.snapshot().server_binding).toBeNull();
    expect(ledger.bindObservedServerContext(token, server(), false)).toBe("gated");
    expect(ledger.snapshot().server_binding).toBeNull();
    expect(ledger.bindObservedServerContext(token, server(), undefined as unknown as boolean)).toBe("gated");
    expect(ledger.bindObservedServerContext(token, server(), true)).toBe("bound");
    expect(ledger.snapshot().mode).toBe("stable");
  });
  it("first verified epoch binding does not invalidate parallel bootstrap tickets", () => {
    const ledger = createReadContextLedger(context());
    const a = ledger.beginRead("a", request(), options()), b = ledger.beginRead("b", request(), options());
    expect(ledger.bindObservedServerContext(a, server(), true)).toBe("bound");
    expect(ledger.isCurrent(b)).toBe(true);
    expect(ledger.bindObservedServerContext(b, server(), true)).toBe("unchanged");
  });
  it("observed namespace/epoch/scope change invalidates all slots; fresh reauthorization learns a new epoch", () => {
    const ledger = createReadContextLedger(context()), a = ledger.beginRead("a", request(), options());
    ledger.bindObservedServerContext(a, server(), true);
    const b = ledger.beginRead("b", request(), options());
    expect(ledger.bindObservedServerContext(a, { ...server(), permission_epoch: "observed-B" }, true)).toBe("mismatch");
    expect([a, b].some(x => ledger.isCurrent(x))).toBe(false);
    expect(ledger.snapshot().server_binding).toBeNull();
    expect(() => ledger.beginRead("fresh", request(), options())).toThrow();
    ledger.beginReauthorization();
    expect(ledger.snapshot().server_binding).toBeNull();
    const fresh = ledger.beginRead("fresh", request(), options());
    expect(ledger.bindObservedServerContext(fresh, { ...server(), permission_epoch: "observed-B" }, true)).toBe("bound");
    expect(ledger.isCurrent(a)).toBe(false);
  });
  it("a stale denial cannot revoke the new context", () => {
    const ledger = createReadContextLedger(context()), old = ledger.beginRead("one", request(), options());
    ledger.replaceContext(context()); const before = ledger.snapshot();
    expect(ledger.observeRevocation(old)).toBe(false); expect(ledger.snapshot()).toEqual(before);
  });
  it("settled requests cannot be applied twice and fresh tickets remain independent", () => {
    const ledger = createReadContextLedger(context()), a = ledger.beginRead("a", request(), options()), b = ledger.beginRead("b", request(), options());
    expect(ledger.retireRead(a)).toBe(true); expect(ledger.retireRead(a)).toBe(false);
    expect(ledger.isCurrent(b)).toBe(true);
  });
  it("rejects getters/functions/cycles without invoking a getter; data keys cannot pollute prototypes", () => {
    let calls = 0;
    expect(() => immutableJson({ get value() { calls++; return "hidden"; } })).toThrow();
    expect(calls).toBe(0);
    expect(() => immutableJson({ fn: async () => "later" })).toThrow();
    const cycle: Record<string, unknown> = {}; cycle.self = cycle;
    expect(() => immutableJson(cycle)).toThrow();
    expect(() => immutableJson(new Array(2))).toThrow();
    const safe = immutableJson(JSON.parse('{"__proto__":{"polluted":true}}'));
    expect(Object.getPrototypeOf(safe)).toBeNull();
    expect(({} as { polluted?: boolean }).polluted).toBeUndefined();
  });
  it("reentrant caller traps cannot mint a request against an old captured root", () => {
    const ledger = createReadContextLedger(context()); let first = true;
    const hostile = new Proxy(request(), { ownKeys(target) {
      if (first) { first = false; ledger.replaceContext(context()); }
      return Reflect.ownKeys(target);
    } });
    expect(() => ledger.beginRead("one", hostile, options())).toThrow("Reentrant read capture");
    expect(ledger.currentRequest("one")).toBeNull();
  });
  it("view scope is independent of object member order and UI preference; no institutional/advice prerequisite", () => {
    const ledger = createReadContextLedger(context()), a = request();
    const b = { ...request(), ui_locale: "en" as const, payload: { page_size_hint: null, requested_projection_version: null } };
    const x = ledger.beginRead("one", a, options()), y = ledger.beginRead("two", b, options());
    expect(ledger.inspectTicket(x)!.view_scope).toBe(ledger.inspectTicket(y)!.view_scope);
    expect(ledger.snapshot().context.context).toEqual({ kind: "personal", organization_id: null });
  });
});

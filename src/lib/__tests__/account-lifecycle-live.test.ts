// @vitest-environment node
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it } from "vitest";
import { finalizeLiveAccount, purgeLiveFinancialAccount, type LiveClaim, type LiveLifecycleDependencies } from "../../../supabase/functions/_shared/account-lifecycle-live";

const user = "a1111111-1111-4111-8111-111111111111", lease = "b2222222-2222-4222-8222-222222222222";
const generation = "c3333333-3333-4333-8333-333333333333", rowId = "d4444444-4444-4444-8444-444444444444";
const now = Date.parse("2026-11-05T00:00:00Z");
const metadata = { environment: "live", user_id: user, app: "masaarat" };
const clone = <T>(v: T): T => structuredClone(v);
function session(extra: any = {}) {
  return { object: "checkout.session", id: "cs_live_owned", livemode: true, customer: "cus_owned", mode: "subscription",
    client_reference_id: user, status: "expired", payment_status: "unpaid", subscription: null, payment_intent: null,
    metadata: { ...metadata }, line_items: { has_more: false, data: [{ price: { id: "price_owned" }, quantity: 1 }] }, ...extra };
}
function harness(phase: "deletion" | "financial" = "deletion") {
  const claim: LiveClaim = { stage: phase === "deletion" ? "blocked" : "financial_due", user_id: user, lease_token: lease,
    lease_until: new Date(now + 300000).toISOString(), server_time: new Date(now).toISOString(),
    customers: [{ id: "cus_owned", gateway: "stripe_us_live", mode: "live" }], storage_objects: [],
    checkout_attempts: [], core_checkouts: [], commercial_checkouts: [], offer_reservations: [], holds: [] };
  const objects: Record<string, any> = { "/customers/cus_owned": { object: "customer", id: "cus_owned", livemode: true, metadata } };
  const lists: Record<string, any[]> = {};
  const events: any[] = [], proofs: any[] = [];
  const control = { identity: true, badLease: false, lateHold: false, nativeHold: false,
    failAuth: false, failStorage: false, failProviderOnce: false, settle: false, replay: null as any,
    providerHook: null as null | ((path: string, options: any) => any), renewHook: null as null | (() => void) };
  const deps: LiveLifecycleDependencies = {
    now: () => now,
    rpc: async <T>(name: string, args: any): Promise<T> => {
      events.push({ type: "rpc", name, args: clone(args) });
      let result: any;
      if (name === "lc09_claim_live_deletion" || name === "lc09_claim_live_financial_purge") result = clone(claim);
      else if (name === "lc09_renew_live_lifecycle_lease") {
        control.renewHook?.();
        result = { ...claim, phase, lease_token: control.badLease ? rowId : lease, holds: control.lateHold ? [{ reason: "refund_pending" }] : claim.holds };
      } else if (name === "lc09_record_live_checkout_proof") {
        proofs.push(clone(args));
        if (args.p_disposition !== "observed") claim.holds = claim.holds!.filter(h => h.reason !== `${args.p_kind}_checkout_pending` && !(args.p_kind === "commercial" && h.reason === "commercial_pending"));
        if (control.settle && args.p_payment_id) claim.holds = [];
        result = true;
      } else if (name === "close_scoped_checkout_intent") { claim.holds = claim.holds!.filter(h => h.reason !== "checkout_unresolved"); result = true; }
      else if (name === "attach_scoped_checkout_intent") result = false; // Existing contract persists identity under deletion, refuses grant.
      else if (name === "lc09_advance_deletion") {
        if (args.p_next_stage !== "release" && (claim.holds!.length || control.nativeHold)) throw Error("LC09_LIVE_RECONCILIATION_PENDING");
        result = { stage: args.p_next_stage };
      } else if (name === "lc09_complete_financial_purge") result = { stage: "financial_purged" };
      else throw Error(`UNEXPECTED_RPC:${name}`);
      return result as T;
    },
    stripe: async (path, options = {}) => {
      events.push({ type: "stripe", path, method: options.method ?? "GET", params: options.params?.toString(), key: options.idempotency });
      if (control.failProviderOnce) { control.failProviderOnce = false; throw Error("TIMEOUT"); }
      const override = control.providerHook?.(path, options); if (override !== undefined) return clone(override);
      const url = new URL(path, "https://synthetic.invalid"), base = url.pathname;
      if (base === "/checkout/sessions" && options.method === "POST") {
        if (!control.replay) throw Error("UNEXPECTED_CREATE");
        objects[`/checkout/sessions/${control.replay.id}`] = clone(control.replay); return clone(control.replay);
      }
      if (base.endsWith("/expire")) {
        const s = objects[base.slice(0, -7)]; if (!s) throw Error("NO_SESSION"); s.status = "expired"; return clone(s);
      }
      if (base.startsWith("/subscriptions/") && options.method === "DELETE") { objects[base].status = "canceled"; return clone(objects[base]); }
      if (base.startsWith("/subscription_schedules/") && base.endsWith("/cancel")) { objects[base.slice(0, -7)].status = "canceled"; return clone(objects[base.slice(0, -7)]); }
      if (base.startsWith("/customers/") && options.method === "DELETE") { objects[base] = { id: "cus_owned", deleted: true }; return clone(objects[base]); }
      if (objects[base]) return clone(objects[base]);
      if (["/checkout/sessions", "/subscriptions", "/subscription_schedules", "/invoices", "/payment_intents", "/charges", "/refunds"].includes(base)) {
        const rows = (lists[base] ?? []).map(v => objects[`${base}/${v.id}`] ?? v);
        return { object: "list", data: clone(rows), has_more: false };
      }
      throw Error(`UNEXPECTED_PROVIDER:${path}`);
    },
    removeStorage: async (_objects, financial, check) => { await check!(); events.push({ type: "storage", financial }); if (control.failStorage) throw Error("STORAGE_FAILED"); },
    identityExists: async () => control.identity,
    deleteIdentity: async () => { events.push({ type: "auth" }); if (control.failAuth) throw Error("AUTH_FAILED"); control.identity = false; },
  };
  return { claim, objects, lists, events, proofs, control, deps,
    addSession(s: any) { objects[`/checkout/sessions/${s.id}`] = s; (lists["/checkout/sessions"] ??= []).push(s); },
    noErasure() { expect(events.filter(e => e.type === "storage" || e.type === "auth" || (e.type === "stripe" && e.path.startsWith("/customers/") && e.method === "DELETE"))).toEqual([]); },
  };
}
function scoped(h: ReturnType<typeof harness>, scope = "kids", known = true) {
  const p = new URLSearchParams({ customer: "cus_owned", mode: "subscription", client_reference_id: user,
    "metadata[user_id]": user, "metadata[environment]": "live", "metadata[product_scope]": scope,
    "metadata[checkout_generation]": generation, "subscription_data[metadata][checkout_generation]": generation,
    "line_items[0][price]": "price_owned", expires_at: String((now + 3600000) / 1000) });
  const a = { id: generation, key: "original-key", parameters: p.toString(), scope, environment: "live", session_id: known ? "cs_live_owned" : null,
    create_started_at: new Date(now - 1000).toISOString(), session_expires_at: new Date(now + 3600000).toISOString() };
  h.claim.checkout_attempts = [a]; h.claim.holds = [{ reason: "checkout_unresolved", id: generation }];
  const s = session({ metadata: { ...metadata, product_scope: scope, checkout_generation: generation } });
  if (known) h.addSession(s); else h.control.replay = s;
  return a;
}
function core(h: ReturnType<typeof harness>, known = true) {
  const r = { id: rowId, generation, state: "checkout_pending", session_id: known ? "cs_live_owned" : null };
  h.claim.core_checkouts = [r]; h.claim.holds = [{ reason: "core_checkout_pending", id: rowId }];
  h.addSession(session({ metadata: { ...metadata, checkout_generation: generation, internal_subscription_id: rowId } })); return r;
}
function commercial(h: ReturnType<typeof harness>, paid = false) {
  const p = { id: rowId, user_id: user, kind: "question_topup", state: "pending", payment_rail: "stripe", amount_minor: 5000,
    currency: "EGP", price_id: "price_owned", product_id: "prod_owned", customer_id: null, session_id: null, payment_id: null, parameters: {} };
  h.claim.commercial_checkouts = [p]; h.claim.holds = [{ reason: "commercial_pending", id: rowId }];
  const m = { ...metadata, commercial_purchase_id: rowId, product_scope: "question_topup" };
  h.addSession(session({ mode: "payment", metadata: m, currency: "egp", amount_subtotal: 5000, amount_total: 5000,
    total_details: { amount_tax: 0, amount_shipping: 0, amount_discount: 0 }, discounts: [],
    line_items: { has_more: false, data: [{ quantity: 1, price: { object: "price", id: "price_owned", livemode: true,
      type: "one_time", recurring: null, unit_amount: 5000, currency: "egp", tax_behavior: "exclusive", metadata,
      product: { object: "product", id: "prod_owned", livemode: true, metadata } } }] },
    ...(paid ? { status: "complete", payment_status: "paid", payment_intent: "pi_owned" } : {}) }));
  if (paid) {
    const pi = { object: "payment_intent", id: "pi_owned", livemode: true, customer: "cus_owned", metadata: m, status: "succeeded", amount: 5000, amount_received: 5000, currency: "egp", latest_charge: "ch_owned" };
    const ch = { object: "charge", id: "ch_owned", livemode: true, customer: "cus_owned", status: "succeeded", paid: true, disputed: false, amount: 5000, currency: "egp", payment_intent: "pi_owned" };
    h.objects["/payment_intents/pi_owned"] = pi; h.lists["/payment_intents"] = [pi];
    h.objects["/charges/ch_owned"] = ch; h.lists["/charges"] = [ch];
  }
  return p;
}

describe("M17 Live account finalization", () => {
  it("retries a create whose provider response was lost with the very same key and body", async () => {
    const h = harness(); const attempt = scoped(h, "kids", false); let creates = 0;
    h.control.providerHook = (path, options) => {
      if (path === "/checkout/sessions" && options.method === "POST" && ++creates === 1) {
        h.objects["/checkout/sessions/cs_live_owned"] = clone(h.control.replay);
        throw Error("CREATE_RESPONSE_LOST");
      }
      return undefined;
    };
    await expect(finalizeLiveAccount(user, h.deps)).rejects.toThrow("CREATE_RESPONSE_LOST"); h.noErasure();
    await finalizeLiveAccount(user, h.deps);
    const requests = h.events.filter(e => e.type === "stripe" && e.path === "/checkout/sessions" && e.method === "POST");
    expect(requests).toHaveLength(2); expect(requests.every(e => e.key === attempt.key && e.params === attempt.parameters)).toBe(true);
  });
  it("rejects a successful session with missing corresponding payment inventory", async () => {
    const h = harness(); h.addSession(session({ mode: "payment", status: "complete", payment_status: "paid", payment_intent: "pi_missing" }));
    await expect(finalizeLiveAccount(user, h.deps)).rejects.toThrow("PAYMENT_PENDING"); h.noErasure();
  });
  it("stops before the next mutation when a provider call outlives its lease", async () => {
    const h = harness(); h.addSession(session({ status: "open" }));
    h.control.providerHook = path => { if (path.startsWith("/checkout/sessions?")) h.control.badLease = true; return undefined; };
    await expect(finalizeLiveAccount(user, h.deps)).rejects.toThrow("LEASE_LOST"); h.noErasure(); expect(h.events.some(e => e.method === "POST")).toBe(false);
  });
  it("refuses delayed invoice settlement after cancellation without recording terminal proof", async () => {
    const h = harness(); core(h); Object.assign(h.objects["/checkout/sessions/cs_live_owned"], { status: "complete", payment_status: "paid", subscription: "sub_owned" });
    const sub = { object: "subscription", id: "sub_owned", livemode: true, customer: "cus_owned", metadata: { ...metadata, checkout_generation: generation }, status: "active", latest_invoice: "in_owned" };
    h.objects["/subscriptions/sub_owned"] = sub; h.lists["/subscriptions"] = [sub];
    h.objects["/invoices/in_owned"] = { object: "invoice", id: "in_owned", livemode: true, customer: "cus_owned", subscription: "sub_owned", status: "open" };
    await expect(finalizeLiveAccount(user, h.deps)).rejects.toThrow("INVOICE_PENDING"); h.noErasure();
    expect(h.proofs.every(p => p.p_disposition === "observed")).toBe(true);
  });
  it("reconciles an active owned subscription schedule without invoicing or prorating", async () => {
    const h = harness(); const schedule = { object: "subscription_schedule", id: "sub_sched_owned", livemode: true, customer: "cus_owned", metadata, status: "active" };
    h.objects["/subscription_schedules/sub_sched_owned"] = schedule; h.lists["/subscription_schedules"] = [schedule];
    await finalizeLiveAccount(user, h.deps);
    expect(h.events.find(e => e.path === "/subscription_schedules/sub_sched_owned/cancel")).toMatchObject({ params: "invoice_now=false&prorate=false" });
  });
  it("captures commercial session before asynchronous payment remains unpaid", async () => {
    const h = harness(); commercial(h); Object.assign(h.objects["/checkout/sessions/cs_live_owned"], { status: "complete", payment_status: "unpaid", payment_intent: "pi_processing" });
    await expect(finalizeLiveAccount(user, h.deps)).rejects.toThrow("PAYMENT_PENDING"); h.noErasure(); expect(h.proofs[0].p_disposition).toBe("observed");
  });
  it("refuses commercial payment linked to a different purchase", async () => {
    const h = harness(); commercial(h, true); h.objects["/payment_intents/pi_owned"].metadata = { ...metadata, commercial_purchase_id: generation, product_scope: "question_topup" };
    await expect(finalizeLiveAccount(user, h.deps)).rejects.toThrow("PAYMENT_PENDING"); h.noErasure(); expect(h.proofs.every(p => p.p_payment_id === null)).toBe(true);
  });
  it("rechecks holds immediately before financial provider deletion", async () => {
    const h = harness("financial"); let customerReads = 0;
    h.control.providerHook = path => { if (path === "/customers/cus_owned" && ++customerReads === 3) h.control.lateHold = true; return undefined; };
    await expect(purgeLiveFinancialAccount(user, h.deps)).rejects.toThrow("LIVE_HOLD"); h.noErasure();
  });
  it("refuses unknown offer identity even after its wall clock expiry", async () => {
    const h = harness(); h.claim.offer_reservations = [{ id: rowId, session_id: null, expires_at: "2020-01-01T00:00:00Z" }];
    await expect(finalizeLiveAccount(user, h.deps)).rejects.toThrow("OFFER_UNKNOWN"); h.noErasure();
  });
  it("does not clear a known offer reservation on mere expiration of its timer", async () => {
    const h = harness(); h.claim.offer_reservations = [{ id: rowId, session_id: "cs_live_owned", customer_id: "cus_owned" }];
    h.addSession(session({ metadata: { ...metadata, offer_reservation_id: rowId } })); await finalizeLiveAccount(user, h.deps);
    expect(h.events.some(e => /release.*offer|refund/.test(e.name ?? ""))).toBe(false);
  });
  it("completes a settled owned account with a fresh lease before every provider call", async () => {
    const h = harness(); expect(await finalizeLiveAccount(user, h.deps)).toEqual({ stage: "complete" });
    for (let i = 0; i < h.events.length; i++) if (h.events[i].type === "stripe") expect(h.events[i - 1].name).toBe("lc09_renew_live_lifecycle_lease");
    expect(h.events.at(-1).args.p_next_stage).toBe("release");
  });
  it.each(["test", null, "unknown"])("holds ambiguous customer mode %s without provider/erasure", async mode => {
    const h = harness(); h.claim.customers![0].mode = mode; await expect(finalizeLiveAccount(user, h.deps)).rejects.toThrow("MODE_REVIEW"); h.noErasure(); expect(h.events.some(e => e.type === "stripe")).toBe(false);
  });
  it("refuses a stolen or expired lease before provider mutation", async () => {
    const h = harness(); h.control.badLease = true; await expect(finalizeLiveAccount(user, h.deps)).rejects.toThrow("LEASE_LOST"); h.noErasure(); expect(h.events.some(e => e.type === "stripe")).toBe(false);
  });
  it.each(["kids", "technical", "academic"])("resolves exact known %s scoped checkout", async scope => {
    const h = harness(); scoped(h, scope); await finalizeLiveAccount(user, h.deps);
    expect(h.events.find(e => e.name === "close_scoped_checkout_intent").args.p_scope).toBe(scope);
    expect(h.events.some(e => e.type === "stripe" && e.method === "POST" && e.path === "/checkout/sessions")).toBe(false);
  });
  it("replays only original frozen request/key then captures false-grant attachment", async () => {
    const h = harness(); const a = scoped(h, "academic", false); await finalizeLiveAccount(user, h.deps);
    const replay = h.events.filter(e => e.type === "stripe" && e.path === "/checkout/sessions" && e.method === "POST");
    expect(replay).toHaveLength(1); expect(replay[0]).toMatchObject({ params: a.parameters, key: a.key });
    expect(h.events.some(e => e.name === "attach_scoped_checkout_intent")).toBe(true);
  });
  it("holds old unknown attempts without regenerating checkout", async () => {
    const h = harness(); const a = scoped(h, "kids", false); a.create_started_at = new Date(now - 24 * 3600000).toISOString();
    await expect(finalizeLiveAccount(user, h.deps)).rejects.toThrow("UNKNOWN_REPLAY_HELD"); h.noErasure(); expect(h.events.some(e => e.method === "POST")).toBe(false);
  });
  it("captures response after timeout on safe retry using identical original key", async () => {
    const h = harness(); scoped(h, "kids", false); h.control.failProviderOnce = true;
    await expect(finalizeLiveAccount(user, h.deps)).rejects.toThrow("TIMEOUT"); h.noErasure();
    await finalizeLiveAccount(user, h.deps); expect(h.events.find(e => e.name === "attach_scoped_checkout_intent")).toBeTruthy();
  });
  it("rejects foreign replay metadata before immutable attachment", async () => {
    const h = harness(); scoped(h, "kids", false); h.control.replay.metadata.checkout_generation = rowId;
    await expect(finalizeLiveAccount(user, h.deps)).rejects.toThrow("SESSION_MISMATCH"); expect(h.events.some(e => e.name === "attach_scoped_checkout_intent")).toBe(false); h.noErasure();
  });
  it("locates and durably records a missing core response then proves expiry", async () => {
    const h = harness(); core(h, false); await finalizeLiveAccount(user, h.deps);
    expect(h.proofs.map(p => p.p_disposition)).toContain("expired"); expect(h.proofs[0].p_disposition).toBe("observed");
    expect(h.events.some(e => e.type === "stripe" && e.path === "/checkout/sessions" && e.method === "POST")).toBe(false);
  });
  it("captures complete but unpaid core session then holds erasure", async () => {
    const h = harness(); core(h, false); Object.assign(h.objects["/checkout/sessions/cs_live_owned"], { status: "complete", payment_status: "unpaid" });
    await expect(finalizeLiveAccount(user, h.deps)).rejects.toThrow("PAYMENT_PENDING"); expect(h.proofs[0].p_disposition).toBe("observed"); h.noErasure();
  });
  it("requires unique generation discovery rather than first-match selection", async () => {
    const h = harness(); core(h, false); h.addSession({ ...clone(h.objects["/checkout/sessions/cs_live_owned"]), id: "cs_live_duplicate" });
    await expect(finalizeLiveAccount(user, h.deps)).rejects.toThrow("UNKNOWN_SESSION_HELD"); h.noErasure(); expect(h.proofs).toHaveLength(0);
  });
  it("cancels exact linked subscription and proves invoice before core terminal", async () => {
    const h = harness(); core(h); Object.assign(h.objects["/checkout/sessions/cs_live_owned"], { status: "complete", payment_status: "paid", subscription: "sub_owned" });
    const sub = { object: "subscription", id: "sub_owned", livemode: true, customer: "cus_owned", metadata: { ...metadata, checkout_generation: generation }, status: "active", latest_invoice: "in_owned" };
    h.objects["/subscriptions/sub_owned"] = sub; h.lists["/subscriptions"] = [sub];
    h.objects["/invoices/in_owned"] = { object: "invoice", id: "in_owned", livemode: true, customer: "cus_owned", subscription: "sub_owned", status: "paid" };
    await finalizeLiveAccount(user, h.deps); expect(h.proofs.at(-1)).toMatchObject({ p_disposition: "completed_terminal", p_subscription_id: "sub_owned" });
  });
  it("commercial expired session closes without synthesizing fulfillment", async () => {
    const h = harness(); commercial(h); await finalizeLiveAccount(user, h.deps);
    expect(h.proofs.at(-1).p_disposition).toBe("expired"); expect(h.events.some(e => /fulfill|apply.*event/.test(e.name ?? ""))).toBe(false);
  });
  it("paid commercial session remains held awaiting signed settlement", async () => {
    const h = harness(); commercial(h, true); await expect(finalizeLiveAccount(user, h.deps)).rejects.toThrow("RECONCILIATION_PENDING");
    expect(h.proofs.at(-1)).toMatchObject({ p_disposition: "observed", p_payment_id: "pi_owned" }); h.noErasure();
  });
  it("permits eventual commercial completion only after authoritative hold disappears", async () => {
    const h = harness(); commercial(h, true); h.control.settle = true; await finalizeLiveAccount(user, h.deps); expect(h.control.identity).toBe(false);
  });
  it("captures a valid pending commercial identity before a native risk hold", async () => {
    const h = harness(); commercial(h); h.claim.holds!.push({ reason: "commercial_risk", id: "evt_owned" });
    await expect(finalizeLiveAccount(user, h.deps)).rejects.toThrow("LIVE_HOLD"); expect(h.proofs).toHaveLength(1); h.noErasure();
  });
  it("refuses wrong commercial price before recording or expiring session", async () => {
    const h = harness(); commercial(h); h.objects["/checkout/sessions/cs_live_owned"].line_items.data[0].price.id = "price_wrong";
    await expect(finalizeLiveAccount(user, h.deps)).rejects.toThrow("COMMERCIAL_MISMATCH"); expect(h.proofs).toHaveLength(0); h.noErasure();
  });
  it.each(["draft", "open", "uncollectible"])("does not waive %s invoice", async status => {
    const h = harness(); h.lists["/invoices"] = [{ object: "invoice", id: "in_owned", customer: "cus_owned", livemode: true, status }];
    await expect(finalizeLiveAccount(user, h.deps)).rejects.toThrow("INVOICE_PENDING"); h.noErasure();
  });
  it("does not refund, waive, or erase a pending refund", async () => {
    const h = harness(); h.lists["/charges"] = [{ object: "charge", id: "ch_owned", customer: "cus_owned", livemode: true, disputed: false, status: "succeeded" }];
    h.lists["/refunds"] = [{ object: "refund", id: "re_owned", charge: "ch_owned", livemode: true, status: "pending" }];
    await expect(finalizeLiveAccount(user, h.deps)).rejects.toThrow("REFUND_PENDING"); h.noErasure(); expect(h.events.filter(e => e.path?.startsWith("/refunds")).every(e => e.method === "GET")).toBe(true);
  });
  it("refuses incomplete pagination", async () => {
    const h = harness(); h.control.providerHook = path => path.startsWith("/subscriptions?") ? { object: "list", data: [], has_more: true } : undefined;
    await expect(finalizeLiveAccount(user, h.deps)).rejects.toThrow("LIST_INVALID"); h.noErasure();
  });
  it("finds a dangerous second page", async () => {
    const h = harness(); h.control.providerHook = path => path.startsWith("/invoices?") ? { object: "list", data: [{ object: "invoice", id: path.includes("starting_after") ? "in_second" : "in_first", customer: "cus_owned", livemode: true, status: path.includes("starting_after") ? "open" : "paid" }], has_more: !path.includes("starting_after") } : undefined;
    await expect(finalizeLiveAccount(user, h.deps)).rejects.toThrow("INVOICE_PENDING"); h.noErasure(); expect(h.events.some(e => e.path?.includes("starting_after=in_first"))).toBe(true);
  });
  it("fresh native hold prevents storage/auth deletion after provider reconciliation", async () => {
    const h = harness(); h.control.renewHook = () => { if (h.events.some(e => e.args?.p_next_stage === "provider_reconciled")) h.control.lateHold = true; };
    await expect(finalizeLiveAccount(user, h.deps)).rejects.toThrow("LIVE_HOLD"); h.noErasure();
  });
  it("does not mark complete when auth deletion fails; releases lease for retry", async () => {
    const h = harness(); h.control.failAuth = true; await expect(finalizeLiveAccount(user, h.deps)).rejects.toThrow("AUTH_FAILED");
    expect(h.events.some(e => e.args?.p_next_stage === "complete")).toBe(false); expect(h.events.at(-1).args.p_next_stage).toBe("release");
  });
  it("can resume learner-erased phase without replaying prior checkpoint", async () => {
    const h = harness(); h.claim.stage = "learner_erased"; h.control.identity = false; await finalizeLiveAccount(user, h.deps);
    expect(h.events.some(e => ["provider_reconciled", "learner_erased"].includes(e.args?.p_next_stage))).toBe(false);
  });
  it("financial purge verifies provider deletion and only then acknowledges native purge", async () => {
    const h = harness("financial"); await purgeLiveFinancialAccount(user, h.deps);
    expect(h.events.find(e => e.method === "DELETE")).toMatchObject({ path: "/customers/cus_owned" });
    expect(h.events.some(e => e.name === "lc09_complete_financial_purge" && e.args.p_release === false)).toBe(true);
  });
  it("financial retry accepts already-deleted exact customer identity", async () => {
    const h = harness("financial"); h.objects["/customers/cus_owned"] = { id: "cus_owned", deleted: true };
    await purgeLiveFinancialAccount(user, h.deps); expect(h.events.some(e => e.method === "DELETE")).toBe(false);
  });
  it("financial pending hold prevents every irreversible action", async () => {
    const h = harness("financial"); h.claim.holds = [{ reason: "payment_pending", id: "pending" }];
    await expect(purgeLiveFinancialAccount(user, h.deps)).rejects.toThrow("LIVE_HOLD"); h.noErasure();
  });
});

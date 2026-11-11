import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createScopedCheckout,
  scopedSelection,
  type ScopedDeps,
  type ScopedIntent,
} from "../live/scoped-checkout-intent";
import {
  coordinateCheckout,
  type CheckoutIntent,
} from "../../../../supabase/functions/_shared/stripe-checkout-intent";

const user = "55555555-5555-4555-8555-555555555505";
const instant = new Date("2026-11-05T00:00:00Z");
// Deliberately synthetic state model. Native SQL tests separately prove the
// database contract; this fixture exercises the actual adapter/coordinator.
function fixture(offer = false) {
  const params = new URLSearchParams({
    mode: "subscription",
    customer: "cus_m05",
    client_reference_id: user,
    "line_items[0][price]": "price_m05",
    "line_items[0][quantity]": "1",
    success_url: "https://masaarat.ai/account",
    "metadata[app]": "masaarat",
    "metadata[environment]": "live",
    "metadata[product_scope]": "kids",
    "metadata[user_id]": user,
  });
  if (offer) {
    params.set("metadata[offer_reservation_id]", "offer_m05");
    params.set("expires_at", String(Date.now() / 1000 + 1800));
  }
  type Row = ScopedIntent & { resolved?: boolean };
  type FixtureSession = {
    id: string;
    status: string;
    url: string;
    [key: string]: unknown;
  };
  const rows: Row[] = [],
    sessions = new Map<string, FixtureSession>(),
    byKey = new Map<string, FixtureSession>();
  const calls: { name: string; body: Record<string, unknown> }[] = [];
  const creates: { key: string; parameters: string }[] = [];
  const faults = {
    createUnknown: false,
    createComplete: false,
    recordFalse: false,
    recordUnknown: false,
    attachFalse: false,
    attachUnknown: false,
    expireUnknown: false,
    expireComplete: false,
    closeUnknown: false,
    retrieveUnknown: false,
    confirmFalse: false,
    canceled: false,
    unpaid: false,
    invoiceParent: false,
    invoiceConflict: false,
  };
  let after = async () => {};
  function newRow(legacy = false, keySuffix = "old") {
    const generation = `55555555-5555-4555-8555-${String(rows.length + 1).padStart(12, "0")}`;
    const stable = scopedSelection(params),
      p = new URLSearchParams(stable);
    const expiry = Math.floor(Date.now() / 1000) + (offer ? 1860 : 86400);
    if (!legacy) {
      p.set("expires_at", String(expiry));
      p.set("metadata[checkout_generation]", generation);
      p.set("subscription_data[metadata][checkout_generation]", generation);
    }
    const row: Row = {
      checkout_generation: generation,
      checkout_session_id: null,
      selection_matches: true,
      idempotency_key: legacy
        ? `kids-live-checkout-${user}-${keySuffix}`
        : `scoped-kids-live-${generation}`,
      parameters: p.toString(),
      selection_parameters: legacy ? null : stable,
      session_expires_at: legacy ? null : new Date(expiry * 1000).toISOString(),
      create_started_at: legacy ? null : new Date().toISOString(),
      legacy,
    };
    rows.push(row);
    return row;
  }
  function makeSession(row: Row, status = "open") {
    const p = new URLSearchParams(row.parameters),
      session = {
        id: `cs_m05_${sessions.size + 1}`,
        object: "checkout.session",
        livemode: true,
        status,
        url: "https://checkout.stripe.com/c/m05",
        customer: "cus_m05",
        client_reference_id: user,
        metadata: {
          app: "masaarat",
          environment: "live",
          product_scope: "kids",
          user_id: user,
          checkout_generation: row.checkout_generation,
        },
        expires_at: Number(p.get("expires_at")),
        line_items: {
          has_more: false,
          data: [{ price: p.get("line_items[0][price]"), quantity: 1 }],
        },
        subscription: status === "complete" ? "sub_m05" : null,
        payment_status: status === "complete" ? "paid" : "unpaid",
      };
    sessions.set(session.id, session);
    byKey.set(row.idempotency_key, session);
    return session;
  }
  const deps: ScopedDeps = {
    async rpc<T>(name: string, body: Record<string, unknown>): Promise<T> {
      calls.push({ name, body });
      expect(body.p_user_id).toBe(user);
      if (name === "prepare_scoped_checkout_intent") {
        let pending = rows.filter((r) => !r.resolved);
        if (!pending.length) pending = [newRow()];
        return pending.map((row) => ({
          ...row,
          selection_matches: row.selection_parameters === body.p_parameters,
        })) as T;
      }
      const row = rows.find((r) => r.checkout_generation === (body.p_generation ?? body.p_attempt));
      if (!row) throw new Error("MISSING_ROW");
      if (name === "lc09_record_kids_checkout" || name === "attach_scoped_checkout_intent") {
        if (row.checkout_session_id && row.checkout_session_id !== body.p_session)
          throw new Error("CAS");
        row.checkout_session_id = String(body.p_session);
        if (
          (name === "lc09_record_kids_checkout" && faults.recordUnknown) ||
          (name === "attach_scoped_checkout_intent" && faults.attachUnknown)
        )
          throw new Error("TRANSPORT_UNKNOWN");
        return (!(name === "lc09_record_kids_checkout" ? faults.recordFalse : faults.attachFalse) &&
          !row.resolved) as T;
      }
      expect(body.p_key).toBe(row.idempotency_key);
      expect(body.p_session).toBe(row.checkout_session_id);
      if (name === "confirm_scoped_checkout_intent")
        return (!faults.confirmFalse &&
          !row.resolved &&
          rows.filter((r) => !r.resolved).length === 1) as T;
      if (name === "close_scoped_checkout_intent") {
        row.resolved = true;
        if (faults.closeUnknown) throw new Error("CLOSE_RESPONSE_LOST");
        return true as T;
      }
      throw new Error(`UNEXPECTED_RPC_${name}`);
    },
    async stripe<T>(path: string, options = {}): Promise<T> {
      const opt = options as { method?: string; params?: URLSearchParams; idempotencyKey?: string };
      if (path === "/checkout/sessions" && opt.method === "POST") {
        const row = rows.find((r) => r.idempotency_key === opt.idempotencyKey)!;
        expect(opt.params!.toString()).toBe(row.parameters);
        creates.push({ key: opt.idempotencyKey!, parameters: opt.params!.toString() });
        const result =
          byKey.get(opt.idempotencyKey!) ??
          makeSession(row, faults.createComplete ? "complete" : "open");
        if (faults.createUnknown) throw new Error("PROVIDER_500_UNKNOWN");
        return { ...result } as T;
      }
      if (path.startsWith("/subscriptions/sub_m05?")) {
        return {
          id: "sub_m05",
          object: "subscription",
          livemode: true,
          customer: "cus_m05",
          status: faults.canceled ? "canceled" : "active",
          metadata: { user_id: user, environment: "live", product_scope: "kids" },
          pending_update: null,
          latest_invoice: {
            id: "in_m05",
            object: "invoice",
            livemode: true,
            customer: "cus_m05",
            subscription: faults.invoiceParent ? undefined : "sub_m05",
            parent:
              faults.invoiceParent || faults.invoiceConflict
                ? {
                    subscription_details: {
                      subscription: faults.invoiceConflict ? "sub_wrong" : "sub_m05",
                    },
                  }
                : undefined,
            status: faults.unpaid ? "open" : "paid",
            amount_remaining: faults.unpaid ? 100 : 0,
          },
        } as T;
      }
      const session = [...sessions.values()].find(
        (s) =>
          path.startsWith(`/checkout/sessions/${s.id}/`) ||
          path.startsWith(`/checkout/sessions/${s.id}?`),
      );
      if (!session) throw new Error("MISSING_SESSION");
      if (path.endsWith("/expire")) {
        if (faults.expireUnknown) throw new Error("EXPIRE_UNKNOWN");
        session.status = faults.expireComplete ? "complete" : "expired";
        return { ...session } as T;
      }
      if (faults.retrieveUnknown) throw new Error("RETRIEVE_UNKNOWN");
      return { ...session } as T;
    },
  };
  const run = () =>
    createScopedCheckout({
      userId: user,
      scope: "kids",
      parameters: params,
      offer,
      deps,
      afterSession: () => after(),
    });
  return {
    params,
    rows,
    sessions,
    byKey,
    creates,
    calls,
    faults,
    run,
    newRow,
    makeSession,
    setAfter: (fn: () => Promise<void>) => {
      after = fn;
    },
  };
}
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(instant);
});
afterEach(() => vi.useRealTimers());

describe("M05 sealed scoped recovery", () => {
  it.each([false, true])(
    "freezes exact expiry/parameters across unknown response, offer=%s",
    async (offer) => {
      const f = fixture(offer);
      f.faults.createUnknown = true;
      await expect(f.run()).rejects.toThrow("PROVIDER_500_UNKNOWN");
      vi.setSystemTime(new Date(instant.getTime() + 60_000));
      f.params.set("expires_at", String(Date.now() / 1000 + 1800));
      f.faults.createUnknown = false;
      await expect(f.run()).resolves.toHaveProperty("status", "open");
      expect(f.creates).toHaveLength(2);
      expect(f.creates[1]).toEqual(f.creates[0]);
      expect(f.sessions.size).toBe(1);
      expect(Date.parse(f.rows[0].session_expires_at!) - instant.getTime()).toBe(
        (offer ? 1860 : 86400) * 1000,
      );
    },
  );
  it.each([false, true])(
    "never replays a pruned/expired unknown request, offer=%s",
    async (offer) => {
      const f = fixture(offer);
      f.faults.createUnknown = true;
      await expect(f.run()).rejects.toThrow();
      f.byKey.clear();
      f.faults.createUnknown = false;
      vi.setSystemTime(new Date(instant.getTime() + (offer ? 32 * 60_000 : 25 * 3600_000)));
      await expect(f.run()).rejects.toThrow("CHECKOUT_IN_PROGRESS");
      expect(f.creates).toHaveLength(1);
      expect(f.rows).toHaveLength(1);
    },
  );
  it("same generation concurrent requests share exact provider request", async () => {
    const f = fixture();
    const [a, b] = await Promise.all([f.run(), f.run()]);
    expect(a.id).toBe(b.id);
    expect(f.rows).toHaveLength(1);
    expect(f.sessions.size).toBe(1);
  });
  it("captures complete before generic complete rejection", async () => {
    const f = fixture();
    f.faults.createComplete = true;
    await expect(f.run()).rejects.toThrow("SUBSCRIPTION_ALREADY_MANAGED");
    expect(f.rows[0].checkout_session_id).toBe("cs_m05_1");
    expect(f.rows[0].resolved).not.toBe(true);
    expect(f.creates).toHaveLength(1);
  });
  it("completed then verified canceled and settled may resubscribe", async () => {
    const f = fixture();
    f.faults.createComplete = true;
    await expect(f.run()).rejects.toThrow();
    f.faults.createComplete = false;
    f.faults.canceled = true;
    const second = await f.run();
    expect(second.id).toBe("cs_m05_2");
    expect(f.rows[0].resolved).toBe(true);
    expect(f.rows).toHaveLength(2);
  });
  it("canceled but unpaid invoice remains fenced", async () => {
    const f = fixture();
    f.faults.createComplete = true;
    await expect(f.run()).rejects.toThrow();
    f.faults.canceled = true;
    f.faults.unpaid = true;
    await expect(f.run()).rejects.toThrow("SUBSCRIPTION_ALREADY_MANAGED");
    expect(f.rows).toHaveLength(1);
  });
  it("supports the existing invoice parent subscription shape for settled cancellation", async () => {
    const f = fixture();
    f.faults.createComplete = true;
    await expect(f.run()).rejects.toThrow();
    f.faults.createComplete = false;
    f.faults.canceled = true;
    f.faults.invoiceParent = true;
    await expect(f.run()).resolves.toHaveProperty("id", "cs_m05_2");
  });
  it("conflicting invoice subscription identities cannot release a completed intent", async () => {
    const f = fixture();
    f.faults.createComplete = true;
    await expect(f.run()).rejects.toThrow();
    f.faults.canceled = true;
    f.faults.invoiceConflict = true;
    await expect(f.run()).rejects.toThrow("SUBSCRIPTION_ALREADY_MANAGED");
    expect(f.rows).toHaveLength(1);
  });
  it.each(["recordFalse", "attachFalse"] as const)(
    "%s persists session and verifies expiration before refusal",
    async (fault) => {
      const f = fixture();
      f.faults[fault] = true;
      await expect(f.run()).rejects.toThrow("CHECKOUT_INTENT_SUPERSEDED");
      expect(f.rows[0].checkout_session_id).toBe("cs_m05_1");
      expect(f.sessions.get("cs_m05_1")!.status).toBe("expired");
      expect(f.rows).toHaveLength(1);
    },
  );
  it.each(["recordUnknown", "attachUnknown"] as const)(
    "%s retains known identity and recovers without creating again",
    async (fault) => {
      const f = fixture();
      f.faults[fault] = true;
      await expect(f.run()).rejects.toThrow();
      f.faults[fault] = false;
      await expect(f.run()).resolves.toHaveProperty("id", "cs_m05_1");
      expect(f.creates).toHaveLength(1);
    },
  );
  it.each(["expireUnknown", "expireComplete"] as const)(
    "%s never releases old selection",
    async (fault) => {
      const f = fixture();
      await f.run();
      f.params.set("success_url", "https://masaarat.ai/account?locale=en");
      f.faults[fault] = true;
      await expect(f.run()).rejects.toThrow();
      expect(f.rows).toHaveLength(1);
      expect(f.creates).toHaveLength(1);
      expect(f.rows[0].resolved).not.toBe(true);
    },
  );
  it("changed selection expires positively before replacement", async () => {
    const f = fixture();
    await f.run();
    f.params.set("success_url", "https://masaarat.ai/account?locale=en");
    await expect(f.run()).resolves.toHaveProperty("id", "cs_m05_2");
    expect(f.sessions.get("cs_m05_1")!.status).toBe("expired");
  });
  it("lost close response is recovered from persisted terminal evidence", async () => {
    const f = fixture();
    await f.run();
    f.sessions.get("cs_m05_1")!.status = "expired";
    f.faults.closeUnknown = true;
    await expect(f.run()).rejects.toThrow("CLOSE_RESPONSE_LOST");
    f.faults.closeUnknown = false;
    await expect(f.run()).resolves.toHaveProperty("id", "cs_m05_2");
  });
  it("unknown retrieve cannot produce a replacement", async () => {
    const f = fixture();
    await f.run();
    f.faults.retrieveUnknown = true;
    await expect(f.run()).rejects.toThrow("RETRIEVE_UNKNOWN");
    expect(f.creates).toHaveLength(1);
  });
  it("legacy unknown even beyond a typical page cannot be ignored", async () => {
    const f = fixture();
    for (let i = 0; i < 101; i++) {
      const r = f.newRow(true, String(i));
      r.checkout_session_id = f.makeSession(r, "expired").id;
    }
    f.newRow(true, "unknown");
    await expect(f.run()).rejects.toThrow("CHECKOUT_IN_PROGRESS");
    expect(f.creates).toHaveLength(0);
    expect(f.rows).toHaveLength(102);
  });
  it("legacy matching known session is reused without changing its original request", async () => {
    const f = fixture();
    const r = f.newRow(true);
    r.checkout_session_id = f.makeSession(r).id;
    await expect(f.run()).resolves.toHaveProperty("id", r.checkout_session_id);
    expect(f.creates).toHaveLength(0);
    expect(r.session_expires_at).toBeNull();
  });
  it("multiple open legacy sessions require reconciliation", async () => {
    const f = fixture();
    for (let i = 0; i < 2; i++) {
      const r = f.newRow(true, String(i));
      r.checkout_session_id = f.makeSession(r).id;
    }
    await expect(f.run()).rejects.toThrow("CHECKOUT_IN_PROGRESS");
    expect(f.creates).toHaveLength(0);
  });
  it("binding retirement rejects stale URL", async () => {
    const f = fixture(true);
    f.setAfter(async () => {
      f.faults.confirmFalse = true;
    });
    await expect(f.run()).rejects.toThrow("CHECKOUT_INTENT_SUPERSEDED");
    expect(f.rows[0].checkout_session_id).toBe("cs_m05_1");
  });
  it("completion during binding rejects earlier open snapshot", async () => {
    const f = fixture();
    f.setAfter(async () => {
      f.sessions.get("cs_m05_1")!.status = "complete";
    });
    await expect(f.run()).rejects.toThrow("CHECKOUT_IN_PROGRESS");
  });
  it.each(["https://checkout.stripe.com.evil.invalid/x", "javascript:alert(1)"])(
    "rejects untrusted returned URL %s",
    async (url) => {
      const f = fixture();
      f.setAfter(async () => {
        f.sessions.get("cs_m05_1")!.url = url;
      });
      await expect(f.run()).rejects.toThrow("CHECKOUT_IN_PROGRESS");
    },
  );
  it("clock moving behind creation fails closed", async () => {
    const f = fixture();
    f.newRow();
    vi.setSystemTime(new Date(instant.getTime() - 6000));
    await expect(f.run()).rejects.toThrow("CHECKOUT_IN_PROGRESS");
    expect(f.creates).toHaveLength(0);
  });
  it("core subtype still carries subscription identity to create", async () => {
    const intent: CheckoutIntent = {
      subscription_id: "core_sub",
      checkout_generation: "core_gen",
      checkout_session_id: null,
      selection_matches: true,
    };
    const create = vi.fn(async (value: CheckoutIntent) => {
      expect(value.subscription_id).toBe("core_sub");
      return { id: "cs_core", status: "open", url: "https://checkout.stripe.com/c/core" };
    });
    const unused = async () => {
      throw new Error("UNEXPECTED");
    };
    await expect(
      coordinateCheckout({
        prepare: async () => intent,
        create,
        attach: async () => true,
        close: unused,
        confirm: unused,
        retrieve: unused,
        expire: unused,
      }),
    ).resolves.toHaveProperty("id", "cs_core");
  });
  it("core refused attach cannot treat raced complete expiration as successful", async () => {
    const intent: CheckoutIntent = {
      subscription_id: "core_sub",
      checkout_generation: "core_gen",
      checkout_session_id: null,
      selection_matches: true,
    };
    const unused = async () => {
      throw new Error("UNEXPECTED");
    };
    await expect(
      coordinateCheckout({
        prepare: async () => intent,
        create: async () => ({
          id: "cs_core",
          status: "open",
          url: "https://checkout.stripe.com/c/core",
        }),
        attach: async () => false,
        close: unused,
        confirm: unused,
        retrieve: unused,
        expire: async () => ({ id: "cs_core", status: "complete", url: null }),
      }),
    ).rejects.toThrow("CHECKOUT_IN_PROGRESS");
  });
});

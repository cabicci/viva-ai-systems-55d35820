import { describe, expect, it } from "vitest";
import { decidePaidPlanEvidence } from "../../../../supabase/functions/_shared/stripe-generation-decisions";
import {
  coordinateCheckout,
  type CheckoutIntent,
  type CheckoutSession,
} from "../../../../supabase/functions/_shared/stripe-checkout-intent";

const subscription = (price = "price_plus", latest = "in_current") => ({
  id: "sub_same",
  status: "active",
  latest_invoice: latest,
  items: { data: [{ price: { id: price } }] },
});
const line = (price: string, amount: number, sub = "sub_same") => ({
  amount,
  pricing: { price_details: { price } },
  parent: { subscription_item_details: { subscription: sub } },
});
const invoice = (lines: Record<string, unknown>[] = [line("price_plus", 14000)]) => ({
  id: "in_current",
  status: "paid",
  amount_paid: 14000,
  amount_remaining: 0,
  parent: { subscription_details: { subscription: "sub_same" } },
  lines: { data: lines, has_more: false },
});
const decide = (object: Record<string, unknown>, sub = subscription()) =>
  decidePaidPlanEvidence({ eventType: "invoice.paid", object, subscription: sub });

describe("Paid plan evidence used by the webhook", () => {
  it("accepts current API proration debit and ignores unused-time credit", () => {
    expect(decide(invoice([line("price_pro", -9000), line("price_plus", 23000)]))).toMatchObject({
      valid: true,
      priceId: "price_plus",
      transition: "payment_succeeded",
    });
  });
  it("never grants an unpaid Plus from a delayed paid Pro invoice", () => {
    expect(decide(invoice([line("price_pro", 16900)]))).toMatchObject({
      valid: false,
      error: "PAID_PLAN_EVIDENCE_MISMATCH",
    });
  });
  it("rejects an older invoice even if the price happens to match", () => {
    expect(decide({ ...invoice(), id: "in_old" })).toMatchObject({
      valid: false,
      error: "PAID_INVOICE_MISMATCH",
    });
  });
  it("rejects unpaid and pending updates", () => {
    expect(decide({ ...invoice(), status: "open" }).valid).toBe(false);
    expect(
      decidePaidPlanEvidence({
        eventType: "invoice.paid",
        object: invoice(),
        subscription: { ...subscription(), pending_update: { expires_at: 123 } },
      }).valid,
    ).toBe(false);
  });
  it("rejects unrelated, manual, ambiguous and incomplete invoice lines", () => {
    expect(decide(invoice([line("price_plus", 14000, "sub_other")])).valid).toBe(false);
    expect(
      decide(invoice([{ amount: 14000, pricing: { price_details: { price: "price_plus" } } }]))
        .valid,
    ).toBe(false);
    expect(decide(invoice([line("price_pro", 16900), line("price_plus", 30900)])).valid).toBe(
      false,
    );
    expect(
      decide({ ...invoice(), lines: { data: [line("price_plus", 14000)], has_more: true } }).valid,
    ).toBe(false);
  });
  it("accepts a paid invoice settled by existing credit", () => {
    expect(decide({ ...invoice(), amount_paid: 0 }).valid).toBe(true);
  });
  it("handles legacy line shapes as well as current ones", () => {
    expect(
      decide(invoice([{ amount: 14000, price: { id: "price_plus" }, subscription: "sub_same" }]))
        .valid,
    ).toBe(true);
  });
  it("binds Checkout to its actual line price and latest invoice", () => {
    const object = {
      id: "cs_paid",
      invoice: "in_current",
      subscription: "sub_same",
      payment_status: "paid",
    };
    const evidence = (price: string, obj = object) =>
      decidePaidPlanEvidence({
        eventType: "checkout.session.completed",
        object: obj,
        subscription: subscription(),
        checkoutLineItems: [{ amount_total: 30900, price: { id: price } }],
      });
    expect(evidence("price_plus").valid).toBe(true);
    expect(evidence("price_pro").valid).toBe(false);
    expect(evidence("price_plus", { ...object, invoice: "in_old" }).valid).toBe(false);
  });
});

function harness() {
  let sequence = 0;
  let selected = "pro";
  let current: (CheckoutIntent & { selection: string }) | null = null;
  const sessions = new Map<string, CheckoutSession>();
  const calls: string[] = [];
  let pauseCreate: (() => Promise<void>) | undefined;
  let failExpiration = false;
  const deps = {
    prepare: async () => {
      if (!current)
        current = {
          subscription_id: "internal",
          checkout_generation: String(++sequence),
          checkout_session_id: null,
          selection_matches: true,
          selection: selected,
        };
      return { ...current, selection_matches: current.selection === selected };
    },
    retrieve: async (id: string) => ({ ...sessions.get(id)! }),
    expire: async (id: string) => {
      calls.push("expire:" + id);
      if (failExpiration) throw new Error("session completed during expiration");
      const value = { ...sessions.get(id)!, status: "expired", url: null };
      sessions.set(id, value);
      return value;
    },
    create: async (intent: CheckoutIntent) => {
      if (pauseCreate) await pauseCreate();
      const id = "cs_" + intent.checkout_generation;
      if (!sessions.has(id)) {
        calls.push("create:" + id);
        sessions.set(id, { id, status: "open", url: "https://checkout.test/" + id });
      }
      return { ...sessions.get(id)! };
    },
    attach: async (intent: CheckoutIntent, id: string) => {
      if (current?.checkout_generation !== intent.checkout_generation) return false;
      current.checkout_session_id = id;
      return true;
    },
    close: async (intent: CheckoutIntent) => {
      if (
        current?.checkout_generation !== intent.checkout_generation ||
        current.checkout_session_id !== intent.checkout_session_id
      )
        return false;
      current = null;
      return true;
    },
    confirm: async (intent: CheckoutIntent) =>
      current?.checkout_generation === intent.checkout_generation,
  };
  return {
    deps,
    calls,
    sessions,
    choose: (value: string) => {
      selected = value;
    },
    pause: (value: () => Promise<void>) => {
      pauseCreate = value;
    },
    failExpiration: () => {
      failExpiration = true;
    },
  };
}

describe("Actual checkout coordinator", () => {
  it("expires before replacing Pro → Plus → Pro; repeats reuse one session", async () => {
    const h = harness();
    const first = await coordinateCheckout(h.deps);
    expect(await coordinateCheckout(h.deps)).toEqual(first);
    h.choose("plus");
    const second = await coordinateCheckout(h.deps);
    h.choose("pro");
    const third = await coordinateCheckout(h.deps);
    expect(new Set([first.id, second.id, third.id]).size).toBe(3);
    expect(h.calls).toEqual([
      "create:cs_1",
      "expire:cs_1",
      "create:cs_2",
      "expire:cs_2",
      "create:cs_3",
    ]);
    expect([...h.sessions.values()].filter((s) => s.status === "open")).toHaveLength(1);
  });
  it("does not supersede an in-flight creation for a different selection", async () => {
    const h = harness();
    let resume!: () => void;
    let started!: () => void;
    const entered = new Promise<void>((r) => {
      started = r;
    });
    h.pause(() => {
      started();
      return new Promise<void>((r) => {
        resume = r;
      });
    });
    const first = coordinateCheckout(h.deps);
    await entered;
    h.choose("plus");
    await expect(coordinateCheckout(h.deps)).rejects.toThrow("CHECKOUT_IN_PROGRESS");
    resume();
    expect((await first).id).toBe("cs_1");
    expect(h.calls).toEqual(["create:cs_1"]);
  });
  it("concurrent repeat requests share the generation idempotency key", async () => {
    const h = harness();
    const results = await Promise.all([coordinateCheckout(h.deps), coordinateCheckout(h.deps)]);
    expect(results[0].id).toBe(results[1].id);
    expect(h.calls).toEqual(["create:cs_1"]);
  });
  it("never creates a replacement if payment wins the expiration race", async () => {
    const h = harness();
    await coordinateCheckout(h.deps);
    h.choose("plus");
    h.failExpiration();
    await expect(coordinateCheckout(h.deps)).rejects.toThrow("session completed");
    expect(h.calls.filter((x) => x.startsWith("create:"))).toHaveLength(1);
  });
  it("blocks a completed session before its webhook arrives", async () => {
    const h = harness();
    const paid = await coordinateCheckout(h.deps);
    h.sessions.set(paid.id, { ...paid, status: "complete" });
    h.choose("plus");
    await expect(coordinateCheckout(h.deps)).rejects.toThrow("SUBSCRIPTION_ALREADY_MANAGED");
    expect(h.calls).toEqual(["create:cs_1"]);
  });
});

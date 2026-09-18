import { describe, expect, it } from "vitest";
import { decidePaidPlanEvidence, selectCheckoutSessionIntent } from "../stripe-generation-decisions";

const subscription = (priceId: string) => ({
  id: "sub_same", status: "active", items: { data: [{ price: { id: priceId } }] },
});
const session = (id: string, generation: string, internalId = "internal_sub") => ({
  id, url: `https://checkout.test/${id}`,
  metadata: { environment: "test", internal_subscription_id: internalId, checkout_generation: generation },
});

describe("Stripe generation decisions", () => {
  it("does not grant unpaid Plus from a delayed paid Pro invoice or Checkout", () => {
    const invoice = decidePaidPlanEvidence({
      eventType: "invoice.paid",
      object: { status: "paid", amount_paid: 16900, lines: { data: [{ amount: 16900, price: { id: "price_pro" }, subscription: "sub_same" }] } },
      subscription: subscription("price_plus"),
    });
    const checkout = decidePaidPlanEvidence({
      eventType: "checkout.session.completed",
      object: { payment_status: "paid", amount_total: 16900 },
      subscription: subscription("price_plus"),
      checkoutLineItems: [{ amount_total: 16900, price: { id: "price_pro" }, subscription: "sub_same" }],
    });
    expect(invoice.error).toBe("PAID_PLAN_EVIDENCE_MISMATCH");
    expect(checkout.error).toBe("PAID_PLAN_EVIDENCE_MISMATCH");
  });

  it("accepts genuine paid Plus proration evidence", () => {
    expect(decidePaidPlanEvidence({
      eventType: "invoice.paid",
      object: { status: "paid", amount_paid: 14000, lines: { data: [
        { amount: -9000, price: { id: "price_pro" }, subscription: "sub_same" },
        { amount: 14000, price: { id: "price_plus" }, subscription: "sub_same" },
      ] } },
      subscription: subscription("price_plus"),
    })).toMatchObject({ transition: "payment_succeeded", priceId: "price_plus", valid: true });
  });

  it("coordinates Pro → Plus → Pro and repeat/current-generation reuse", () => {
    const stale = selectCheckoutSessionIntent({
      sessions: [session("cs_pro_a", "A"), session("cs_plus_b", "B")],
      subscriptionId: "internal_sub", generation: "C",
    });
    expect(stale).toEqual({ reusable: null, expireIds: ["cs_pro_a", "cs_plus_b"] });
    const repeated = selectCheckoutSessionIntent({
      sessions: [session("cs_old", "A"), session("cs_current", "B")],
      subscriptionId: "internal_sub", generation: "B",
    });
    expect(repeated.reusable?.id).toBe("cs_current");
    expect(repeated.expireIds).toEqual(["cs_old"]);
  });

  it("leaves unrelated/new-user sessions untouched", () => {
    expect(selectCheckoutSessionIntent({
      sessions: [session("cs_other", "A", "other_sub")],
      subscriptionId: "new_sub", generation: "N",
    })).toEqual({ reusable: null, expireIds: [] });
  });
});
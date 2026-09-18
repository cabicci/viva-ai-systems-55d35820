import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(process.cwd(), "supabase/functions/billing-stripe-checkout/index.ts"),
  "utf8",
);

describe("Stripe checkout duplicate-subscription guards", () => {
  it("blocks a new Checkout when Stripe already has a managed subscription", () => {
    expect(source).toContain("hasManagedStripeSubscription(customerId)");
    expect(source).toContain('status: "all"');
    expect(source).toContain('"active"');
    expect(source).toContain('"trialing"');
    expect(source).toContain('"past_due"');
    expect(source).toContain('"unpaid"');
    expect(source).toContain('"incomplete"');
  });

  it("reuses an open matching Checkout Session", () => {
    expect(source).toContain("findReusableCheckoutSession(customerId, context)");
    expect(source).toContain('status: "open"');
    expect(source).toContain("reusableSession.url");
    expect(source).toContain("reusableSession.id");
  });

  it("uses a stable short checkout window instead of a random idempotency key", () => {
    expect(source).toContain("Math.floor(Date.now() / 300_000)");
    expect(source).not.toContain("crypto.randomUUID()");
  });
});

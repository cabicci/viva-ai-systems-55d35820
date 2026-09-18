import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const webhook = readFileSync(
  resolve(process.cwd(), "supabase/functions/billing-stripe-webhook/index.ts"),
  "utf8",
);
const portal = readFileSync(
  resolve(process.cwd(), "supabase/functions/billing-stripe-portal/index.ts"),
  "utf8",
);
const migration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260918173000_stripe_customer_portal_upgrade.sql"),
  "utf8",
);

describe("Stripe prorated subscription upgrades", () => {
  it("creates authenticated test-mode Billing Portal sessions", () => {
    expect(portal).toContain('billing_portal/sessions');
    expect(portal).toContain('STRIPE_TEST_KEY_REQUIRED');
    expect(portal).toContain('get_stripe_portal_context');
    expect(portal).toContain('authenticate(request)');
  });

  it("resolves webhook plan identity from the active Stripe price", () => {
    expect(webhook).toContain('resolve_stripe_subscription_plan');
    expect(webhook).toContain('subscription.items?.data?.[0]?.price');
    expect(migration).toContain('gateway_price_id = p_gateway_price_id');
  });

  it("keeps portal and price-resolution RPCs service-role only", () => {
    expect(migration).toContain('STRIPE_PORTAL_SERVICE_ONLY');
    expect(migration).toContain('STRIPE_PRICE_RESOLUTION_SERVICE_ONLY');
    expect(migration).toContain('GRANT EXECUTE ON FUNCTION public.get_stripe_portal_context(uuid) TO service_role');
  });
});

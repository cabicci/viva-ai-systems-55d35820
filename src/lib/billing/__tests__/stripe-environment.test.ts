import { describe, expect, it } from "vitest";
import { stripeSecretKey } from "../../../../supabase/functions/_shared/stripe-environment.ts";

describe("Stripe server credential boundary", () => {
  it("defaults to TEST even if a Live key and enable flag are present", () => {
    expect(
      stripeSecretKey({
        STRIPE_SECRET_KEY: "sk_test_example",
        STRIPE_LIVE_SECRET_KEY: "sk_live_example",
        BILLING_STRIPE_LIVE_ENABLED: "true",
      }),
    ).toBe("sk_test_example");
    expect(() => stripeSecretKey({ STRIPE_SECRET_KEY: "sk_live_example" })).toThrow(
      "STRIPE_TEST_KEY_REQUIRED",
    );
  });

  it("requires an explicit server enable and a separate Live key for Live mode", () => {
    expect(() => stripeSecretKey({ STRIPE_LIVE_SECRET_KEY: "sk_live_example" }, "live")).toThrow(
      "STRIPE_LIVE_DISABLED",
    );
    expect(() =>
      stripeSecretKey(
        {
          STRIPE_SECRET_KEY: "sk_test_example",
          BILLING_STRIPE_LIVE_ENABLED: "true",
        },
        "live",
      ),
    ).toThrow("STRIPE_LIVE_KEY_REQUIRED");
    expect(() =>
      stripeSecretKey(
        {
          STRIPE_LIVE_SECRET_KEY: "sk_test_example",
          BILLING_STRIPE_LIVE_ENABLED: "true",
        },
        "live",
      ),
    ).toThrow("STRIPE_LIVE_KEY_REQUIRED");
    expect(
      stripeSecretKey(
        {
          STRIPE_LIVE_SECRET_KEY: "rk_live_example",
          BILLING_STRIPE_LIVE_ENABLED: "true",
        },
        "live",
      ),
    ).toBe("rk_live_example");
  });
});

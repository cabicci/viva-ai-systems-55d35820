/** Server-only credential boundary. No caller can select Live through a request body. */
export type StripeEnvironment = "test" | "live";
type StripeSecrets = {
  STRIPE_SECRET_KEY?: string;
  STRIPE_LIVE_SECRET_KEY?: string;
  BILLING_STRIPE_LIVE_ENABLED?: string;
};

export function stripeSecretKey(
  secrets: StripeSecrets,
  environment: StripeEnvironment = "test",
): string {
  if (environment === "live") {
    if (secrets.BILLING_STRIPE_LIVE_ENABLED !== "true") {
      throw new Error("STRIPE_LIVE_DISABLED");
    }
    const key = secrets.STRIPE_LIVE_SECRET_KEY;
    if (!key || !/^(rk|sk)_live_/.test(key)) throw new Error("STRIPE_LIVE_KEY_REQUIRED");
    return key;
  }
  const key = secrets.STRIPE_SECRET_KEY;
  if (!key || !/^(rk|sk)_test_/.test(key)) throw new Error("STRIPE_TEST_KEY_REQUIRED");
  return key;
}

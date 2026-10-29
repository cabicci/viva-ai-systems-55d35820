import { describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";
import {
  assertKeyMatchesEnvironment,
  assertLiveCheckoutAllowed,
  assertMetadataEnvironment,
  assertObjectEnvironment,
  assertRowEnvironment,
  handleLiveWebhook,
  isLiveEnabled,
  lookupKeySuffix,
  resolveStripeKey,
} from "../../../../supabase/functions/_shared/stripe-environment";

const LIVE_SECRET = "whsec_live_fixture";
const TEST_SECRET = "whsec_test_fixture";

function deps(env: Record<string, string>, db = true) {
  const databaseLiveEnabled = vi.fn(async () => db);
  return { getEnv: (n: string) => env[n], databaseLiveEnabled };
}

function signed(body: string, secret: string) {
  const t = Math.floor(Date.now() / 1000);
  const sig = createHmac("sha256", secret).update(`${t}.${body}`).digest("hex");
  return new Request("https://x.test/live", {
    method: "POST",
    body,
    headers: { "stripe-signature": `t=${t},v1=${sig}` },
  });
}

describe("Stripe key separation", () => {
  it("rejects a live key in test and a test key in live", () => {
    expect(() => assertKeyMatchesEnvironment("sk_live_x", "test")).toThrow("STRIPE_TEST_KEY_REQUIRED");
    expect(() => assertKeyMatchesEnvironment("rk_test_x", "live")).toThrow("STRIPE_LIVE_KEY_REQUIRED");
    expect(() => assertKeyMatchesEnvironment("pk_live_x", "live")).toThrow();
    expect(assertKeyMatchesEnvironment("rk_live_x", "live")).toBe("rk_live_x");
  });

  it("uses separate lookup key suffixes", () => {
    expect(lookupKeySuffix("test")).toBe("_test_v1");
    expect(lookupKeySuffix("live")).toBe("_live_v1");
  });
});

describe("Live kill switch (default OFF)", () => {
  it("is off without the env flag and never queries the database", async () => {
    const d = deps({}, true);
    expect(await isLiveEnabled(d)).toBe(false);
    expect(d.databaseLiveEnabled).not.toHaveBeenCalled();
  });

  it("is off when the database switch is off or errors", async () => {
    expect(await isLiveEnabled(deps({ STRIPE_LIVE_ENABLED: "true" }, false))).toBe(false);
    const failing = {
      getEnv: () => "true",
      databaseLiveEnabled: async (): Promise<boolean> => {
        throw new Error("db");
      },
    };
    expect(await isLiveEnabled(failing)).toBe(false);
  });

  it("refuses to hand out the live key while off", async () => {
    await expect(resolveStripeKey("live", deps({ STRIPE_LIVE_SECRET_KEY: "rk_live_x" }))).rejects.toThrow(
      "STRIPE_LIVE_DISABLED",
    );
  });

  it("never returns the test key for live, even when on", async () => {
    const d = deps({ STRIPE_LIVE_ENABLED: "true", STRIPE_SECRET_KEY: "sk_test_x" });
    await expect(resolveStripeKey("live", d)).rejects.toThrow("MISSING_STRIPE_LIVE_SECRET_KEY");
  });

  it("keeps test checkout working with the test key", async () => {
    expect(await resolveStripeKey("test", deps({ STRIPE_SECRET_KEY: "sk_test_x" }))).toBe("sk_test_x");
  });
});

describe("object/row mixing", () => {
  it("rejects objects, metadata and rows from the other environment", () => {
    expect(() => assertObjectEnvironment({ livemode: false }, "live")).toThrow("STRIPE_ENVIRONMENT_MISMATCH");
    expect(() => assertObjectEnvironment({ livemode: true }, "test")).toThrow("STRIPE_ENVIRONMENT_MISMATCH");
    expect(() => assertObjectEnvironment({}, "test")).toThrow("STRIPE_ENVIRONMENT_MISMATCH");
    expect(() => assertMetadataEnvironment({ environment: "test" }, "live")).toThrow();
    expect(() => assertRowEnvironment({ stripe_environment: "test" }, "live")).toThrow();
    expect(() => assertRowEnvironment({ stripe_environment: "live" }, "live")).not.toThrow();
  });
});

describe("live webhook endpoint", () => {
  const body = JSON.stringify({ id: "evt_1", livemode: true });
  const on = { STRIPE_LIVE_ENABLED: "true", STRIPE_LIVE_WEBHOOK_SECRET: LIVE_SECRET };

  it("returns 503 while live is off, even with a valid signature", async () => {
    const res = await handleLiveWebhook(signed(body, LIVE_SECRET), deps({ STRIPE_LIVE_WEBHOOK_SECRET: LIVE_SECRET }));
    expect(res.status).toBe(503);
  });

  it("never returns 2xx while live processing is not built, even when ON and correctly signed", async () => {
    const d = deps(on);
    const res = await handleLiveWebhook(signed(body, LIVE_SECRET), d);
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "STRIPE_LIVE_PROCESSING_NOT_BUILT" });
  });

  it("still answers 503 for test-signed or test-mode events", async () => {
    const testBody = JSON.stringify({ id: "evt_2", livemode: false });
    expect((await handleLiveWebhook(signed(body, TEST_SECRET), deps(on))).status).toBe(503);
    expect((await handleLiveWebhook(signed(testBody, LIVE_SECRET), deps(on))).status).toBe(503);
  });
});

describe("kill switch scope: new checkout only", () => {
  it("blocks new live checkout while off", async () => {
    await expect(assertLiveCheckoutAllowed("live", deps({}))).rejects.toThrow("STRIPE_LIVE_CHECKOUT_DISABLED");
    await expect(
      assertLiveCheckoutAllowed("live", deps({ STRIPE_LIVE_ENABLED: "true" }, false)),
    ).rejects.toThrow("STRIPE_LIVE_CHECKOUT_DISABLED");
  });

  it("allows new live checkout only when both switches are on", async () => {
    await expect(assertLiveCheckoutAllowed("live", deps({ STRIPE_LIVE_ENABLED: "true" }, true))).resolves.toBeUndefined();
  });

  it("never gates test checkout", async () => {
    await expect(assertLiveCheckoutAllowed("test", deps({}))).resolves.toBeUndefined();
  });
});

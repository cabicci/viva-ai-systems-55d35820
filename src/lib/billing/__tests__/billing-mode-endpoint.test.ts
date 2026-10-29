import { afterEach, describe, expect, it, vi } from "vitest";
import { handleBillingMode } from "../mode-endpoint.server";
import server from "../../../server";

afterEach(() => vi.unstubAllEnvs());

describe("published Worker billing mode dispatch", () => {
  it.each(["checkout", "portal"])("serves GET %s as Test JSON when mode is unset", async (intent) => {
    vi.stubEnv("STRIPE_BILLING_MODE", undefined);
    vi.stubEnv("STRIPE_LIVE_ENABLED", undefined);
    const response = await server.fetch(new Request(`https://masaarat.ai/api/billing/mode?intent=${intent}`), {}, {});
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ mode: "test" });
  });
  it.each(["invalid", ""])("rejects invalid/missing intent %s with 400 JSON", async (intent) => {
    const response = await server.fetch(new Request(`https://masaarat.ai/api/billing/mode?intent=${intent}`), {}, {});
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "INVALID_INTENT" });
  });
  it("does not allow writes to the mode endpoint", async () => {
    const response = await handleBillingMode(new Request("https://masaarat.ai/api/billing/mode?intent=checkout", { method: "POST" }));
    expect(response.status).toBe(405);
    expect(await response.json()).toEqual({ error: "METHOD_NOT_ALLOWED" });
  });
  it("never guesses Test when Live mode is selected with the Live gate OFF", async () => {
    vi.stubEnv("STRIPE_BILLING_MODE", "live");
    vi.stubEnv("STRIPE_LIVE_ENABLED", undefined);
    const response = await handleBillingMode(new Request("https://masaarat.ai/api/billing/mode?intent=checkout"));
    expect(await response.json()).toEqual({ mode: "live_unavailable" });
  });
});
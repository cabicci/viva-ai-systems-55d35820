import { afterEach, describe, expect, it, vi } from "vitest";
import server from "../../../server";

afterEach(() => vi.unstubAllEnvs());
const paths = [
  "/api/stripe-live/checkout",
  "/api/stripe-live/portal",
  "/api/public/stripe-live-webhook",
];

describe("Live endpoint exact-path dispatch", () => {
  it.each(paths)("rejects GET %s with 405 JSON and no outbound call", async (path) => {
    const outbound = vi
      .spyOn(globalThis, "fetch")
      .mockRejectedValue(new Error("UNEXPECTED_OUTBOUND"));
    try {
      const response = await server.fetch(new Request(`https://masaarat.ai${path}`), {}, {});
      expect(response.status).toBe(405);
      expect(response.headers.get("allow")).toBe("POST");
      expect(await response.json()).toEqual({ error: "METHOD_NOT_ALLOWED" });
      expect(outbound).not.toHaveBeenCalled();
    } finally {
      outbound.mockRestore();
    }
  });
  it.each(paths.slice(0, 2))("rejects unsigned POST %s before any outbound call", async (path) => {
    const outbound = vi
      .spyOn(globalThis, "fetch")
      .mockRejectedValue(new Error("UNEXPECTED_OUTBOUND"));
    try {
      for (const [origin, status, error] of [
        [undefined, 403, "UNTRUSTED_ORIGIN"],
        ["https://masaarat.ai", 401, "UNAUTHORIZED"],
      ] as const) {
        const response = await server.fetch(
          new Request(`https://masaarat.ai${path}`, {
            method: "POST",
            headers: origin ? { Origin: origin } : {},
            body: "{}",
          }),
          {},
          {},
        );
        expect(response.status).toBe(status);
        expect(await response.json()).toEqual({ error });
      }
      expect(outbound).not.toHaveBeenCalled();
    } finally {
      outbound.mockRestore();
    }
  });
  it("rejects an unsigned webhook before any database or Stripe call", async () => {
    vi.stubEnv("STRIPE_LIVE_WEBHOOK_SECRET", "synthetic-test-only");
    const outbound = vi
      .spyOn(globalThis, "fetch")
      .mockRejectedValue(new Error("UNEXPECTED_OUTBOUND"));
    try {
      const response = await server.fetch(
        new Request("https://masaarat.ai/api/public/stripe-live-webhook", {
          method: "POST",
          body: "{}",
        }),
        {},
        {},
      );
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: "INVALID_SIGNATURE" });
      expect(outbound).not.toHaveBeenCalled();
    } finally {
      outbound.mockRestore();
    }
  });
});

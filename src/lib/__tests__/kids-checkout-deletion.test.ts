// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { coordinateKidsCheckout } from "../../../supabase/functions/kids-stripe-checkout/coordinator";

function dependencies() {
  return {
    begin: vi.fn(async () => ({ attempt_id: "attempt", idempotency_key: "key" })),
    create: vi.fn(async () => ({
      id: "cs_test",
      status: "open",
      url: "https://checkout.stripe.com/test",
    })),
    record: vi.fn(async () => true),
    expire: vi.fn(async () => ({ status: "expired" })),
  };
}
describe("Kids checkout racing account deletion", () => {
  it("records provider creation before returning a usable URL", async () => {
    const d = dependencies();
    expect((await coordinateKidsCheckout(d)).id).toBe("cs_test");
    expect(d.create).toHaveBeenCalledWith("key");
    expect(d.record).toHaveBeenCalledWith("attempt", "cs_test");
  });
  it("expires a session created after the deletion gate and never returns its URL", async () => {
    const d = dependencies();
    d.record.mockResolvedValue(false);
    await expect(coordinateKidsCheckout(d)).rejects.toThrow("ACCOUNT_DELETION_PENDING");
    expect(d.expire).toHaveBeenCalledWith("cs_test");
    expect(d.record).toHaveBeenLastCalledWith("attempt", "cs_test", true);
  });
  it("does not call Stripe after a denied start, and does not mark an unknown provider response resolved", async () => {
    const d = dependencies();
    d.begin.mockRejectedValueOnce(new Error("blocked"));
    await expect(coordinateKidsCheckout(d)).rejects.toThrow("blocked");
    expect(d.create).not.toHaveBeenCalled();
    d.create.mockRejectedValueOnce(new Error("connection lost"));
    await expect(coordinateKidsCheckout(d)).rejects.toThrow("connection lost");
    expect(d.record).not.toHaveBeenCalled();
  });
});

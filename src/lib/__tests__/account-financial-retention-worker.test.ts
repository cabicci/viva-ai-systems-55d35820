// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import {
  eraseStripeCustomer,
  purgeFinancialAccount,
  type FinancialPurgeDependencies,
  type StripeTransport,
} from "../../../supabase/functions/account-deletion-job/handler";
import { financialDeliveryExpired } from "../../../supabase/functions/_shared/account-financial-gate";
const user = "11111111-1111-4111-8111-111111111111";
const deps = (): FinancialPurgeDependencies => ({
  claim: vi.fn<FinancialPurgeDependencies["claim"]>(async () => ({
    stage: "financial_due",
    user_id: user,
    lease_token: "lease",
    customers: [{ id: "cus_synthetic", gateway: "stripe_us", mode: "test" }],
  })),
  complete: vi.fn(async () => undefined),
  eraseCustomer: vi.fn(async () => undefined),
});

describe("financial purge worker and late delivery boundary", () => {
  it("erases the owned provider customer before atomically completing local erasure", async () => {
    const d = deps();
    expect(await purgeFinancialAccount(user, d)).toEqual({ stage: "financial_purged" });
    expect(d.eraseCustomer).toHaveBeenCalledWith("cus_synthetic", user);
    expect(d.complete).toHaveBeenNthCalledWith(1, user, "lease");
    expect(d.complete).toHaveBeenNthCalledWith(2, user, "lease", true);
    expect(vi.mocked(d.eraseCustomer).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(d.complete).mock.invocationCallOrder[0],
    );
  });
  it("keeps a failed provider operation retryable and does not claim local completion", async () => {
    const d = deps();
    vi.mocked(d.eraseCustomer).mockRejectedValue(new Error("unavailable"));
    await expect(purgeFinancialAccount(user, d)).rejects.toThrow("unavailable");
    expect(d.complete).toHaveBeenCalledExactlyOnceWith(user, "lease", true);
  });
  it("does no work on a completed account, and rejects live/foreign/unleased claims", async () => {
    const d = deps();
    vi.mocked(d.claim).mockResolvedValue({ stage: "financial_purged" });
    await purgeFinancialAccount(user, d);
    expect(d.eraseCustomer).not.toHaveBeenCalled();
    vi.mocked(d.claim).mockResolvedValue({
      stage: "financial_due",
      user_id: "other",
      lease_token: "lease",
    });
    await expect(purgeFinancialAccount(user, d)).rejects.toThrow(/INVALID_FINANCIAL_CLAIM/);
    vi.mocked(d.claim).mockResolvedValue({
      stage: "financial_due",
      user_id: user,
      lease_token: "lease",
      customers: [{ id: "cus_synthetic", gateway: "stripe_us", mode: "live" }],
    });
    await expect(purgeFinancialAccount(user, d)).rejects.toThrow(/PROVIDER_REVIEW_REQUIRED/);
    expect(d.eraseCustomer).not.toHaveBeenCalled();
  });
  it("checks customer ownership, deletes in TEST only, and verifies the deletion", async () => {
    const transport = vi
      .fn<StripeTransport>()
      .mockResolvedValueOnce({
        id: "cus_synthetic",
        livemode: false,
        metadata: { environment: "test", user_id: user },
      })
      .mockResolvedValueOnce({ id: "cus_synthetic", deleted: true })
      .mockResolvedValueOnce({ id: "cus_synthetic", deleted: true });
    await eraseStripeCustomer(transport, "cus_synthetic", user);
    expect(transport.mock.calls).toEqual([
      ["/customers/cus_synthetic"],
      ["/customers/cus_synthetic", { method: "DELETE" }],
      ["/customers/cus_synthetic"],
    ]);
  });
  it("resumes after provider success with a lost response, and rejects unverifiable deletion", async () => {
    const transport = vi
      .fn<StripeTransport>()
      .mockResolvedValue({ id: "cus_synthetic", deleted: true });
    await eraseStripeCustomer(transport, "cus_synthetic", user);
    expect(transport).toHaveBeenCalledTimes(1);
    transport.mockReset().mockResolvedValue({
      id: "cus_synthetic",
      livemode: false,
      metadata: { environment: "test", user_id: user },
    });
    await expect(eraseStripeCustomer(transport, "cus_synthetic", user)).rejects.toThrow(
      /REMOVAL_UNVERIFIED/,
    );
  });
  it("never deletes a live or differently owned customer", async () => {
    const transport = vi.fn<StripeTransport>().mockResolvedValue({
      id: "cus_synthetic",
      livemode: true,
      metadata: { environment: "live", user_id: user },
    });
    await expect(eraseStripeCustomer(transport, "cus_synthetic", user)).rejects.toThrow(
      /OWNERSHIP_MISMATCH/,
    );
    expect(transport).toHaveBeenCalledTimes(1);
  });
  it("uses only a valid resolved UUID and a boolean database decision for late deliveries", async () => {
    const rpc = vi.fn(async () => true) as unknown as Parameters<
      typeof financialDeliveryExpired
    >[1];
    expect(await financialDeliveryExpired("client-name", rpc)).toBe(false);
    expect(rpc).not.toHaveBeenCalled();
    expect(await financialDeliveryExpired(user, rpc)).toBe(true);
    expect(rpc).toHaveBeenCalledWith("lc09_financial_expired", { p_user_id: user });
  });
  it("fails closed when the financial deadline decision is unavailable or malformed", async () => {
    const malformed = vi.fn(async () => "false") as unknown as Parameters<
      typeof financialDeliveryExpired
    >[1];
    await expect(financialDeliveryExpired(user, malformed)).rejects.toThrow(/GATE_INVALID/);
    const unavailable = vi.fn(async () => {
      throw new Error("database unavailable");
    });
    await expect(financialDeliveryExpired(user, unavailable)).rejects.toThrow(
      "database unavailable",
    );
  });
});

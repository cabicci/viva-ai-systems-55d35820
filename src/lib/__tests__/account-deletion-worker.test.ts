// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import {
  authorizedDeletionJob,
  finalizeAccount,
  reconcileStripeCustomer,
  recoverStripeCheckout,
  type DeletionDependencies,
  type DeletionClaim,
  type StripeTransport,
} from "../../../supabase/functions/account-deletion-job/handler";

const user = "11111111-1111-4111-8111-111111111111";
function dependencies(stage: DeletionClaim["stage"] = "blocked"): DeletionDependencies {
  let exists = true;
  return {
    claim: vi.fn(async () => ({
      stage,
      user_id: user,
      lease_token: "lease",
      customers: [{ id: "cus_test", gateway: "stripe_us", mode: "test" }],
      storage_objects: [],
    })),
    advance: vi.fn(async () => undefined),
    reconcileCustomer: vi.fn(async () => undefined),
    recoverCheckout: vi.fn(async () => undefined),
    removeStorage: vi.fn(async () => undefined),
    deleteIdentity: vi.fn(async () => {
      exists = false;
    }),
    identityExists: vi.fn(async () => exists),
  };
}
describe("LC-09 worker interruption and authorization", () => {
  it("requires a dedicated long secret and rejects a client JWT", async () => {
    expect(
      await authorizedDeletionJob(
        new Request("https://test.local", { headers: { Authorization: "Bearer jwt" } }),
        "s".repeat(32),
      ),
    ).toBe(false);
    expect(
      await authorizedDeletionJob(
        new Request("https://test.local", {
          headers: { Authorization: `Bearer ${"s".repeat(32)}` },
        }),
        "s".repeat(32),
      ),
    ).toBe(true);
    expect(await authorizedDeletionJob(new Request("https://test.local"), "short")).toBe(false);
  });
  it("uses ordered durable checkpoints and verifies hard Auth deletion", async () => {
    const d = dependencies();
    expect(await finalizeAccount(user, d)).toEqual({ stage: "complete" });
    expect(vi.mocked(d.advance).mock.calls.map((c) => c[2])).toEqual([
      "provider_reconciled",
      "learner_erased",
      "complete",
      "release",
    ]);
    expect(d.identityExists).toHaveBeenCalledTimes(2);
  });
  it("keeps blocked state and learner data after a provider failure", async () => {
    const d = dependencies();
    vi.mocked(d.reconcileCustomer).mockRejectedValue(new Error("provider unavailable"));
    await expect(finalizeAccount(user, d)).rejects.toThrow("provider unavailable");
    expect(d.removeStorage).not.toHaveBeenCalled();
    expect(d.deleteIdentity).not.toHaveBeenCalled();
    expect(d.advance).toHaveBeenCalledWith(user, "lease", "release");
  });
  it("does not erase while Checkout creation is in flight or while mode is unreviewed", async () => {
    const d = dependencies();
    vi.mocked(d.claim).mockResolvedValue({
      stage: "blocked",
      user_id: user,
      lease_token: "lease",
      checkout_in_flight: true,
    });
    await expect(finalizeAccount(user, d)).rejects.toThrow(/CHECKOUT_IN_FLIGHT/);
    expect(d.deleteIdentity).not.toHaveBeenCalled();
    vi.mocked(d.claim).mockResolvedValue({
      stage: "blocked",
      user_id: user,
      lease_token: "lease",
      customers: [{ id: "cus_live", gateway: "stripe_us", mode: "live" }],
    });
    await expect(finalizeAccount(user, d)).rejects.toThrow(/PROVIDER_REVIEW_REQUIRED/);
  });
  it("resumes after Auth removal and refuses to claim success when identity remains", async () => {
    const d = dependencies("learner_erased");
    vi.mocked(d.identityExists).mockResolvedValue(false);
    await finalizeAccount(user, d);
    expect(d.deleteIdentity).not.toHaveBeenCalled();
    expect(d.reconcileCustomer).not.toHaveBeenCalled();
    vi.mocked(d.identityExists).mockResolvedValue(true);
    vi.mocked(d.deleteIdentity).mockResolvedValue();
    await expect(finalizeAccount(user, d)).rejects.toThrow(/AUTH_REMOVAL_UNVERIFIED/);
  });
  it("returns completed requests idempotently without external calls", async () => {
    const d = dependencies("complete");
    await finalizeAccount(user, d);
    expect(d.deleteIdentity).not.toHaveBeenCalled();
    expect(d.advance).not.toHaveBeenCalled();
  });
});

describe("LC-09 Stripe reconciliation without network", () => {
  function transport(overrides: Record<string, unknown> = {}) {
    return vi.fn<StripeTransport>(async (path, options) => {
      if (path.startsWith("/customers/"))
        return {
          id: "cus_test",
          livemode: false,
          metadata: { environment: "test", user_id: user },
          ...overrides,
        };
      if (path.startsWith("/subscription_schedules?")) return { data: [], has_more: false };
      if (path.startsWith("/subscriptions?")) return { data: [], has_more: false };
      if (path.startsWith("/checkout/sessions?")) return { data: [], has_more: false };
      if (path.startsWith("/invoices?")) return { data: [], has_more: false };
      if (path.startsWith("/payment_intents?")) return { data: [], has_more: false };
      if (path.startsWith("/charges?")) return { data: [], has_more: false };
      throw new Error(`unexpected ${path} ${options?.method}`);
    });
  }
  it("verifies TEST customer ownership before any mutation", async () => {
    const t = transport({ livemode: true });
    await expect(reconcileStripeCustomer(t, "cus_test", user)).rejects.toThrow(
      /OWNERSHIP_MISMATCH/,
    );
    expect(t).toHaveBeenCalledTimes(1);
  });
  it("expires open Checkout and cancels renewal without prorating or charging", async () => {
    let cancelled = false;
    const t = transport();
    t.mockImplementation(async (path, options) => {
      if (path.startsWith("/customers/"))
        return {
          id: "cus_test",
          livemode: false,
          metadata: { environment: "test", user_id: user },
        };
      if (path.startsWith("/checkout/sessions?"))
        return { data: [{ id: "cs_test", status: "open", livemode: false }], has_more: false };
      if (path.endsWith("/expire")) return { id: "cs_test", status: "expired" };
      if (path.startsWith("/subscription_schedules?")) return { data: [], has_more: false };
      if (path.startsWith("/subscriptions?"))
        return {
          data: cancelled ? [] : [{ id: "sub_test", status: "active", livemode: false }],
          has_more: false,
        };
      if (options?.method === "DELETE") {
        cancelled = true;
        return { id: "sub_test", status: "canceled" };
      }
      return { data: [], has_more: false };
    });
    await reconcileStripeCustomer(t, "cus_test", user);
    const cancellation = t.mock.calls.find((c) => c[1]?.method === "DELETE");
    expect(cancellation?.[0]).toBe("/subscriptions/sub_test");
    expect(t.mock.calls.some((c) => c[0].endsWith("/expire"))).toBe(true);
  });
  it("does not ignore additional list pages or unsettled invoices", async () => {
    const base = transport();
    const t = vi.fn(async (path: string) => {
      if (path.startsWith("/invoices?"))
        return path.includes("starting_after")
          ? { data: [{ id: "in_pending", status: "open" }], has_more: false }
          : { data: [{ id: "in_paid", status: "paid" }], has_more: true };
      return base(path);
    });
    await expect(reconcileStripeCustomer(t, "cus_test", user)).rejects.toThrow(
      /FINANCIAL_RECONCILIATION_PENDING/,
    );
    expect(t.mock.calls.some((c) => c[0].includes("starting_after=in_paid"))).toBe(true);
  });
});

describe("Kids Checkout erasure coordination", () => {
  it("recovers an unknown provider response with the original parameters/key and expires it", async () => {
    const t = vi.fn<StripeTransport>(async (path) =>
      path.endsWith("/expire")
        ? { id: "cs_recovered", status: "expired" }
        : { id: "cs_recovered", status: "open", livemode: false },
    );
    expect(
      await recoverStripeCheckout(t, {
        key: "original-key",
        parameters: "customer=cus_test&mode=subscription",
      }),
    ).toBe("cs_recovered");
    expect(t.mock.calls[0][1]?.idempotency).toBe("original-key");
    expect(t.mock.calls[0][1]?.params?.get("customer")).toBe("cus_test");
    expect(t.mock.calls[1][0]).toBe("/checkout/sessions/cs_recovered/expire");
  });
  it("never erases when recovery fails and rechecks the provider after recovery succeeds", async () => {
    const d = dependencies();
    vi.mocked(d.claim).mockResolvedValue({
      stage: "blocked",
      user_id: user,
      lease_token: "lease",
      customers: [{ id: "cus_test", gateway: "stripe_us", mode: null }],
      checkout_attempts: [{ id: "attempt", key: "key", parameters: "customer=cus_test" }],
    });
    vi.mocked(d.recoverCheckout).mockRejectedValueOnce(new Error("retry"));
    await expect(finalizeAccount(user, d)).rejects.toThrow("retry");
    expect(d.deleteIdentity).not.toHaveBeenCalled();
    await finalizeAccount(user, d);
    expect(d.reconcileCustomer).toHaveBeenCalledTimes(3);
    expect(d.recoverCheckout).toHaveBeenCalledTimes(2);
  });
});

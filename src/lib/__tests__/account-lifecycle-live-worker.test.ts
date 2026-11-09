// @vitest-environment node
/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterEach, describe, expect, it, vi } from "vitest";
import { createLiveAccountLifecycleWorker, lifecycleMode } from "../../../supabase/functions/_shared/account-lifecycle-live-worker";
import { createAccountLifecycleWorker } from "../../../supabase/functions/_shared/account-lifecycle-worker";
const user = "a1111111-1111-4111-8111-111111111111", lease = "b2222222-2222-4222-8222-222222222222";
function database() {
  const events: any[] = [];
  let identity = true;
  const claim = { stage: "blocked", user_id: user, lease_token: lease, lease_until: "2026-11-05T00:05:00Z", server_time: "2026-11-05T00:00:00Z",
    customers: [] as any[], storage_objects: [{ bucket: "learner", name: "owned/file" }], holds: [], checkout_attempts: [], core_checkouts: [], commercial_checkouts: [], offer_reservations: [] };
  const db: any = {
    rpc: async (name: string, args: any) => {
      events.push({ name, args });
      return { data: name === "lc09_claim_live_deletion" ? claim : name === "lc09_renew_live_lifecycle_lease" ? { ...claim, phase: "deletion" }
        : name.endsWith("_candidates") ? [user] : { stage: args.p_next_stage }, error: null };
    },
    storage: { from: (bucket: string) => ({ remove: async (paths: string[]) => { events.push({ name: "storage", bucket, paths }); return { error: null }; } }) },
    auth: { admin: { getUserById: async () => ({ data: { user: identity ? { id: user } : null }, error: identity ? null : { status: 404 } }),
      deleteUser: async (id: string, soft: boolean) => { events.push({ name: "auth", id, soft }); identity = false; return { error: null }; } } },
  };
  return { db, events, claim };
}
afterEach(() => vi.unstubAllGlobals());
describe("M17 explicit Live worker boundary", () => {
  it.each([undefined, ""])("retains Test default for missing mode %s", input => expect(lifecycleMode(input)).toBe("test"));
  it("accepts explicit Live and rejects unknown modes", () => { expect(lifecycleMode("live")).toBe("live"); expect(() => lifecycleMode("production")).toThrow(); expect(() => lifecycleMode(" ")).toThrow(); });
  it("separates Live and existing Test key factories", () => {
    const { db } = database(); expect(() => createLiveAccountLifecycleWorker(db, "sk_test_synthetic")).toThrow("LIVE_KEY_REQUIRED");
    expect(() => createAccountLifecycleWorker(db, "sk_live_synthetic")).toThrow("LC09_TEST_ONLY");
  });
  it("calls real composition with native leases before storage and auth", async () => {
    const h = database(); const transport = vi.fn(); await createLiveAccountLifecycleWorker(h.db, "sk_live_synthetic", transport).finalize(user);
    expect(transport).not.toHaveBeenCalled();
    const index = h.events.findIndex(e => e.name === "storage"); expect(h.events[index - 1].name).toBe("lc09_renew_live_lifecycle_lease");
    expect(h.events.find(e => e.name === "auth")).toMatchObject({ id: user, soft: false });
  });
  it("does not interpret transient auth lookup failure as absent", async () => {
    const h = database(); h.db.auth.admin.getUserById = async () => ({ data: {}, error: { status: 503 } });
    await expect(createLiveAccountLifecycleWorker(h.db, "sk_live_synthetic", vi.fn()).finalize(user)).rejects.toThrow("AUTH_LOOKUP_FAILED");
    expect(h.events.some(e => e.args?.p_next_stage === "complete")).toBe(false);
  });
  it("does not advance learner erasure when object storage fails", async () => {
    const h = database(); h.db.storage.from = () => ({ remove: async () => ({ error: { message: "private" } }) });
    await expect(createLiveAccountLifecycleWorker(h.db, "sk_live_synthetic", vi.fn()).finalize(user)).rejects.toThrow("STORAGE_REMOVAL_FAILED");
    expect(h.events.some(e => e.args?.p_next_stage === "learner_erased")).toBe(false);
  });
  it("uses fixed provider host/version and emits generic failure without payload", async () => {
    const h = database(); h.claim.customers = [{ id: "cus_owned", mode: "live", gateway: "stripe_us_live" }];
    const fetch = vi.fn(async (..._args: any[]) => ({ ok: false, json: () => ({ secret: "never returned" }) })); vi.stubGlobal("fetch", fetch);
    await expect(createLiveAccountLifecycleWorker(h.db, "sk_live_synthetic").finalize(user)).rejects.toThrow("LC09_PROVIDER_STEP_FAILED");
    expect(fetch.mock.calls[0][0]).toBe("https://api.stripe.com/v1/customers/cus_owned");
    expect((fetch.mock.calls[0] as any)[1].headers["Stripe-Version"]).toBe("2026-08-26.dahlia");
  });
  it("honors both disabled batch controls without reading candidates", async () => {
    const h = database(); expect(await createLiveAccountLifecycleWorker(h.db, "sk_live_synthetic", vi.fn()).runBatch({ deletionEnabled: false, financialEnabled: false })).toEqual({ completed: 0, deferred: 0 }); expect(h.events).toEqual([]);
  });
  it("counts deferred accounts without exposing private errors", async () => {
    const h = database(); h.db.auth.admin.getUserById = async () => ({ data: {}, error: { status: 503 } });
    expect(await createLiveAccountLifecycleWorker(h.db, "sk_live_synthetic", vi.fn()).runBatch({ deletionEnabled: true, financialEnabled: false })).toEqual({ completed: 0, deferred: 1 });
  });
});

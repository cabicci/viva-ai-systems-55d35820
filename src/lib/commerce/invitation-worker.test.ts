// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
import { handleCommerceInvitations } from "../../../supabase/functions/commerce-invitations/handler";
import {
  purgeFinancialAccount,
  type FinancialPurgeDependencies,
} from "../../../supabase/functions/_shared/account-lifecycle-handler";
const actor = "00000000-0000-4000-8000-000000000001",
  group = "00000000-0000-4000-8000-000000000002";
const request = () =>
  new Request("https://synthetic.test", {
    method: "POST",
    headers: { Authorization: "Bearer synthetic" },
    body: JSON.stringify({ group_id: group }),
  });
describe("explicit invitation dispatch and receipt custody", () => {
  it("authenticates before claiming and never accepts a client supplied actor", async () => {
    const rpc = vi.fn(),
      send = vi.fn();
    const response = await handleCommerceInvitations(
      request(),
      {
        auth: {
          getUser: vi.fn(async () => ({ data: { user: null }, error: new Error("Invalid") })),
        },
        rpc,
      },
      send,
    );
    expect(response.status).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });
  it("uses a stable per-recipient key and tracks provider acceptance separately", async () => {
    const send = vi.fn(async (_message: { to: string; idempotencyKey: string }) => ({
      ok: true as const,
      emailId: "synthetic_provider",
    }));
    const rpc = vi.fn(async (_name: string, args: Record<string, unknown>) => ({
      error: null,
      data:
        args.p_action === "claim"
          ? [
              {
                id: "outbox1",
                invitation_id: actor,
                recipient: "member@example.test",
                payload: {
                  locale: "ar-EG",
                  package: "pro",
                  duration_days: 1,
                  deadline: "2026-12-01T00:00:00Z",
                  access_kind: "external",
                },
              },
            ]
          : args.p_action === "authorize_attempt"
            ? true
            : { ok: true },
    }));
    const response = await handleCommerceInvitations(
      request(),
      {
        auth: { getUser: vi.fn(async () => ({ data: { user: { id: actor } }, error: null })) },
        rpc,
      },
      send,
    );
    expect(await response.json()).toEqual({ accepted: 1, pending: 0, claimed: 1 });
    expect(send.mock.calls[0][0]).toMatchObject({
      to: "member@example.test",
      idempotencyKey: "commerce-invitation/outbox1",
    });
    expect(rpc.mock.calls[0][1]).toEqual({ p_action: "claim", p_data: { actor, group_id: group } });
  });
  it("rechecks pause/suppression immediately before each message", async () => {
    const send = vi.fn();
    const rpc = vi.fn(async (_name: string, args: Record<string, unknown>) => ({
      error: null,
      data: args.p_action === "claim" ? [{ id: "outbox1" }] : false,
    }));
    await handleCommerceInvitations(
      request(),
      {
        auth: { getUser: vi.fn(async () => ({ data: { user: { id: actor } }, error: null })) },
        rpc,
      },
      send,
    );
    expect(send).not.toHaveBeenCalled();
  });
  it("removes retained private receipt objects before marking financial erasure complete", async () => {
    const deps: FinancialPurgeDependencies = {
      claim: vi.fn(async () => ({
        stage: "financial_due" as const,
        user_id: actor,
        lease_token: "lease",
        customers: [],
        storage_objects: [{ bucket: "commerce-receipts", name: `${actor}/${group}` }],
      })),
      eraseCustomer: vi.fn(),
      removeStorage: vi.fn(async () => {}),
      complete: vi.fn(async () => {}),
    };
    await purgeFinancialAccount(actor, deps);
    expect(deps.removeStorage).toHaveBeenCalledOnce();
    expect(vi.mocked(deps.removeStorage!).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(deps.complete).mock.invocationCallOrder[0],
    );
    vi.mocked(deps.removeStorage!).mockRejectedValue(new Error("Storage unavailable"));
    vi.mocked(deps.complete).mockClear();
    await expect(purgeFinancialAccount(actor, deps)).rejects.toThrow(/unavailable/);
    expect(deps.complete).toHaveBeenCalledExactlyOnceWith(actor, "lease", true);
  });
});

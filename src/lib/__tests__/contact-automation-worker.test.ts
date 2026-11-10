// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import {
  contactAutomationOwner,
  runContactAutomationJob,
} from "../../../supabase/functions/_shared/contact-automation-worker";

const counters = {
  awaitingOwner: 1,
  ownerReconciliation: 0,
  retryWindowExpired: 0,
  messageWindowExpired: 0,
  intakeReconciliation: 0,
  inFlight: 0,
  withdrawn: 0,
};
const row = {
  id: "source-ack",
  claim_token: "lease",
  recipient: "customer@example.test",
  subject: "Frozen",
  text_body: "Frozen text",
  html_body: "<p>Frozen</p>",
  sender: "info@mail.masaarat.ai",
};
function fixture() {
  const rpc = vi.fn(
    async (
      name: string,
      _args?: Record<string, unknown>,
    ): Promise<{ data: unknown; error: unknown }> => ({
      error: null,
      data:
        name === "prepare_contact_automation"
          ? { scheduled: 0, awaiting_owner: 1 }
          : name === "claim_contact_automation"
            ? [row]
            : name === "contact_automation_status"
              ? counters
              : true,
    }),
  );
  const send = vi.fn().mockResolvedValue({ ok: true, emailId: "provider-ack" });
  return { db: { rpc }, rpc, send };
}
describe("contact automation uses the existing mail worker", () => {
  it("rechecks each claimed row, so withdrawal during an earlier send stops a later batch item", async () => {
    const second = { ...row, id: "second-ack", claim_token: "second-lease" };
    let withdrawn = false;
    const rpc = vi.fn(
      async (
        name: string,
        args?: Record<string, unknown>,
      ): Promise<{ data: unknown; error: unknown }> => ({
        error: null,
        data:
          name === "prepare_contact_automation"
            ? { scheduled: 0, awaiting_owner: 0 }
            : name === "claim_contact_automation"
              ? [row, second]
              : name === "begin_contact_mail_send"
                ? !withdrawn
                : name === "contact_automation_status"
                  ? counters
                  : true,
      }),
    );
    const send = vi.fn(async () => {
      withdrawn = true;
      return { ok: true as const, emailId: "first-accepted" };
    });
    expect(await runContactAutomationJob({ rpc }, send, "owner@example.test")).toMatchObject({
      accepted: 1,
      deferred: 1,
    });
    expect(send).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith("begin_contact_mail_send", {
      p_id: second.id,
      p_claim: second.claim_token,
      p_owner: "owner@example.test",
    });
  });
  it("fails closed before POST when the fresh pre-send check is unavailable", async () => {
    const { db, rpc, send } = fixture();
    rpc.mockImplementation(async (name: string) => ({
      data:
        name === "prepare_contact_automation"
          ? { scheduled: 0, awaiting_owner: 0 }
          : name === "claim_contact_automation"
            ? [row]
            : null,
      error: name === "begin_contact_mail_send" ? "unavailable" : null,
    }));
    await expect(runContactAutomationJob(db, send, "owner@example.test")).rejects.toThrow(
      "contact_mail_begin_failed",
    );
    expect(send).not.toHaveBeenCalled();
  });
  it("keeps acknowledgements working while clearly reporting missing owner configuration", async () => {
    const { db, rpc, send } = fixture();
    expect(await runContactAutomationJob(db, send, undefined, row.id)).toEqual({
      accepted: 1,
      deferred: 0,
      automation: {
        status: "owner_configuration_required",
        scheduled: 0,
        awaitingOwner: 1,
        reconciliation: counters,
        statusReadFailed: false,
      },
    });
    expect(rpc).toHaveBeenNthCalledWith(1, "prepare_contact_automation", {
      p_owner: null,
      p_id: row.id,
    });
    expect(rpc).toHaveBeenNthCalledWith(2, "claim_contact_automation", {
      p_owner: null,
      p_id: row.id,
    });
    expect(send.mock.calls[0][0].idempotencyKey).toBe(`contact-ack-v1/${row.id}`);
  });
  it("passes only the configured destination to both preparation and claim", async () => {
    const { db, rpc, send } = fixture();
    await runContactAutomationJob(db, send, " OWNER@example.test ");
    expect(rpc).toHaveBeenNthCalledWith(1, "prepare_contact_automation", {
      p_owner: "owner@example.test",
      p_id: null,
    });
    expect(rpc).toHaveBeenNthCalledWith(2, "claim_contact_automation", {
      p_owner: "owner@example.test",
      p_id: null,
    });
    expect(rpc).toHaveBeenCalledWith("complete_contact_acknowledgement", {
      p_id: row.id,
      p_claim: row.claim_token,
      p_email_id: "provider-ack",
      p_block: false,
    });
  });
  it.each([
    undefined,
    "",
    "not-an-email",
    "owner@example.test\r\nBcc: victim@example.test",
    "one@example.test,two@example.test",
  ])("rejects an unusable destination %s", (email) =>
    expect(contactAutomationOwner(email)).toBeNull(),
  );
  it("isolates preparation failure and still sends the already persisted ACK", async () => {
    const { db, rpc, send } = fixture();
    rpc.mockResolvedValueOnce({ data: null, error: "database unavailable" });
    expect(await runContactAutomationJob(db, send, "owner@example.test")).toMatchObject({
      accepted: 1,
      automation: { status: "owner_preparation_failed" },
    });
    expect(rpc).toHaveBeenCalledWith("claim_contact_automation", { p_owner: null, p_id: null });
    expect(send).toHaveBeenCalledTimes(1);
  });
  it("retains the existing retry and completion result for an ambiguous send", async () => {
    const { db, rpc, send } = fixture();
    send.mockRejectedValue(new Error("timeout after possible acceptance"));
    expect(await runContactAutomationJob(db, send, "owner@example.test")).toMatchObject({
      accepted: 0,
      deferred: 1,
    });
    expect(rpc).toHaveBeenCalledWith(
      "complete_contact_acknowledgement",
      expect.objectContaining({ p_email_id: null, p_block: false }),
    );
  });
  it("interleaved worker invocations send only the atomic claim winner", async () => {
    const { send } = fixture();
    let claimed = false;
    const rpc = vi.fn(async (name: string) => {
      if (name === "prepare_contact_automation")
        return { data: { scheduled: 0, awaiting_owner: 0 }, error: null };
      if (name === "claim_contact_automation") {
        const rows = claimed ? [] : [row];
        claimed = true;
        return { data: rows, error: null };
      }
      return { data: true, error: null };
    });
    const results = await Promise.all([
      runContactAutomationJob({ rpc }, send, "owner@example.test"),
      runContactAutomationJob({ rpc }, send, "owner@example.test", row.id),
    ]);
    expect(results.reduce((sum, value) => sum + value.accepted, 0)).toBe(1);
    expect(send).toHaveBeenCalledTimes(1);
  });
});

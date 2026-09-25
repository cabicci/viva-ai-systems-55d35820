import { describe, expect, it, vi } from "vitest";
import {
  authorizedRetentionJob,
  retentionNotice,
  runKidsRetention,
} from "../../../supabase/functions/kids-retention-job/handler";
import {
  readWebhookBody,
  recordRetentionEvent,
} from "../../../supabase/functions/kids-retention-webhook/handler";

const claim = {
  notice_id: "notice-1",
  claim_token: "lease-1",
  recipient_email: "parent@example.test",
  expiry: "2026-01-01T00:00:00Z",
  first_attempt_at: "2026-04-01T00:00:00Z",
};
function dbMock() {
  return {
    rpc: vi.fn(async (name: string) => ({
      data:
        name === "kids_claim_retention_notices"
          ? [claim]
          : name === "kids_retention_deletion_candidates"
            ? []
            : true,
      error: null,
    })),
  };
}
describe("Kids retention worker", () => {
  it("blocks a permanent provider rejection instead of repeatedly sending it", async () => {
    const db = dbMock();
    await runKidsRetention(db, vi.fn().mockResolvedValue({ ok: false, retryable: false }));
    expect(db.rpc).toHaveBeenCalledWith("kids_block_retention_notice", {
      p_notice: "notice-1",
      p_claim: "lease-1",
    });
  });
  it("bounds raw webhook bytes before signature verification", async () => {
    expect(
      await readWebhookBody(
        new Request("https://example.test", { method: "POST", body: "a".repeat(65537) }),
      ),
    ).toBeNull();
    expect(
      await readWebhookBody(
        new Request("https://example.test", { method: "POST", body: '{"test":true}' }),
      ),
    ).toBe('{"test":true}');
  });
  it("records provider acceptance without manufacturing a delivery receipt", async () => {
    const db = dbMock(),
      send = vi.fn().mockResolvedValue({ ok: true, emailId: "provider-1" });
    expect(await runKidsRetention(db, send)).toEqual({
      submitted: 1,
      deferred: 0,
      deletedProfiles: 0,
    });
    expect(send.mock.calls[0][0]).toMatchObject({
      to: claim.recipient_email,
      idempotencyKey: "kids-retention/notice-1",
    });
    expect(db.rpc).toHaveBeenCalledWith("kids_record_retention_submission", {
      p_notice: "notice-1",
      p_claim: "lease-1",
      p_email_id: "provider-1",
    });
    expect(db.rpc.mock.calls.some(([name]) => name === "kids_record_retention_delivery")).toBe(
      false,
    );
  });
  it("keeps the identical payload on retry and defers unknown outcomes", async () => {
    const send = vi.fn().mockResolvedValue({ ok: false });
    const a = await runKidsRetention(dbMock(), send);
    await runKidsRetention(dbMock(), send);
    expect(a.deferred).toBe(1);
    expect(send.mock.calls[0][0]).toEqual(send.mock.calls[1][0]);
  });
  it("contains no child fields or promotional message in the template", () => {
    const message = retentionNotice(claim.expiry, Date.parse(claim.first_attempt_at));
    expect(message.text).toContain("2026-04-15");
    expect(message.text).toContain("14 full days");
    expect(message.text).not.toContain("Explorer");
  });
  it("binds a validated single-recipient event and ignores unrelated event types", async () => {
    const db = dbMock();
    const event = {
      eventId: "event-1",
      emailId: "provider-1",
      type: "email.delivered",
      occurredAt: "2026-04-01T00:00:00Z",
      recipients: [claim.recipient_email],
    };
    expect(await recordRetentionEvent(db, event)).toBe(true);
    expect(db.rpc).toHaveBeenCalledWith(
      "kids_record_retention_delivery",
      expect.objectContaining({ p_event_id: "event-1", p_recipient: claim.recipient_email }),
    );
    db.rpc.mockClear();
    expect(
      await recordRetentionEvent(db, {
        ...event,
        recipients: [claim.recipient_email, "other@example.test"],
      }),
    ).toBe(false);
    expect(await recordRetentionEvent(db, { ...event, type: "email.opened" })).toBe(true);
    expect(db.rpc).not.toHaveBeenCalled();
  });
  it("does not call deletion after a database claim error", async () => {
    const db = { rpc: vi.fn().mockResolvedValue({ data: null, error: { code: "503" } }) };
    const send = vi.fn();
    await expect(runKidsRetention(db, send)).rejects.toThrow();
    expect(send).not.toHaveBeenCalled();
  });
  it("requires a dedicated high-entropy job credential", async () => {
    const secret = "a".repeat(40);
    expect(await authorizedRetentionJob(new Request("https://example.test"), secret)).toBe(false);
    expect(
      await authorizedRetentionJob(
        new Request("https://example.test", { headers: { authorization: "Bearer " + secret } }),
        secret,
      ),
    ).toBe(true);
    expect(
      await authorizedRetentionJob(
        new Request("https://example.test", { headers: { authorization: "Bearer " + secret } }),
        "short",
      ),
    ).toBe(false);
  });
});

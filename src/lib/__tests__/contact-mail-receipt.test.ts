import { describe, expect, it, vi } from "vitest";
import { handleContactMailReceipt } from "../../../supabase/functions/contact-mail-webhook/handler";
const keyBytes = new Uint8Array(32).fill(7);
const secret = `whsec_${btoa(String.fromCharCode(...keyBytes))}`;
async function signedRequest(
  type = "email.delivered",
  recipients = ["adult@example.test"],
) {
  const timestamp = Math.floor(Date.now() / 1000).toString(),
    id = "msg_contact_1";
  const body = JSON.stringify({
    type,
    created_at: new Date().toISOString(),
    data: { email_id: "provider-id", to: recipients },
  });
  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = new Uint8Array(
    await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(`${id}.${timestamp}.${body}`),
    ),
  );
  return new Request("https://example.test", {
    method: "POST",
    headers: {
      "svix-id": id,
      "svix-timestamp": timestamp,
      "svix-signature": `v1,${btoa(String.fromCharCode(...signature))}`,
    },
    body,
  });
}
describe("signed contact delivery receipts", () => {
  it("rejects invalid signatures before any DB access", async () => {
    const db = vi.fn();
    expect(
      (
        await handleContactMailReceipt(
          new Request("https://example.test", { method: "POST", body: "{}" }),
          secret,
          db,
        )
      ).status,
    ).toBe(401);
    expect(db).not.toHaveBeenCalled();
  });
  it("records only verified provider identity and recipient", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: "recorded", error: null });
    expect(
      (
        await handleContactMailReceipt(await signedRequest(), secret, () => ({
          rpc,
        }))
      ).status,
    ).toBe(204);
    expect(rpc).toHaveBeenCalledWith(
      "record_contact_mail_receipt",
      expect.objectContaining({
        p_event: "msg_contact_1",
        p_email_id: "provider-id",
        p_recipient: "adult@example.test",
        p_type: "email.delivered",
      }),
    );
  });
  it("retries a receipt that arrived before send completion is persisted", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: "pending", error: null });
    expect(
      (
        await handleContactMailReceipt(await signedRequest(), secret, () => ({
          rpc,
        }))
      ).status,
    ).toBe(503);
  });
  it("acknowledges unrelated messages without recording a contact delivery", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: "ignored", error: null });
    expect(
      (
        await handleContactMailReceipt(await signedRequest(), secret, () => ({
          rpc,
        }))
      ).status,
    ).toBe(204);
    const db = vi.fn();
    expect(
      (
        await handleContactMailReceipt(
          await signedRequest("email.sent"),
          secret,
          db,
        )
      ).status,
    ).toBe(204);
    expect(db).not.toHaveBeenCalled();
  });
  it("rejects missing configuration, wrong methods and DB failures", async () => {
    expect(
      (
        await handleContactMailReceipt(
          new Request("https://example.test"),
          secret,
          vi.fn(),
        )
      ).status,
    ).toBe(405);
    expect(
      (
        await handleContactMailReceipt(
          await signedRequest(),
          undefined,
          vi.fn(),
        )
      ).status,
    ).toBe(503);
    expect(
      (
        await handleContactMailReceipt(await signedRequest(), secret, () => ({
          rpc: vi.fn().mockResolvedValue({ error: "denied", data: null }),
        }))
      ).status,
    ).toBe(503);
  });
});

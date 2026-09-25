// @vitest-environment node
import { createHmac } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import {
  sendTransactionalEmail,
  verifyResendSignature,
  verifyResendWebhook,
} from "../../../supabase/functions/_shared/resend";

const config = {
  enabled: true,
  apiKey: "re_test_placeholder",
  from: "Masaarat <notice@mail.masaarat.ai>",
  replyTo: "info@masaarat.ai",
};
const message = {
  to: "guardian@example.com",
  subject: "Account notice",
  text: "Open your account for details.",
  idempotencyKey: "notice/notice-1",
};
const now = Date.parse("2026-09-25T16:00:00Z");
const secret = `whsec_${Buffer.from("local-webhook-fixture-only").toString("base64")}`;
const event = {
  type: "email.delivered",
  created_at: "2026-09-25T15:59:00Z",
  data: { email_id: "email-1", to: [message.to] },
};

function signed(body: string, timestamp = String(now / 1000), eventId = "msg_test_1") {
  const signature = createHmac("sha256", Buffer.from(secret.slice(6), "base64"))
    .update(`${eventId}.${timestamp}.${body}`)
    .digest("base64");
  return new Headers({
    "svix-id": eventId,
    "svix-timestamp": timestamp,
    "svix-signature": `v1,${signature}`,
  });
}

describe("Resend transactional transport", () => {
  it("never sends while disabled or configured with another domain", async () => {
    const fetcher = vi.fn();
    expect(
      await sendTransactionalEmail({ ...config, enabled: false }, message, fetcher),
    ).toMatchObject({ ok: false, code: "disabled" });
    expect(
      await sendTransactionalEmail({ ...config, from: "sender@example.com" }, message, fetcher),
    ).toMatchObject({ ok: false, code: "configuration" });
    expect(fetcher).not.toHaveBeenCalled();
  });
  it.each([
    { to: "guardian@example.com,other@example.com" },
    { subject: "Hello\r\nBcc: other@example.com" },
    { idempotencyKey: "" },
    { text: " " },
  ])("rejects malformed message before network access: %j", async (override) => {
    const fetcher = vi.fn();
    expect(
      await sendTransactionalEmail(config, { ...message, ...override }, fetcher),
    ).toMatchObject({ ok: false, code: "invalid_message", retryable: false });
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("sends a single recipient with stable idempotency and returns API acceptance only", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(JSON.stringify({ id: "email-1" })));
    expect(await sendTransactionalEmail(config, message, fetcher)).toEqual({
      ok: true,
      emailId: "email-1",
    });
    const [url, request] = fetcher.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(request?.redirect).toBe("error");
    expect(new Headers(request?.headers).get("Idempotency-Key")).toBe(message.idempotencyKey);
    expect(JSON.parse(String(request?.body))).toEqual({
      from: config.from,
      to: [message.to],
      subject: message.subject,
      text: message.text,
      reply_to: config.replyTo,
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it.each([
    [429, {}, "provider_unavailable", true],
    [409, { name: "concurrent_idempotent_requests" }, "provider_unavailable", true],
    [409, { name: "invalid_idempotent_request" }, "provider_rejected", false],
    [403, { message: "private provider detail" }, "provider_rejected", false],
    [503, {}, "unknown_outcome", true],
    [200, {}, "unknown_outcome", true],
  ] as const)(
    "handles status %s without leaking response content or retrying itself",
    async (status, body, code, retryable) => {
      const fetcher = vi
        .fn<typeof fetch>()
        .mockResolvedValue(new Response(JSON.stringify(body), { status }));
      expect(await sendTransactionalEmail(config, message, fetcher)).toEqual({
        ok: false,
        code,
        retryable,
      });
      expect(fetcher).toHaveBeenCalledTimes(1);
    },
  );
  it("keeps a network failure uncertain to prevent an unbounded duplicate retry", async () => {
    const fetcher = vi.fn<typeof fetch>().mockRejectedValue(new Error("private network details"));
    expect(await sendTransactionalEmail(config, message, fetcher)).toEqual({
      ok: false,
      code: "unknown_outcome",
      retryable: true,
    });
  });
});

describe("Resend signed delivery events", () => {
  it("matches the published Svix signature vector", async () => {
    const headers = new Headers({
      "svix-id": "msg_loFOjxBNrRLzqYUf",
      "svix-timestamp": "1731705121",
      "svix-signature": "v1,rAvfW3dJ/X/qxhsaXPOyyCGmRKsaKWcsNccKXlIktD0=",
    });
    expect(
      await verifyResendSignature(
        '{"event_type":"ping","data":{"success":true}}',
        headers,
        "whsec_plJ3nmyCDGBKInavdOK15jsl",
        1731705121_000,
      ),
    ).toBe(true);
  });
  it("returns only authenticated receipt fields, not subject or arbitrary provider data", async () => {
    const raw = JSON.stringify({ ...event, data: { ...event.data, subject: "private detail" } });
    expect(await verifyResendWebhook(raw, signed(raw), secret, now)).toEqual({
      eventId: "msg_test_1",
      type: event.type,
      emailId: "email-1",
      occurredAt: event.created_at.replace("Z", ".000Z"),
      recipients: [message.to],
    });
  });
  it.each([
    "email.sent",
    "email.delivery_delayed",
    "email.bounced",
    "email.failed",
    "email.complained",
    "email.suppressed",
  ])("preserves %s without treating it as delivered", async (type) => {
    const raw = JSON.stringify({ ...event, type });
    expect((await verifyResendWebhook(raw, signed(raw), secret, now))?.type).toBe(type);
  });
  it("rejects tampered body, wrong secret, missing signature and reserialized JSON", async () => {
    const raw = JSON.stringify(event);
    expect(await verifyResendWebhook(`${raw} `, signed(raw), secret, now)).toBeNull();
    expect(await verifyResendWebhook(raw, signed(raw), `${secret}x`, now)).toBeNull();
    expect(await verifyResendWebhook(raw, new Headers(), secret, now)).toBeNull();
    expect(
      await verifyResendWebhook(JSON.stringify(event, null, 2), signed(raw), secret, now),
    ).toBeNull();
  });
  it.each([-301, 301])(
    "rejects replay/future timestamps outside tolerance (%s seconds)",
    async (offset) => {
      const raw = JSON.stringify(event);
      expect(
        await verifyResendWebhook(raw, signed(raw, String(now / 1000 + offset)), secret, now),
      ).toBeNull();
    },
  );
  it("accepts a matching v1 signature during rotation and rejects unknown signature versions", async () => {
    const raw = JSON.stringify(event);
    const headers = signed(raw);
    const valid = headers.get("svix-signature");
    headers.set("svix-signature", `v2,invalid ${valid}`);
    expect(await verifyResendWebhook(raw, headers, secret, now)).not.toBeNull();
    headers.set("svix-signature", valid!.replace("v1,", "v2,"));
    expect(await verifyResendWebhook(raw, headers, secret, now)).toBeNull();
  });
  it.each([
    { ...event, created_at: "invalid" },
    { ...event, created_at: "2027-01-01T00:00:00Z" },
    { ...event, data: { email_id: "email-1", to: [] } },
    { ...event, data: { email_id: "email-1", to: ["not-an-email"] } },
    { ...event, data: { to: [message.to] } },
  ])("rejects signed but malformed email events", async (invalid) => {
    const raw = JSON.stringify(invalid);
    expect(await verifyResendWebhook(raw, signed(raw), secret, now)).toBeNull();
  });
});

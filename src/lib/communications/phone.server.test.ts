// @vitest-environment node
import { randomUUID } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { beginAccountPhone, confirmAccountPhone, loadAccountPhone } from "./phone.server";
const env = {
  TWILIO_API_KEY: "SYNTHETIC_CONNECTION",
  LOVABLE_API_KEY: "SYNTHETIC_GATEWAY",
  TWILIO_VERIFY_SERVICE_SID: `VA${"b".repeat(32)}`,
};
const phone = "+201012345678",
  sid = `VE${"c".repeat(32)}`,
  id = randomUUID(),
  lease = randomUUID();
const receipt = {
  sid,
  service_sid: env.TWILIO_VERIFY_SERVICE_SID,
  to: phone,
  status: "pending",
  valid: false,
};
const challenge = { challengeId: id, expiresAt: "2026-10-08T12:10:00Z" };
const bound = { phone, serviceSid: env.TWILIO_VERIFY_SERVICE_SID, verificationSid: sid, lease };
describe("account-bound Verify orchestration", () => {
  it("loads only the current actor's status", async () => {
    const db = vi.fn().mockResolvedValue({ enabled: false, phone: null, verifiedAt: null });
    expect((await loadAccountPhone(db)).ok).toBe(true);
    expect(db).toHaveBeenCalledWith("status");
  });
  it("never calls Twilio if ownership/quota reservation fails", async () => {
    const db = vi.fn().mockRejectedValue(new Error("PHONE_DISABLED")),
      fetcher = vi.fn();
    expect(await beginAccountPhone({ phone, locale: "en" }, db, env, fetcher)).toEqual({
      ok: false,
      error: "disabled",
    });
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("reserves before provider send and attaches the exact SID afterwards", async () => {
    const events: string[] = [];
    const db = vi.fn(async (action: string) => {
      events.push(action);
      return action === "reserve" ? challenge : {};
    });
    const fetcher = vi.fn(async () => {
      events.push("provider");
      return new Response(JSON.stringify(receipt));
    });
    expect(await beginAccountPhone({ phone, locale: "ar-EG" }, db, env, fetcher)).toEqual({
      ok: true,
      value: challenge,
    });
    expect(events).toEqual(["reserve", "provider", "sent"]);
    expect(db).toHaveBeenLastCalledWith("sent", { challengeId: id, verificationSid: sid });
  });
  it("never retries a timeout, preserves uncertain reservation and redacts provider data", async () => {
    const db = vi.fn().mockResolvedValueOnce(challenge).mockResolvedValue({});
    const fetcher = vi.fn().mockRejectedValue(new Error(`${phone} secret`));
    expect(await beginAccountPhone({ phone, locale: "en" }, db, env, fetcher)).toEqual({
      ok: false,
      error: "unavailable",
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(db).toHaveBeenLastCalledWith("uncertain", { challengeId: id });
  });
  it("rejects a browser-supplied actor, receipt, channel or phone at check boundary", async () => {
    const db = vi.fn(),
      fetcher = vi.fn();
    for (const extra of [
      { actor: randomUUID() },
      { phone },
      { approved: true },
      { verificationSid: sid },
    ])
      expect(
        (await confirmAccountPhone({ challengeId: id, code: "123456", ...extra }, db, env, fetcher))
          .ok,
      ).toBe(false);
    expect(db).not.toHaveBeenCalled();
    expect(fetcher).not.toHaveBeenCalled();
    expect(
      (await beginAccountPhone({ phone, locale: "en", channel: "whatsapp" }, db, env, fetcher)).ok,
    ).toBe(false);
  });
  it("commits provider-approved ownership with the database check lease, without storing the OTP", async () => {
    const db = vi.fn().mockResolvedValueOnce(bound).mockResolvedValueOnce({ verified: true });
    const fetcher = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ ...receipt, status: "approved", valid: true })),
      );
    expect(
      await confirmAccountPhone({ challengeId: id, code: "123456" }, db, env, fetcher),
    ).toEqual({ ok: true, value: { verified: true } });
    expect(db).toHaveBeenLastCalledWith("checked", { challengeId: id, lease, approved: true });
    expect(JSON.stringify(db.mock.calls)).not.toContain("123456");
  });
  it.each([
    { to: "+201112345678" },
    { sid: `VE${"d".repeat(32)}` },
    { service_sid: `VA${"d".repeat(32)}` },
  ])("does not approve a mismatched provider receipt %j", async (extra) => {
    const db = vi.fn().mockResolvedValueOnce(bound).mockResolvedValue({});
    const fetcher = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ ...receipt, status: "approved", valid: true, ...extra })),
      );
    expect(
      (await confirmAccountPhone({ challengeId: id, code: "123456" }, db, env, fetcher)).ok,
    ).toBe(false);
    expect(db).toHaveBeenLastCalledWith("check_failed", { challengeId: id, lease });
    expect(db.mock.calls.some((x) => x[0] === "checked")).toBe(false);
  });
  it("fails closed on a changed service and never calls the provider", async () => {
    const db = vi
      .fn()
      .mockResolvedValueOnce({ ...bound, serviceSid: `VA${"d".repeat(32)}` })
      .mockResolvedValue({});
    const fetcher = vi.fn();
    expect(
      await confirmAccountPhone({ challengeId: id, code: "123456" }, db, env, fetcher),
    ).toEqual({ ok: false, error: "challenge" });
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("does not claim success if the provider approves but deletion/ownership commit fails", async () => {
    const db = vi
      .fn()
      .mockResolvedValueOnce(bound)
      .mockRejectedValueOnce(new Error("PHONE_ACCOUNT_UNAVAILABLE"))
      .mockResolvedValue({});
    const fetcher = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ ...receipt, status: "approved", valid: true })),
      );
    expect(
      await confirmAccountPhone({ challengeId: id, code: "123456" }, db, env, fetcher),
    ).toEqual({ ok: false, error: "unavailable" });
  });
});

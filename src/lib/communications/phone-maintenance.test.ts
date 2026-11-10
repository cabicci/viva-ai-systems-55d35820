// @vitest-environment node
import { it, expect, vi } from "vitest";
import { beginAccountPhone, confirmAccountPhone } from "./phone.server";
const env = { TWILIO_VERIFY_SERVICE_SID: "VA" + "b".repeat(32) };
it("maintenance pause prevents any new phone provider call", async () => {
  const database = vi.fn().mockRejectedValue(new Error("COMMUNICATIONS_STARTS_PAUSED"));
  const transport = vi.fn();
  expect(
    await beginAccountPhone(
      { phone: "+201012345678", channel: "sms", locale: "en" },
      database,
      env,
      transport,
    ),
  ).toEqual({ ok: false, error: "disabled" });
  expect(
    await confirmAccountPhone(
      { challengeId: "11111111-1111-4111-8111-111111111111", code: "123456" },
      database,
      env,
      transport,
    ),
  ).toEqual({ ok: false, error: "disabled" });
  expect(transport).not.toHaveBeenCalled();
});

/** Private account orchestration: never import into a browser component. */
import { z } from "zod";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { accountPhoneStart, accountPhoneCheck } from "./phone-contracts";
import type { PhoneResult, PhoneStatus, PhoneChallenge, PhoneError } from "./phone-contracts";
import { startPhoneVerification, checkPhoneVerification } from "./twilio.server";

type Env = Record<string, string | undefined>;
export type PhoneDatabase = (action: string, data?: Record<string, unknown>) => Promise<unknown>;
const service = z.string().regex(/^VA[a-fA-F0-9]{32}$/);
const status = z.object({
  enabled: z.boolean(),
  phone: z.string().nullable(),
  verifiedAt: z.string().nullable(),
});
const challenge = z.object({ challengeId: z.string().uuid(), expiresAt: z.string() });
const binding = z.object({
  phone: z.string().regex(/^\+[1-9][0-9]{7,14}$/),
  serviceSid: service,
  verificationSid: z.string().regex(/^VE[a-fA-F0-9]{32}$/),
  lease: z.string().uuid(),
});
function failure(error: unknown): { ok: false; error: PhoneError } {
  const message = error instanceof Error ? error.message : "";
  if (/PHONE_DISABLED/.test(message)) return { ok: false, error: "disabled" };
  if (/EMAIL_CONFIRMATION_REQUIRED/.test(message)) return { ok: false, error: "email" };
  if (/PHONE_INVALID|INVALID_PHONE|COUNTRY_UNAVAILABLE/.test(message))
    return { ok: false, error: "phone" };
  if (/PHONE_LIMIT|PHONE_COOLDOWN|RATE_LIMITED/.test(message)) return { ok: false, error: "limit" };
  if (/PHONE_CHALLENGE/.test(message)) return { ok: false, error: "challenge" };
  return { ok: false, error: "unavailable" };
}
export async function loadAccountPhone(db: PhoneDatabase): Promise<PhoneResult<PhoneStatus>> {
  try {
    return { ok: true, value: status.parse(await db("status")) };
  } catch (error) {
    return failure(error);
  }
}
export async function beginAccountPhone(
  input: unknown,
  db: PhoneDatabase,
  env: Env,
  transport: typeof fetch = fetch,
): Promise<PhoneResult<PhoneChallenge>> {
  let reservation: PhoneChallenge | undefined;
  try {
    const data = accountPhoneStart.parse(input);
    const serviceSid = service.parse(env.TWILIO_VERIFY_SERVICE_SID);
    const country = parsePhoneNumberFromString(data.phone)?.country;
    if (!country) throw new Error("PHONE_INVALID");
    reservation = challenge.parse(await db("reserve", { phone: data.phone, country, serviceSid }));
    // The durable reservation and quotas commit BEFORE the provider call.
    const receipt = await startPhoneVerification({ ...data, channel: "sms" }, env, transport);
    await db("sent", {
      challengeId: reservation.challengeId,
      verificationSid: receipt.verificationSid,
    });
    return { ok: true, value: reservation };
  } catch (error) {
    if (reservation) {
      // A timeout/invalid provider receipt may still have sent a code. Retain
      // its reservation, do not retry, refund the budget, or switch channels.
      try {
        await db("uncertain", { challengeId: reservation.challengeId });
      } catch {
        /* Lease expires; no retry. */
      }
    }
    return failure(error);
  }
}
export async function confirmAccountPhone(
  input: unknown,
  db: PhoneDatabase,
  env: Env,
  transport: typeof fetch = fetch,
): Promise<PhoneResult<{ verified: boolean }>> {
  let acquired: z.infer<typeof binding> | undefined;
  let challengeId: string | undefined;
  try {
    const data = accountPhoneCheck.parse(input);
    challengeId = data.challengeId;
    acquired = binding.parse(await db("claim_check", { challengeId }));
    if (acquired.serviceSid !== service.parse(env.TWILIO_VERIFY_SERVICE_SID))
      throw new Error("PHONE_CHALLENGE_SERVICE_CHANGED");
    const approved = await checkPhoneVerification(
      {
        verificationSid: acquired.verificationSid,
        phone: acquired.phone,
        code: data.code,
      },
      env,
      transport,
    );
    const result = z.object({ verified: z.boolean() }).parse(
      await db("checked", {
        challengeId,
        lease: acquired.lease,
        approved,
      }),
    );
    return { ok: true, value: result };
  } catch (error) {
    if (acquired && challengeId) {
      try {
        await db("check_failed", { challengeId, lease: acquired.lease });
      } catch {
        /* Do not claim success. */
      }
    }
    return failure(error);
  }
}

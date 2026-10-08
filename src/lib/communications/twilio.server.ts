/** Server-only transport. Import dynamically inside a server handler. */
import { z } from "zod";
import { phoneVerificationInput } from "./contracts";
import type { CommunicationsReadiness } from "./contracts";

const sid = (prefix: string) => new RegExp(`^${prefix}[a-fA-F0-9]{32}$`);
const resultSchema = z.object({
  sid: z.string().regex(sid("VE")),
  service_sid: z.string().regex(sid("VA")),
  to: z.string(),
  status: z.string(),
  valid: z.boolean().optional(),
});
type Env = Record<string, string | undefined>;
type Transport = typeof fetch;
type Authorizer = (
  name: "has_role" | "lc09_account_active",
  parameters?: { _user_id: string; _role: "admin" },
) => PromiseLike<{ data: unknown; error: unknown }>;

export async function readAuthorizedCommunicationsReadiness(
  userId: string,
  rpc: Authorizer,
  env: Env = process.env,
  transport: Transport = fetch,
): Promise<CommunicationsReadiness> {
  const role = await rpc("has_role", { _user_id: userId, _role: "admin" });
  if (role.error || role.data !== true) throw new Error("Forbidden: admin role required");
  const active = await rpc("lc09_account_active");
  if (active.error || active.data !== true) throw new Error("ACCOUNT_DELETION_PENDING");
  return readCommunicationsReadiness(env, transport);
}

function configuration(env: Env) {
  const account = env.TWILIO_ACCOUNT_SID;
  const token = env.TWILIO_AUTH_TOKEN;
  const service = env.TWILIO_VERIFY_SERVICE_SID;
  if (!account || !sid("AC").test(account) || !token || !service || !sid("VA").test(service))
    throw new Error("COMMUNICATIONS_NOT_CONFIGURED");
  return { account, token, service };
}

async function request(env: Env, transport: Transport, resource: string, body?: URLSearchParams) {
  const config = configuration(env);
  let response: Response;
  try {
    response = await transport(
      `https://verify.twilio.com/v2/Services/${config.service}${resource}`,
      {
        method: body ? "POST" : "GET",
        redirect: "error", // Never forward credentials to a redirected origin.
        signal: AbortSignal.timeout(8_000),
        headers: {
          Authorization: `Basic ${btoa(`${config.account}:${config.token}`)}`,
          ...(body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
        },
        ...(body ? { body } : {}),
      },
    );
  } catch {
    // A timed-out POST may have succeeded. No automatic retry or channel fallback.
    throw new Error("COMMUNICATIONS_PROVIDER_UNCERTAIN");
  }
  if (!response.ok) {
    // Provider text can include a phone number, request details or account data.
    // Do not return it, attach it as a cause, or log it.
    if (response.status === 429) throw new Error("COMMUNICATIONS_RATE_LIMITED");
    if (response.status === 404) throw new Error("COMMUNICATIONS_VERIFICATION_UNAVAILABLE");
    throw new Error("COMMUNICATIONS_PROVIDER_REJECTED");
  }
  try {
    return (await response.json()) as unknown;
  } catch {
    throw new Error("COMMUNICATIONS_PROVIDER_INVALID");
  }
}

export async function readCommunicationsReadiness(
  env: Env = process.env,
  transport: Transport = fetch,
): Promise<CommunicationsReadiness> {
  const credentialsConfigured =
    !!env.TWILIO_ACCOUNT_SID && sid("AC").test(env.TWILIO_ACCOUNT_SID) && !!env.TWILIO_AUTH_TOKEN;
  const verifyConfigured =
    credentialsConfigured &&
    !!env.TWILIO_VERIFY_SERVICE_SID &&
    sid("VA").test(env.TWILIO_VERIFY_SERVICE_SID);
  let verifyReachable: boolean | null = null;
  if (verifyConfigured) {
    try {
      const response = await request(env, transport, "");
      verifyReachable = z
        .object({ sid: z.literal(env.TWILIO_VERIFY_SERVICE_SID!) })
        .safeParse(response).success;
    } catch {
      verifyReachable = false;
    }
  }
  return {
    credentialsConfigured,
    verifyConfigured,
    verifyReachable,
    messagingConfigured:
      credentialsConfigured &&
      !!env.TWILIO_MESSAGING_SERVICE_SID &&
      sid("MG").test(env.TWILIO_MESSAGING_SERVICE_SID),
    whatsappSenderConfigured: /^whatsapp:\+[1-9][0-9]{7,14}$/.test(env.TWILIO_WHATSAPP_FROM ?? ""),
    activationAvailable: false,
  };
}

// These transport methods are not exposed as public endpoints. The pending
// Lovable database boundary must authorize the user and reserve quotas BEFORE
// using them, then bind the receipt to the exact user/phone/challenge.
export async function startPhoneVerification(
  input: unknown,
  env: Env,
  transport: Transport = fetch,
) {
  const data = phoneVerificationInput.parse(input);
  const response = resultSchema.safeParse(
    await request(
      env,
      transport,
      "/Verifications",
      new URLSearchParams({
        To: data.phone,
        Channel: data.channel,
        Locale: data.locale === "en" ? "en" : "ar",
      }),
    ),
  );
  if (
    !response.success ||
    response.data.service_sid !== env.TWILIO_VERIFY_SERVICE_SID ||
    response.data.to !== data.phone ||
    response.data.status !== "pending"
  )
    throw new Error("COMMUNICATIONS_PROVIDER_INVALID");
  return { verificationSid: response.data.sid, phone: data.phone };
}

export async function checkPhoneVerification(
  input: { verificationSid: string; phone: string; code: string },
  env: Env,
  transport: Transport = fetch,
) {
  const data = z
    .object({
      verificationSid: z.string().regex(sid("VE")),
      phone: z.string().regex(/^\+[1-9][0-9]{7,14}$/),
      code: z.string().regex(/^[0-9]{4,10}$/),
    })
    .strict()
    .parse(input);
  const response = resultSchema.safeParse(
    await request(
      env,
      transport,
      "/VerificationCheck",
      new URLSearchParams({
        VerificationSid: data.verificationSid,
        Code: data.code,
      }),
    ),
  );
  if (
    !response.success ||
    response.data.service_sid !== env.TWILIO_VERIFY_SERVICE_SID ||
    response.data.sid !== data.verificationSid ||
    response.data.to !== data.phone
  )
    throw new Error("COMMUNICATIONS_PROVIDER_INVALID");
  return response.data.status === "approved" && response.data.valid === true;
}

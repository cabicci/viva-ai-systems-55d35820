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
type Operation = "readiness" | "start" | "check";
type FailureStage = "configuration" | "transport" | "http" | "json" | "receipt";
const operations = {
  "": "readiness",
  "/Verifications": "start",
  "/VerificationCheck": "check",
} as const;
const providerErrorSchema = z.object({
  code: z.number().int().min(1).max(999_999),
});

function reportFailure(
  operation: Operation,
  stage: FailureStage,
  httpStatus?: number,
  providerCode?: number,
) {
  // Only fixed labels and validated numbers cross this boundary. Never log
  // input, URLs, headers, SIDs, provider text, raw bodies or caught errors.
  console.warn("[masaarat.phone]", {
    operation,
    stage,
    ...(httpStatus === undefined ? {} : { httpStatus }),
    ...(providerCode === undefined ? {} : { providerCode }),
  });
}

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

function credentials(env: Env) {
  // Native Lovable connector keys are opaque gateway credentials, never a
  // Twilio SK SID/secret. Partial connector configuration must fail closed;
  // do not silently switch to another account through legacy credentials.
  if (env.TWILIO_API_KEY !== undefined || env.LOVABLE_API_KEY !== undefined) {
    if (!env.TWILIO_API_KEY?.trim() || !env.LOVABLE_API_KEY?.trim())
      throw new Error("COMMUNICATIONS_NOT_CONFIGURED");
    return {
      base: "https://connector-gateway.lovable.dev/twilio/verify/v2/Services/",
      headers: {
        Authorization: `Bearer ${env.LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": env.TWILIO_API_KEY,
      } as Record<string, string>,
    };
  }
  const account = env.TWILIO_ACCOUNT_SID;
  const token = env.TWILIO_AUTH_TOKEN;
  if (!account || !sid("AC").test(account) || !token?.trim())
    throw new Error("COMMUNICATIONS_NOT_CONFIGURED");
  return {
    base: "https://verify.twilio.com/v2/Services/",
    headers: {
      Authorization: `Basic ${btoa(`${account}:${token}`)}`,
    } as Record<string, string>,
  };
}

function configuration(env: Env) {
  const connection = credentials(env);
  const service = env.TWILIO_VERIFY_SERVICE_SID;
  if (!service || !sid("VA").test(service)) throw new Error("COMMUNICATIONS_NOT_CONFIGURED");
  return { ...connection, service };
}

async function request(
  env: Env,
  transport: Transport,
  resource: keyof typeof operations,
  body?: URLSearchParams,
) {
  const operation = operations[resource];
  let config: ReturnType<typeof configuration>;
  try {
    config = configuration(env);
  } catch {
    reportFailure(operation, "configuration");
    throw new Error("COMMUNICATIONS_NOT_CONFIGURED");
  }
  let response: Response;
  try {
    response = await transport(`${config.base}${config.service}${resource}`, {
      method: body ? "POST" : "GET",
      redirect: "error", // Never forward credentials to a redirected origin.
      signal: AbortSignal.timeout(8_000),
      headers: {
        ...config.headers,
        ...(body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
      },
      ...(body ? { body } : {}),
    });
  } catch {
    // A timed-out POST may have succeeded. No automatic retry or channel fallback.
    reportFailure(operation, "transport");
    throw new Error("COMMUNICATIONS_PROVIDER_UNCERTAIN");
  }
  if (!response.ok) {
    // Provider text can include a phone number, request details or account data.
    // Extract only a bounded numeric error code; discard every other field.
    let providerCode: number | undefined;
    try {
      const parsed = providerErrorSchema.safeParse(await response.json());
      if (parsed.success) providerCode = parsed.data.code;
    } catch {
      /* Non-JSON gateway errors still have an HTTP status. */
    }
    reportFailure(operation, "http", response.status, providerCode);
    if (response.status === 429) throw new Error("COMMUNICATIONS_RATE_LIMITED");
    if (response.status === 404) throw new Error("COMMUNICATIONS_VERIFICATION_UNAVAILABLE");
    throw new Error("COMMUNICATIONS_PROVIDER_REJECTED");
  }
  try {
    return (await response.json()) as unknown;
  } catch {
    reportFailure(operation, "json", response.status);
    throw new Error("COMMUNICATIONS_PROVIDER_INVALID");
  }
}

export async function readCommunicationsReadiness(
  env: Env = process.env,
  transport: Transport = fetch,
): Promise<CommunicationsReadiness> {
  let credentialsConfigured = false;
  try {
    credentials(env);
    credentialsConfigured = true;
  } catch {
    /* Presence only. */
  }
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
      if (!verifyReachable) reportFailure("readiness", "receipt");
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

// These transports are private. phone.server reserves database quotas before
// calling them and binds the receipt to the exact current actor/challenge.
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
  ) {
    reportFailure("start", "receipt");
    throw new Error("COMMUNICATIONS_PROVIDER_INVALID");
  }
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
  ) {
    reportFailure("check", "receipt");
    throw new Error("COMMUNICATIONS_PROVIDER_INVALID");
  }
  return response.data.status === "approved" && response.data.valid === true;
}

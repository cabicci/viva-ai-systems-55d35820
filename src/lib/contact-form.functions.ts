import { z } from "zod";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import {
  buildHubSpotSubmission,
  contactFormInputSchema,
  HUBSPOT_CONTACT_FORM_ID,
  HUBSPOT_PORTAL_ID,
} from "./contact-form";
import { enforceRateLimit, RateLimitExceededError } from "./rate-limit.server";
import {
  reserveContactSubmission,
  completeContactSubmission,
  dispatchAcceptedContact,
  beginContactSubmission,
  readContactRecovery,
} from "./contact-mail.server";
import { verifyTurnstileToken } from "./turnstile.server";

export type ContactSubmitResult =
  | { success: true; replayed?: boolean }
  | {
      success: false;
      error:
        | "invalid_phone"
        | "captcha"
        | "rate_limit"
        | "service_unavailable"
        | "pending_review"
        | "closed_manual"
        | "withdrawn";
    };

function readClientIp(headers: Headers): string | undefined {
  const raw =
    headers.get("cf-connecting-ip") ??
    headers.get("x-real-ip") ??
    headers.get("x-forwarded-for")?.split(",")[0];
  const value = raw?.trim();
  if (!value || value.length > 64 || !/^[0-9a-f:.]+$/i.test(value)) return undefined;
  return value;
}

function readCookie(cookieHeader: string | null, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  for (const entry of cookieHeader.split(";")) {
    const separator = entry.indexOf("=");
    if (separator < 0) continue;
    if (entry.slice(0, separator).trim() !== name) continue;
    const value = entry.slice(separator + 1).trim();
    return value && value.length <= 256 ? decodeURIComponent(value) : undefined;
  }
  return undefined;
}

async function stableAnonymousId(ipAddress: string | undefined): Promise<string> {
  const source = `masaarat-contact:${ipAddress ?? "unknown"}`;
  const digest = new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(source)),
  );
  const bytes = digest.slice(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export const submitContactForm = createServerFn({ method: "POST" })
  .inputValidator((input) => contactFormInputSchema.parse(input))
  .handler(async ({ data }): Promise<ContactSubmitResult> => {
    const attemptId = data.attemptId;
    if (!attemptId) return { success: false, error: "service_unavailable" };
    const request = getRequest();
    const ipAddress = readClientIp(request.headers);
    if (data.phone) {
      const phone = parsePhoneNumberFromString(data.phone);
      if (!phone?.isValid() || phone.country !== data.countryCode) {
        return { success: false, error: "invalid_phone" };
      }
    }

    const captcha = await verifyTurnstileToken(data.turnstileToken, ipAddress);
    if (!captcha.success) return { success: false, error: "captcha" };

    try {
      await enforceRateLimit({
        userId: await stableAnonymousId(ipAddress),
        bucketKey: "public:contact-hubspot",
        maxCalls: 5,
        windowSeconds: 60 * 60,
      });
    } catch (error) {
      console.warn("Contact form rate limit rejected:", error);
      return {
        success: false,
        error: error instanceof RateLimitExceededError ? "rate_limit" : "service_unavailable",
      };
    }

    const portalId = process.env.HUBSPOT_PORTAL_ID ?? HUBSPOT_PORTAL_ID;
    const formId = process.env.HUBSPOT_CONTACT_FORM_ID ?? HUBSPOT_CONTACT_FORM_ID;
    const endpoint = `https://api.hsforms.com/submissions/v3/integration/submit/${encodeURIComponent(portalId)}/${encodeURIComponent(formId)}`;
    const payload = buildHubSpotSubmission(data, {
      ipAddress,
      hutk: readCookie(request.headers.get("cookie"), "hubspotutk"),
    });

    let intake: Awaited<ReturnType<typeof reserveContactSubmission>>;
    try {
      intake = await reserveContactSubmission(data);
    } catch {
      return { success: false, error: "service_unavailable" };
    }
    if (intake.state === "reconciliation_required")
      return { success: false, error: "pending_review" };
    if (intake.state === "withdrawn") return { success: false, error: "withdrawn" };
    if (intake.state === "closed_manual") return { success: false, error: "closed_manual" };
    if (intake.state === "accepted") {
      await dispatchAcceptedContact(attemptId).catch(() => {});
      return { success: true, replayed: true };
    }
    const claim = intake.claim;
    try {
      if (!(await beginContactSubmission(attemptId, claim)))
        return { success: false, error: "pending_review" };
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(12_000),
      });
      if (!response.ok) {
        await completeContactSubmission(attemptId, claim, false).catch(() => {});
        console.error("HubSpot contact submission failed", {
          status: response.status,
        });
        return {
          success: false,
          error: "pending_review",
        };
      }
      await completeContactSubmission(attemptId, claim, true);
      try {
        await dispatchAcceptedContact(attemptId);
      } catch {
        // HubSpot already accepted the request. Do not invite a duplicate submission.
        console.error("Contact acknowledgement processing deferred");
      }
      return { success: true };
    } catch (error) {
      // A timeout can follow remote acceptance. Never issue a second POST under
      // this attempt ID; retain the frozen request for human reconciliation.
      await completeContactSubmission(attemptId, claim, false).catch(() => {});
      console.error("Contact intake requires reconciliation");
      return { success: false, error: "pending_review" };
    }
  });

// Capability lookup returns no identity, content or delivery credentials.
export const getContactSubmissionState = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        attemptId: z.string().uuid(),
        recoveryToken: z.string().regex(/^[0-9a-f]{64}$/),
      })
      .strict()
      .parse(input),
  )
  .handler(async ({ data }) => {
    const request = getRequest();
    await enforceRateLimit({
      userId: await stableAnonymousId(readClientIp(request.headers)),
      bucketKey: "public:contact-state",
      maxCalls: 30,
      windowSeconds: 60,
    });
    return { state: await readContactRecovery(data.attemptId, data.recoveryToken) };
  });

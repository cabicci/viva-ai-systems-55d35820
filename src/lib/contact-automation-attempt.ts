import type { ContactFormInput } from "./contact-form";

/** Identity is bound to business input, not a refreshed CAPTCHA, IP or cookie. */
export async function contactAttemptFingerprint(input: ContactFormInput): Promise<string> {
  const payload = JSON.stringify([
    input.requestType ?? "support",
    input.firstName.trim(),
    (input.lastName ?? "").trim(),
    input.email.trim().toLowerCase(),
    input.phone.trim(),
    input.countryCode.toUpperCase(),
    (input.company ?? "").trim(),
    input.message.trim(),
    input.locale,
    input.consentToProcess,
  ]);
  const bytes = new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(payload)),
  );
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
}

export type ContactAttempt = {
  id: string;
  fingerprint: string;
  status: "pending" | "accepted" | "closed_manual" | "withdrawn";
  conversionTracked: boolean;
  recoveryToken?: string;
};
export function readContactAttempt(value: unknown): ContactAttempt | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (
    typeof record.id !== "string" ||
    !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(record.id) ||
    typeof record.fingerprint !== "string" ||
    !/^[0-9a-f]{64}$/.test(record.fingerprint)
  )
    return null;
  return {
    id: record.id,
    fingerprint: record.fingerprint,
    status:
      record.status === "accepted"
        ? "accepted"
        : record.status === "withdrawn"
          ? "withdrawn"
          : record.status === "closed_manual"
            ? "closed_manual"
            : "pending",
    conversionTracked: record.conversionTracked === true,
    ...(typeof record.recoveryToken === "string" && /^[0-9a-f]{64}$/.test(record.recoveryToken)
      ? { recoveryToken: record.recoveryToken }
      : {}),
  };
}
/** This nonce grants no read/withdraw permission; the server binds it atomically. */
export function contactAttemptIdentity(
  fingerprint: string,
  previous: ContactAttempt | null,
): ContactAttempt {
  // Editing A→B→A cannot replace a still-pending identity. Ending it and starting
  // another request are explicit UI actions, independent of the page URL.
  return (
    readContactAttempt(previous) ?? {
      id: crypto.randomUUID(),
      fingerprint,
      status: "pending",
      conversionTracked: false,
      recoveryToken: Array.from(crypto.getRandomValues(new Uint8Array(32)), (byte) =>
        byte.toString(16).padStart(2, "0"),
      ).join(""),
    }
  );
}

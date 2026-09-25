/** Server-only transactional transport. No credentials or payloads are logged. */
export type ResendConfig = {
  apiKey: string;
  from: string;
  replyTo?: string;
  enabled: boolean;
};

export type TransactionalEmail = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  /** Stable outbox ID; reuse the exact payload when retrying within 24 hours. */
  idempotencyKey: string;
};

export type ResendResult =
  | { ok: true; emailId: string }
  | {
      ok: false;
      code:
        | "disabled"
        | "configuration"
        | "invalid_message"
        | "provider_rejected"
        | "provider_unavailable"
        | "unknown_outcome";
      retryable: boolean;
    };

const addressPattern =
  /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?\.[A-Za-z]{2,63}$/;
const idPattern = /^[A-Za-z0-9_-]{1,200}$/;

function validAddress(address: unknown): address is string {
  return typeof address === "string" && address.length <= 254 && addressPattern.test(address);
}

function senderAddress(from: string): string | null {
  if (/[\r\n]/.test(from) || from.includes("\0")) return null;
  const match = from.match(/^(?:[^<>]+<)?([^<>]+)>?$/);
  const address = match?.[1]?.trim();
  if (!validAddress(address)) return null;
  const domain = address.split("@")[1].toLowerCase();
  return domain === "masaarat.ai" || domain.endsWith(".masaarat.ai") ? address : null;
}

export async function sendTransactionalEmail(
  config: ResendConfig,
  message: TransactionalEmail,
  fetcher: typeof fetch = fetch,
): Promise<ResendResult> {
  if (config.enabled !== true) return { ok: false, code: "disabled", retryable: false };
  if (
    !/^re_[A-Za-z0-9_-]+$/.test(config.apiKey) ||
    !senderAddress(config.from) ||
    (config.replyTo !== undefined && !validAddress(config.replyTo))
  ) {
    return { ok: false, code: "configuration", retryable: false };
  }
  if (
    !validAddress(message.to) ||
    !message.subject.trim() ||
    message.subject.length > 200 ||
    /[\r\n]/.test(message.subject) ||
    message.subject.includes("\0") ||
    !message.text.trim() ||
    message.text.length > 60_000 ||
    (message.html !== undefined && message.html.length > 200_000) ||
    !/^[A-Za-z0-9_:/.-]{1,256}$/.test(message.idempotencyKey)
  ) {
    return { ok: false, code: "invalid_message", retryable: false };
  }

  try {
    const response = await fetcher("https://api.resend.com/emails", {
      method: "POST",
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": message.idempotencyKey,
      },
      body: JSON.stringify({
        from: config.from,
        to: [message.to],
        subject: message.subject,
        text: message.text,
        ...(message.html !== undefined ? { html: message.html } : {}),
        ...(config.replyTo ? { reply_to: config.replyTo } : {}),
      }),
    });
    if (response.status === 429)
      return { ok: false, code: "provider_unavailable", retryable: true };
    if (response.status >= 500) return { ok: false, code: "unknown_outcome", retryable: true };
    if (!response.ok) {
      const error = (await response.json().catch(() => null)) as { name?: string } | null;
      const concurrent =
        response.status === 409 && error?.name === "concurrent_idempotent_requests";
      return {
        ok: false,
        code: concurrent ? "provider_unavailable" : "provider_rejected",
        retryable: concurrent,
      };
    }
    const result = (await response.json()) as { id?: unknown };
    if (typeof result.id !== "string" || !idPattern.test(result.id)) {
      return { ok: false, code: "unknown_outcome", retryable: true };
    }
    // This confirms API acceptance only. Delivery requires a verified webhook.
    return { ok: true, emailId: result.id };
  } catch {
    // The remote service might have accepted the request before the connection failed.
    return { ok: false, code: "unknown_outcome", retryable: true };
  }
}

const encoder = new TextEncoder();

function decodeBase64(value: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}

/** Svix HMAC protocol, implemented with WebCrypto to run in Deno without npm imports. */
export async function verifyResendSignature(
  rawBody: string,
  headers: Headers,
  webhookSecret: string,
  nowMs = Date.now(),
): Promise<boolean> {
  const eventId = headers.get("svix-id");
  const timestamp = headers.get("svix-timestamp");
  const signatures = headers.get("svix-signature");
  if (
    !eventId ||
    !idPattern.test(eventId) ||
    !timestamp ||
    !/^\d{1,12}$/.test(timestamp) ||
    !signatures ||
    signatures.length > 4096 ||
    !Number.isFinite(nowMs) ||
    Math.abs(nowMs / 1000 - Number(timestamp)) > 300 ||
    rawBody.length > 100_000 ||
    !/^whsec_[A-Za-z0-9+/]+={0,2}$/.test(webhookSecret)
  )
    return false;
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      decodeBase64(webhookSecret.slice(6)),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const signedContent = encoder.encode(`${eventId}.${timestamp}.${rawBody}`);
    for (const signature of signatures.split(" ")) {
      const [version, value, extra] = signature.split(",");
      if (
        version !== "v1" ||
        !value ||
        extra !== undefined ||
        !/^[A-Za-z0-9+/]+={0,2}$/.test(value)
      )
        continue;
      const bytes = decodeBase64(value);
      if (bytes.length === 32 && (await crypto.subtle.verify("HMAC", key, bytes, signedContent)))
        return true;
    }
    return false;
  } catch {
    return false;
  }
}

export type VerifiedResendEvent = {
  eventId: string;
  type: string;
  emailId: string;
  occurredAt: string;
  recipients: string[];
};

/** Authentication only; callers still deduplicate eventId and match their outbox recipient. */
export async function verifyResendWebhook(
  rawBody: string,
  headers: Headers,
  webhookSecret: string,
  nowMs = Date.now(),
): Promise<VerifiedResendEvent | null> {
  if (!(await verifyResendSignature(rawBody, headers, webhookSecret, nowMs))) return null;
  try {
    const event = JSON.parse(rawBody);
    if (
      !event ||
      typeof event !== "object" ||
      typeof event.type !== "string" ||
      !/^email\.[a-z_]{1,50}$/.test(event.type) ||
      typeof event.created_at !== "string" ||
      !/^\d{4}-\d{2}-\d{2}T.+(?:Z|[+-]\d{2}:\d{2})$/.test(event.created_at) ||
      !Number.isFinite(Date.parse(event.created_at)) ||
      Date.parse(event.created_at) > nowMs + 300_000 ||
      typeof event.data?.email_id !== "string" ||
      !idPattern.test(event.data.email_id) ||
      !Array.isArray(event.data?.to) ||
      event.data.to.length < 1 ||
      event.data.to.length > 50 ||
      !event.data.to.every(validAddress)
    )
      return null;
    return {
      eventId: headers.get("svix-id")!,
      type: event.type,
      emailId: event.data.email_id,
      occurredAt: new Date(event.created_at).toISOString(),
      recipients: event.data.to,
    };
  } catch {
    return null;
  }
}

/** Diagnostic minimization, not arbitrary prose/PII classification.
 * URL paths remain useful for diagnosis; credentials, search and fragment do not.
 */
const REDACTED = "[redacted]";
const BAD_URL = "[redacted URL]";
const MAX_INPUT = 20_000;
const MAX_DEPTH = 4;
const MAX_NODES = 80;
const MAX_ITEMS = 20;
const URL_ENTITIES: Record<string, string> = { amp: "&", colon: ":", sol: "/", quest: "?", num: "#", equals: "=", commat: "@" };

function decodeForInspection(value: string): string | null {
  if (value.length > MAX_INPUT) return null;
  let text = value;
  for (let i = 0; i < 3; i++) {
    const before = text;
    text = text.replace(/\\u([\da-f]{4})|\\x([\da-f]{2})/gi, (_, u, x) => String.fromCharCode(parseInt(u ?? x, 16)));
    text = text.replace(/&#(x[\da-f]+|\d+);/gi, (_, n: string) => {
      const point = n[0].toLowerCase() === "x" ? parseInt(n.slice(1), 16) : Number(n);
      return point <= 0x10ffff ? String.fromCodePoint(point) : "\uFFFD";
    });
    text = text.replace(/&(amp|colon|sol|quest|num|equals|commat);/gi, (_, name: string) =>
      URL_ENTITIES[name.toLowerCase()]!);
    if (/%[\da-f]{2}/i.test(text)) {
      try { text = decodeURIComponent(text); } catch { return null; }
    }
    if (text === before) return text;
  }
  // Do not preserve opaque deeply encoded content that we did not inspect.
  return /%[\da-f]{2}|\\[ux][\da-f]|&#/i.test(text) ? null : text;
}

export function sanitizeLogUrl(value: string): string {
  const decoded = decodeForInspection(value);
  if (decoded == null) return BAD_URL;
  const text = decoded.trim();
  // Controls, backslashes, malformed escapes or whitespace are not a URL we
  // can safely preserve. Do not echo the input on any parse failure.
  if (!text || /[\s\\\u0000-\u001f\u007f%]/.test(text)) return BAD_URL;
  try {
    const relative = text.startsWith("/") && !text.startsWith("//");
    const protocolRelative = text.startsWith("//");
    const bare = /^(?:[a-z\d-]+\.)+[a-z]{2,}(?::\d+)?(?:[/?#]|$)/i.test(text);
    if (!relative && !protocolRelative && !bare && !/^https?:\/\//i.test(text)) return BAD_URL;
    const url = new URL(relative ? text : protocolRelative ? `https:${text}` : bare ? `https://${text}` : text, "https://diagnostic.invalid");
    if (!/^https?:$/.test(url.protocol)) return BAD_URL;
    const path = url.pathname;
    if (relative) return path;
    return `${protocolRelative ? "//" : bare ? "" : url.protocol + "//"}${url.host}${path}`;
  } catch { return BAD_URL; }
}

export function sanitizeLogText(value: string, limit = 2000): string {
  const decoded = decodeForInspection(value);
  if (decoded == null) return REDACTED;
  // Encoded delimiters could split a credential out of its URL token. Omit
  // ambiguous text rather than turning an encoded query into visible prose.
  const delimiters = (text: string) => text.match(/[\s"'<>`]/g)?.join("") ?? "";
  if (delimiters(decoded) !== delimiters(value)) return REDACTED;
  if (/\bhttps?:\/\/[^\s]*:\s+[^\r\n]*@|\bhttps?:\/\/[^\s]*[?#][^\s]*=\s+/i.test(decoded)) return REDACTED;
  // Whole URL tokens are sanitized before length truncation, including encoded
  // query delimiters. Stack-frame line/column suffixes in paths remain useful.
  const text = decoded
    .replace(/\b(?:https?|wss?|blob|data|javascript|file):[^\s]+|\/\/[^\s]+|\b(?:[a-z\d-]+\.)+[a-z]{2,}(?::\d+)?[/?#][^\s]*|\/(?!\/)[^\s]*[?#][^\s]*/gi, token => sanitizeLogUrl(token))
    .replace(/\b(Bearer|Basic)\s+[^\s"',;<>]+/gi, "$1 [redacted]");
  return text.slice(0, limit);
}

function sensitiveKey(key: string): boolean {
  return /password|passwd|secret|token|authorization|cookie|apikey|accesskey|privatekey|servicerolekey|signingkey|credential|authentication|session|bearer|jwt|verificationcode|authcode|^otp$|^pwd$/.test(key.replace(/[^a-z\d]/gi, "").toLowerCase());
}
function urlKey(key: string): boolean {
  return /(?:url|uri|href|location|referer|referrer|endpoint|redirectto|^src$)/i.test(key);
}

export function sanitizeLogExtra(value: unknown): unknown {
  const seen = new WeakSet<object>();
  let nodes = 0;
  function visit(input: unknown, depth: number, key = ""): unknown {
    if (++nodes > MAX_NODES || depth > MAX_DEPTH) return "[truncated]";
    if (sensitiveKey(key)) return REDACTED;
    if (input === null || typeof input === "boolean") return input;
    if (typeof input === "number") return Number.isFinite(input) ? input : null;
    if (typeof input === "string") return urlKey(key) ? sanitizeLogUrl(input) : sanitizeLogText(input, 1000);
    if (typeof input !== "object") return REDACTED;
    try {
      if (seen.has(input)) return "[circular]";
      seen.add(input);
      if (Array.isArray(input)) {
        const result: unknown[] = [];
        for (let i = 0; i < Math.min(input.length, MAX_ITEMS); i++) {
          const field = Object.getOwnPropertyDescriptor(input, String(i));
          result.push(field && "value" in field ? visit(field.value, depth + 1, key) : REDACTED);
        }
        if (input.length > MAX_ITEMS) result.push("[truncated]");
        return result;
      }
      const proto = Object.getPrototypeOf(input);
      if (proto !== Object.prototype && proto !== null) return REDACTED;
      const result: Record<string, unknown> = Object.create(null);
      let count = 0;
      for (const rawKey in input) {
        if (!Object.prototype.hasOwnProperty.call(input, rawKey)) continue;
        if (count++ >= MAX_ITEMS || nodes >= MAX_NODES) { result["[truncated]"] = true; break; }
        const decodedKey = decodeForInspection(rawKey);
        if (decodedKey == null) { result["[redacted key]"] = REDACTED; continue; }
        if (["__proto__", "constructor", "prototype"].includes(decodedKey)) continue;
        const safeKey = sanitizeLogText(decodedKey, 80);
        const field = Object.getOwnPropertyDescriptor(input, rawKey);
        result[safeKey] = field && "value" in field ? visit(field.value, depth + 1, decodedKey) : REDACTED;
      }
      return result;
    } catch { return REDACTED; }
  }
  return visit(value, 0);
}

export type ErrorLogFields = {
  scope: string;
  message: string;
  stack?: string | null;
  url?: string | null;
  userAgent?: string | null;
  release?: string | null;
  extra?: unknown;
};

export function sanitizeErrorLog(data: ErrorLogFields) {
  const safeExtra = data.extra == null ? null : sanitizeLogExtra(data.extra);
  const extra: Record<string, unknown> | null = safeExtra == null ? null
    : typeof safeExtra === "object" && !Array.isArray(safeExtra)
      ? safeExtra as Record<string, unknown> : { diagnostic: safeExtra };
  return {
    scope: sanitizeLogText(data.scope, 120) || "unknown",
    message: sanitizeLogText(data.message, 2000) || "[unavailable]",
    stack: data.stack == null ? null : sanitizeLogText(data.stack, 10_000),
    url: data.url == null ? null : sanitizeLogUrl(data.url).slice(0, 2000),
    userAgent: data.userAgent == null ? null : sanitizeLogText(data.userAgent, 500),
    release: data.release == null ? null : sanitizeLogText(data.release, 120),
    extra,
  };
}

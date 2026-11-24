// Web Crypto only, so the same code runs in Workers, Bun and Node.
const enc = new TextEncoder();

async function hmac(algorithm: "SHA-1" | "SHA-256", secret: string, data: string | Uint8Array<ArrayBuffer>): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: algorithm }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, typeof data === "string" ? enc.encode(data) : data));
}

export function timingSafeEqualText(a: string, b: string): boolean {
  const x = enc.encode(a);
  const y = enc.encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

function base64(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}
function hex(bytes: Uint8Array): string {
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Twilio: HMAC-SHA1 over the full external URL plus sorted POST parameters. */
export async function twilioSignature(token: string, url: string, params: URLSearchParams): Promise<string> {
  const pairs = [...params.entries()].sort(([a, av], [b, bv]) => (a < b ? -1 : a > b ? 1 : av < bv ? -1 : av > bv ? 1 : 0));
  return base64(await hmac("SHA-1", token, url + pairs.map(([k, v]) => k + v).join("")));
}

export async function verifyTwilio(token: string, url: string, params: URLSearchParams, header: string | null): Promise<boolean> {
  if (!header) return false;
  return timingSafeEqualText(await twilioSignature(token, url, params), header);
}

/** Meta: X-Hub-Signature-256 = "sha256=" + hex HMAC-SHA256(app secret, raw body). */
export async function metaSignature(secret: string, rawBody: Uint8Array<ArrayBuffer>): Promise<string> {
  return `sha256=${hex(await hmac("SHA-256", secret, rawBody))}`;
}

export async function verifyMeta(secret: string, rawBody: Uint8Array<ArrayBuffer>, header: string | null): Promise<boolean> {
  if (!header) return false;
  return timingSafeEqualText(await metaSignature(secret, rawBody), header.trim().toLowerCase());
}

const ECHO_PREFIX = "msr1";

/** Send API metadata that proves an echo is this app's own outbound DM; bound to one conversation. */
export async function echoToken(secret: string, family: string, recipient: string, nonce?: string): Promise<string> {
  const n = nonce ?? hex(crypto.getRandomValues(new Uint8Array(16)));
  return `${ECHO_PREFIX}.${n}.${hex(await hmac("SHA-256", secret, `masaarat-support-echo:v1:${family}:${recipient}:${n}`))}`;
}

export async function verifyEchoToken(secret: string, family: string, recipient: string, metadata: string): Promise<boolean> {
  const m = /^msr1\.([a-f0-9]{32})\.[a-f0-9]{64}$/.exec(metadata);
  if (!m) return false;
  return timingSafeEqualText(await echoToken(secret, family, recipient, m[1]), metadata);
}

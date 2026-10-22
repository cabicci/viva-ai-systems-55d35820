/** Trusted-main scheduler client. Holds no database/OpenAI keys and never
 * retries a state-changing request after a missing or uncertain response. */
const endpoint = "https://masaarat.ai/api/internal/assistant-indexing";
import { runAutomaticDriver } from "../../src/lib/assistant-automation/driver";
let identity: { token: string; until: number } | undefined;
async function token(): Promise<string> {
  if (identity && identity.until > Date.now()) return identity.token;
  const url = new URL(process.env.ACTIONS_ID_TOKEN_REQUEST_URL ?? "");
  if (url.protocol !== "https:" || !url.hostname.endsWith(".actions.githubusercontent.com") || !process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN)
    throw new Error("AUTOMATION_IDENTITY_UNAVAILABLE");
  url.searchParams.set("audience", endpoint);
  const response = await fetch(url, { headers: { Authorization: `Bearer ${process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN}` },
    signal: AbortSignal.timeout(15000), redirect: "error" });
  if (!response.ok) throw new Error("AUTOMATION_IDENTITY_UNAVAILABLE");
  const data = await response.json() as { value?: string };
  if (typeof data.value !== "string" || data.value.length > 16000) throw new Error("AUTOMATION_IDENTITY_UNAVAILABLE");
  // GitHub interprets this workflow command without printing the token value.
  console.log(`::add-mask::${data.value}`);
  identity = { token: data.value, until: Date.now() + 120000 };
  return data.value;
}
async function call(operation: "status" | "tick"): Promise<Record<string, unknown>> {
  const response = await fetch(endpoint, { method: "POST", redirect: "error", signal: AbortSignal.timeout(operation === "status" ? 20000 : 125000),
    headers: { Authorization: `Bearer ${await token()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ operation, ...(operation === "tick" ? { requestId: crypto.randomUUID() } : {}) }) });
  if (!response.ok || !response.headers.get("content-type")?.includes("application/json")) throw new Error("AUTOMATION_REQUEST_UNCONFIRMED");
  const text = await response.text();
  if (text.length > 4000) throw new Error("AUTOMATION_RESPONSE_INVALID");
  const body = JSON.parse(text) as Record<string, unknown>;
  if (!body || Array.isArray(body) || typeof body !== "object") throw new Error("AUTOMATION_RESPONSE_INVALID");
  return body;
}
async function main() {
  const state = await runAutomaticDriver({ call, wait: milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds)),
    now: Date.now, log: message => console.log(message) });
  console.log(`Automatic indexing: ${state}.`);
}
await main().catch(() => { console.error("Automatic indexing stopped safely. Inspect sanitized job status before any uncertain request is retried."); process.exitCode = 1; });

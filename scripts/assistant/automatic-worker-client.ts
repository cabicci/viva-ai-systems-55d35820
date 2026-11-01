/** Trusted-main scheduler client. Holds no database/OpenAI keys and never
 * retries a state-changing request after a missing or uncertain response. */
import { INDEXER_PUBLIC_ENDPOINT as endpoint } from "../../src/lib/assistant-automation/public-indexer-target";
import { runAutomaticDriver } from "../../src/lib/assistant-automation/driver";
import { computeAssistantBuildIdentities } from "./indexer-build.mjs";
let expected: { indexerBuild: string; deploymentFingerprint: string };
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
    headers: { Authorization: `Bearer ${await token()}`, "Content-Type": "application/json",
      ...(operation === "tick" ? { "x-masaarat-indexer-build": expected.indexerBuild,
        "x-masaarat-indexer-deployment": expected.deploymentFingerprint } : {}) },
    body: JSON.stringify({ operation, ...(operation === "tick" ? { requestId: crypto.randomUUID() } : {}) }) });
  if (operation === "status" && [403,404].includes(response.status)) return { awaitingPublication: true };
  if (!response.ok || !response.headers.get("content-type")?.includes("application/json")) throw new Error("AUTOMATION_REQUEST_UNCONFIRMED");
  const text = await response.text();
  if (text.length > 4000) throw new Error("AUTOMATION_RESPONSE_INVALID");
  const body = JSON.parse(text) as Record<string, unknown>;
  if (!body || Array.isArray(body) || typeof body !== "object") throw new Error("AUTOMATION_RESPONSE_INVALID");
  return body;
}
export async function runTrustedAutomaticClient() {
  expected = computeAssistantBuildIdentities(process.cwd());
  // A single signed read proves the deployed source before the driver can send any tick.
  // Auth/database failures remain failures; publication mismatch is a successful idle run.
  const initial = await call("status");
  if (initial.awaitingPublication === true || initial.indexerBuild !== expected.indexerBuild ||
    initial.deploymentFingerprint !== expected.deploymentFingerprint) {
    console.log("Automatic indexing: awaiting publication of the reviewed main source; no tick sent.");
    return "awaiting-publication";
  }
  if (initial.schemaVersion !== "assistant-auto-v1") throw new Error("AUTOMATION_RESPONSE_INVALID");
  const state = await runAutomaticDriver({ call: operation => operation === "status" ? Promise.resolve(initial) : call(operation),
    wait: milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds)),
    now: Date.now, log: message => console.log(message) });
  console.log(`Automatic indexing: ${state}.`);
  return state;
}
if ((import.meta as ImportMeta & { main?: boolean }).main) await runTrustedAutomaticClient().catch(() => {
  console.error("Automatic indexing stopped safely. Inspect sanitized job status before any uncertain request is retried.");
  process.exitCode = 1;
});

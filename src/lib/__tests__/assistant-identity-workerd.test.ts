// @vitest-environment node
// Runs the real verifier inside workerd (Miniflare) — the production Worker runtime —
// with GitHub's JWKS served by a local outbound mock. Regression for the
// redirect:"error" TypeError that rejected every production OIDC token.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { build } from "esbuild";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { Miniflare } from "miniflare";
import { INDEXER_AUDIENCE } from "../assistant-automation/github-identity.server";

let mf: Miniflare; let pair: CryptoKeyPair; let jwk: JsonWebKey;
const enc = (v: unknown) => Buffer.from(JSON.stringify(v)).toString("base64url");
async function token(changes: Record<string, unknown> = {}) {
  const now = Math.floor(Date.now() / 1000);
  const claims = { iss: "https://token.actions.githubusercontent.com", aud: INDEXER_AUDIENCE,
    repository: "cabicci/viva-ai-systems-55d35820", repository_id: "1272666418", repository_owner_id: "236468702",
    ref: "refs/heads/main", workflow_ref: "cabicci/viva-ai-systems-55d35820/.github/workflows/assistant-auto-index.yml@refs/heads/main",
    event_name: "workflow_dispatch", sha: "b".repeat(40), run_id: "41587562849", run_attempt: "1",
    // GitHub's real shape: nbf precedes iat, 5-minute lifetime.
    nbf: now - 300, iat: now, exp: now + 300, ...changes };
  const material = `${enc({ alg: "RS256", kid: "gh-kid", typ: "JWT", x5t: "abc" })}.${enc(claims)}`;
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", pair.privateKey, new TextEncoder().encode(material));
  return `${material}.${Buffer.from(sig).toString("base64url")}`;
}
beforeAll(async () => {
  pair = await crypto.subtle.generateKey({ name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }, true, ["sign", "verify"]);
  // Same member set GitHub publishes (x5c/x5t extras included).
  jwk = { ...(await crypto.subtle.exportKey("jwk", pair.publicKey)), kid: "gh-kid", alg: "RS256", use: "sig", x5c: ["MIIB"], x5t: "abc" } as JsonWebKey;
  const out = await build({ stdin: { contents: `
    import { verifyIndexerIdentity } from "./src/lib/assistant-automation/github-identity.server.ts";
    import { handleAutomaticIndexing } from "./src/lib/assistant-automation/endpoint.server.ts";
    export default { async fetch(request) {
      const u = new URL(request.url);
      if (u.pathname === "/raw-error") { try { await fetch("https://token.actions.githubusercontent.com/.well-known/jwks", { redirect: "error" }); return new Response("no-throw"); } catch (e) { return new Response(String(e)); } }
      const forwarded = new Request("https://masaarat.ai/api/public/assistant-indexing", request);
      return handleAutomaticIndexing(forwarded, { probe: async () => ({ probed: true }),
        status: async () => { throw new Error("status must not run"); }, tick: async () => { throw new Error("tick must not run"); } });
    } };`, resolveDir: process.cwd(), loader: "ts" }, bundle: true, format: "esm", platform: "neutral", write: false,
    alias: { "@": join(process.cwd(), "src") },
    plugins: [{ name: "stub-privileged", setup(b) {
      b.onResolve({ filter: /(store|worker)\.server$/ }, (a) => ({ path: a.path, namespace: "stub" }));
      b.onLoad({ filter: /.*/, namespace: "stub" }, () => ({ contents: "throw new Error('privileged module loaded');", loader: "js" }));
    } }] });
  mf = new Miniflare({ modules: true, script: out.outputFiles[0].text, compatibilityDate: "2025-09-24", compatibilityFlags: ["nodejs_compat"],
    outboundService: async (req) => req.url === "https://token.actions.githubusercontent.com/.well-known/jwks"
      ? Response.json({ keys: [jwk] }) : new Response("blocked", { status: 599 }) });
}, 60000);
afterAll(async () => { await mf?.dispose(); });
const post = async (auth: string, body: unknown = { operation: "probe" }) =>
  mf.dispatchFetch("https://masaarat.ai/api/public/assistant-indexing", { method: "POST", headers: { authorization: `Bearer ${auth}` }, body: JSON.stringify(body) });

describe("GitHub OIDC verification in workerd", () => {
  it("reproduces the runtime constraint: workerd throws on redirect:\"error\"", async () => {
    expect(await (await mf.dispatchFetch("https://x/raw-error")).text()).toContain("Invalid redirect value");
  });
  it("accepts a correctly signed trusted-main token and probe stays read-only", async () => {
    const r = await post(await token());
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ probe: true, identity: "verified", probed: true });
  });
  it.each([
    [{ aud: "other" }, "AUDIENCE"], [{ iss: "https://evil" }, "ISSUER"], [{ repository_id: "1" }, "REPOSITORY"],
    [{ workflow_ref: "cabicci/viva-ai-systems-55d35820/.github/workflows/x.yml@refs/heads/main" }, "WORKFLOW"],
    [{ event_name: "pull_request" }, "EVENT"], [{ exp: Math.floor(Date.now() / 1000) - 5 }, "TIME"],
  ])("rejects out-of-scope claims %j with bounded reason", async (change, reason) => {
    const r = await post(await token(change));
    expect(r.status).toBe(401); expect(await r.json()).toEqual({ code: "AUTOMATION_FORBIDDEN", reason });
  });
  it("rejects a tampered signature", async () => {
    const parts = (await token()).split("."); parts[1] = enc({ ...JSON.parse(Buffer.from(parts[1], "base64url").toString()), run_id: "9" });
    const r = await post(parts.join("."));
    expect(await r.json()).toEqual({ code: "AUTOMATION_FORBIDDEN", reason: "SIGNATURE" });
  });
  it("probe cannot carry tick fields", async () => {
    expect((await post(await token(), { operation: "probe", requestId: crypto.randomUUID() })).status).toBe(400);
  });
});
describe("Worker server code avoids unsupported fetch options", () => {
  it("no src/ server module uses redirect:\"error\"", () => {
    const hits: string[] = [];
    const walk = (d: string) => { for (const f of readdirSync(d)) { const p = join(d, f);
      if (statSync(p).isDirectory()) { if (f !== "__tests__") walk(p); }
      else if (/\.(ts|tsx)$/.test(f) && !/\.test\./.test(f) && /redirect:\s*"error"/.test(readFileSync(p, "utf8"))) hits.push(p); } };
    walk("src"); expect(hits).toEqual([]);
  });
});

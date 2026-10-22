// @vitest-environment node
import { beforeAll, describe, expect, it, vi } from "vitest";
import { INDEXER_AUDIENCE, verifyIndexerIdentity } from "../assistant-automation/github-identity.server";
import { handleAutomaticIndexing } from "../assistant-automation/endpoint.server";
let pair: CryptoKeyPair, jwk: JsonWebKey & { kid: string };
const now = 1800000000000;
const claims = () => ({ iss: "https://token.actions.githubusercontent.com", aud: INDEXER_AUDIENCE,
  repository: "cabicci/viva-ai-systems-55d35820", repository_id: "1272666418", repository_owner_id: "236468702",
  ref: "refs/heads/main", workflow_ref: "cabicci/viva-ai-systems-55d35820/.github/workflows/assistant-auto-index.yml@refs/heads/main",
  event_name: "schedule", sha: "a".repeat(40), run_id: "123", run_attempt: "1", iat: now / 1000, nbf: now / 1000, exp: now / 1000 + 300 });
const encoded = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");
async function signed(changes: Record<string, unknown> = {}, headers: Record<string, unknown> = {}) {
  const material = `${encoded({ alg: "RS256", kid: "test-key", ...headers })}.${encoded({ ...claims(), ...changes })}`;
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", pair.privateKey, new TextEncoder().encode(material));
  return `${material}.${Buffer.from(signature).toString("base64url")}`;
}
beforeAll(async () => {
  pair = await crypto.subtle.generateKey({ name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }, true, ["sign", "verify"]);
  jwk = { ...await crypto.subtle.exportKey("jwk", pair.publicKey), kid: "test-key" };
});
const dependencies = { now: () => now, keys: async () => [jwk] };
describe("short-lived automatic-indexing principal", () => {
  it("accepts the exact signed trusted-main workflow without a human JWT", async () => {
    expect(await verifyIndexerIdentity(new Request(INDEXER_AUDIENCE, { headers: { authorization: `Bearer ${await signed()}` } }), dependencies))
      .toEqual({ runId: "123", attempt: "1", sha: "a".repeat(40) });
  });
  it.each([
    { repository_id: "another-repository" }, { repository_owner_id: "another-owner" }, { ref: "refs/heads/other" },
    { event_name: "pull_request" }, { workflow_ref: "cabicci/viva-ai-systems-55d35820/.github/workflows/other.yml@refs/heads/main" },
    { aud: "another-service" }, { iss: "https://attacker.invalid" }, { exp: now / 1000 - 1 },
    { iat: now / 1000 - 601 }, { nbf: now / 1000 + 100 }, { exp: now / 1000 + 1000 },
  ])("rejects a signed but out-of-scope identity: %j", async change => {
    await expect(verifyIndexerIdentity(new Request(INDEXER_AUDIENCE, { headers: { authorization: `Bearer ${await signed(change)}` } }), dependencies)).rejects.toThrow("AUTOMATION_FORBIDDEN");
  });
  it("rejects forged signatures, key redirects and algorithm substitution", async () => {
    for (const headers of [{ alg: "none" }, { jku: "https://attacker.invalid/key" }, { alg: "HS256" }])
      await expect(verifyIndexerIdentity(new Request(INDEXER_AUDIENCE, { headers: { authorization: `Bearer ${await signed({}, headers)}` } }), dependencies)).rejects.toThrow("AUTOMATION_FORBIDDEN");
    const token = await signed();
    const parts = token.split("."); parts[1] = encoded({ ...claims(), run_id: "456" });
    await expect(verifyIndexerIdentity(new Request(INDEXER_AUDIENCE, { headers: { authorization: `Bearer ${parts.join(".")}` } }), dependencies)).rejects.toThrow("AUTOMATION_FORBIDDEN");
  });
});
describe("closed maintenance endpoint", () => {
  it("does not initialize database/provider dependencies before authentication", async () => {
    const tick = vi.fn(), status = vi.fn();
    const result = await handleAutomaticIndexing(new Request(INDEXER_AUDIENCE, { method: "POST", body: JSON.stringify({ operation: "tick", requestId: crypto.randomUUID() }) }),
      { authorize: async () => { throw new Error("private token/body must never escape"); }, tick, status });
    expect(result.status).toBe(401); expect(await result.text()).not.toContain("private"); expect(tick).not.toHaveBeenCalled(); expect(status).not.toHaveBeenCalled();
  });
  it("permits only status or one request ID; callers cannot supply content, cards, credentials or activation flags", async () => {
    const tick = vi.fn(async () => ({ progressed: true }));
    for (const extra of [{ cardId: "other" }, { content: "body" }, { enabled: true }, { providerKey: "private" }]) {
      const response = await handleAutomaticIndexing(new Request(INDEXER_AUDIENCE, { method: "POST", body: JSON.stringify({ operation: "tick", requestId: crypto.randomUUID(), ...extra }) }), { authorize: async () => {}, tick });
      expect(response.status).toBe(400);
    }
    expect(tick).not.toHaveBeenCalled();
    const id = crypto.randomUUID();
    expect((await handleAutomaticIndexing(new Request(INDEXER_AUDIENCE, { method: "POST", body: JSON.stringify({ operation: "tick", requestId: id }) }), { authorize: async () => {}, tick })).status).toBe(200);
    expect(tick).toHaveBeenCalledExactlyOnceWith(id);
  });
  it("redacts operational errors and performs no application retry", async () => {
    const tick = vi.fn(async () => { throw new Error("secret provider response / private SQL row"); });
    const response = await handleAutomaticIndexing(new Request(INDEXER_AUDIENCE, { method: "POST", body: JSON.stringify({ operation: "tick", requestId: crypto.randomUUID() }) }), { authorize: async () => {}, tick });
    expect(response.status).toBe(503); expect(await response.json()).toEqual({ code: "AUTOMATION_OPERATION_UNAVAILABLE" }); expect(tick).toHaveBeenCalledTimes(1);
  });
});

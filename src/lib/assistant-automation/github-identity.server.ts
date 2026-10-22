/** A closed maintenance identity. No learner/admin JWT is impersonated, and no
 * persistent database/provider credential is sent to the workflow runner. */
export const INDEXER_AUDIENCE = "https://masaarat.ai/api/internal/assistant-indexing";
const ISSUER = "https://token.actions.githubusercontent.com";
const REPOSITORY = "cabicci/viva-ai-systems-55d35820";
const WORKFLOW = `${REPOSITORY}/.github/workflows/assistant-auto-index.yml@refs/heads/main`;
type SigningKey = JsonWebKey & { kid?: string; alg?: string; use?: string };
export type IndexerIdentity = { runId: string; attempt: string; sha: string };
type IdentityDependencies = { now?: () => number; keys?: () => Promise<SigningKey[]> };
let cachedKeys: { until: number; keys: SigningKey[] } | undefined;

async function githubKeys(): Promise<SigningKey[]> {
  if (cachedKeys && cachedKeys.until > Date.now()) return cachedKeys.keys;
  const response = await fetch(`${ISSUER}/.well-known/jwks`, { signal: AbortSignal.timeout(8000), redirect: "error" });
  if (!response.ok) throw new Error("AUTOMATION_IDENTITY_UNAVAILABLE");
  const body = await response.text();
  if (body.length > 100000) throw new Error("AUTOMATION_IDENTITY_UNAVAILABLE");
  const parsed = JSON.parse(body) as { keys?: SigningKey[] };
  if (!Array.isArray(parsed.keys) || !parsed.keys.length || parsed.keys.length > 20)
    throw new Error("AUTOMATION_IDENTITY_UNAVAILABLE");
  cachedKeys = { until: Date.now() + 300000, keys: parsed.keys };
  return parsed.keys;
}
function decode(value: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error("AUTOMATION_FORBIDDEN");
  return Uint8Array.from(atob(value.replace(/-/g, "+").replace(/_/g, "/")), char => char.charCodeAt(0));
}
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("AUTOMATION_FORBIDDEN");
  return value as Record<string, unknown>;
}
export async function verifyIndexerIdentity(request: Request, dependencies: IdentityDependencies = {}): Promise<IndexerIdentity> {
  try {
    const authorization = request.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ") || authorization.length > 16000) throw new Error();
    const parts = authorization.slice(7).split(".");
    if (parts.length !== 3) throw new Error();
    const header = object(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(decode(parts[0]))));
    const claims = object(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(decode(parts[1]))));
    if (header.alg !== "RS256" || typeof header.kid !== "string" || header.kid.length > 200 || header.jku || header.jwk || header.x5u || header.crit)
      throw new Error();
    const now = Math.floor((dependencies.now?.() ?? Date.now()) / 1000);
    if (claims.iss !== ISSUER || claims.aud !== INDEXER_AUDIENCE || claims.repository !== REPOSITORY ||
      claims.repository_id !== "1272666418" || claims.repository_owner_id !== "236468702" ||
      claims.ref !== "refs/heads/main" || claims.workflow_ref !== WORKFLOW ||
      !["workflow_run", "schedule", "workflow_dispatch"].includes(String(claims.event_name)) ||
      typeof claims.exp !== "number" || claims.exp <= now || typeof claims.iat !== "number" ||
      claims.iat > now + 30 || claims.iat < now - 600 || claims.exp - claims.iat > 600 ||
      typeof claims.nbf !== "number" || claims.nbf > now + 30 ||
      typeof claims.sha !== "string" || !/^[a-f0-9]{40}$/.test(claims.sha) ||
      typeof claims.run_id !== "string" || !/^[0-9]{1,24}$/.test(claims.run_id) ||
      typeof claims.run_attempt !== "string" || !/^[0-9]{1,8}$/.test(claims.run_attempt)) throw new Error();
    const keys = await (dependencies.keys ?? githubKeys)();
    const matching = keys.filter(key => key.kid === header.kid && key.kty === "RSA" &&
      (key.alg === undefined || key.alg === "RS256") && (key.use === undefined || key.use === "sig"));
    if (matching.length !== 1) throw new Error();
    const key = await crypto.subtle.importKey("jwk", matching[0], { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
    const valid = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, decode(parts[2]) as BufferSource,
      new TextEncoder().encode(`${parts[0]}.${parts[1]}`));
    if (!valid) throw new Error();
    return { runId: claims.run_id, attempt: claims.run_attempt, sha: claims.sha };
  } catch { throw new Error("AUTOMATION_FORBIDDEN"); }
}

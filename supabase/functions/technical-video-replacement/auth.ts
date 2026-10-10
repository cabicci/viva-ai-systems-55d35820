export const AUDIENCE = "masaarat-technical-motion-v2-20261011";
export const REPOSITORY = "cabicci/viva-ai-systems-55d35820";
export const BRANCH = "refs/heads/review/cabinet-ai-style-20261010";
export const WORKFLOW = `${REPOSITORY}/.github/workflows/technical-motion-v2.yml@${BRANCH}`;
export function enforceClaims(p: Record<string, unknown>, allowedSha: string, now = Date.now() / 1000) {
  if (p.iss !== "https://token.actions.githubusercontent.com" || p.aud !== AUDIENCE ||
      p.repository !== REPOSITORY || p.repository_id !== "1272666418" ||
      p.repository_owner_id !== "236468702" || p.ref !== BRANCH ||
      p.workflow_ref !== WORKFLOW || p.sha !== allowedSha || p.workflow_sha !== allowedSha ||
      p.event_name !== "push" || p.actor_id !== "236468702" ||
      p.runner_environment !== "github-hosted" ||
      typeof p.exp !== "number" || p.exp <= now ||
      typeof p.nbf !== "number" || p.nbf > now + 10 ||
      typeof p.iat !== "number" || p.iat > now + 10 || now - p.iat > 600 ||
      !/^\d+$/.test(String(p.run_id))) throw new Error("Unauthorized workflow");
}
function decode(s: string) {
  return Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
}
export async function verifyGithub(token: string, allowedSha: string) {
  if (token.length > 20000) throw new Error("Oversized identity");
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid identity");
  const header = JSON.parse(new TextDecoder().decode(decode(parts[0])));
  if (header.alg !== "RS256" || typeof header.kid !== "string") throw new Error("Invalid algorithm");
  const response = await fetch("https://token.actions.githubusercontent.com/.well-known/jwks", {signal: AbortSignal.timeout(10000)});
  if (!response.ok) throw new Error("Identity provider unavailable");
  const jwks = await response.json();
  const jwk = jwks.keys?.find((k: JsonWebKey & {kid?: string}) => k.kid === header.kid && k.kty === "RSA");
  if (!jwk) throw new Error("Unknown signing key");
  const key = await crypto.subtle.importKey("jwk", jwk, {name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"}, false, ["verify"]);
  if (!await crypto.subtle.verify("RSASSA-PKCS1-v1_5",key,decode(parts[2]),new TextEncoder().encode(parts[0]+"."+parts[1]))) throw new Error("Invalid signature");
  const claims = JSON.parse(new TextDecoder().decode(decode(parts[1])));
  enforceClaims(claims, allowedSha);
  return claims;
}

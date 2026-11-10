import { createHash } from "node:crypto";
export class CheckpointReviewRequired extends Error {
  constructor(reason: string) { super(reason); this.name = "CheckpointReviewRequired"; }
}
/** Only the digest is persisted. Callers must exclude credentials from inputs. */
export function inputFingerprint(value: unknown): string {
  function canonical(v: unknown): unknown {
    if (v === null || typeof v === "string" || typeof v === "boolean") return v;
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (Array.isArray(v)) return v.map(canonical);
    if (typeof v === "object" && v !== null) return Object.fromEntries(Object.entries(v).sort(([a],[b])=>a<b?-1:a>b?1:0).map(([key,item])=>[key,canonical(item)]));
    throw new CheckpointReviewRequired("Unverifiable input identity; no request started");
  }
  return createHash("sha256").update(JSON.stringify(canonical(value))).digest("hex");
}
export function assertRequestIdentity(actual: string, expected?: string): void {
  if (expected !== undefined && actual !== expected) throw new CheckpointReviewRequired("Request inputs changed since planning; no request started");
}

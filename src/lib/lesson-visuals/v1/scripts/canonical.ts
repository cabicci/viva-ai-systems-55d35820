/**
 * Canonical JSON + checksum helper shared by author_masters / validate_local.
 * Canonical form = JSON with all object keys sorted recursively (stable),
 * arrays left in original order. Checksum = sha256 hex of that UTF-8 text.
 */
import { createHash } from "node:crypto";

function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortKeysDeep);
  }
  if (value !== null && typeof value === "object") {
    const input = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(input).sort()) {
      out[key] = sortKeysDeep(input[key]);
    }
    return out;
  }
  return value;
}

export function canonicalStringify(value: unknown): string {
  return JSON.stringify(sortKeysDeep(value));
}

export function canonicalChecksum(valueWithoutChecksum: unknown): string {
  const json = canonicalStringify(valueWithoutChecksum);
  return createHash("sha256").update(json, "utf8").digest("hex");
}

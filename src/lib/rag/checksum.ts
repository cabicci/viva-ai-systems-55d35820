import { createHash } from "node:crypto";

/** Normalize text for reproducible checksums. */
export function normalizeText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** SHA-256 hex digest of normalized UTF-8 content. */
export function sha256Hex(input: string): string {
  return createHash("sha256").update(normalizeText(input), "utf8").digest("hex");
}

/** SHA-256 of a JSON-serializable value with stable key ordering. */
export function sha256Json(value: unknown): string {
  return sha256Hex(stableStringify(value));
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(",")}}`;
}

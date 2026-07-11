import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

export function sha256Hex(input: string | Buffer): string {
  return createHash("sha256").update(input).digest("hex");
}

export function fileChecksum(absPath: string): string {
  return sha256Hex(readFileSync(absPath));
}

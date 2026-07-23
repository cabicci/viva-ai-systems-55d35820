import { createHash } from "node:crypto";
import { readFileSync as readFile, statSync as stat } from "node:fs";
import { resolve } from "node:path";
import { GOLDEN_REFERENCES_PATH, REPO_ROOT } from "./paths";
import type { GoldenReferencesFile, GoldenVerifyResult } from "./types";

export function sha256HexOfFile(path: string): string {
  const buf = readFile(path);
  return createHash("sha256").update(buf).digest("hex").toUpperCase();
}

/** Reads width/height from a PNG's IHDR chunk without any image library. */
export function readPngDimensions(path: string): {
  width: number;
  height: number;
} {
  const fd = readFile(path);
  const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (fd.length < 24 || !fd.subarray(0, 8).equals(PNG_SIG)) {
    throw new Error(`not a PNG file: ${path}`);
  }
  // IHDR chunk always immediately follows the signature: 4-byte length, "IHDR", width(4), height(4)
  const chunkType = fd.toString("ascii", 12, 16);
  if (chunkType !== "IHDR") {
    throw new Error(`PNG missing leading IHDR chunk: ${path}`);
  }
  const width = fd.readUInt32BE(16);
  const height = fd.readUInt32BE(20);
  return { width, height };
}

export function loadGoldenReferences(
  path: string = GOLDEN_REFERENCES_PATH,
): GoldenReferencesFile {
  return JSON.parse(readFile(path, "utf8")) as GoldenReferencesFile;
}

/**
 * Verifies every golden reference PNG is present, byte-size-correct, and sha256-correct.
 * Golden references are read-only: this function never writes, retries, or regenerates them.
 */
export function verifyGoldenReferences(
  refsFile: GoldenReferencesFile = loadGoldenReferences(),
): GoldenVerifyResult[] {
  return refsFile.references.map((ref) => {
    const abs = resolve(REPO_ROOT, ref.copyPath);
    try {
      const st = stat(abs);
      const actualSha256 = sha256HexOfFile(abs);
      const ok =
        actualSha256.toUpperCase() === ref.sha256.toUpperCase() &&
        st.size === ref.size;
      return {
        id: ref.id,
        path: abs,
        expectedSha256: ref.sha256,
        actualSha256,
        expectedSize: ref.size,
        actualSize: st.size,
        ok,
        error: ok ? null : "checksum-or-size-mismatch",
      };
    } catch (err) {
      return {
        id: ref.id,
        path: abs,
        expectedSha256: ref.sha256,
        actualSha256: null,
        expectedSize: ref.size,
        actualSize: null,
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  });
}

export function allGoldenReferencesOk(results: GoldenVerifyResult[]): boolean {
  return results.length > 0 && results.every((r) => r.ok);
}

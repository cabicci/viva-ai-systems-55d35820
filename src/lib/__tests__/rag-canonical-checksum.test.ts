import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import {
  isValidSha256Digest,
  normalizeCanonicalText,
  sha256CanonicalHex,
  sha256CanonicalJson,
  stableCanonicalStringify,
} from "@/lib/rag/canonical-checksum";

const REPO_ROOT = path.resolve(import.meta.dirname, "../../..");

describe("canonical checksum contract", () => {
  it("accepts only 64 lowercase hex digests", () => {
    expect(isValidSha256Digest("a".repeat(64))).toBe(true);
    expect(isValidSha256Digest("A".repeat(64))).toBe(false);
    expect(isValidSha256Digest("abc123")).toBe(false);
    expect(isValidSha256Digest("def456")).toBe(false);
    expect(isValidSha256Digest(null)).toBe(false);
  });

  it("normalizes CRLF, trailing horizontal whitespace, and blank runs", () => {
    expect(normalizeCanonicalText("a\r\nb  \n\n\nc\n")).toBe("a\nb\n\nc");
  });

  it("hashes fixed vectors and matches node:crypto over normalized UTF-8", () => {
    const vectors = ["", "hello\r\nworld  \n\n\n!", "مرحبا", "café"];
    for (const v of vectors) {
      const digest = sha256CanonicalHex(v);
      expect(digest).toMatch(/^[a-f0-9]{64}$/);
      const node = createHash("sha256").update(normalizeCanonicalText(v), "utf8").digest("hex");
      expect(digest).toBe(node);
    }
  });

  it("JSON key order is stable for checksums; arrays preserve order", () => {
    expect(sha256CanonicalJson({ b: 1, a: 2 })).toBe(sha256CanonicalJson({ a: 2, b: 1 }));
    expect(stableCanonicalStringify({ b: 1, a: [3, 1, 2] })).toBe('{"a":[3,1,2],"b":1}');
    expect(sha256CanonicalJson([1, 2])).not.toBe(sha256CanonicalJson([2, 1]));
  });

  it("Deno twin produces byte-for-byte identical digests for fixed vectors", async () => {
    const twinPath = path.join(
      REPO_ROOT,
      "supabase/functions/assistant-runtime/canonical-checksum.ts",
    );
    const twin = await import(pathToFileURL(twinPath).href);
    const vectors: Array<{ label: string; text?: string; json?: unknown }> = [
      { label: "empty", text: "" },
      { label: "crlf", text: "line1\r\nline2  \n\n\nline3" },
      { label: "unicode", text: "مرحبا — café" },
      { label: "json-key-order", json: { z: true, a: { c: 2, b: 1 }, m: [9, 8] } },
    ];
    for (const v of vectors) {
      if (v.text !== undefined) {
        expect(twin.sha256CanonicalHex(v.text)).toBe(sha256CanonicalHex(v.text));
      }
      if (v.json !== undefined) {
        expect(twin.sha256CanonicalJson(v.json)).toBe(sha256CanonicalJson(v.json));
      }
    }
    const twinSrc = readFileSync(twinPath, "utf8");
    expect(twinSrc).toContain("isValidSha256Digest");
    expect(twinSrc).toContain("sha256CanonicalHex");
  });
});

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import specification from "../lesson-visuals/contextual-v2/scripts/audit-source-compatibility.json";
import { restoreExactEditorialGenerationSource } from "../lesson-visuals/contextual-v2/scripts/audit-source-compatibility";

const sha256 = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");
const blob = (bytes: Buffer) =>
  createHash("sha1")
    .update(Buffer.from(`blob ${bytes.length}\0`))
    .update(bytes)
    .digest("hex");
describe("exact editorial image-source provenance", () => {
  for (const change of specification.entries) {
    const identity = {
      sourcePath: change.sourcePath,
      sourceSha256: change.generationSourceSha256,
      sourceBlob: change.generationSourceBlob,
    };
    const current = Buffer.from(
      readFileSync(resolve(change.sourcePath), "utf8").replace(/\r\n/g, "\n"),
    );
    it(`reconstructs the original generation bytes for ${change.sourcePath}`, () => {
      expect(sha256(current)).toBe(change.currentSha256);
      const restored = restoreExactEditorialGenerationSource(identity, current);
      expect(sha256(restored)).toBe(identity.sourceSha256);
      expect(blob(restored)).toBe(identity.sourceBlob);
      expect(restored.equals(current)).toBe(false);
      expect(() => JSON.parse(restored.toString("utf8"))).not.toThrow();
      expect(sha256(current)).toBe(change.currentSha256);
    });
    it(`rejects unreviewed changes and identity mismatches for ${change.sourcePath}`, () => {
      const edited = Buffer.concat([current, Buffer.from(" ")]);
      expect(restoreExactEditorialGenerationSource(identity, edited)).toBe(edited);
      expect(
        restoreExactEditorialGenerationSource(
          { ...identity, sourcePath: "unreviewed.json" },
          current,
        ),
      ).toBe(current);
      expect(
        restoreExactEditorialGenerationSource({ ...identity, sourceSha256: "incorrect" }, current),
      ).toBe(current);
      expect(
        restoreExactEditorialGenerationSource({ ...identity, sourceBlob: "incorrect" }, current),
      ).toBe(current);
    });
  }
});

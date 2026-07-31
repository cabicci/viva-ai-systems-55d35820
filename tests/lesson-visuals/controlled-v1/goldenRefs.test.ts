import { describe, expect, it } from "vitest";
import {
  allGoldenReferencesOk,
  loadGoldenReferences,
  readPngDimensions,
  verifyGoldenReferences,
} from "../../../src/lib/lesson-visuals/controlled-v1/goldenRefs";
import { resolve } from "node:path";
import { REPO_ROOT } from "../../../src/lib/lesson-visuals/controlled-v1/paths";

describe("controlled-v1 golden references", () => {
  it("declares exactly 9 golden references", () => {
    const refs = loadGoldenReferences();
    expect(refs.references.length).toBe(9);
    const ids = new Set(refs.references.map((r) => r.id));
    expect(ids.size).toBe(9);
  });

  it("every golden reference PNG matches its recorded sha256 and size", () => {
    const results = verifyGoldenReferences();
    for (const r of results) {
      expect({ id: r.id, ok: r.ok, error: r.error }).toEqual({ id: r.id, ok: true, error: null });
    }
    expect(allGoldenReferencesOk(results)).toBe(true);
  });

  it("every golden reference PNG is 1280x720", () => {
    const refs = loadGoldenReferences();
    for (const ref of refs.references) {
      const dims = readPngDimensions(resolve(REPO_ROOT, ref.copyPath));
      expect(dims).toEqual({ width: 1280, height: 720 });
      expect(ref.dims).toEqual({ width: 1280, height: 720 });
    }
  });

  it("no golden reference approvalRole claims an unconditional production rights grant", () => {
    const refs = loadGoldenReferences();
    for (const ref of refs.references) {
      expect(ref.approvalRole).not.toBe("APPROVED_PRODUCTION_RIGHTS_GRANT");
    }
  });

  it("golden refs are not retryable: the module exposes no write/regenerate/retry function", async () => {
    const mod = await import("../../../src/lib/lesson-visuals/controlled-v1/goldenRefs");
    const exportNames = Object.keys(mod);
    expect(exportNames.some((name) => /write|regenerate|retry|repair|fix/i.test(name))).toBe(false);
  });

  it("golden refs are not retryable: repeated verification never mutates the files (idempotent, identical hashes)", () => {
    const first = verifyGoldenReferences();
    const second = verifyGoldenReferences();
    expect(first.map((r) => r.actualSha256)).toEqual(second.map((r) => r.actualSha256));
    expect(first.every((r) => r.ok)).toBe(true);
  });
});

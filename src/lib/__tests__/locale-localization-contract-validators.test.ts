import { describe, expect, it } from "vitest";
import { validateTitleIndexParity } from "../../../scripts/locale-lessons/lib/validate-title-index-parity-core.ts";
import { validateManifestCurriculumSync } from "../../../scripts/locale-lessons/lib/validate-manifest-curriculum-sync-core.ts";
import { validateUiKeyParity } from "../../../scripts/locale-lessons/lib/validate-ui-key-parity-core.ts";
import { validateLocaleLeakScan } from "../../../scripts/locale-lessons/lib/validate-locale-leak-scan-core.ts";

describe("localization contract validators (Phase 12.6)", () => {
  it("passes title index parity for en / ar-MSA / ar-Gulf", async () => {
    const result = await validateTitleIndexParity();
    expect(result.errors, result.errors.join("\n")).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it("passes manifest ↔ curriculum sync for package locales", async () => {
    const result = await validateManifestCurriculumSync();
    expect(result.errors, result.errors.join("\n")).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it("passes ui.json key parity across four locales", async () => {
    const result = await validateUiKeyParity();
    expect(result.errors, result.errors.join("\n")).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it("passes locale leak scan (continuity localized in Batch 2)", () => {
    const result = validateLocaleLeakScan();
    expect(result.errors, result.errors.join("\n")).toEqual([]);
    expect(result.ok).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildProductionManifest,
  buildPilotManifest,
} from "../../../src/lib/lesson-visuals/controlled-v1/buildManifest";
import {
  LOCALES,
  METHOD_B_TO_C_REPLACEMENT_CELL_IDS,
  METHOD_C_REMAINING_CONFIRM_TOKEN,
  METHOD_C_REMAINING_EXPECTED_EXCLUDED_A_CELLS,
  METHOD_C_REMAINING_EXPECTED_PER_LOCALE,
  METHOD_C_REMAINING_EXPECTED_TOTAL,
  PRESERVED_METHOD_C_PILOT_CELL_IDS,
} from "../../../src/lib/lesson-visuals/controlled-v1/constants";
import { loadClassification100 } from "../../../src/lib/lesson-visuals/controlled-v1/loadClassification";
import { resolveLocalePackage } from "../../../src/lib/lesson-visuals/controlled-v1/localePackages";
import { selectMethodCRemainingCells } from "../../../src/lib/lesson-visuals/controlled-v1/methodCRemaining";
import { runMethodCRemaining } from "../../../src/lib/lesson-visuals/controlled-v1/runner";

const HISTORICAL_A_PILOT_CELLS = [
  "builder-m7-l1-tables-columns__ar-EG",
  "builder-m7-l1-tables-columns__ar-MSA",
  "builder-m7-l1-tables-columns__ar-Gulf",
  "builder-m7-l1-tables-columns__en",
] as const;

describe("method-c-remaining selection", () => {
  const classification = loadClassification100({ useCache: false });
  const manifest = buildProductionManifest(classification);
  const selection = selectMethodCRemainingCells(manifest);

  it("selects exactly 356 Method C cells", () => {
    expect(selection.ok).toBe(true);
    expect(selection.errors).toEqual([]);
    expect(selection.cells).toHaveLength(METHOD_C_REMAINING_EXPECTED_TOTAL);
    expect(selection.counts.total).toBe(356);
    expect(selection.counts.perRoute.INSTRUCTIONAL_COMPOSITION).toBe(356);
    expect(selection.counts.perRoute.MASAARAT_SCREENSHOT ?? 0).toBe(0);
    expect(selection.counts.perRoute.AUTHORIZED_EXTERNAL_SCREENSHOT ?? 0).toBe(0);
  });

  it("selects exactly 89 cells per locale", () => {
    for (const locale of LOCALES) {
      expect(selection.counts.perLocale[locale]).toBe(METHOD_C_REMAINING_EXPECTED_PER_LOCALE);
    }
  });

  it("excludes the four preserved Method C pilot cells", () => {
    const ids = new Set(selection.cells.map((c) => c.cellId));
    for (const id of PRESERVED_METHOD_C_PILOT_CELL_IDS) {
      expect(ids.has(id)).toBe(false);
      expect(selection.excludedPreservedPilotCellIds).toContain(id);
    }
  });

  it("excludes Method A cells and the twelve B→C replacement cells", () => {
    const ids = new Set(selection.cells.map((c) => c.cellId));
    expect(selection.excludedAbCellIds).toHaveLength(METHOD_C_REMAINING_EXPECTED_EXCLUDED_A_CELLS);
    expect(selection.excludedReplacementCellIds).toHaveLength(
      METHOD_B_TO_C_REPLACEMENT_CELL_IDS.length,
    );
    for (const id of HISTORICAL_A_PILOT_CELLS) {
      expect(ids.has(id)).toBe(false);
      expect(selection.excludedAbCellIds).toContain(id);
    }
    for (const id of METHOD_B_TO_C_REPLACEMENT_CELL_IDS) {
      expect(ids.has(id)).toBe(false);
      expect(selection.excludedReplacementCellIds).toContain(id);
    }
  });

  it("preserves production-manifest Method C order excluding preserved + replacements", () => {
    const preserved = new Set<string>(PRESERVED_METHOD_C_PILOT_CELL_IDS);
    const replacements = new Set<string>(METHOD_B_TO_C_REPLACEMENT_CELL_IDS);
    const expected = manifest.cells
      .filter(
        (c) =>
          c.route === "INSTRUCTIONAL_COMPOSITION" &&
          !preserved.has(c.cellId) &&
          !replacements.has(c.cellId),
      )
      .map((c) => c.cellId);
    expect(selection.cells.map((c) => c.cellId)).toEqual(expected);
  });

  it("has no duplicate, missing, or unexpected selected cells", () => {
    const ids = selection.cells.map((c) => c.cellId);
    expect(new Set(ids).size).toBe(ids.length);
    expect(selection.cells.every((c) => c.route === "INSTRUCTIONAL_COMPOSITION")).toBe(true);
  });

  it("requires a matching locale package for every selected cell", () => {
    for (const cell of selection.cells) {
      const pkg = resolveLocalePackage(cell.lessonId, cell.locale, cell.title);
      expect(pkg.exists).toBe(true);
      expect(pkg.locale).toBe(cell.locale);
    }
  });
});

describe("method-c-remaining gates", () => {
  it("requires the exact confirmation sentinel", () => {
    expect(METHOD_C_REMAINING_CONFIRM_TOKEN).toBe("RUN_AUTHORIZED_METHOD_C_356");
    const bad = runMethodCRemaining("RUN_AUTHORIZED_400");
    expect(bad.ok).toBe(false);
    expect(bad.receipts).toEqual([]);
    expect(bad.errors[0]).toContain("RUN_AUTHORIZED_METHOD_C_356");
  });

  it("dry-selects 356 cells under ZERO_RENDER without invoking full-400", () => {
    const prev = process.env.CONTROLLED_V1_ZERO_RENDER;
    process.env.CONTROLLED_V1_ZERO_RENDER = "1";
    try {
      const result = runMethodCRemaining(METHOD_C_REMAINING_CONFIRM_TOKEN);
      expect(result.ok).toBe(true);
      expect(result.mode).toBe("method-c-remaining");
      expect(result.receipts).toEqual([]);
      expect(result.summary).toContain("356");
    } finally {
      if (prev === undefined) delete process.env.CONTROLLED_V1_ZERO_RENDER;
      else process.env.CONTROLLED_V1_ZERO_RENDER = prev;
    }
  });

  it("pilot manifest treats former Method B lesson as Method C and masaarat as Method A", () => {
    const pilot = buildPilotManifest(loadClassification100({ useCache: false }));
    const m6 = pilot.cells.filter((c) => c.lessonId === "builder-m6-l3-first-prompt-to-lovable");
    const m7 = pilot.cells.filter((c) => c.lessonId === "builder-m7-l1-tables-columns");
    expect(m6.every((c) => c.route === "INSTRUCTIONAL_COMPOSITION")).toBe(true);
    expect(m7.every((c) => c.route === "MASAARAT_SCREENSHOT")).toBe(true);
  });
});

describe("method-c-remaining workflow contract", () => {
  const yml = readFileSync(
    resolve(process.cwd(), ".github/workflows/controlled-400-visual-pipeline.yml"),
    "utf8",
  );

  it("registers method-c-remaining with owner cabicci authority and exact sentinel", () => {
    expect(yml).toContain("- method-c-remaining");
    expect(yml).toContain("RUN_AUTHORIZED_METHOD_C_356");
    expect(yml).toContain("mode=method-c-remaining requires dispatch_actor=cabicci");
    expect(yml).toContain("mode=method-c-remaining requires github.actor=cabicci");
    expect(yml).toContain(
      "bun run src/lib/lesson-visuals/controlled-v1/scripts/cli.ts method-c-remaining",
    );
  });

  it("does not wire method-c-remaining to prior_artifact_run_id or full-400", () => {
    expect(yml).toContain("prior_artifact_run_id is not authorized for method-c-remaining");
    expect(yml).toMatch(/mode=full-400 requires confirm_full_400 to equal RUN_AUTHORIZED_400/);
    expect(yml).toContain(
      "prior_artifact_run_id is only authorized for mode=failed-only or mode=method-c-canonical-repair",
    );
  });

  it("uploads selection reports and successful cell artifacts", () => {
    expect(yml).toContain("artifacts/controlled-v1/receipts/**");
    expect(yml).toContain("artifacts/controlled-v1/reports/**");
    expect(yml).toContain("artifacts/controlled-v1/cells/**");
  });
});

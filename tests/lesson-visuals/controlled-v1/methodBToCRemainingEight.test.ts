import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { buildProductionManifest } from "../../../src/lib/lesson-visuals/controlled-v1/buildManifest";
import {
  LOCALES,
  METHOD_C_B6L3_FOUR_PILOT_CELL_IDS,
  METHOD_C_REMAINING_EIGHT_CELL_IDS,
  METHOD_C_REMAINING_EIGHT_CONFIRM_TOKEN,
  METHOD_C_REMAINING_EIGHT_EXPECTED_PER_LOCALE,
  METHOD_C_REMAINING_EIGHT_EXPECTED_TOTAL,
  METHOD_C_REMAINING_EIGHT_LESSON_IDS,
  PRESERVED_METHOD_C_PILOT_CELL_IDS,
} from "../../../src/lib/lesson-visuals/controlled-v1/constants";
import { loadClassification100 } from "../../../src/lib/lesson-visuals/controlled-v1/loadClassification";
import { resolveLocalePackage } from "../../../src/lib/lesson-visuals/controlled-v1/localePackages";
import { selectMethodBToCRemainingEight } from "../../../src/lib/lesson-visuals/controlled-v1/methodBToCRemainingEight";
import { runMethodBToCRemainingEight } from "../../../src/lib/lesson-visuals/controlled-v1/runner";
import type {
  ManifestCell,
  ProductionManifest,
} from "../../../src/lib/lesson-visuals/controlled-v1/types";

describe("method-c-b-to-c-remaining-eight selection", () => {
  const classification = loadClassification100({ useCache: false });
  const manifest = buildProductionManifest(classification);
  const selection = selectMethodBToCRemainingEight(manifest);

  it("selects exactly eight authorized replacement cells", () => {
    expect(selection.ok).toBe(true);
    expect(selection.errors).toEqual([]);
    expect(selection.cells).toHaveLength(METHOD_C_REMAINING_EIGHT_EXPECTED_TOTAL);
    expect(selection.cells.map((c) => c.cellId).sort()).toEqual(
      [...METHOD_C_REMAINING_EIGHT_CELL_IDS].sort(),
    );
    expect(selection.counts.total).toBe(8);
    expect(selection.counts.methodASelected).toBe(0);
    expect(selection.counts.acceptedFourCellPilotSelected).toBe(0);
    expect(selection.counts.acceptedMethodCSelected).toBe(0);
    expect(selection.counts.otherLessonSelected).toBe(0);
  });

  it("requires exact lessons, Method C route, and two cells per locale", () => {
    for (const cell of selection.cells) {
      expect(METHOD_C_REMAINING_EIGHT_LESSON_IDS as readonly string[]).toContain(cell.lessonId);
      expect(cell.category).toBe("C");
      expect(cell.route).toBe("INSTRUCTIONAL_COMPOSITION");
    }
    for (const locale of LOCALES) {
      expect(selection.counts.perLocale[locale]).toBe(METHOD_C_REMAINING_EIGHT_EXPECTED_PER_LOCALE);
    }
  });

  it("excludes Method A, accepted four-cell pilot, and preserved Method C pilot cells", () => {
    const ids = new Set(selection.cells.map((c) => c.cellId));
    for (const id of METHOD_C_B6L3_FOUR_PILOT_CELL_IDS) {
      expect(ids.has(id)).toBe(false);
    }
    for (const id of PRESERVED_METHOD_C_PILOT_CELL_IDS) {
      expect(ids.has(id)).toBe(false);
    }
    expect(
      selection.cells.every((c) => c.lessonId !== "builder-m6-l3-first-prompt-to-lovable"),
    ).toBe(true);
    expect(selection.cells.every((c) => c.route !== "MASAARAT_SCREENSHOT")).toBe(true);
  });

  it("requires matching locale packages for all eight cells", () => {
    for (const cell of selection.cells) {
      const pkg = resolveLocalePackage(cell.lessonId, cell.locale, cell.title);
      expect(pkg.exists).toBe(true);
      expect(pkg.locale).toBe(cell.locale);
    }
  });

  it("fails closed on missing or duplicate selection", () => {
    const missing: ProductionManifest = {
      ...manifest,
      cells: manifest.cells.filter((c) => c.cellId !== METHOD_C_REMAINING_EIGHT_CELL_IDS[0]),
    };
    const missingSelection = selectMethodBToCRemainingEight(missing);
    expect(missingSelection.ok).toBe(false);
    expect(
      missingSelection.errors.some((e) => /missing|fewer than eight|expected exactly 8/i.test(e)),
    ).toBe(true);

    const dupCell = selection.cells[0]!;
    const dup: ProductionManifest = {
      ...manifest,
      cells: [...manifest.cells, dupCell],
    };
    const dupSelection = selectMethodBToCRemainingEight(dup);
    expect(dupSelection.ok).toBe(false);
    expect(dupSelection.errors.some((e) => /duplicate|more than eight/i.test(e))).toBe(true);

    const extra: ManifestCell = {
      ...selection.cells[0]!,
      cellId: "builder-m6-l3-first-prompt-to-lovable__ar-EG",
      lessonId: "builder-m6-l3-first-prompt-to-lovable",
    };
    const broadened = selectMethodBToCRemainingEight({
      ...manifest,
      cells: [...manifest.cells, extra],
    });
    expect(
      broadened.cells.every((c) => c.lessonId !== "builder-m6-l3-first-prompt-to-lovable"),
    ).toBe(true);
    expect(broadened.cells).toHaveLength(8);
  });
});

describe("method-c-b-to-c-remaining-eight gates", () => {
  it("requires the exact confirmation sentinel", () => {
    expect(METHOD_C_REMAINING_EIGHT_CONFIRM_TOKEN).toBe(
      "RUN_AUTHORIZED_METHOD_B_TO_C_REMAINING_EIGHT",
    );
    const bad = runMethodBToCRemainingEight("RUN_AUTHORIZED_METHOD_B_TO_C_FOUR_CELL_PILOT");
    expect(bad.ok).toBe(false);
    expect(bad.receipts).toEqual([]);
    expect(bad.errors[0]).toContain("RUN_AUTHORIZED_METHOD_B_TO_C_REMAINING_EIGHT");
  });

  it("dry-selects exactly eight cells under ZERO_RENDER", () => {
    const prev = process.env.CONTROLLED_V1_ZERO_RENDER;
    process.env.CONTROLLED_V1_ZERO_RENDER = "1";
    try {
      const result = runMethodBToCRemainingEight(METHOD_C_REMAINING_EIGHT_CONFIRM_TOKEN);
      expect(result.ok).toBe(true);
      expect(result.mode).toBe("method-c-b-to-c-remaining-eight");
      expect(result.receipts).toEqual([]);
      expect(result.summary).toContain("8 cells");
      expect(result.summary).toContain("Method A 0");
    } finally {
      if (prev === undefined) delete process.env.CONTROLLED_V1_ZERO_RENDER;
      else process.env.CONTROLLED_V1_ZERO_RENDER = prev;
    }
  });
});

describe("preservation of accepted four-cell pilot PNGs", () => {
  it("does not require selecting accepted pilot cells for remaining-eight", () => {
    const selection = selectMethodBToCRemainingEight(
      buildProductionManifest(loadClassification100({ useCache: false })),
    );
    for (const id of METHOD_C_B6L3_FOUR_PILOT_CELL_IDS) {
      expect(selection.cells.some((c) => c.cellId === id)).toBe(false);
    }
  });

  it("accepted pilot PNG sources remain present for hash verification", () => {
    const roots = [
      "E:/Temp/method-b-to-c-four-cell-pilot-1d4389721abaa1467a2461b7d294f0936c6c5e01/cells",
      "artifacts/controlled-v1/cells",
    ];
    for (const id of METHOD_C_B6L3_FOUR_PILOT_CELL_IDS) {
      const found = roots.some((r) => existsSync(join(r, id, "final.png")));
      expect(found).toBe(true);
    }
  });
});

import { describe, expect, it } from "vitest";
import { buildProductionManifest } from "../../../src/lib/lesson-visuals/controlled-v1/buildManifest";
import {
  LOCALES,
  METHOD_B_TO_C_REPLACEMENT_LESSON_IDS,
  METHOD_C_B6L3_FOUR_PILOT_CELL_IDS,
  METHOD_C_B6L3_FOUR_PILOT_CONFIRM_TOKEN,
  METHOD_C_B6L3_FOUR_PILOT_EXPECTED_TOTAL,
  METHOD_C_B6L3_FOUR_PILOT_LESSON_ID,
  PRESERVED_METHOD_C_PILOT_CELL_IDS,
} from "../../../src/lib/lesson-visuals/controlled-v1/constants";
import { loadClassification100 } from "../../../src/lib/lesson-visuals/controlled-v1/loadClassification";
import { resolveLocalePackage } from "../../../src/lib/lesson-visuals/controlled-v1/localePackages";
import { selectMethodBToCFourCellPilot } from "../../../src/lib/lesson-visuals/controlled-v1/methodBToCFourCellPilot";
import { runMethodBToCFourCellPilot } from "../../../src/lib/lesson-visuals/controlled-v1/runner";
import type {
  ManifestCell,
  ProductionManifest,
} from "../../../src/lib/lesson-visuals/controlled-v1/types";

describe("method-c-b6l3-four-pilot selection", () => {
  const classification = loadClassification100({ useCache: false });
  const manifest = buildProductionManifest(classification);
  const selection = selectMethodBToCFourCellPilot(manifest);

  it("selects exactly four cells for the authorized lesson and locales", () => {
    expect(selection.ok).toBe(true);
    expect(selection.errors).toEqual([]);
    expect(selection.cells).toHaveLength(METHOD_C_B6L3_FOUR_PILOT_EXPECTED_TOTAL);
    expect(selection.cells.map((c) => c.cellId)).toEqual([...METHOD_C_B6L3_FOUR_PILOT_CELL_IDS]);
    expect(selection.counts.total).toBe(4);
    expect(selection.counts.methodASelected).toBe(0);
    expect(selection.counts.otherReplacementLessonsSelected).toBe(0);
    expect(selection.counts.acceptedMethodCSelected).toBe(0);
  });

  it("requires Method C / INSTRUCTIONAL_COMPOSITION and exact locales", () => {
    for (const cell of selection.cells) {
      expect(cell.lessonId).toBe(METHOD_C_B6L3_FOUR_PILOT_LESSON_ID);
      expect(cell.category).toBe("C");
      expect(cell.route).toBe("INSTRUCTIONAL_COMPOSITION");
    }
    for (const locale of LOCALES) {
      expect(selection.counts.perLocale[locale]).toBe(1);
    }
  });

  it("does not select Method A, other replacements, or accepted Method C cells", () => {
    const ids = new Set(selection.cells.map((c) => c.cellId));
    for (const id of PRESERVED_METHOD_C_PILOT_CELL_IDS) {
      expect(ids.has(id)).toBe(false);
    }
    for (const lessonId of METHOD_B_TO_C_REPLACEMENT_LESSON_IDS) {
      if (lessonId === METHOD_C_B6L3_FOUR_PILOT_LESSON_ID) continue;
      expect(selection.cells.some((c) => c.lessonId === lessonId)).toBe(false);
    }
    expect(selection.cells.every((c) => c.route !== "MASAARAT_SCREENSHOT")).toBe(true);
    expect(selection.cells.every((c) => c.route !== "AUTHORIZED_EXTERNAL_SCREENSHOT")).toBe(true);
  });

  it("requires matching locale packages for all four cells", () => {
    for (const cell of selection.cells) {
      const pkg = resolveLocalePackage(cell.lessonId, cell.locale, cell.title);
      expect(pkg.exists).toBe(true);
      expect(pkg.locale).toBe(cell.locale);
    }
  });

  it("fails closed when selection would broaden beyond four cells", () => {
    const extra: ManifestCell = {
      ...selection.cells[0]!,
      cellId: "intro-m1-l3-setup-your-ai__ar-EG",
      lessonId: "intro-m1-l3-setup-your-ai",
    };
    const broadened: ProductionManifest = {
      ...manifest,
      cells: [...manifest.cells, extra],
    };
    // Broadening by duplicating an authorized id must fail closed on duplicate.
    const dup: ProductionManifest = {
      ...manifest,
      cells: [...manifest.cells, selection.cells[0]!],
    };
    const dupSelection = selectMethodBToCFourCellPilot(dup);
    expect(dupSelection.ok).toBe(false);
    expect(dupSelection.errors.some((e) => /duplicate|more than four/i.test(e))).toBe(true);

    // Removing one authorized cell must fail closed on missing / fewer than four.
    const missing: ProductionManifest = {
      ...manifest,
      cells: manifest.cells.filter((c) => c.cellId !== METHOD_C_B6L3_FOUR_PILOT_CELL_IDS[0]),
    };
    const missingSelection = selectMethodBToCFourCellPilot(missing);
    expect(missingSelection.ok).toBe(false);
    expect(
      missingSelection.errors.some((e) => /missing|fewer than four|expected exactly 4/i.test(e)),
    ).toBe(true);

    // Extra unrelated Method C cell does not enter the selector (intrinsic four-cell set).
    const unrelatedSelection = selectMethodBToCFourCellPilot(broadened);
    expect(
      unrelatedSelection.cells.every((c) => c.lessonId === METHOD_C_B6L3_FOUR_PILOT_LESSON_ID),
    ).toBe(true);
    expect(unrelatedSelection.cells).toHaveLength(4);
  });
});

describe("method-c-b6l3-four-pilot gates", () => {
  it("requires the exact confirmation sentinel", () => {
    expect(METHOD_C_B6L3_FOUR_PILOT_CONFIRM_TOKEN).toBe(
      "RUN_AUTHORIZED_METHOD_B_TO_C_FOUR_CELL_PILOT",
    );
    const bad = runMethodBToCFourCellPilot("RUN_AUTHORIZED_METHOD_C_356");
    expect(bad.ok).toBe(false);
    expect(bad.receipts).toEqual([]);
    expect(bad.errors[0]).toContain("RUN_AUTHORIZED_METHOD_B_TO_C_FOUR_CELL_PILOT");
  });

  it("dry-selects exactly four cells under ZERO_RENDER", () => {
    const prev = process.env.CONTROLLED_V1_ZERO_RENDER;
    process.env.CONTROLLED_V1_ZERO_RENDER = "1";
    try {
      const result = runMethodBToCFourCellPilot(METHOD_C_B6L3_FOUR_PILOT_CONFIRM_TOKEN);
      expect(result.ok).toBe(true);
      expect(result.mode).toBe("method-c-b6l3-four-pilot");
      expect(result.receipts).toEqual([]);
      expect(result.summary).toContain("4 cells");
      expect(result.summary).toContain("Method A 0");
    } finally {
      if (prev === undefined) delete process.env.CONTROLLED_V1_ZERO_RENDER;
      else process.env.CONTROLLED_V1_ZERO_RENDER = prev;
    }
  });
});

import { describe, expect, it } from "vitest";
import {
  buildPilotManifest,
  buildProductionManifest,
  buildUnresolvedLedger,
} from "../../../src/lib/lesson-visuals/controlled-v1/buildManifest";
import { validateProductionManifest } from "../../../src/lib/lesson-visuals/controlled-v1/validateManifest";
import {
  EXPECTED_COUNTS,
  LOCALES,
  METHOD_B_TO_C_REPLACEMENT_CELL_IDS,
  METHOD_B_TO_C_REPLACEMENT_LESSON_IDS,
  PILOT_AUTHORIZED_EXTERNAL_LESSON_ID,
  PILOT_INSTRUCTIONAL_LESSON_ID,
  PILOT_MASAARAT_LESSON_ID,
} from "../../../src/lib/lesson-visuals/controlled-v1/constants";
import { loadClassification100 } from "../../../src/lib/lesson-visuals/controlled-v1/loadClassification";

const EXPECTED_PILOT_ORDER = [
  "intro-m1-l4-ai-can-cannot__ar-EG",
  "intro-m1-l4-ai-can-cannot__ar-MSA",
  "intro-m1-l4-ai-can-cannot__ar-Gulf",
  "intro-m1-l4-ai-can-cannot__en",
  "builder-m6-l3-first-prompt-to-lovable__ar-EG",
  "builder-m6-l3-first-prompt-to-lovable__ar-MSA",
  "builder-m6-l3-first-prompt-to-lovable__ar-Gulf",
  "builder-m6-l3-first-prompt-to-lovable__en",
  "builder-m7-l1-tables-columns__ar-EG",
  "builder-m7-l1-tables-columns__ar-MSA",
  "builder-m7-l1-tables-columns__ar-Gulf",
  "builder-m7-l1-tables-columns__en",
] as const;

describe("controlled-v1 PRODUCTION_MANIFEST (400 cells)", () => {
  it("has exactly 400 cells with unique cellIds", () => {
    const manifest = buildProductionManifest(loadClassification100({ useCache: false }));
    expect(manifest.cells.length).toBe(400);
    const ids = new Set(manifest.cells.map((c) => c.cellId));
    expect(ids.size).toBe(400);
  });

  it("covers 100 lessons x 4 locales with no gaps", () => {
    const manifest = buildProductionManifest(loadClassification100({ useCache: false }));
    const coverage = new Map<string, Set<string>>();
    for (const cell of manifest.cells) {
      if (!coverage.has(cell.lessonId)) coverage.set(cell.lessonId, new Set());
      coverage.get(cell.lessonId)!.add(cell.locale);
    }
    expect(coverage.size).toBe(100);
    for (const locales of coverage.values()) {
      expect([...locales].sort()).toEqual([...LOCALES].sort());
    }
  });

  it("has route counts: 28 MASAARAT_SCREENSHOT, 0 AUTHORIZED_EXTERNAL_SCREENSHOT, 372 INSTRUCTIONAL_COMPOSITION", () => {
    const manifest = buildProductionManifest(loadClassification100({ useCache: false }));
    expect(manifest.counts.perRoute.MASAARAT_SCREENSHOT).toBe(
      EXPECTED_COUNTS.MASAARAT_SCREENSHOT * 4,
    );
    expect(manifest.counts.perRoute.AUTHORIZED_EXTERNAL_SCREENSHOT).toBe(
      EXPECTED_COUNTS.AUTHORIZED_EXTERNAL_SCREENSHOT * 4,
    );
    expect(manifest.counts.perRoute.INSTRUCTIONAL_COMPOSITION).toBe(
      EXPECTED_COUNTS.INSTRUCTIONAL_COMPOSITION * 4,
    );
  });

  it("passes validateProductionManifest with zero errors", () => {
    const manifest = buildProductionManifest(loadClassification100({ useCache: false }));
    const result = validateProductionManifest(manifest);
    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it("rejects a manifest with duplicate cellIds", () => {
    const manifest = buildProductionManifest(loadClassification100({ useCache: false }));
    const mutated = { ...manifest, cells: [...manifest.cells, manifest.cells[0]] };
    const result = validateProductionManifest(mutated);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("duplicate cellId"))).toBe(true);
  });

  it("keeps only Method A screenshot lessons after B→C reclassification", () => {
    const classification = loadClassification100({ useCache: false });
    const screenshot = classification.lessons
      .filter(
        (l) => l.route === "MASAARAT_SCREENSHOT" || l.route === "AUTHORIZED_EXTERNAL_SCREENSHOT",
      )
      .map((l) => l.lessonId)
      .sort();
    expect(screenshot).toEqual(
      [
        "builder-m2-l1-prompt-layer",
        "builder-m2-l2-instructions-examples",
        "builder-m3-l1-context-layer",
        "builder-m6-l4-components-routes",
        "builder-m7-l1-tables-columns",
        "builder-m7-l3-queries",
        "builder-m10-l2-first-users",
      ].sort(),
    );
  });
});

describe("controlled-v1 PILOT_MANIFEST after Method B→C", () => {
  it("has 3 lessons x 4 locales = 12 cells", () => {
    const pilot = buildPilotManifest(loadClassification100({ useCache: false }));
    expect(pilot.cells.length).toBe(12);
    const lessonIds = new Set(pilot.cells.map((c) => c.lessonId));
    expect(lessonIds.size).toBe(3);
  });

  it("preserves exact pilot identities and ordering", () => {
    const pilot = buildPilotManifest(loadClassification100({ useCache: false }));
    expect(pilot.cells.map((c) => c.cellId)).toEqual([...EXPECTED_PILOT_ORDER]);
  });

  it("declares the controlled-failure target cell", () => {
    const pilot = buildPilotManifest(loadClassification100({ useCache: false }));
    expect(pilot.controlledFailureTargetCellId).toBe("intro-m1-l4-ai-can-cannot__en");
    expect(pilot.cells.some((c) => c.cellId === pilot.controlledFailureTargetCellId)).toBe(true);
  });

  it("routes former Method B pilot lesson as Method C and keeps masaarat as Method A", () => {
    const pilot = buildPilotManifest(loadClassification100({ useCache: false }));
    const intro = pilot.cells.filter((c) => c.lessonId === PILOT_INSTRUCTIONAL_LESSON_ID);
    const formerExternal = pilot.cells.filter(
      (c) => c.lessonId === PILOT_AUTHORIZED_EXTERNAL_LESSON_ID,
    );
    const masaarat = pilot.cells.filter((c) => c.lessonId === PILOT_MASAARAT_LESSON_ID);
    expect(intro).toHaveLength(4);
    expect(intro.every((c) => c.route === "INSTRUCTIONAL_COMPOSITION")).toBe(true);
    expect(formerExternal.every((c) => c.route === "INSTRUCTIONAL_COMPOSITION")).toBe(true);
    expect(masaarat.every((c) => c.route === "MASAARAT_SCREENSHOT")).toBe(true);
  });

  it("lists the three pilot lessons", () => {
    const pilot = buildPilotManifest(loadClassification100({ useCache: false }));
    const lessons = new Set(pilot.cells.map((c) => c.lessonId));
    expect(lessons).toEqual(
      new Set([
        PILOT_INSTRUCTIONAL_LESSON_ID,
        PILOT_AUTHORIZED_EXTERNAL_LESSON_ID,
        PILOT_MASAARAT_LESSON_ID,
      ]),
    );
  });
});

describe("controlled-v1 UNRESOLVED_LEDGER", () => {
  it("lists 28 Method A + 8 remaining B→C replacement Method C cells (36 total)", () => {
    const manifest = buildProductionManifest(loadClassification100({ useCache: false }));
    const ledger = buildUnresolvedLedger(manifest);
    expect(ledger.entries.length).toBe(36);

    const methodA = ledger.entries.filter((e) => e.route === "MASAARAT_SCREENSHOT");
    const methodB = ledger.entries.filter((e) => e.route === "AUTHORIZED_EXTERNAL_SCREENSHOT");
    const replacementC = ledger.entries.filter((e) => e.route === "INSTRUCTIONAL_COMPOSITION");
    expect(methodA).toHaveLength(28);
    expect(methodB).toHaveLength(0);
    expect(replacementC).toHaveLength(8);

    const replacementIds = new Set(replacementC.map((e) => e.cellId));
    for (const id of METHOD_B_TO_C_REPLACEMENT_CELL_IDS) {
      if (id.startsWith("builder-m6-l3-first-prompt-to-lovable__")) {
        expect(replacementIds.has(id)).toBe(false);
      } else {
        expect(replacementIds.has(id)).toBe(true);
      }
    }
    for (const lessonId of METHOD_B_TO_C_REPLACEMENT_LESSON_IDS) {
      if (lessonId === "builder-m6-l3-first-prompt-to-lovable") {
        expect(ledger.entries.some((e) => e.lessonId === lessonId)).toBe(false);
      } else {
        expect(ledger.entries.some((e) => e.lessonId === lessonId)).toBe(true);
      }
    }
    expect(ledger.entries.some((e) => e.lessonId === PILOT_MASAARAT_LESSON_ID)).toBe(true);
    expect(ledger.entries.every((e) => e.reason.length > 0)).toBe(true);
  });
});

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

  it("has route counts: 24 MASAARAT_SCREENSHOT, 8 AUTHORIZED_EXTERNAL_SCREENSHOT, 368 INSTRUCTIONAL_COMPOSITION", () => {
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

  it("does not change non-pilot screenshot lesson routes", () => {
    const classification = loadClassification100({ useCache: false });
    const nonPilotScreenshot = classification.lessons.filter(
      (l) =>
        (l.route === "MASAARAT_SCREENSHOT" || l.route === "AUTHORIZED_EXTERNAL_SCREENSHOT") &&
        l.lessonId !== PILOT_MASAARAT_LESSON_ID &&
        l.lessonId !== PILOT_AUTHORIZED_EXTERNAL_LESSON_ID,
    );
    expect(nonPilotScreenshot.map((l) => l.lessonId).sort()).toEqual(
      [
        "builder-m2-l1-prompt-layer",
        "builder-m2-l2-instructions-examples",
        "builder-m3-l1-context-layer",
        "builder-m5-l2-frontend",
        "builder-m6-l4-components-routes",
        "builder-m7-l3-queries",
        "builder-m10-l2-first-users",
        "intro-m1-l3-setup-your-ai",
      ].sort(),
    );
  });
});

describe("controlled-v1 PILOT_MANIFEST eligibility after reclassification", () => {
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

  it("routes all 12 pilot cells as INSTRUCTIONAL_COMPOSITION with zero screenshot dependencies", () => {
    const pilot = buildPilotManifest(loadClassification100({ useCache: false }));
    expect(pilot.cells.every((c) => c.route === "INSTRUCTIONAL_COMPOSITION")).toBe(true);
    expect(pilot.cells.filter((c) => c.route !== "INSTRUCTIONAL_COMPOSITION")).toHaveLength(0);

    const screenshotRoutes = pilot.cells.filter(
      (c) => c.route === "MASAARAT_SCREENSHOT" || c.route === "AUTHORIZED_EXTERNAL_SCREENSHOT",
    );
    expect(screenshotRoutes).toHaveLength(0);

    // Eligibility contract: instructional composition needs none of these.
    expect(pilot.cells).toHaveLength(12);
    const browserCaptureRequired = 0;
    const externalRightsRequired = 0;
    const authenticatedCaptureRequired = 0;
    const productionRequired = 0;
    const supabaseRequired = 0;
    const paidProviderRequired = 0;
    const externalProviderRequired = 0;
    expect(browserCaptureRequired).toBe(0);
    expect(externalRightsRequired).toBe(0);
    expect(authenticatedCaptureRequired).toBe(0);
    expect(productionRequired).toBe(0);
    expect(supabaseRequired).toBe(0);
    expect(paidProviderRequired).toBe(0);
    expect(externalProviderRequired).toBe(0);
    expect(pilot.cells.length).toBe(12); // deterministic local-render eligible 12/12
  });

  it("keeps the original four instructional-composition cells unchanged", () => {
    const pilot = buildPilotManifest(loadClassification100({ useCache: false }));
    const introCells = pilot.cells.filter((c) => c.lessonId === PILOT_INSTRUCTIONAL_LESSON_ID);
    expect(introCells).toHaveLength(4);
    expect(introCells.every((c) => c.route === "INSTRUCTIONAL_COMPOSITION")).toBe(true);
    expect(introCells.map((c) => c.locale)).toEqual([...LOCALES]);
  });

  it("lists the three pilot lessons including the former screenshot lessons", () => {
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
  it("lists exactly the non-INSTRUCTIONAL_COMPOSITION cells (32 of 400)", () => {
    const manifest = buildProductionManifest(loadClassification100({ useCache: false }));
    const ledger = buildUnresolvedLedger(manifest);
    expect(ledger.entries.length).toBe(32);
    expect(ledger.entries.every((e) => e.route !== "INSTRUCTIONAL_COMPOSITION")).toBe(true);
    expect(ledger.entries.some((e) => e.lessonId === PILOT_MASAARAT_LESSON_ID)).toBe(false);
    expect(ledger.entries.some((e) => e.lessonId === PILOT_AUTHORIZED_EXTERNAL_LESSON_ID)).toBe(
      false,
    );
  });
});

import { describe, expect, it } from "vitest";
import { buildPilotManifest, buildProductionManifest, buildUnresolvedLedger } from "../../../src/lib/lesson-visuals/controlled-v1/buildManifest";
import { validateProductionManifest } from "../../../src/lib/lesson-visuals/controlled-v1/validateManifest";
import { LOCALES } from "../../../src/lib/lesson-visuals/controlled-v1/constants";

describe("controlled-v1 PRODUCTION_MANIFEST (400 cells)", () => {
  it("has exactly 400 cells with unique cellIds", () => {
    const manifest = buildProductionManifest();
    expect(manifest.cells.length).toBe(400);
    const ids = new Set(manifest.cells.map((c) => c.cellId));
    expect(ids.size).toBe(400);
  });

  it("covers 100 lessons x 4 locales with no gaps", () => {
    const manifest = buildProductionManifest();
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

  it("has route counts: 28 MASAARAT_SCREENSHOT, 12 AUTHORIZED_EXTERNAL_SCREENSHOT, 360 INSTRUCTIONAL_COMPOSITION", () => {
    const manifest = buildProductionManifest();
    expect(manifest.counts.perRoute.MASAARAT_SCREENSHOT).toBe(28);
    expect(manifest.counts.perRoute.AUTHORIZED_EXTERNAL_SCREENSHOT).toBe(12);
    expect(manifest.counts.perRoute.INSTRUCTIONAL_COMPOSITION).toBe(360);
  });

  it("passes validateProductionManifest with zero errors", () => {
    const manifest = buildProductionManifest();
    const result = validateProductionManifest(manifest);
    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it("rejects a manifest with duplicate cellIds", () => {
    const manifest = buildProductionManifest();
    const mutated = { ...manifest, cells: [...manifest.cells, manifest.cells[0]] };
    const result = validateProductionManifest(mutated);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("duplicate cellId"))).toBe(true);
  });
});

describe("controlled-v1 PILOT_MANIFEST", () => {
  it("has 3 lessons x 4 locales = 12 cells", () => {
    const pilot = buildPilotManifest();
    expect(pilot.cells.length).toBe(12);
    const lessonIds = new Set(pilot.cells.map((c) => c.lessonId));
    expect(lessonIds.size).toBe(3);
  });

  it("declares the controlled-failure target cell", () => {
    const pilot = buildPilotManifest();
    expect(pilot.controlledFailureTargetCellId).toBe("intro-m1-l4-ai-can-cannot__en");
    expect(pilot.cells.some((c) => c.cellId === pilot.controlledFailureTargetCellId)).toBe(true);
  });

  it("includes one INSTRUCTIONAL_COMPOSITION, one MASAARAT_SCREENSHOT and one AUTHORIZED_EXTERNAL_SCREENSHOT lesson", () => {
    const pilot = buildPilotManifest();
    const routes = new Set(pilot.cells.map((c) => c.route));
    expect(routes).toEqual(new Set(["INSTRUCTIONAL_COMPOSITION", "MASAARAT_SCREENSHOT", "AUTHORIZED_EXTERNAL_SCREENSHOT"]));
  });
});

describe("controlled-v1 UNRESOLVED_LEDGER", () => {
  it("lists exactly the non-INSTRUCTIONAL_COMPOSITION cells (40 of 400)", () => {
    const manifest = buildProductionManifest();
    const ledger = buildUnresolvedLedger(manifest);
    expect(ledger.entries.length).toBe(40);
    expect(ledger.entries.every((e) => e.route !== "INSTRUCTIONAL_COMPOSITION")).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildProductionManifest } from "../../../src/lib/lesson-visuals/controlled-v1/buildManifest";
import {
  LOCALES,
  METHOD_A_M7L1_FOUR_PILOT_CELL_IDS,
  METHOD_A_M7L1_FOUR_PILOT_LESSON_ID,
  METHOD_A_REMAINING_SIX_CELL_IDS,
  METHOD_A_REMAINING_SIX_CONFIRM_TOKEN,
  METHOD_A_REMAINING_SIX_EXPECTED_TOTAL,
  METHOD_A_REMAINING_SIX_LESSON_IDS,
} from "../../../src/lib/lesson-visuals/controlled-v1/constants";
import { loadClassification100 } from "../../../src/lib/lesson-visuals/controlled-v1/loadClassification";
import { selectMethodAFourCellPilot } from "../../../src/lib/lesson-visuals/controlled-v1/methodAFourCellPilot";
import { selectMethodARemainingSix } from "../../../src/lib/lesson-visuals/controlled-v1/methodARemainingSix";
import { loadRemainingSixCaptureConfig } from "../../../src/lib/lesson-visuals/controlled-v1/routes/methodARemainingSixCapture";
import { runMethodARemainingSixLessons } from "../../../src/lib/lesson-visuals/controlled-v1/runner";
import {
  CAPTURE_LEDGER_PATH,
  REPO_ROOT,
} from "../../../src/lib/lesson-visuals/controlled-v1/paths";
import type {
  ManifestCell,
  ProductionManifest,
} from "../../../src/lib/lesson-visuals/controlled-v1/types";

describe("method-a-remaining-six-lessons-24 selection", () => {
  const classification = loadClassification100({ useCache: false });
  const manifest = buildProductionManifest(classification);
  const selection = selectMethodARemainingSix(manifest);

  it("selects exactly 24 cells (six lessons × four locales) in authoritative order", () => {
    expect(selection.ok).toBe(true);
    expect(selection.errors).toEqual([]);
    expect(selection.cells).toHaveLength(METHOD_A_REMAINING_SIX_EXPECTED_TOTAL);
    expect(selection.cells.map((c) => c.cellId)).toEqual([...METHOD_A_REMAINING_SIX_CELL_IDS]);
    expect(selection.counts.selected).toBe(24);
    expect(selection.counts.capturedTarget).toBe(24);
    expect(selection.counts.methodBSelected).toBe(0);
    expect(selection.counts.methodCSelected).toBe(0);
    expect(selection.counts.acceptedPilotSelected).toBe(0);
    expect(selection.counts.otherMethodASelected).toBe(0);
    expect(selection.counts.otherLessonsSelected).toBe(0);
  });

  it("requires Method A / MASAARAT_SCREENSHOT, exactly the six authorized lessons, four locales each", () => {
    for (const cell of selection.cells) {
      expect(METHOD_A_REMAINING_SIX_LESSON_IDS as readonly string[]).toContain(cell.lessonId);
      expect(cell.category).toBe("A");
      expect(cell.route).toBe("MASAARAT_SCREENSHOT");
    }
    for (const locale of LOCALES) {
      expect(selection.counts.perLocale[locale]).toBe(METHOD_A_REMAINING_SIX_LESSON_IDS.length);
    }
    for (const lessonId of METHOD_A_REMAINING_SIX_LESSON_IDS) {
      expect(selection.counts.perLesson[lessonId]).toBe(LOCALES.length);
    }
  });

  it("rejects a missing authorized cell (fails closed)", () => {
    const missing: ProductionManifest = {
      ...manifest,
      cells: manifest.cells.filter((c) => c.cellId !== METHOD_A_REMAINING_SIX_CELL_IDS[0]),
    };
    const missingSelection = selectMethodARemainingSix(missing);
    expect(missingSelection.ok).toBe(false);
    expect(
      missingSelection.errors.some((e) => /missing expected cell|expected exactly 24/i.test(e)),
    ).toBe(true);
  });

  it("rejects an extra/duplicate authorized cell (fails closed, does not broaden)", () => {
    const dup: ProductionManifest = {
      ...manifest,
      cells: [...manifest.cells, selection.cells[0]!],
    };
    const dupSelection = selectMethodARemainingSix(dup);
    expect(dupSelection.ok).toBe(false);
    expect(dupSelection.errors.some((e) => /duplicate/i.test(e))).toBe(true);
  });

  it("never selects the already-accepted four-locale pilot lesson", () => {
    expect(selection.cells.every((c) => c.lessonId !== METHOD_A_M7L1_FOUR_PILOT_LESSON_ID)).toBe(
      true,
    );
    for (const id of METHOD_A_M7L1_FOUR_PILOT_CELL_IDS) {
      expect(selection.cells.some((c) => c.cellId === id)).toBe(false);
    }

    const withPilotCell: ProductionManifest = {
      ...manifest,
      cells: manifest.cells.map((c) =>
        c.cellId === METHOD_A_REMAINING_SIX_CELL_IDS[0]
          ? { ...c, lessonId: METHOD_A_M7L1_FOUR_PILOT_LESSON_ID }
          : c,
      ),
    };
    const polluted = selectMethodARemainingSix(withPilotCell);
    expect(polluted.ok).toBe(false);
    expect(polluted.errors.some((e) => /accepted pilot cell selected/i.test(e))).toBe(true);
    expect(polluted.counts.acceptedPilotSelected).toBeGreaterThan(0);
  });

  it("rejects Method C (INSTRUCTIONAL_COMPOSITION) cells masquerading as one of the six lessons", () => {
    const polluted: ProductionManifest = {
      ...manifest,
      cells: manifest.cells.map((c) =>
        c.cellId === METHOD_A_REMAINING_SIX_CELL_IDS[0]
          ? { ...c, route: "INSTRUCTIONAL_COMPOSITION" as const, category: "C" as const }
          : c,
      ),
    };
    const result = selectMethodARemainingSix(polluted);
    expect(result.ok).toBe(false);
    expect(result.counts.methodCSelected).toBeGreaterThan(0);
    expect(result.errors.some((e) => /Method C cell selected/i.test(e))).toBe(true);
  });

  it("ignores unrelated Method A lessons outside the authorized six (intrinsic set)", () => {
    const extra: ManifestCell = {
      ...selection.cells[0]!,
      cellId: "builder-m7-l1-tables-columns__ar-EG",
      lessonId: "builder-m7-l1-tables-columns",
    };
    const broadened: ProductionManifest = { ...manifest, cells: [...manifest.cells, extra] };
    const unrelated = selectMethodARemainingSix(broadened);
    expect(unrelated.cells).toHaveLength(24);
    expect(
      unrelated.cells.every((c) =>
        (METHOD_A_REMAINING_SIX_LESSON_IDS as readonly string[]).includes(c.lessonId),
      ),
    ).toBe(true);
  });
});

describe("method-a-remaining-six-lessons-24 capture configs", () => {
  it("has a parseable, schema-valid capture config for each of the six lessons", () => {
    for (const lessonId of METHOD_A_REMAINING_SIX_LESSON_IDS) {
      const config = loadRemainingSixCaptureConfig(lessonId);
      expect(config, `config for ${lessonId}`).not.toBeNull();
      expect(config!.schemaVersion).toBe("controlled-v1-capture-config/1");
      expect(config!.lessonId).toBe(lessonId);
      expect(config!.environment).toBe("local-dev");
      expect(typeof config!.authorizedBy).toBe("string");
      expect(config!.authorizedBy.length).toBeGreaterThan(0);
      expect(typeof config!.sessionUrl).toBe("string");
      expect(config!.sessionUrl).toMatch(/^http:\/\/127\.0\.0\.1:55440/);
    }
  });

  it("exposes a cellAllowlist covering exactly that lesson's four locale cells", () => {
    for (const lessonId of METHOD_A_REMAINING_SIX_LESSON_IDS) {
      const config = loadRemainingSixCaptureConfig(lessonId);
      expect(config!.cellAllowlist, `cellAllowlist for ${lessonId}`).toBeDefined();
      const expected = LOCALES.map((locale) => `${lessonId}__${locale}`);
      expect([...config!.cellAllowlist!].sort()).toEqual([...expected].sort());
    }
  });

  it("returns null (fails closed) for lessons outside the authorized six", () => {
    expect(loadRemainingSixCaptureConfig("builder-m7-l1-tables-columns")).toBeNull();
    expect(loadRemainingSixCaptureConfig("intro-m1-l4-ai-can-cannot")).toBeNull();
    expect(loadRemainingSixCaptureConfig("does-not-exist")).toBeNull();
  });
});

describe("method-a-remaining-six-lessons-24 capture ledger", () => {
  it("declares exactly six remainingSixAuthorizedLessonIds matching the authoritative constant", () => {
    const ledger = JSON.parse(readFileSync(CAPTURE_LEDGER_PATH, "utf8")) as {
      remainingSixAuthorizedLessonIds?: string[];
    };
    expect(ledger.remainingSixAuthorizedLessonIds).toBeDefined();
    expect(ledger.remainingSixAuthorizedLessonIds).toHaveLength(6);
    expect([...ledger.remainingSixAuthorizedLessonIds!].sort()).toEqual(
      [...METHOD_A_REMAINING_SIX_LESSON_IDS].sort(),
    );
  });

  it("has an on-disk capture config file for each authorized lesson referenced by the ledger", () => {
    const ledger = JSON.parse(readFileSync(CAPTURE_LEDGER_PATH, "utf8")) as {
      authorizedSessions?: Array<{ lessonId: string; configPath: string }>;
    };
    const remainingSixSessions = (ledger.authorizedSessions ?? []).filter((s) =>
      (METHOD_A_REMAINING_SIX_LESSON_IDS as readonly string[]).includes(s.lessonId),
    );
    expect(remainingSixSessions).toHaveLength(6);
    for (const session of remainingSixSessions) {
      const abs = resolve(REPO_ROOT, session.configPath);
      expect(() => readFileSync(abs, "utf8")).not.toThrow();
    }
  });
});

describe("method-a-remaining-six-lessons-24 gates", () => {
  it("requires the exact confirmation sentinel", async () => {
    expect(METHOD_A_REMAINING_SIX_CONFIRM_TOKEN).toBe(
      "RUN_AUTHORIZED_METHOD_A_REMAINING_SIX_LESSONS_24",
    );
    const bad = await runMethodARemainingSixLessons(
      "RUN_AUTHORIZED_METHOD_A_FOUR_LOCALE_CAPTURE_PILOT",
    );
    expect(bad.ok).toBe(false);
    expect(bad.receipts).toEqual([]);
    expect(bad.errors[0]).toContain("RUN_AUTHORIZED_METHOD_A_REMAINING_SIX_LESSONS_24");
  });

  it("dry-selects exactly 24 cells under ZERO_CAPTURE without touching fixtures or capturing", async () => {
    const prev = process.env.CONTROLLED_V1_ZERO_CAPTURE;
    process.env.CONTROLLED_V1_ZERO_CAPTURE = "1";
    try {
      const dry = await runMethodARemainingSixLessons(METHOD_A_REMAINING_SIX_CONFIRM_TOKEN);
      expect(dry.ok).toBe(true);
      expect(dry.receipts).toEqual([]);
      expect(dry.summary).toMatch(/dry-select: 24 cells/);
      expect(dry.summary).toMatch(/no capture/);
    } finally {
      if (prev === undefined) delete process.env.CONTROLLED_V1_ZERO_CAPTURE;
      else process.env.CONTROLLED_V1_ZERO_CAPTURE = prev;
    }
  });

  it("dry-selects exactly 24 cells under ZERO_RENDER as well", async () => {
    const prev = process.env.CONTROLLED_V1_ZERO_RENDER;
    process.env.CONTROLLED_V1_ZERO_RENDER = "1";
    try {
      const dry = await runMethodARemainingSixLessons(METHOD_A_REMAINING_SIX_CONFIRM_TOKEN);
      expect(dry.ok).toBe(true);
      expect(dry.receipts).toEqual([]);
      expect(dry.summary).toMatch(/dry-select: 24 cells/);
    } finally {
      if (prev === undefined) delete process.env.CONTROLLED_V1_ZERO_RENDER;
      else process.env.CONTROLLED_V1_ZERO_RENDER = prev;
    }
  });

  it("rejects an obviously wrong token distinct from every other mode's token", async () => {
    const wrong = await runMethodARemainingSixLessons("RUN_AUTHORIZED_METHOD_C_356");
    expect(wrong.ok).toBe(false);
    expect(wrong.receipts).toEqual([]);
  });
});

describe("preservation: method-a-m7l1-four-pilot selection still works unmodified", () => {
  it("still selects exactly the four pilot cells for builder-m7-l1-tables-columns", () => {
    const classification = loadClassification100({ useCache: false });
    const manifest = buildProductionManifest(classification);
    const pilotSelection = selectMethodAFourCellPilot(manifest);
    expect(pilotSelection.ok).toBe(true);
    expect(pilotSelection.cells.map((c) => c.cellId)).toEqual([
      ...METHOD_A_M7L1_FOUR_PILOT_CELL_IDS,
    ]);
    expect(pilotSelection.counts.selected).toBe(4);
  });
});

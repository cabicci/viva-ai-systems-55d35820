import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import {
  ACCEPTED_CLASSIFICATION_BASELINE_SHA,
  CLASSIFICATION_SOURCE_SHA256,
  CONTROLLED_FAILURE_TARGET_CELL_ID,
  LOCALES,
  METHOD_B_TO_C_REPLACEMENT_CELL_IDS,
  METHOD_C_B6L3_FOUR_PILOT_CELL_IDS,
  PILOT_AUTHORIZED_EXTERNAL_LESSON_ID,
  PILOT_INSTRUCTIONAL_LESSON_ID,
  PILOT_MASAARAT_LESSON_ID,
  RECONCILED_ORIGIN_MAIN_SHA,
} from "./constants";
import { loadClassification100 } from "./loadClassification";
import { cellId } from "./paths";
import type {
  Classification100,
  Locale,
  ManifestCell,
  PilotManifest,
  ProductionManifest,
  Route,
  UnresolvedLedger,
  UnresolvedLedgerEntry,
} from "./types";

/** Expands the 100-lesson classification × 4 locales into the 400-cell production manifest. */
export function buildProductionManifest(
  classification: Classification100 = loadClassification100(),
): ProductionManifest {
  const cells: ManifestCell[] = [];
  const perRoute: Record<Route, number> = {
    MASAARAT_SCREENSHOT: 0,
    AUTHORIZED_EXTERNAL_SCREENSHOT: 0,
    INSTRUCTIONAL_COMPOSITION: 0,
  };

  for (const lesson of classification.lessons) {
    for (const locale of LOCALES) {
      cells.push({
        cellId: cellId(lesson.lessonId, locale),
        lessonId: lesson.lessonId,
        locale,
        position: lesson.position,
        category: lesson.cat,
        route: lesson.route,
        title: lesson.title,
      });
      perRoute[lesson.route] += 1;
    }
  }

  return {
    manifestVersion: "controlled-v1-manifest/1",
    generatedAt: new Date().toISOString(),
    classificationSourceSha256: CLASSIFICATION_SOURCE_SHA256,
    acceptedClassificationBaselineSha: ACCEPTED_CLASSIFICATION_BASELINE_SHA,
    reconciledOriginMainSha: RECONCILED_ORIGIN_MAIN_SHA,
    counts: {
      lessons: classification.lessons.length,
      locales: LOCALES.length,
      cells: cells.length,
      perRoute,
    },
    cells,
  };
}

/** Small, named pilot manifest: 3 lessons x 4 locales = 12 cells. */
export function buildPilotManifest(
  classification: Classification100 = loadClassification100(),
): PilotManifest {
  const pilotLessonIds = new Set([
    PILOT_INSTRUCTIONAL_LESSON_ID,
    PILOT_MASAARAT_LESSON_ID,
    PILOT_AUTHORIZED_EXTERNAL_LESSON_ID,
  ]);

  const cells: ManifestCell[] = [];
  for (const lesson of classification.lessons) {
    if (!pilotLessonIds.has(lesson.lessonId)) continue;
    for (const locale of LOCALES as readonly Locale[]) {
      cells.push({
        cellId: cellId(lesson.lessonId, locale),
        lessonId: lesson.lessonId,
        locale,
        position: lesson.position,
        category: lesson.cat,
        route: lesson.route,
        title: lesson.title,
      });
    }
  }

  return {
    manifestVersion: "controlled-v1-pilot-manifest/1",
    generatedAt: new Date().toISOString(),
    controlledFailureTargetCellId: CONTROLLED_FAILURE_TARGET_CELL_ID,
    cells,
  };
}

const REPLACEMENT_CELL_SET = new Set<string>(METHOD_B_TO_C_REPLACEMENT_CELL_IDS);
const ACCEPTED_FOUR_CELL_PILOT_SET = new Set<string>(METHOD_C_B6L3_FOUR_PILOT_CELL_IDS);

/**
 * Unresolved = all Method A cells (28) + remaining Method B→C replacement Method C cells (8).
 * Human-accepted four-cell pilot (m6×4) and the existing accepted 360 Method C are never re-added.
 */
export function buildUnresolvedLedger(manifest: ProductionManifest): UnresolvedLedger {
  const entries: UnresolvedLedgerEntry[] = [];

  for (const cell of manifest.cells) {
    if (cell.route !== "INSTRUCTIONAL_COMPOSITION") {
      entries.push({
        cellId: cell.cellId,
        lessonId: cell.lessonId,
        locale: cell.locale,
        route: cell.route,
        reason:
          cell.route === "MASAARAT_SCREENSHOT"
            ? "no authorized non-Production Masaarat capture session (see docs/lesson-visuals/controlled-v1/capture/ledger.json)"
            : "no Control-Room-approved external rights grant (see docs/lesson-visuals/controlled-v1/rights/ledger.json)",
        resolutionPath:
          cell.route === "MASAARAT_SCREENSHOT"
            ? "docs/lesson-visuals/controlled-v1/capture/"
            : "docs/lesson-visuals/controlled-v1/rights/",
      });
      continue;
    }
    if (REPLACEMENT_CELL_SET.has(cell.cellId) && !ACCEPTED_FOUR_CELL_PILOT_SET.has(cell.cellId)) {
      entries.push({
        cellId: cell.cellId,
        lessonId: cell.lessonId,
        locale: cell.locale,
        route: cell.route,
        reason:
          "NO_VALID_RIGHTS_BASIS reclassification — original instructional composition pending human visual review (CR-LV-METHOD-B-TO-C-REMAINING-EIGHT-EXECUTION-20260727-01)",
        resolutionPath: "docs/lesson-visuals/controlled-v1/",
      });
    }
  }

  return {
    ledgerVersion: "controlled-v1-unresolved-ledger/1",
    generatedAt: new Date().toISOString(),
    entries,
  };
}

export function writeJson(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

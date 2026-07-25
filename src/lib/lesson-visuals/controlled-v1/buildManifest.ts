import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import {
  ACCEPTED_CLASSIFICATION_BASELINE_SHA,
  CLASSIFICATION_SOURCE_SHA256,
  LOCALES,
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
import {
  CONTROLLED_FAILURE_TARGET_CELL_ID,
  PILOT_AUTHORIZED_EXTERNAL_LESSON_ID,
  PILOT_INSTRUCTIONAL_LESSON_ID,
  PILOT_MASAARAT_LESSON_ID,
} from "./constants";

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

/** Every MASAARAT_SCREENSHOT / AUTHORIZED_EXTERNAL_SCREENSHOT cell starts unresolved (fail-closed by design). */
export function buildUnresolvedLedger(manifest: ProductionManifest): UnresolvedLedger {
  const entries: UnresolvedLedgerEntry[] = manifest.cells
    .filter((cell) => cell.route !== "INSTRUCTIONAL_COMPOSITION")
    .map((cell) => ({
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
    }));

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

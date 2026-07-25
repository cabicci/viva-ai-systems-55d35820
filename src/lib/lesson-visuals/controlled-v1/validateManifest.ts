import {
  EXPECTED_COUNTS,
  EXPECTED_TOTAL_CELLS,
  EXPECTED_TOTAL_LESSONS,
  LOCALES,
} from "./constants";
import type { ProductionManifest } from "./types";

export interface ManifestValidationResult {
  ok: boolean;
  errors: string[];
}

export function validateProductionManifest(manifest: ProductionManifest): ManifestValidationResult {
  const errors: string[] = [];

  if (manifest.cells.length !== EXPECTED_TOTAL_CELLS) {
    errors.push(`expected ${EXPECTED_TOTAL_CELLS} cells, found ${manifest.cells.length}`);
  }

  const seenCellIds = new Set<string>();
  const seenPairs = new Set<string>();
  const lessonLocaleCoverage = new Map<string, Set<string>>();
  const perRoute: Record<string, number> = {
    MASAARAT_SCREENSHOT: 0,
    AUTHORIZED_EXTERNAL_SCREENSHOT: 0,
    INSTRUCTIONAL_COMPOSITION: 0,
  };

  for (const cell of manifest.cells) {
    if (seenCellIds.has(cell.cellId)) {
      errors.push(`duplicate cellId: ${cell.cellId}`);
    }
    seenCellIds.add(cell.cellId);

    const pairKey = `${cell.lessonId}::${cell.locale}`;
    if (seenPairs.has(pairKey)) {
      errors.push(`duplicate lessonId+locale pair: ${pairKey}`);
    }
    seenPairs.add(pairKey);

    if (!lessonLocaleCoverage.has(cell.lessonId)) {
      lessonLocaleCoverage.set(cell.lessonId, new Set());
    }
    lessonLocaleCoverage.get(cell.lessonId)!.add(cell.locale);

    if (!(cell.route in perRoute)) {
      errors.push(`cell ${cell.cellId} has invalid route: ${cell.route}`);
      continue;
    }
    perRoute[cell.route] += 1;

    const expectedCellId = `${cell.lessonId}__${cell.locale}`;
    if (cell.cellId !== expectedCellId) {
      errors.push(`cell ${cell.cellId} does not match expected shape ${expectedCellId}`);
    }
  }

  if (lessonLocaleCoverage.size !== EXPECTED_TOTAL_LESSONS) {
    errors.push(
      `expected ${EXPECTED_TOTAL_LESSONS} unique lessons, found ${lessonLocaleCoverage.size}`,
    );
  }

  for (const [lessonId, locales] of lessonLocaleCoverage) {
    if (locales.size !== LOCALES.length) {
      errors.push(`lesson ${lessonId} has ${locales.size}/${LOCALES.length} locales`);
    }
    for (const locale of LOCALES) {
      if (!locales.has(locale)) {
        errors.push(`lesson ${lessonId} missing locale ${locale}`);
      }
    }
  }

  for (const [route, expectedPerLesson] of Object.entries(EXPECTED_COUNTS)) {
    const expectedTotal = expectedPerLesson * LOCALES.length;
    if (perRoute[route] !== expectedTotal) {
      errors.push(
        `route ${route}: expected ${expectedTotal} cells (${expectedPerLesson} lessons x ${LOCALES.length} locales), found ${perRoute[route]}`,
      );
    }
  }

  return { ok: errors.length === 0, errors };
}

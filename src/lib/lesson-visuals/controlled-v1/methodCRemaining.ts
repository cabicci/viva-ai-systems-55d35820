import {
  LOCALES,
  METHOD_B_TO_C_REPLACEMENT_CELL_IDS,
  METHOD_C_REMAINING_EXPECTED_EXCLUDED_A_CELLS,
  METHOD_C_REMAINING_EXPECTED_PER_LOCALE,
  METHOD_C_REMAINING_EXPECTED_TOTAL,
  PRESERVED_METHOD_C_PILOT_CELL_IDS,
} from "./constants";
import type { Locale, ManifestCell, ProductionManifest } from "./types";

export interface MethodCRemainingSelection {
  ok: boolean;
  cells: ManifestCell[];
  errors: string[];
  counts: {
    total: number;
    perLocale: Record<Locale, number>;
    perRoute: Record<string, number>;
  };
  excludedPreservedPilotCellIds: string[];
  excludedAbCellIds: string[];
  excludedReplacementCellIds: string[];
}

const PRESERVED_SET = new Set<string>(PRESERVED_METHOD_C_PILOT_CELL_IDS);
const REPLACEMENT_SET = new Set<string>(METHOD_B_TO_C_REPLACEMENT_CELL_IDS);

/**
 * Deterministic Method-C-remaining selection:
 * all INSTRUCTIONAL_COMPOSITION cells from the production manifest except:
 * - the four preserved accepted Method C pilot cell IDs, and
 * - the twelve Method B→C replacement cells (not yet accepted).
 * Never selects A/B cells.
 */
export function selectMethodCRemainingCells(
  manifest: ProductionManifest,
): MethodCRemainingSelection {
  const errors: string[] = [];
  const excludedPreservedPilotCellIds: string[] = [];
  const excludedAbCellIds: string[] = [];
  const excludedReplacementCellIds: string[] = [];
  const selected: ManifestCell[] = [];

  for (const cell of manifest.cells) {
    if (cell.route !== "INSTRUCTIONAL_COMPOSITION") {
      excludedAbCellIds.push(cell.cellId);
      continue;
    }
    if (PRESERVED_SET.has(cell.cellId)) {
      excludedPreservedPilotCellIds.push(cell.cellId);
      continue;
    }
    if (REPLACEMENT_SET.has(cell.cellId)) {
      excludedReplacementCellIds.push(cell.cellId);
      continue;
    }
    selected.push(cell);
  }

  const perLocale = Object.fromEntries(LOCALES.map((l) => [l, 0])) as Record<Locale, number>;
  const perRoute: Record<string, number> = {};
  const seen = new Set<string>();
  for (const cell of selected) {
    if (seen.has(cell.cellId)) {
      errors.push(`duplicate selected cellId: ${cell.cellId}`);
    }
    seen.add(cell.cellId);
    if (cell.route !== "INSTRUCTIONAL_COMPOSITION") {
      errors.push(`non-Method-C cell selected: ${cell.cellId} route=${cell.route}`);
    }
    if (PRESERVED_SET.has(cell.cellId)) {
      errors.push(`preserved pilot cell was selected: ${cell.cellId}`);
    }
    if (REPLACEMENT_SET.has(cell.cellId)) {
      errors.push(`B→C replacement cell was selected: ${cell.cellId}`);
    }
    perLocale[cell.locale] = (perLocale[cell.locale] ?? 0) + 1;
    perRoute[cell.route] = (perRoute[cell.route] ?? 0) + 1;
  }

  if (selected.length !== METHOD_C_REMAINING_EXPECTED_TOTAL) {
    errors.push(`expected ${METHOD_C_REMAINING_EXPECTED_TOTAL} cells, got ${selected.length}`);
  }
  for (const locale of LOCALES) {
    if (perLocale[locale] !== METHOD_C_REMAINING_EXPECTED_PER_LOCALE) {
      errors.push(
        `expected ${METHOD_C_REMAINING_EXPECTED_PER_LOCALE} cells for ${locale}, got ${perLocale[locale]}`,
      );
    }
  }
  if ((perRoute.INSTRUCTIONAL_COMPOSITION ?? 0) !== METHOD_C_REMAINING_EXPECTED_TOTAL) {
    errors.push(`expected all selected cells to be INSTRUCTIONAL_COMPOSITION`);
  }
  if (
    (perRoute.MASAARAT_SCREENSHOT ?? 0) !== 0 ||
    (perRoute.AUTHORIZED_EXTERNAL_SCREENSHOT ?? 0) !== 0
  ) {
    errors.push(`A/B cells must not be selected`);
  }
  if (excludedPreservedPilotCellIds.length !== PRESERVED_METHOD_C_PILOT_CELL_IDS.length) {
    errors.push(
      `expected to exclude ${PRESERVED_METHOD_C_PILOT_CELL_IDS.length} preserved pilot cells, excluded ${excludedPreservedPilotCellIds.length}`,
    );
  }
  if (excludedAbCellIds.length !== METHOD_C_REMAINING_EXPECTED_EXCLUDED_A_CELLS) {
    errors.push(
      `expected to exclude ${METHOD_C_REMAINING_EXPECTED_EXCLUDED_A_CELLS} A cells, excluded ${excludedAbCellIds.length}`,
    );
  }
  if (excludedReplacementCellIds.length !== METHOD_B_TO_C_REPLACEMENT_CELL_IDS.length) {
    errors.push(
      `expected to exclude ${METHOD_B_TO_C_REPLACEMENT_CELL_IDS.length} B→C replacement cells, excluded ${excludedReplacementCellIds.length}`,
    );
  }

  // Manifest order must be preserved (selected is already in manifest order).
  const expectedOrder = manifest.cells
    .filter(
      (c) =>
        c.route === "INSTRUCTIONAL_COMPOSITION" &&
        !PRESERVED_SET.has(c.cellId) &&
        !REPLACEMENT_SET.has(c.cellId),
    )
    .map((c) => c.cellId);
  if (JSON.stringify(selected.map((c) => c.cellId)) !== JSON.stringify(expectedOrder)) {
    errors.push(`selection order does not match production manifest Method C order`);
  }

  return {
    ok: errors.length === 0,
    cells: selected,
    errors,
    counts: { total: selected.length, perLocale, perRoute },
    excludedPreservedPilotCellIds,
    excludedAbCellIds,
    excludedReplacementCellIds,
  };
}

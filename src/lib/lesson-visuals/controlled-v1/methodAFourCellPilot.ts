import {
  LOCALES,
  METHOD_A_M7L1_FOUR_PILOT_CELL_IDS,
  METHOD_A_M7L1_FOUR_PILOT_EXPECTED_TOTAL,
  METHOD_A_M7L1_FOUR_PILOT_LESSON_ID,
} from "./constants";
import type { Locale, ManifestCell, ProductionManifest } from "./types";

export interface MethodAFourCellPilotSelection {
  ok: boolean;
  cells: ManifestCell[];
  errors: string[];
  counts: {
    total: number;
    selected: number;
    capturedTarget: number;
    perLocale: Record<Locale, number>;
    perRoute: Record<string, number>;
    methodBSelected: number;
    methodCSelected: number;
    otherMethodASelected: number;
    otherLessonsSelected: number;
  };
}

const EXPECTED_SET = new Set<string>(METHOD_A_M7L1_FOUR_PILOT_CELL_IDS);

/**
 * Fail-closed selector for exactly four Method A pilot cells:
 * builder-m7-l1-tables-columns × {ar-EG, ar-MSA, ar-Gulf, en}.
 * Intrinsically cannot broaden to other Method A cells or Method B/C.
 */
export function selectMethodAFourCellPilot(
  manifest: ProductionManifest,
): MethodAFourCellPilotSelection {
  const errors: string[] = [];
  const selected: ManifestCell[] = [];

  for (const cell of manifest.cells) {
    if (!EXPECTED_SET.has(cell.cellId)) continue;
    selected.push(cell);
  }

  const perLocale = Object.fromEntries(LOCALES.map((l) => [l, 0])) as Record<Locale, number>;
  const perRoute: Record<string, number> = {};
  const seen = new Set<string>();
  let methodBSelected = 0;
  let methodCSelected = 0;
  let otherMethodASelected = 0;
  let otherLessonsSelected = 0;

  for (const cell of selected) {
    if (seen.has(cell.cellId)) {
      errors.push(`duplicate selected cellId: ${cell.cellId}`);
    }
    seen.add(cell.cellId);

    if (cell.lessonId !== METHOD_A_M7L1_FOUR_PILOT_LESSON_ID) {
      otherLessonsSelected += 1;
      errors.push(`unexpected lesson selected: ${cell.cellId}`);
    }
    if (cell.route !== "MASAARAT_SCREENSHOT" || cell.category !== "A") {
      errors.push(
        `cell ${cell.cellId} must be Method A / MASAARAT_SCREENSHOT; got ${cell.category}/${cell.route}`,
      );
    }
    if (cell.route === "AUTHORIZED_EXTERNAL_SCREENSHOT" || cell.category === "B") {
      methodBSelected += 1;
      errors.push(`Method B cell selected: ${cell.cellId}`);
    }
    if (cell.route === "INSTRUCTIONAL_COMPOSITION" || cell.category === "C") {
      methodCSelected += 1;
      errors.push(`Method C cell selected: ${cell.cellId}`);
    }
    if (
      (cell.route === "MASAARAT_SCREENSHOT" || cell.category === "A") &&
      cell.lessonId !== METHOD_A_M7L1_FOUR_PILOT_LESSON_ID
    ) {
      otherMethodASelected += 1;
      errors.push(`other Method A lesson selected: ${cell.cellId}`);
    }
    if (!(LOCALES as readonly string[]).includes(cell.locale)) {
      errors.push(`unexpected locale: ${cell.cellId}`);
    }

    perLocale[cell.locale] = (perLocale[cell.locale] ?? 0) + 1;
    perRoute[cell.route] = (perRoute[cell.route] ?? 0) + 1;
  }

  if (selected.length !== METHOD_A_M7L1_FOUR_PILOT_EXPECTED_TOTAL) {
    errors.push(
      `expected exactly ${METHOD_A_M7L1_FOUR_PILOT_EXPECTED_TOTAL} cells, got ${selected.length}`,
    );
  }
  if (selected.length < METHOD_A_M7L1_FOUR_PILOT_EXPECTED_TOTAL) {
    errors.push("fewer than four cells — fail closed");
  }
  if (selected.length > METHOD_A_M7L1_FOUR_PILOT_EXPECTED_TOTAL) {
    errors.push("more than four cells — fail closed (selection must not broaden)");
  }

  for (const expectedId of METHOD_A_M7L1_FOUR_PILOT_CELL_IDS) {
    if (!seen.has(expectedId)) {
      errors.push(`missing expected cell: ${expectedId}`);
    }
  }
  for (const locale of LOCALES) {
    if (perLocale[locale] !== 1) {
      errors.push(`expected exactly 1 cell for ${locale}, got ${perLocale[locale]}`);
    }
  }
  if ((perRoute.MASAARAT_SCREENSHOT ?? 0) !== METHOD_A_M7L1_FOUR_PILOT_EXPECTED_TOTAL) {
    errors.push("all selected cells must be MASAARAT_SCREENSHOT");
  }
  if (
    (perRoute.INSTRUCTIONAL_COMPOSITION ?? 0) !== 0 ||
    (perRoute.AUTHORIZED_EXTERNAL_SCREENSHOT ?? 0) !== 0
  ) {
    errors.push("B/C cells must not be selected");
  }

  const manifestOrder = manifest.cells
    .filter((c) => EXPECTED_SET.has(c.cellId))
    .map((c) => c.cellId);
  const actualOrder = selected.map((c) => c.cellId);
  if (JSON.stringify(actualOrder) !== JSON.stringify(manifestOrder)) {
    errors.push("selection order does not match production manifest order for the four cells");
  }

  return {
    ok: errors.length === 0,
    cells: selected,
    errors,
    counts: {
      total: selected.length,
      selected: selected.length,
      capturedTarget: METHOD_A_M7L1_FOUR_PILOT_EXPECTED_TOTAL,
      perLocale,
      perRoute,
      methodBSelected,
      methodCSelected,
      otherMethodASelected,
      otherLessonsSelected,
    },
  };
}

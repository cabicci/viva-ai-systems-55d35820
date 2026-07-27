import {
  LOCALES,
  METHOD_C_B6L3_FOUR_PILOT_CELL_IDS,
  METHOD_C_REMAINING_EIGHT_CELL_IDS,
  METHOD_C_REMAINING_EIGHT_EXPECTED_PER_LOCALE,
  METHOD_C_REMAINING_EIGHT_EXPECTED_TOTAL,
  METHOD_C_REMAINING_EIGHT_LESSON_IDS,
  PRESERVED_METHOD_C_PILOT_CELL_IDS,
} from "./constants";
import type { Locale, ManifestCell, ProductionManifest } from "./types";

export interface MethodBToCRemainingEightSelection {
  ok: boolean;
  cells: ManifestCell[];
  errors: string[];
  counts: {
    total: number;
    perLocale: Record<Locale, number>;
    perRoute: Record<string, number>;
    methodASelected: number;
    acceptedFourCellPilotSelected: number;
    acceptedMethodCSelected: number;
    otherLessonSelected: number;
  };
}

const EXPECTED_SET = new Set<string>(METHOD_C_REMAINING_EIGHT_CELL_IDS);
const AUTHORIZED_LESSONS = new Set<string>(METHOD_C_REMAINING_EIGHT_LESSON_IDS);
const ACCEPTED_FOUR_SET = new Set<string>(METHOD_C_B6L3_FOUR_PILOT_CELL_IDS);
const PRESERVED_360_PILOT_SET = new Set<string>(PRESERVED_METHOD_C_PILOT_CELL_IDS);

/**
 * Fail-closed selector for exactly eight remaining Method B→C replacement cells:
 * intro-m1-l3-setup-your-ai × 4 locales + builder-m5-l2-frontend × 4 locales.
 * Intrinsically cannot broaden to 12/372 or include accepted pilot/360 cells.
 */
export function selectMethodBToCRemainingEight(
  manifest: ProductionManifest,
): MethodBToCRemainingEightSelection {
  const errors: string[] = [];
  const selected: ManifestCell[] = [];

  for (const cell of manifest.cells) {
    if (!EXPECTED_SET.has(cell.cellId)) continue;
    selected.push(cell);
  }

  const perLocale = Object.fromEntries(LOCALES.map((l) => [l, 0])) as Record<Locale, number>;
  const perRoute: Record<string, number> = {};
  const seen = new Set<string>();
  let methodASelected = 0;
  let acceptedFourCellPilotSelected = 0;
  let acceptedMethodCSelected = 0;
  let otherLessonSelected = 0;

  for (const cell of selected) {
    if (seen.has(cell.cellId)) {
      errors.push(`duplicate selected cellId: ${cell.cellId}`);
    }
    seen.add(cell.cellId);

    if (!AUTHORIZED_LESSONS.has(cell.lessonId)) {
      otherLessonSelected += 1;
      errors.push(`unexpected lesson selected: ${cell.cellId}`);
    }
    if (cell.route !== "INSTRUCTIONAL_COMPOSITION" || cell.category !== "C") {
      errors.push(
        `cell ${cell.cellId} must be Method C / INSTRUCTIONAL_COMPOSITION; got ${cell.category}/${cell.route}`,
      );
    }
    if (cell.route === "MASAARAT_SCREENSHOT" || cell.category === "A") {
      methodASelected += 1;
      errors.push(`Method A cell selected: ${cell.cellId}`);
    }
    if (ACCEPTED_FOUR_SET.has(cell.cellId)) {
      acceptedFourCellPilotSelected += 1;
      errors.push(`accepted four-cell pilot selected: ${cell.cellId}`);
    }
    if (PRESERVED_360_PILOT_SET.has(cell.cellId)) {
      acceptedMethodCSelected += 1;
      errors.push(`accepted Method C pilot cell selected: ${cell.cellId}`);
    }
    if (!(LOCALES as readonly string[]).includes(cell.locale)) {
      errors.push(`unexpected locale: ${cell.cellId}`);
    }

    perLocale[cell.locale] = (perLocale[cell.locale] ?? 0) + 1;
    perRoute[cell.route] = (perRoute[cell.route] ?? 0) + 1;
  }

  if (selected.length !== METHOD_C_REMAINING_EIGHT_EXPECTED_TOTAL) {
    errors.push(
      `expected exactly ${METHOD_C_REMAINING_EIGHT_EXPECTED_TOTAL} cells, got ${selected.length}`,
    );
  }
  if (selected.length < METHOD_C_REMAINING_EIGHT_EXPECTED_TOTAL) {
    errors.push("fewer than eight cells — fail closed");
  }
  if (selected.length > METHOD_C_REMAINING_EIGHT_EXPECTED_TOTAL) {
    errors.push("more than eight cells — fail closed (selection must not broaden)");
  }

  for (const expectedId of METHOD_C_REMAINING_EIGHT_CELL_IDS) {
    if (!seen.has(expectedId)) {
      errors.push(`missing expected cell: ${expectedId}`);
    }
  }
  for (const locale of LOCALES) {
    if (perLocale[locale] !== METHOD_C_REMAINING_EIGHT_EXPECTED_PER_LOCALE) {
      errors.push(
        `expected exactly ${METHOD_C_REMAINING_EIGHT_EXPECTED_PER_LOCALE} cells for ${locale}, got ${perLocale[locale]}`,
      );
    }
  }
  if ((perRoute.INSTRUCTIONAL_COMPOSITION ?? 0) !== METHOD_C_REMAINING_EIGHT_EXPECTED_TOTAL) {
    errors.push("all selected cells must be INSTRUCTIONAL_COMPOSITION");
  }
  if (
    (perRoute.MASAARAT_SCREENSHOT ?? 0) !== 0 ||
    (perRoute.AUTHORIZED_EXTERNAL_SCREENSHOT ?? 0) !== 0
  ) {
    errors.push("A/B cells must not be selected");
  }

  const manifestOrder = manifest.cells
    .filter((c) => EXPECTED_SET.has(c.cellId))
    .map((c) => c.cellId);
  if (JSON.stringify(selected.map((c) => c.cellId)) !== JSON.stringify(manifestOrder)) {
    errors.push("selection order does not match production manifest order for the eight cells");
  }

  return {
    ok: errors.length === 0,
    cells: selected,
    errors,
    counts: {
      total: selected.length,
      perLocale,
      perRoute,
      methodASelected,
      acceptedFourCellPilotSelected,
      acceptedMethodCSelected,
      otherLessonSelected,
    },
  };
}

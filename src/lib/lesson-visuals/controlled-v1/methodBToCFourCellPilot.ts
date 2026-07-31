import {
  LOCALES,
  METHOD_B_TO_C_REPLACEMENT_LESSON_IDS,
  METHOD_C_B6L3_FOUR_PILOT_CELL_IDS,
  METHOD_C_B6L3_FOUR_PILOT_EXPECTED_TOTAL,
  METHOD_C_B6L3_FOUR_PILOT_LESSON_ID,
  PRESERVED_METHOD_C_PILOT_CELL_IDS,
} from "./constants";
import type { Locale, ManifestCell, ProductionManifest } from "./types";

export interface MethodBToCFourCellPilotSelection {
  ok: boolean;
  cells: ManifestCell[];
  errors: string[];
  counts: {
    total: number;
    perLocale: Record<Locale, number>;
    perRoute: Record<string, number>;
    methodASelected: number;
    otherReplacementLessonsSelected: number;
    acceptedMethodCSelected: number;
  };
}

const EXPECTED_SET = new Set<string>(METHOD_C_B6L3_FOUR_PILOT_CELL_IDS);
const PRESERVED_SET = new Set<string>(PRESERVED_METHOD_C_PILOT_CELL_IDS);
const OTHER_REPLACEMENT_LESSONS = new Set<string>(
  METHOD_B_TO_C_REPLACEMENT_LESSON_IDS.filter((id) => id !== METHOD_C_B6L3_FOUR_PILOT_LESSON_ID),
);

/**
 * Fail-closed selector for exactly four pilot cells:
 * builder-m6-l3-first-prompt-to-lovable × {ar-EG, ar-MSA, ar-Gulf, en}.
 * Intrinsically cannot broaden to 12 or 372 cells.
 */
export function selectMethodBToCFourCellPilot(
  manifest: ProductionManifest,
): MethodBToCFourCellPilotSelection {
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
  let otherReplacementLessonsSelected = 0;
  let acceptedMethodCSelected = 0;

  for (const cell of selected) {
    if (seen.has(cell.cellId)) {
      errors.push(`duplicate selected cellId: ${cell.cellId}`);
    }
    seen.add(cell.cellId);

    if (cell.lessonId !== METHOD_C_B6L3_FOUR_PILOT_LESSON_ID) {
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
    if (cell.route === "AUTHORIZED_EXTERNAL_SCREENSHOT" || cell.category === "B") {
      errors.push(`former Method B route selected: ${cell.cellId}`);
    }
    if (OTHER_REPLACEMENT_LESSONS.has(cell.lessonId)) {
      otherReplacementLessonsSelected += 1;
      errors.push(`other replacement lesson selected: ${cell.cellId}`);
    }
    if (PRESERVED_SET.has(cell.cellId)) {
      acceptedMethodCSelected += 1;
      errors.push(`accepted Method C pilot cell selected: ${cell.cellId}`);
    }
    if (!(LOCALES as readonly string[]).includes(cell.locale)) {
      errors.push(`unexpected locale: ${cell.cellId}`);
    }

    perLocale[cell.locale] = (perLocale[cell.locale] ?? 0) + 1;
    perRoute[cell.route] = (perRoute[cell.route] ?? 0) + 1;
  }

  if (selected.length !== METHOD_C_B6L3_FOUR_PILOT_EXPECTED_TOTAL) {
    errors.push(
      `expected exactly ${METHOD_C_B6L3_FOUR_PILOT_EXPECTED_TOTAL} cells, got ${selected.length}`,
    );
  }
  if (selected.length < METHOD_C_B6L3_FOUR_PILOT_EXPECTED_TOTAL) {
    errors.push("fewer than four cells — fail closed");
  }
  if (selected.length > METHOD_C_B6L3_FOUR_PILOT_EXPECTED_TOTAL) {
    errors.push("more than four cells — fail closed (selection must not broaden)");
  }

  for (const expectedId of METHOD_C_B6L3_FOUR_PILOT_CELL_IDS) {
    if (!seen.has(expectedId)) {
      errors.push(`missing expected cell: ${expectedId}`);
    }
  }
  for (const locale of LOCALES) {
    if (perLocale[locale] !== 1) {
      errors.push(`expected exactly 1 cell for ${locale}, got ${perLocale[locale]}`);
    }
  }
  if ((perRoute.INSTRUCTIONAL_COMPOSITION ?? 0) !== METHOD_C_B6L3_FOUR_PILOT_EXPECTED_TOTAL) {
    errors.push("all selected cells must be INSTRUCTIONAL_COMPOSITION");
  }
  if (
    (perRoute.MASAARAT_SCREENSHOT ?? 0) !== 0 ||
    (perRoute.AUTHORIZED_EXTERNAL_SCREENSHOT ?? 0) !== 0
  ) {
    errors.push("A/B cells must not be selected");
  }

  // Manifest order for this exact lesson must be preserved.
  const expectedOrder = METHOD_C_B6L3_FOUR_PILOT_CELL_IDS.filter((id) =>
    manifest.cells.some((c) => c.cellId === id),
  );
  const actualOrder = selected.map((c) => c.cellId);
  if (JSON.stringify(actualOrder) !== JSON.stringify([...expectedOrder])) {
    // Prefer production-manifest order for the four cells.
    const manifestOrder = manifest.cells
      .filter((c) => EXPECTED_SET.has(c.cellId))
      .map((c) => c.cellId);
    if (JSON.stringify(actualOrder) !== JSON.stringify(manifestOrder)) {
      errors.push("selection order does not match production manifest order for the four cells");
    }
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
      otherReplacementLessonsSelected,
      acceptedMethodCSelected,
    },
  };
}

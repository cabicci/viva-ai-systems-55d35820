import {
  LOCALES,
  METHOD_A_M7L1_FOUR_PILOT_LESSON_ID,
  METHOD_A_REMAINING_SIX_CELL_IDS,
  METHOD_A_REMAINING_SIX_EXPECTED_TOTAL,
  METHOD_A_REMAINING_SIX_LESSON_IDS,
} from "./constants";
import type { Locale, ManifestCell, ProductionManifest } from "./types";

export interface MethodARemainingSixSelection {
  ok: boolean;
  cells: ManifestCell[];
  errors: string[];
  counts: {
    total: number;
    selected: number;
    capturedTarget: number;
    perLocale: Record<Locale, number>;
    perLesson: Record<string, number>;
    perRoute: Record<string, number>;
    methodBSelected: number;
    methodCSelected: number;
    acceptedPilotSelected: number;
    otherMethodASelected: number;
    otherLessonsSelected: number;
  };
}

const EXPECTED_SET = new Set<string>(METHOD_A_REMAINING_SIX_CELL_IDS);
const LESSON_SET = new Set<string>(METHOD_A_REMAINING_SIX_LESSON_IDS);

/**
 * Fail-closed selector for exactly 24 remaining Method A cells
 * (six lessons × four locales) in authoritative order.
 */
export function selectMethodARemainingSix(
  manifest: ProductionManifest,
): MethodARemainingSixSelection {
  const errors: string[] = [];
  const byId = new Map<string, ManifestCell[]>();
  for (const cell of manifest.cells) {
    if (!EXPECTED_SET.has(cell.cellId)) continue;
    const list = byId.get(cell.cellId) ?? [];
    list.push(cell);
    byId.set(cell.cellId, list);
  }

  const selected: ManifestCell[] = [];
  for (const expectedId of METHOD_A_REMAINING_SIX_CELL_IDS) {
    const matches = byId.get(expectedId);
    if (!matches || matches.length === 0) {
      errors.push(`missing expected cell: ${expectedId}`);
      continue;
    }
    if (matches.length > 1) {
      errors.push(`duplicate selected cellId: ${expectedId}`);
    }
    selected.push(matches[0]!);
  }

  const perLocale = Object.fromEntries(LOCALES.map((l) => [l, 0])) as Record<Locale, number>;
  const perLesson: Record<string, number> = {};
  const perRoute: Record<string, number> = {};
  const seen = new Set<string>();
  let methodBSelected = 0;
  let methodCSelected = 0;
  let acceptedPilotSelected = 0;
  let otherMethodASelected = 0;
  let otherLessonsSelected = 0;

  for (const cell of selected) {
    if (seen.has(cell.cellId)) errors.push(`duplicate selected cellId: ${cell.cellId}`);
    seen.add(cell.cellId);

    if (!LESSON_SET.has(cell.lessonId)) {
      otherLessonsSelected += 1;
      errors.push(`unexpected lesson selected: ${cell.cellId}`);
    }
    if (cell.lessonId === METHOD_A_M7L1_FOUR_PILOT_LESSON_ID) {
      acceptedPilotSelected += 1;
      errors.push(`accepted pilot cell selected: ${cell.cellId}`);
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
      !LESSON_SET.has(cell.lessonId)
    ) {
      otherMethodASelected += 1;
      errors.push(`other Method A lesson selected: ${cell.cellId}`);
    }
    if (!(LOCALES as readonly string[]).includes(cell.locale)) {
      errors.push(`unexpected locale: ${cell.cellId}`);
    }

    perLocale[cell.locale] = (perLocale[cell.locale] ?? 0) + 1;
    perLesson[cell.lessonId] = (perLesson[cell.lessonId] ?? 0) + 1;
    perRoute[cell.route] = (perRoute[cell.route] ?? 0) + 1;
  }

  if (selected.length !== METHOD_A_REMAINING_SIX_EXPECTED_TOTAL) {
    errors.push(
      `expected exactly ${METHOD_A_REMAINING_SIX_EXPECTED_TOTAL} cells, got ${selected.length}`,
    );
  }
  for (const lessonId of METHOD_A_REMAINING_SIX_LESSON_IDS) {
    if ((perLesson[lessonId] ?? 0) !== LOCALES.length) {
      errors.push(
        `expected exactly ${LOCALES.length} cells for ${lessonId}, got ${perLesson[lessonId] ?? 0}`,
      );
    }
  }
  for (const locale of LOCALES) {
    if (perLocale[locale] !== METHOD_A_REMAINING_SIX_LESSON_IDS.length) {
      errors.push(
        `expected exactly ${METHOD_A_REMAINING_SIX_LESSON_IDS.length} cells for ${locale}, got ${perLocale[locale]}`,
      );
    }
  }
  if ((perRoute.MASAARAT_SCREENSHOT ?? 0) !== METHOD_A_REMAINING_SIX_EXPECTED_TOTAL) {
    errors.push("all selected cells must be MASAARAT_SCREENSHOT");
  }
  if (
    (perRoute.INSTRUCTIONAL_COMPOSITION ?? 0) !== 0 ||
    (perRoute.AUTHORIZED_EXTERNAL_SCREENSHOT ?? 0) !== 0
  ) {
    errors.push("B/C cells must not be selected");
  }

  const actualOrder = selected.map((c) => c.cellId);
  if (JSON.stringify(actualOrder) !== JSON.stringify([...METHOD_A_REMAINING_SIX_CELL_IDS])) {
    errors.push("selection order does not match authoritative METHOD_A_REMAINING_SIX_CELL_IDS");
  }

  return {
    ok: errors.length === 0,
    cells: selected,
    errors,
    counts: {
      total: selected.length,
      selected: selected.length,
      capturedTarget: METHOD_A_REMAINING_SIX_EXPECTED_TOTAL,
      perLocale,
      perLesson,
      perRoute,
      methodBSelected,
      methodCSelected,
      acceptedPilotSelected,
      otherMethodASelected,
      otherLessonsSelected,
    },
  };
}

/**
 * Authoritative 12-cell pilot manifest — deterministic selection from the 400-cell
 * AUTHORIZED_MANIFEST.json. No wall-clock, FS ordering, randomness, network, or secrets.
 *
 * Algorithm locale-first-n/v1:
 *   For each locale in PRODUCTION_LOCALES order, take the first N=3 cells that
 *   appear for that locale in the full manifest's cells array order.
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  AUTHORIZED_MANIFEST_RELATIVE_PATH,
  EXPECTED_CELL_COUNT,
  PRODUCTION_LOCALES,
} from "../constants";
import type { Locale, Method } from "../types";

export const PILOT_MANIFEST_SCHEMA = "lesson-visual-pilot-manifest/v1" as const;
export const PILOT_SELECTION_ALGORITHM = "locale-first-n/v1" as const;
export const PILOT_PER_LOCALE = 3 as const;
export const EXPECTED_PILOT_CELL_COUNT = 12 as const;
export const AUTHORIZED_PILOT_MANIFEST_RELATIVE_PATH =
  "docs/lesson-visuals/v1/AUTHORIZED_PILOT_12.json" as const;

export interface FullManifestCell {
  cellId: string;
  lessonId: string;
  locale: Locale;
  method: Method;
}

export interface PilotManifestCell extends FullManifestCell {
  masterRelativePath: string;
}

export interface PilotManifest {
  schemaVersion: typeof PILOT_MANIFEST_SCHEMA;
  sourceSha: string;
  fullManifestSha256: string;
  selectionAlgorithm: typeof PILOT_SELECTION_ALGORITHM;
  selectionParams: { perLocale: typeof PILOT_PER_LOCALE };
  pilotCount: typeof EXPECTED_PILOT_CELL_COUNT;
  locales: readonly Locale[];
  cells: PilotManifestCell[];
  counts: {
    cells: typeof EXPECTED_PILOT_CELL_COUNT;
    perLocale: Record<Locale, typeof PILOT_PER_LOCALE>;
  };
}

export function sha256FileBytes(absPath: string): string {
  return createHash("sha256").update(readFileSync(absPath)).digest("hex");
}

export function sha256Utf8(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

/** Stable JSON with trailing newline — used for committed bytes and digests. */
export function formatPilotManifestJson(manifest: PilotManifest): string {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

export function masterRelativePathForLesson(lessonId: string): string {
  return `docs/lesson-visuals/v1/masters/${lessonId}.master.json`;
}

export function selectPilotCellsFromFull(
  fullCells: readonly FullManifestCell[],
): { ok: boolean; errors: string[]; cells: PilotManifestCell[] } {
  const errors: string[] = [];
  if (fullCells.length !== EXPECTED_CELL_COUNT) {
    errors.push(`full manifest cells ${fullCells.length} != ${EXPECTED_CELL_COUNT}`);
  }
  const seen = new Set<string>();
  for (const c of fullCells) {
    if (seen.has(c.cellId)) errors.push(`duplicate full cell ${c.cellId}`);
    seen.add(c.cellId);
  }
  const selected: PilotManifestCell[] = [];
  for (const locale of PRODUCTION_LOCALES) {
    const forLocale = fullCells.filter((c) => c.locale === locale);
    if (forLocale.length < PILOT_PER_LOCALE) {
      errors.push(`locale ${locale} has only ${forLocale.length} cells`);
      continue;
    }
    for (let i = 0; i < PILOT_PER_LOCALE; i++) {
      const c = forLocale[i]!;
      selected.push({
        cellId: c.cellId,
        lessonId: c.lessonId,
        locale: c.locale,
        method: c.method,
        masterRelativePath: masterRelativePathForLesson(c.lessonId),
      });
    }
  }
  if (selected.length !== EXPECTED_PILOT_CELL_COUNT) {
    errors.push(`selected ${selected.length} != ${EXPECTED_PILOT_CELL_COUNT}`);
  }
  const ids = selected.map((c) => c.cellId);
  if (new Set(ids).size !== ids.length) errors.push("pilot selection contains duplicates");
  for (const c of selected) {
    if (!seen.has(c.cellId)) errors.push(`pilot cell not in full manifest: ${c.cellId}`);
  }
  const perLocale: Record<string, number> = {};
  for (const c of selected) {
    perLocale[c.locale] = (perLocale[c.locale] ?? 0) + 1;
  }
  for (const loc of PRODUCTION_LOCALES) {
    if (perLocale[loc] !== PILOT_PER_LOCALE) {
      errors.push(`locale ${loc} count ${perLocale[loc] ?? 0} != ${PILOT_PER_LOCALE}`);
    }
  }
  return { ok: errors.length === 0, errors, cells: selected };
}

export function buildPilotManifest(args: {
  sourceSha: string;
  fullManifestSha256: string;
  fullCells: readonly FullManifestCell[];
}): { ok: boolean; errors: string[]; manifest: PilotManifest | null } {
  const sel = selectPilotCellsFromFull(args.fullCells);
  if (!sel.ok) return { ok: false, errors: sel.errors, manifest: null };
  if (!/^[a-f0-9]{40}$/.test(args.sourceSha)) {
    return { ok: false, errors: ["sourceSha invalid"], manifest: null };
  }
  if (!/^[a-f0-9]{64}$/.test(args.fullManifestSha256)) {
    return { ok: false, errors: ["fullManifestSha256 invalid"], manifest: null };
  }
  const perLocale = {
    "ar-EG": PILOT_PER_LOCALE,
    "ar-MSA": PILOT_PER_LOCALE,
    "ar-Gulf": PILOT_PER_LOCALE,
    en: PILOT_PER_LOCALE,
  } as const;
  const manifest: PilotManifest = {
    schemaVersion: PILOT_MANIFEST_SCHEMA,
    sourceSha: args.sourceSha,
    fullManifestSha256: args.fullManifestSha256,
    selectionAlgorithm: PILOT_SELECTION_ALGORITHM,
    selectionParams: { perLocale: PILOT_PER_LOCALE },
    pilotCount: EXPECTED_PILOT_CELL_COUNT,
    locales: [...PRODUCTION_LOCALES],
    cells: sel.cells,
    counts: { cells: EXPECTED_PILOT_CELL_COUNT, perLocale },
  };
  return { ok: true, errors: [], manifest };
}

export function validatePilotManifest(
  obj: unknown,
  expected?: {
    sourceSha?: string;
    fullManifestSha256?: string;
    fullCellIds?: ReadonlySet<string> | readonly string[];
  },
): { ok: boolean; errors: string[]; manifest: PilotManifest | null } {
  const errors: string[] = [];
  if (!obj || typeof obj !== "object") {
    return { ok: false, errors: ["pilot manifest not an object"], manifest: null };
  }
  const m = obj as Partial<PilotManifest>;
  if (m.schemaVersion !== PILOT_MANIFEST_SCHEMA) {
    errors.push("unsupported pilot schemaVersion");
  }
  if (m.selectionAlgorithm !== PILOT_SELECTION_ALGORITHM) {
    errors.push("unsupported selectionAlgorithm");
  }
  if (m.selectionParams?.perLocale !== PILOT_PER_LOCALE) {
    errors.push("selectionParams.perLocale must be 3");
  }
  if (m.pilotCount !== EXPECTED_PILOT_CELL_COUNT) {
    errors.push(`pilotCount ${String(m.pilotCount)} != ${EXPECTED_PILOT_CELL_COUNT}`);
  }
  if (!Array.isArray(m.cells)) {
    errors.push("cells must be array");
    return { ok: false, errors, manifest: null };
  }
  if (m.cells.length !== EXPECTED_PILOT_CELL_COUNT) {
    errors.push(`cells length ${m.cells.length} != ${EXPECTED_PILOT_CELL_COUNT}`);
  }
  if (m.counts?.cells !== EXPECTED_PILOT_CELL_COUNT) {
    errors.push("counts.cells must be 12");
  }
  if (!/^[a-f0-9]{40}$/.test(m.sourceSha ?? "")) errors.push("sourceSha invalid");
  if (!/^[a-f0-9]{64}$/.test(m.fullManifestSha256 ?? "")) {
    errors.push("fullManifestSha256 invalid");
  }
  if (expected?.sourceSha && m.sourceSha !== expected.sourceSha) {
    errors.push("pilot sourceSha mismatch");
  }
  if (expected?.fullManifestSha256 && m.fullManifestSha256 !== expected.fullManifestSha256) {
    errors.push("pilot fullManifestSha256 binding mismatch");
  }
  const fullSet = expected?.fullCellIds
    ? expected.fullCellIds instanceof Set
      ? expected.fullCellIds
      : new Set(expected.fullCellIds)
    : null;
  const ids = new Set<string>();
  const perLocale: Record<string, number> = {};
  for (const c of m.cells) {
    if (!c || typeof c !== "object") {
      errors.push("cell entry invalid");
      continue;
    }
    if (!c.cellId || !c.lessonId || !c.locale || !c.method || !c.masterRelativePath) {
      errors.push(`cell missing required fields: ${String(c.cellId)}`);
    }
    if (ids.has(c.cellId)) errors.push(`duplicate pilot cell ${c.cellId}`);
    ids.add(c.cellId);
    if (fullSet && !fullSet.has(c.cellId)) {
      errors.push(`unknown pilot cell not in full 400: ${c.cellId}`);
    }
    if (c.masterRelativePath !== masterRelativePathForLesson(c.lessonId)) {
      errors.push(`masterRelativePath mismatch for ${c.cellId}`);
    }
    perLocale[c.locale] = (perLocale[c.locale] ?? 0) + 1;
  }
  for (const loc of PRODUCTION_LOCALES) {
    if (perLocale[loc] !== PILOT_PER_LOCALE) {
      errors.push(`locale ${loc} distribution ${perLocale[loc] ?? 0} != ${PILOT_PER_LOCALE}`);
    }
  }
  if (errors.length) return { ok: false, errors, manifest: null };
  return { ok: true, errors: [], manifest: m as PilotManifest };
}

export function loadFullManifest(repoRoot: string): {
  ok: boolean;
  errors: string[];
  bytes: Buffer | null;
  sha256: string | null;
  sourceSha: string | null;
  cells: FullManifestCell[];
} {
  const abs = resolve(repoRoot, AUTHORIZED_MANIFEST_RELATIVE_PATH);
  try {
    const bytes = readFileSync(abs);
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    const parsed = JSON.parse(bytes.toString("utf8")) as {
      sourceSha: string;
      cells: FullManifestCell[];
    };
    return {
      ok: true,
      errors: [],
      bytes,
      sha256,
      sourceSha: parsed.sourceSha,
      cells: parsed.cells,
    };
  } catch (e) {
    return {
      ok: false,
      errors: [e instanceof Error ? e.message : String(e)],
      bytes: null,
      sha256: null,
      sourceSha: null,
      cells: [],
    };
  }
}

export function generatePilotManifestFromRepo(repoRoot: string): {
  ok: boolean;
  errors: string[];
  manifest: PilotManifest | null;
  json: string | null;
  sha256: string | null;
} {
  const full = loadFullManifest(repoRoot);
  if (!full.ok || !full.sha256 || !full.sourceSha) {
    return { ok: false, errors: full.errors, manifest: null, json: null, sha256: null };
  }
  const built = buildPilotManifest({
    sourceSha: full.sourceSha,
    fullManifestSha256: full.sha256,
    fullCells: full.cells,
  });
  if (!built.ok || !built.manifest) {
    return { ok: false, errors: built.errors, manifest: null, json: null, sha256: null };
  }
  const json = formatPilotManifestJson(built.manifest);
  return {
    ok: true,
    errors: [],
    manifest: built.manifest,
    json,
    sha256: sha256Utf8(json),
  };
}

export function verifyCheckedInPilotManifest(repoRoot: string): {
  ok: boolean;
  errors: string[];
  sha256: string | null;
  cellIds: string[];
} {
  const full = loadFullManifest(repoRoot);
  if (!full.ok || !full.sha256 || !full.sourceSha) {
    return { ok: false, errors: full.errors, sha256: null, cellIds: [] };
  }
  const regenerated = generatePilotManifestFromRepo(repoRoot);
  if (!regenerated.ok || !regenerated.json || !regenerated.sha256 || !regenerated.manifest) {
    return { ok: false, errors: regenerated.errors, sha256: null, cellIds: [] };
  }
  const abs = resolve(repoRoot, AUTHORIZED_PILOT_MANIFEST_RELATIVE_PATH);
  let onDisk: string;
  try {
    onDisk = readFileSync(abs, "utf8");
  } catch (e) {
    return {
      ok: false,
      errors: [`pilot manifest missing: ${e instanceof Error ? e.message : String(e)}`],
      sha256: null,
      cellIds: [],
    };
  }
  const diskSha = sha256Utf8(onDisk);
  const errors: string[] = [];
  if (onDisk !== regenerated.json) {
    errors.push("checked-in pilot manifest bytes differ from deterministic regeneration");
  }
  if (diskSha !== regenerated.sha256) {
    errors.push("pilot digest mismatch vs regeneration");
  }
  const parsed = JSON.parse(onDisk) as unknown;
  const v = validatePilotManifest(parsed, {
    sourceSha: full.sourceSha,
    fullManifestSha256: full.sha256,
    fullCellIds: full.cells.map((c) => c.cellId),
  });
  if (!v.ok) errors.push(...v.errors);
  return {
    ok: errors.length === 0,
    errors,
    sha256: diskSha,
    cellIds: regenerated.manifest.cells.map((c) => c.cellId),
  };
}

export function writePilotManifest(repoRoot: string): {
  ok: boolean;
  errors: string[];
  sha256: string | null;
  path: string;
} {
  const gen = generatePilotManifestFromRepo(repoRoot);
  const path = resolve(repoRoot, AUTHORIZED_PILOT_MANIFEST_RELATIVE_PATH);
  if (!gen.ok || !gen.json || !gen.sha256) {
    return { ok: false, errors: gen.errors, sha256: null, path };
  }
  writeFileSync(path, gen.json, "utf8");
  return { ok: true, errors: [], sha256: gen.sha256, path };
}

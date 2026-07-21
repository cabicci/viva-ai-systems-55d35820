/**
 * build_manifest — assembles docs/lesson-visuals/v1/AUTHORIZED_MANIFEST.json
 * from the 100 authored masters + the en manifest's lessonId order.
 * Run: bun run src/lib/lesson-visuals/v1/scripts/build_manifest.ts
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { AuthorizedManifest, LessonVisualMaster, ManifestCell } from "../types";
import { LOCALES } from "../types";

const MODULE_DIR = dirname(fileURLToPath(import.meta.url));
const SOURCE_SHA = "b211cd43ed8378dcc9921d85b19a7e8ef6c7b70d";
const REPO_ROOT = resolve(MODULE_DIR, "../../../../..");
const MASTERS_DIR = resolve(REPO_ROOT, "docs/lesson-visuals/v1/masters");
const MANIFEST_OUT_PATH = resolve(REPO_ROOT, "docs/lesson-visuals/v1/AUTHORIZED_MANIFEST.json");
const EN_MANIFEST_PATH = resolve(REPO_ROOT, "src/lib/locale-lessons/en/manifest.json");

function loadJson<T>(absPath: string): T {
  return JSON.parse(readFileSync(absPath, "utf8")) as T;
}

function main() {
  const enManifest = loadJson<{ lessonIds: string[] }>(EN_MANIFEST_PATH);
  const lessonIds = enManifest.lessonIds;

  if (!existsSync(MASTERS_DIR)) {
    throw new Error(`Masters dir not found: ${MASTERS_DIR}. Run author_masters.ts first.`);
  }

  const masterFiles = readdirSync(MASTERS_DIR).filter((f) => f.endsWith(".master.json"));
  const mastersById = new Map<string, LessonVisualMaster>();
  for (const f of masterFiles) {
    const master = loadJson<LessonVisualMaster>(resolve(MASTERS_DIR, f));
    mastersById.set(master.lessonId, master);
  }

  const missing = lessonIds.filter((id) => !mastersById.has(id));
  if (missing.length > 0) {
    throw new Error(`Missing masters for lessonIds: ${missing.join(", ")}`);
  }
  if (mastersById.size !== 100 || lessonIds.length !== 100) {
    throw new Error(`Expected exactly 100 masters and 100 lessonIds, got ${mastersById.size} masters / ${lessonIds.length} ids`);
  }

  const cells: ManifestCell[] = [];
  for (const lessonId of lessonIds) {
    const master = mastersById.get(lessonId)!;
    for (const locale of LOCALES) {
      cells.push({
        cellId: `${lessonId}__${locale}`,
        lessonId,
        locale,
        method: master.method,
      });
    }
  }

  if (cells.length !== 400) {
    throw new Error(`Expected exactly 400 cells, got ${cells.length}`);
  }

  const manifest: AuthorizedManifest = {
    manifestVersion: "lesson-visuals-authorized/v1",
    sourceSha: SOURCE_SHA,
    lessonIds,
    locales: [...LOCALES],
    cells,
    counts: { masters: 100, cells: 400, perLocale: 100 },
  };

  writeFileSync(MANIFEST_OUT_PATH, JSON.stringify(manifest, null, 2) + "\n", "utf8");

  console.log(
    JSON.stringify(
      {
        manifestPath: MANIFEST_OUT_PATH,
        masters: manifest.counts.masters,
        cells: manifest.counts.cells,
        perLocale: manifest.counts.perLocale,
      },
      null,
      2,
    ),
  );
}

main();

/**
 * Deterministically repin AUTHORIZED_MANIFEST.json and all masters to AUTHORITATIVE_BASE_SOURCE_SHA.
 * Does not use the candidate tip SHA (circular / non-reproducible).
 *
 * Run: bun run src/lib/lesson-visuals/v1/scripts/repin_source_sha.ts
 * Validate only: bun run src/lib/lesson-visuals/v1/scripts/repin_source_sha.ts --check
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  AUTHORITATIVE_BASE_SOURCE_SHA,
  AUTHORIZED_MANIFEST_RELATIVE_PATH,
  EXPECTED_CELL_COUNT,
  EXPECTED_LESSON_COUNT,
  EXPECTED_PER_LOCALE,
  PRODUCTION_LOCALES,
} from "../constants";
import { canonicalChecksum } from "./canonical";
import type { AuthorizedManifest, LessonVisualMaster } from "../types";

function moduleDir(): string {
  if (typeof import.meta.dirname === "string") return import.meta.dirname;
  const meta = import.meta as unknown as { dir?: string };
  if (typeof meta.dir === "string") return meta.dir;
  return fileURLToPath(new URL(".", import.meta.url));
}

const REPO_ROOT = resolve(moduleDir(), "../../../../..");
const MASTERS_DIR = resolve(REPO_ROOT, "docs/lesson-visuals/v1/masters");
const MANIFEST_PATH = resolve(REPO_ROOT, AUTHORIZED_MANIFEST_RELATIVE_PATH);
const AUTHOR_SCRIPT = resolve(
  REPO_ROOT,
  "src/lib/lesson-visuals/v1/scripts/author_masters.ts",
);
const BUILD_SCRIPT = resolve(
  REPO_ROOT,
  "src/lib/lesson-visuals/v1/scripts/build_manifest.ts",
);

const SOURCE_SHA_LITERAL_RE =
  /const SOURCE_SHA = "[a-f0-9]{40}";/;

function loadJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function writeJsonStable(path: string, value: unknown): void {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function repinMaster(path: string): { lessonId: string; changed: boolean } {
  const master = loadJson<LessonVisualMaster>(path);
  const before = master.sourceSha;
  const { checksum: _drop, ...rest } = {
    ...master,
    sourceSha: AUTHORITATIVE_BASE_SOURCE_SHA,
  };
  const next: LessonVisualMaster = {
    ...(rest as Omit<LessonVisualMaster, "checksum">),
    sourceSha: AUTHORITATIVE_BASE_SOURCE_SHA,
    checksum: canonicalChecksum({
      ...rest,
      sourceSha: AUTHORITATIVE_BASE_SOURCE_SHA,
    }),
  };
  writeJsonStable(path, next);
  return { lessonId: next.lessonId, changed: before !== AUTHORITATIVE_BASE_SOURCE_SHA };
}

function repinManifest(): AuthorizedManifest {
  const manifest = loadJson<AuthorizedManifest>(MANIFEST_PATH);
  const next: AuthorizedManifest = {
    ...manifest,
    sourceSha: AUTHORITATIVE_BASE_SOURCE_SHA,
  };
  writeJsonStable(MANIFEST_PATH, next);
  return next;
}

function patchSourceShaConstant(scriptPath: string): void {
  const raw = readFileSync(scriptPath, "utf8");
  if (!SOURCE_SHA_LITERAL_RE.test(raw)) {
    throw new Error(`SOURCE_SHA literal not found in ${scriptPath}`);
  }
  const patched = raw.replace(
    SOURCE_SHA_LITERAL_RE,
    `const SOURCE_SHA = "${AUTHORITATIVE_BASE_SOURCE_SHA}";`,
  );
  writeFileSync(scriptPath, patched, "utf8");
}

export interface RepinValidationResult {
  ok: boolean;
  errors: string[];
  manifestSha256: string;
  manifestBytes: number;
  masterCount: number;
  cellCount: number;
  perLocale: Record<string, number>;
  sourceSha: string;
}

export function validateRepinState(): RepinValidationResult {
  const errors: string[] = [];
  if (!existsSync(MANIFEST_PATH)) {
    return {
      ok: false,
      errors: [`missing ${MANIFEST_PATH}`],
      manifestSha256: "",
      manifestBytes: 0,
      masterCount: 0,
      cellCount: 0,
      perLocale: {},
      sourceSha: "",
    };
  }

  const bytes = readFileSync(MANIFEST_PATH);
  const manifestSha256 = createHash("sha256").update(bytes).digest("hex");
  const manifest = JSON.parse(bytes.toString("utf8")) as AuthorizedManifest;

  if (manifest.sourceSha !== AUTHORITATIVE_BASE_SOURCE_SHA) {
    errors.push(
      `manifest.sourceSha ${manifest.sourceSha} != ${AUTHORITATIVE_BASE_SOURCE_SHA}`,
    );
  }
  if (manifest.lessonIds.length !== EXPECTED_LESSON_COUNT) {
    errors.push(`lessonIds ${manifest.lessonIds.length} != ${EXPECTED_LESSON_COUNT}`);
  }
  if (manifest.cells.length !== EXPECTED_CELL_COUNT) {
    errors.push(`cells ${manifest.cells.length} != ${EXPECTED_CELL_COUNT}`);
  }
  if (JSON.stringify(manifest.locales) !== JSON.stringify([...PRODUCTION_LOCALES])) {
    errors.push(`locales mismatch: ${JSON.stringify(manifest.locales)}`);
  }

  const masterFiles = readdirSync(MASTERS_DIR).filter((f) => f.endsWith(".master.json"));
  const masters = new Map<string, LessonVisualMaster>();
  for (const f of masterFiles) {
    const m = loadJson<LessonVisualMaster>(resolve(MASTERS_DIR, f));
    masters.set(m.lessonId, m);
    if (m.sourceSha !== AUTHORITATIVE_BASE_SOURCE_SHA) {
      errors.push(`master ${m.lessonId} sourceSha ${m.sourceSha}`);
    }
    const { checksum, ...rest } = m;
    const expected = canonicalChecksum(rest);
    if (checksum !== expected) {
      errors.push(`master ${m.lessonId} checksum mismatch`);
    }
  }
  if (masters.size !== EXPECTED_LESSON_COUNT) {
    errors.push(`master count ${masters.size} != ${EXPECTED_LESSON_COUNT}`);
  }

  for (const id of manifest.lessonIds) {
    if (!masters.has(id)) errors.push(`orphan lessonId in manifest: ${id}`);
  }
  for (const id of masters.keys()) {
    if (!manifest.lessonIds.includes(id)) errors.push(`orphan master not in manifest: ${id}`);
  }

  const cellIds = new Set<string>();
  const perLocale: Record<string, number> = {};
  for (const cell of manifest.cells) {
    if (cellIds.has(cell.cellId)) errors.push(`duplicate cellId ${cell.cellId}`);
    cellIds.add(cell.cellId);
    const expectedId = `${cell.lessonId}__${cell.locale}`;
    if (cell.cellId !== expectedId) {
      errors.push(`cellId ${cell.cellId} should be ${expectedId}`);
    }
    const master = masters.get(cell.lessonId);
    if (!master) {
      errors.push(`cell ${cell.cellId} has no master`);
    } else if (master.method !== cell.method) {
      errors.push(`cell ${cell.cellId} method ${cell.method} != master ${master.method}`);
    }
    perLocale[cell.locale] = (perLocale[cell.locale] ?? 0) + 1;
  }
  for (const loc of PRODUCTION_LOCALES) {
    if (perLocale[loc] !== EXPECTED_PER_LOCALE) {
      errors.push(`locale ${loc} cells ${perLocale[loc] ?? 0} != ${EXPECTED_PER_LOCALE}`);
    }
  }

  for (const scriptPath of [AUTHOR_SCRIPT, BUILD_SCRIPT]) {
    const raw = readFileSync(scriptPath, "utf8");
    if (!raw.includes(`const SOURCE_SHA = "${AUTHORITATIVE_BASE_SOURCE_SHA}";`)) {
      errors.push(`SOURCE_SHA not pinned in ${scriptPath}`);
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    manifestSha256,
    manifestBytes: bytes.length,
    masterCount: masters.size,
    cellCount: manifest.cells.length,
    perLocale,
    sourceSha: manifest.sourceSha,
  };
}

function main(): void {
  const checkOnly = process.argv.includes("--check");
  if (!checkOnly) {
    const masterFiles = readdirSync(MASTERS_DIR).filter((f) => f.endsWith(".master.json"));
    let changed = 0;
    for (const f of masterFiles) {
      const r = repinMaster(resolve(MASTERS_DIR, f));
      if (r.changed) changed += 1;
    }
    repinManifest();
    patchSourceShaConstant(AUTHOR_SCRIPT);
    patchSourceShaConstant(BUILD_SCRIPT);
    console.log(
      JSON.stringify(
        {
          action: "repin",
          baseSourceSha: AUTHORITATIVE_BASE_SOURCE_SHA,
          mastersTouched: masterFiles.length,
          mastersChanged: changed,
        },
        null,
        2,
      ),
    );
  }

  const result = validateRepinState();
  console.log(JSON.stringify({ action: "validate", ...result }, null, 2));
  if (!result.ok) {
    process.exit(1);
  }
}

const isDirect =
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv[1] &&
  (process.argv[1].endsWith("repin_source_sha.ts") ||
    process.argv[1].endsWith("repin_source_sha.js"));

if (isDirect) {
  main();
}

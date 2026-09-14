import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type {
  LessonPackageLocale,
  LocalizedLessonManifest,
} from "@/lib/locale-lessons/types";

const ISOLATED_PATHS = await vi.hoisted(async () => {
  const { mkdtemp } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  return { root: await mkdtemp(join(tmpdir(), "masaarat-phase13b-")) };
});

vi.mock(
  "../../../scripts/locale-lessons/lib/source-package.ts",
  async (importOriginal) => {
    const actual = await importOriginal<
      typeof import("../../../scripts/locale-lessons/lib/source-package.ts")
    >();
    const nodePath = await import("node:path");
    const packageDirForLocale = (locale: string) =>
      nodePath.join(ISOLATED_PATHS.root, "runtime", locale);

    return {
      ...actual,
      packageDirForLocale,
      lessonsDirForLocale: (locale: string) =>
        nodePath.join(packageDirForLocale(locale), "lessons"),
      manifestPathForLocale: (locale: string) =>
        nodePath.join(packageDirForLocale(locale), "manifest.json"),
    };
  },
);

vi.mock(
  "../../../scripts/locale-lessons/collect-phase13b-recovered-report.ts",
  async (importOriginal) => {
    const actual = await importOriginal<
      typeof import("../../../scripts/locale-lessons/collect-phase13b-recovered-report.ts")
    >();
    const nodePath = await import("node:path");
    const recoveredRoot = nodePath.resolve(
      process.cwd(),
      "src/lib/locale-lessons/ar-MSA/reports/phase13b-recovered-packages",
    );

    return {
      ...actual,
      PHASE13B_RECOVERED_PACKAGES_ROOT: recoveredRoot,
      collectPhase13BRecoveredReport: (
        options: Parameters<typeof actual.collectPhase13BRecoveredReport>[0] = {},
      ) => actual.collectPhase13BRecoveredReport({ ...options, root: recoveredRoot }),
    };
  },
);

import { validateManifestCurriculumSync } from "../../../scripts/locale-lessons/lib/validate-manifest-curriculum-sync-core.ts";
import { validateTitleIndexParity } from "../../../scripts/locale-lessons/lib/validate-title-index-parity-core.ts";
import { activeCurriculumLessonIds } from "../../../scripts/locale-lessons/lib/localization-contract-rules.ts";
import {
  buildEquivalenceChecksumReport,
  findStaleRuntimePackages,
  formatDeterministicJson,
  listPromotionCells,
  promoteRecoveredToRuntime,
  PROMOTION_RUNTIME_LOCALES,
  runtimePackagePath,
  syncIndexesIfNeeded,
  validateRecoveredRuntimeEquivalence,
} from "../../../scripts/locale-lessons/lib/promote-phase13b-recovered-packages-core.ts";
import { REQUIRED_LESSON_COUNT } from "@/lib/locale-lessons/types";

const REPO_ROOT = path.resolve(import.meta.dirname, "../../..");
const TEMP_ROOT = path.resolve(ISOLATED_PATHS.root);
const ACTUAL_RECOVERED_ROOT = path.join(
  REPO_ROOT,
  "src/lib/locale-lessons/ar-MSA/reports/phase13b-recovered-packages",
);

function tempPackageDir(locale: LessonPackageLocale): string {
  return path.join(TEMP_ROOT, "runtime", locale);
}

function isInside(baseDir: string, filePath: string): boolean {
  const relative = path.relative(path.resolve(baseDir), path.resolve(filePath));
  return (
    relative !== "" &&
    relative !== ".." &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
}

function assertInsideTemp(filePath: string): void {
  expect(isInside(TEMP_ROOT, filePath)).toBe(true);
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, formatDeterministicJson(value), "utf8");
}

async function prepareIndexFixtures(): Promise<void> {
  const lessonIds = [...activeCurriculumLessonIds()];
  expect(lessonIds).toHaveLength(REQUIRED_LESSON_COUNT);

  for (const locale of PROMOTION_RUNTIME_LOCALES) {
    const manifest: LocalizedLessonManifest = {
      locale,
      generatedAt: "test-fixture",
      lessonCount: 0,
      lessonIds,
    };
    await writeJson(path.join(tempPackageDir(locale), "manifest.json"), manifest);
    await writeJson(path.join(tempPackageDir(locale), "lesson-titles.json"), {});
    await writeJson(path.join(tempPackageDir(locale), "labels.json"), {});
  }
}

async function collectJsonFiles(root: string): Promise<string[]> {
  let entries: import("node:fs").Dirent[];
  try {
    entries = await fs.readdir(root, { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }

  const files: string[] = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const entryPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectJsonFiles(entryPath)));
    } else if (entry.isFile() && entry.name.endsWith(".json")) {
      files.push(entryPath);
    }
  }
  return files;
}

async function snapshotTrackedLessonState(): Promise<Record<string, string>> {
  const files = new Set<string>();
  for (const locale of PROMOTION_RUNTIME_LOCALES) {
    const packageDir = path.join(REPO_ROOT, "src/lib/locale-lessons", locale);
    for (const name of ["manifest.json", "lesson-titles.json", "labels.json"]) {
      const filePath = path.join(packageDir, name);
      try {
        if ((await fs.stat(filePath)).isFile()) files.add(filePath);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      }
    }
    for (const filePath of await collectJsonFiles(path.join(packageDir, "lessons"))) {
      files.add(filePath);
    }
  }
  for (const filePath of await collectJsonFiles(ACTUAL_RECOVERED_ROOT)) {
    files.add(filePath);
  }

  const snapshot: Record<string, string> = {};
  for (const filePath of [...files].sort()) {
    const raw = await fs.readFile(filePath);
    const relative = path.relative(REPO_ROOT, filePath).replace(/\\/g, "/");
    snapshot[relative] = createHash("sha256").update(raw).digest("hex");
  }
  return snapshot;
}

let trackedStateBefore: Record<string, string> | undefined;

beforeAll(async () => {
  trackedStateBefore = await snapshotTrackedLessonState();
  await prepareIndexFixtures();
});

afterAll(async () => {
  try {
    if (trackedStateBefore) {
      const trackedStateAfter = await snapshotTrackedLessonState();
      expect(trackedStateAfter).toEqual(trackedStateBefore);
    }
  } finally {
    await fs.rm(TEMP_ROOT, { recursive: true, force: true });
  }
});

describe("phase13b runtime promotion uses isolated write paths", () => {
  it(
    "promotes, detects corruption, repairs idempotently, and syncs indexes without touching tracked packages",
    async () => {
      const cells = await listPromotionCells();
      expect(cells).toHaveLength(
        REQUIRED_LESSON_COUNT * PROMOTION_RUNTIME_LOCALES.length,
      );
      expect(
        cells.every((cell) => isInside(ACTUAL_RECOVERED_ROOT, cell.recoveredPath)),
      ).toBe(true);
      for (const cell of cells) assertInsideTemp(cell.runtimePath);

      const stalePath = path.join(tempPackageDir("en"), "lessons", "stale.json");
      await writeJson(stalePath, { lessonId: "stale", locale: "en" });

      // Default options deliberately retain the real recovered-corpus validation gate.
      const first = await promoteRecoveredToRuntime();
      expect(first.packagesPromoted).toBe(300);
      expect(first.filesWritten).toBe(300);
      expect(first.filesSkippedIdentical).toBe(0);
      expect(first.staleFilesRemoved).toContain(stalePath.replace(/\\/g, "/"));
      expect(await findStaleRuntimePackages()).toEqual([]);
      for (const filePath of first.staleFilesRemoved) assertInsideTemp(filePath);

      const equivalence = await validateRecoveredRuntimeEquivalence();
      expect(equivalence).toMatchObject({ ok: true, packagesChecked: 300 });
      expect(equivalence.mismatches).toEqual([]);

      const checksums = await buildEquivalenceChecksumReport();
      expect(checksums).toHaveLength(300);
      expect(checksums.every((cell) => cell.semanticallyEqual)).toBe(true);
      expect(checksums.every((cell) => cell.structuralErrors.length === 0)).toBe(true);

      const second = await promoteRecoveredToRuntime();
      expect(second.filesWritten).toBe(0);
      expect(second.filesSkippedIdentical).toBe(300);
      expect(second.staleFilesRemoved).toEqual([]);

      const corruptedCell = cells[0]!;
      const corruptedPackage = JSON.parse(
        await fs.readFile(corruptedCell.runtimePath, "utf8"),
      ) as { title: string };
      corruptedPackage.title = `${corruptedPackage.title} — corrupted`;
      await writeJson(corruptedCell.runtimePath, corruptedPackage);

      const corrupted = await validateRecoveredRuntimeEquivalence();
      expect(corrupted.ok).toBe(false);
      expect(corrupted.mismatches.map((cell) => cell.lessonId)).toEqual([
        corruptedCell.lessonId,
      ]);

      const repaired = await promoteRecoveredToRuntime();
      expect(repaired.filesWritten).toBe(1);
      expect(repaired.filesSkippedIdentical).toBe(299);
      expect((await validateRecoveredRuntimeEquivalence()).ok).toBe(true);

      const indexSync = await syncIndexesIfNeeded();
      expect(Object.values(indexSync.manifestChanged).every(Boolean)).toBe(true);
      expect(Object.values(indexSync.lessonTitlesChanged).every(Boolean)).toBe(true);
      expect(Object.values(indexSync.labelsChanged).every((changed) => !changed)).toBe(true);
      expect(indexSync.filesWritten).toHaveLength(6);
      for (const filePath of indexSync.filesWritten) assertInsideTemp(filePath);

      const manifest = await validateManifestCurriculumSync();
      const titles = await validateTitleIndexParity();
      expect(manifest).toMatchObject({ ok: true, errors: [] });
      expect(titles).toMatchObject({ ok: true, errors: [] });

      const secondIndexSync = await syncIndexesIfNeeded();
      expect(secondIndexSync.filesWritten).toEqual([]);
      expect(Object.values(secondIndexSync.manifestChanged).every((changed) => !changed)).toBe(
        true,
      );
      expect(
        Object.values(secondIndexSync.lessonTitlesChanged).every((changed) => !changed),
      ).toBe(true);

      for (const locale of PROMOTION_RUNTIME_LOCALES) {
        const lessonFiles = await fs.readdir(path.join(tempPackageDir(locale), "lessons"));
        expect(lessonFiles.filter((name) => name.endsWith(".json"))).toHaveLength(
          REQUIRED_LESSON_COUNT,
        );
        expect(runtimePackagePath(locale, cells.find((cell) => cell.locale === locale)!.lessonId)).toContain(
          TEMP_ROOT,
        );
      }
    },
    240_000,
  );
});

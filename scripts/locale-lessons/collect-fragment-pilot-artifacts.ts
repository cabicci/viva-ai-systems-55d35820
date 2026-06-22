import { promises as fs } from "node:fs";
import path from "node:path";
import type {
  AdaptationTargetLocale,
  AdaptedLessonPackage,
} from "../../src/lib/locale-lessons/types.ts";
import {
  lessonsDirForLocale,
  loadMsaLessonPackage,
  readJsonFile,
} from "./lib/source-package.ts";
import {
  buildFragmentPilotReport,
  type FragmentPilotLessonResult,
} from "./lib/fragment-pilot-report.ts";
import {
  writeFragmentPilotLessonPackage,
  writeFragmentPilotManifest,
  writeFragmentPilotReport,
} from "./lib/fragment-output-writer.ts";
import {
  localesForTarget,
  parseLessonIdsArg,
  resolveFragmentPilotLessonIds,
} from "./lib/resolve-fragment-pilot-lesson-ids.ts";
import {
  readFragmentPilotJobResult,
} from "./lib/fragment-pilot-job-result.ts";
import { validateFragmentPipelineArtifact } from "./lib/validate-structural-parity.ts";
import {
  clampPilotLessonCount,
  DEFAULT_PILOT_LESSON_COUNT,
} from "./lib/pilot-lesson-ids.ts";
import { openAiAdaptationModel } from "./providers/types.ts";
import { sanitizeFinalLessonPackage } from "./lib/sanitize-final-lesson-package.ts";
import { validateFinalLessonFile } from "./lib/validate-final-lesson-package.ts";

export interface FragmentPilotCollectSummary {
  target: AdaptationTargetLocale | "all";
  generatedAt: string;
  passed: string[];
  failed: string[];
  missing: string[];
  ok: boolean;
  combinedManifestPath?: string;
}

interface ArtifactSource {
  runId: string;
  dir: string;
}

interface LoadedArtifact {
  pkg: AdaptedLessonPackage;
  sourceRunId: string;
}

function readArg(name: string): string | null {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
}

function parseTarget(): AdaptationTargetLocale | "all" {
  const target = readArg("target");
  if (!target || target === "all") return "all";
  if (target === "ar-Gulf" || target === "en") return target;
  throw new Error("Usage: --target ar-Gulf|en|all");
}

function parseCount(): number {
  const raw = readArg("count");
  if (raw === null) return DEFAULT_PILOT_LESSON_COUNT;
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed)) throw new Error(`Invalid --count value: ${raw}`);
  return clampPilotLessonCount(parsed);
}

async function listJsonFiles(dir: string): Promise<string[]> {
  try {
    const files = await fs.readdir(dir);
    return files.filter((f) => f.endsWith(".json"));
  } catch {
    return [];
  }
}

async function loadLocalLessonPackage(
  locale: AdaptationTargetLocale,
  lessonId: string,
): Promise<AdaptedLessonPackage | null> {
  try {
    return await readJsonFile<AdaptedLessonPackage>(
      path.join(lessonsDirForLocale(locale), `${lessonId}.json`),
    );
  } catch {
    return null;
  }
}

/**
 * Search candidate artifact layouts for a lesson JSON within ONE run dir.
 * Returns the package + which file path was hit (for source-run reporting).
 */
async function findLessonInRunDir(
  runDir: string,
  locale: AdaptationTargetLocale,
  lessonId: string,
): Promise<AdaptedLessonPackage | null> {
  const candidates = [
    path.join(runDir, locale, "lessons", `${lessonId}.json`),
    path.join(runDir, `${locale}__${lessonId}`, "lessons", `${lessonId}.json`),
    path.join(
      runDir,
      `locale-fragment-pilot-${locale}-${lessonId}`,
      locale,
      "lessons",
      `${lessonId}.json`,
    ),
    path.join(runDir, "lessons", `${lessonId}.json`),
  ];
  for (const c of candidates) {
    try {
      return await readJsonFile<AdaptedLessonPackage>(c);
    } catch {
      continue;
    }
  }
  // Fuzzy fallback: scan subdirs for `<locale>/lessons/<lessonId>.json`.
  try {
    const subs = await fs.readdir(runDir);
    for (const sub of subs) {
      const p = path.join(runDir, sub, "lessons", `${lessonId}.json`);
      try {
        return await readJsonFile<AdaptedLessonPackage>(p);
      } catch {
        // try shape: <locale>/lessons/<lessonId>.json under root sub
        const p2 = path.join(runDir, sub, locale, "lessons", `${lessonId}.json`);
        try {
          return await readJsonFile<AdaptedLessonPackage>(p2);
        } catch {
          continue;
        }
      }
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Multi-run loader. Iterates sources in order; later sources win on conflict
 * because they overwrite. Returns null if no run contains the lesson.
 */
async function loadArtifactFromSources(
  sources: ArtifactSource[],
  locale: AdaptationTargetLocale,
  lessonId: string,
): Promise<LoadedArtifact | null> {
  let hit: LoadedArtifact | null = null;
  for (const src of sources) {
    const pkg = await findLessonInRunDir(src.dir, locale, lessonId);
    if (pkg) hit = { pkg, sourceRunId: src.runId };
  }
  return hit;
}

function parseArtifactsDirs(): ArtifactSource[] {
  const multi = readArg("artifacts-dirs");
  const single = readArg("artifacts-dir");
  const dirs = (multi ?? single ?? "fragment-artifacts")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return dirs.map((dir) => ({
    runId: path.basename(dir),
    dir,
  }));
}

async function writeJsonFile(filePath: string, value: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export interface CollectInput {
  target: AdaptationTargetLocale | "all";
  count: number;
  lessonIdsOverride?: string[];
  artifactsDir?: string;
  artifactSources?: ArtifactSource[];
  outputDir?: string;
  generatedAt?: string;
}

export async function collectFragmentPilotArtifacts(
  input: CollectInput,
): Promise<FragmentPilotCollectSummary> {
  const sources: ArtifactSource[] =
    input.artifactSources ??
    (input.artifactsDir
      ? [{ runId: path.basename(input.artifactsDir), dir: input.artifactsDir }]
      : parseArtifactsDirs());
  const outputDir = input.outputDir ?? readArg("output-dir") ?? null;
  const locales = localesForTarget(input.target);
  const pilotLessonIds = await resolveFragmentPilotLessonIds({
    count: input.count,
    lessonIdsOverride: input.lessonIdsOverride,
  });
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const passed: string[] = [];
  const failed: string[] = [];
  const missing: string[] = [];
  const combinedRows: Array<{
    locale: string;
    lesson_id: string;
    source_run_id: string;
    status: "ok" | "failed";
    banned_hits: string;
    unbalanced_fields: string;
  }> = [];

  for (const locale of locales) {
    const packages: AdaptedLessonPackage[] = [];
    const lessonResults: FragmentPilotLessonResult[] = [];

    for (const lessonId of pilotLessonIds) {
      const key = `${locale}/${lessonId}`;
      const jobResult = await readFragmentPilotJobResult(locale, lessonId);
      const loaded =
        (await loadArtifactFromSources(sources, locale, lessonId)) ??
        ((await loadLocalLessonPackage(locale, lessonId)) &&
          ({
            pkg: (await loadLocalLessonPackage(locale, lessonId))!,
            sourceRunId: "local",
          } as LoadedArtifact));

      if (!loaded) {
        missing.push(key);
        combinedRows.push({
          locale,
          lesson_id: lessonId,
          source_run_id: "",
          status: "failed",
          banned_hits: "",
          unbalanced_fields: "MISSING",
        });
        continue;
      }

      // Structural parity is validated against the RAW adapter output,
      // not the sanitized version (sanitizer intentionally drops the
      // internal "Video block (production reference only)" section).
      const source = await loadMsaLessonPackage(lessonId);
      const validation = validateFragmentPipelineArtifact(source, loaded.pkg, locale);
      // Sanitize AFTER parity check, BEFORE write.
      const sanitized = sanitizeFinalLessonPackage(loaded.pkg);
      lessonResults.push({
        lessonId,
        fieldCount: jobResult?.fieldCount ?? 0,
        validation,
      });

      // Write to outputDir if given; else writer goes to runtime path.
      let writtenPath: string;
      if (outputDir) {
        writtenPath = path.join(outputDir, locale, "lessons", `${lessonId}.json`);
        await writeJsonFile(writtenPath, sanitized);
      } else {
        writtenPath = await writeFragmentPilotLessonPackage(locale, sanitized);
      }

      // Re-read from disk and validate the final on-disk artifact.
      const finalCheck = await validateFinalLessonFile(writtenPath);

      if (!finalCheck.ok || !validation.ok) {
        failed.push(key);
        combinedRows.push({
          locale,
          lesson_id: lessonId,
          source_run_id: loaded.sourceRunId,
          status: "failed",
          banned_hits: finalCheck.bannedHits.join(";"),
          unbalanced_fields: finalCheck.unbalancedFields.join(";"),
        });
        continue;
      }

      packages.push(sanitized);
      passed.push(key);
      combinedRows.push({
        locale,
        lesson_id: lessonId,
        source_run_id: loaded.sourceRunId,
        status: "ok",
        banned_hits: "",
        unbalanced_fields: "",
      });
    }

    // Only write the manifest/report if all pilot ids are present.
    if (packages.length === pilotLessonIds.length) {
      if (outputDir) {
        await writeJsonFile(path.join(outputDir, locale, "manifest.json"), {
          locale,
          packageStatus: "pilot",
          mode: "pilot",
          pipeline: "fragment",
          generatedAt,
          lessonCount: packages.length,
          pilotLessonIds,
          lessonIds: packages.map((p) => p.lessonId).sort(),
          providerModel: openAiAdaptationModel(),
        });
        const report = buildFragmentPilotReport({
          targetLocale: locale,
          providerModel: openAiAdaptationModel(),
          generatedAt,
          pilotLessonIds,
          lessonResults,
        });
        await writeJsonFile(
          path.join(outputDir, locale, "reports", "fragment-pilot-report.json"),
          report,
        );
      } else {
        await writeFragmentPilotManifest({
          targetLocale: locale,
          generatedAt,
          pilotLessonIds,
          packages,
          providerModel: openAiAdaptationModel(),
        });
        const report = buildFragmentPilotReport({
          targetLocale: locale,
          providerModel: openAiAdaptationModel(),
          generatedAt,
          pilotLessonIds,
          lessonResults,
        });
        await writeFragmentPilotReport(locale, report);
      }
    }
  }

  // Combined manifest (root of outputDir) — always emit if outputDir set.
  let combinedManifestPath: string | undefined;
  if (outputDir) {
    combinedManifestPath = path.join(outputDir, "combined-manifest.json");
    await writeJsonFile(combinedManifestPath, {
      generatedAt,
      sourceRuns: sources.map((s) => s.runId),
      summary: {
        passed: passed.length,
        failed: failed.length,
        missing: missing.length,
      },
      lessons: combinedRows,
    });
    const csvHeader =
      "locale,lesson_id,source_run_id,status,banned_hits,unbalanced_fields\n";
    const csvBody = combinedRows
      .map((r) =>
        [
          r.locale,
          r.lesson_id,
          r.source_run_id,
          r.status,
          `"${r.banned_hits.replace(/"/g, '""')}"`,
          `"${r.unbalanced_fields.replace(/"/g, '""')}"`,
        ].join(","),
      )
      .join("\n");
    await fs.writeFile(
      path.join(outputDir, "combined-manifest.csv"),
      csvHeader + csvBody + "\n",
      "utf8",
    );
  }

  const expectedTotal = locales.length * pilotLessonIds.length;
  const ok =
    passed.length === expectedTotal && failed.length === 0 && missing.length === 0;

  return {
    target: input.target,
    generatedAt,
    passed,
    failed,
    missing,
    ok,
    combinedManifestPath,
  };
}

async function main() {
  const summary = await collectFragmentPilotArtifacts({
    target: parseTarget(),
    count: parseCount(),
    lessonIdsOverride: parseLessonIdsArg(readArg("lesson_ids")),
  });

  console.log(
    `Fragment pilot collect: passed=${summary.passed.length} failed=${summary.failed.length} missing=${summary.missing.length}`,
  );
  if (summary.combinedManifestPath) {
    console.log(`Combined manifest: ${summary.combinedManifestPath}`);
  }
  if (summary.failed.length > 0) {
    console.error("Failed lessons:");
    for (const item of summary.failed) console.error(`  - ${item}`);
  }
  if (summary.missing.length > 0) {
    console.error("Missing lessons:");
    for (const item of summary.missing) console.error(`  - ${item}`);
  }
  if (!summary.ok) process.exit(1);
}

if (import.meta.main) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}

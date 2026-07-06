/**
 * Full-mode collector for the fragment pipeline.
 * Mirrors collect-fragment-pilot-artifacts.ts but expects 100 lessons per locale
 * and emits a `full` manifest (packageStatus="full", incomplete=false).
 *
 * Reuses the SAME sanitizer + final disk-level validator as the accepted pilot fix.
 */
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
import { localesForTarget, parseLessonIdsArg } from "./lib/resolve-fragment-pilot-lesson-ids.ts";
import { validateFragmentPipelineArtifact } from "./lib/validate-structural-parity.ts";
import { finalizeLearnerFacingLocalePackageForWrite } from "./lib/phase13-pilot-lesson-output.ts";
import { validateFinalLessonFile } from "./lib/validate-final-lesson-package.ts";
import { selectFullLessonIds } from "./lib/full-lesson-ids.ts";
import { openAiAdaptationModel } from "./providers/types.ts";

interface ArtifactSource { runId: string; dir: string }
interface LoadedArtifact { pkg: AdaptedLessonPackage; sourceRunId: string }

function readArg(name: string): string | null {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? null : process.argv[i + 1] ?? null;
}

function parseTarget(): AdaptationTargetLocale | "all" {
  const t = readArg("target");
  if (!t || t === "all") return "all";
  if (t === "ar-Gulf" || t === "en") return t;
  throw new Error("Usage: --target ar-Gulf|en|all");
}

async function findInRunDir(
  runDir: string, locale: AdaptationTargetLocale, lessonId: string,
): Promise<AdaptedLessonPackage | null> {
  const candidates = [
    path.join(runDir, locale, "lessons", `${lessonId}.json`),
    path.join(runDir, `${locale}__${lessonId}`, "lessons", `${lessonId}.json`),
    path.join(runDir, `locale-fragment-full-${locale}-${lessonId}`, locale, "lessons", `${lessonId}.json`),
    path.join(runDir, `locale-fragment-pilot-${locale}-${lessonId}`, locale, "lessons", `${lessonId}.json`),
    path.join(runDir, "lessons", `${lessonId}.json`),
  ];
  for (const c of candidates) {
    try { return await readJsonFile<AdaptedLessonPackage>(c); } catch { /* next */ }
  }
  return null;
}

async function loadLocal(locale: AdaptationTargetLocale, lessonId: string) {
  try {
    return await readJsonFile<AdaptedLessonPackage>(
      path.join(lessonsDirForLocale(locale), `${lessonId}.json`),
    );
  } catch { return null; }
}

function parseArtifactsDirs(): ArtifactSource[] {
  const multi = readArg("artifacts-dirs");
  const single = readArg("artifacts-dir");
  return (multi ?? single ?? "fragment-artifacts")
    .split(",").map((s) => s.trim()).filter(Boolean)
    .map((dir) => ({ runId: path.basename(dir), dir }));
}

async function writeJson(p: string, v: unknown) {
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, `${JSON.stringify(v, null, 2)}\n`, "utf8");
}

export interface FullCollectSummary {
  target: AdaptationTargetLocale | "all";
  generatedAt: string;
  passed: string[];
  failed: string[];
  missing: string[];
  ok: boolean;
  combinedManifestPath?: string;
}

export async function collectFragmentFullArtifacts(input: {
  target: AdaptationTargetLocale | "all";
  lessonIdsOverride?: string[];
  artifactSources?: ArtifactSource[];
  outputDir?: string;
  generatedAt?: string;
}): Promise<FullCollectSummary> {
  const sources = input.artifactSources ?? parseArtifactsDirs();
  const outputDir = input.outputDir ?? readArg("output-dir") ?? null;
  const locales = localesForTarget(input.target);
  const lessonIds = input.lessonIdsOverride?.length
    ? input.lessonIdsOverride
    : await selectFullLessonIds();
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const passed: string[] = [];
  const failed: string[] = [];
  const missing: string[] = [];
  const rows: Array<Record<string, string>> = [];

  for (const locale of locales) {
    const packages: AdaptedLessonPackage[] = [];

    for (const lessonId of lessonIds) {
      const key = `${locale}/${lessonId}`;
      let loaded: LoadedArtifact | null = null;
      for (const src of sources) {
        const pkg = await findInRunDir(src.dir, locale, lessonId);
        if (pkg) loaded = { pkg, sourceRunId: src.runId };
      }
      if (!loaded) {
        const localPkg = await loadLocal(locale, lessonId);
        if (localPkg) loaded = { pkg: localPkg, sourceRunId: "local" };
      }
      if (!loaded) {
        missing.push(key);
        rows.push({ locale, lesson_id: lessonId, source_run_id: "", status: "failed", banned_hits: "", unbalanced_fields: "MISSING" });
        continue;
      }

      const source = await loadMsaLessonPackage(lessonId);
      const parity = validateFragmentPipelineArtifact(source, loaded.pkg, locale);
      const { sanitized, errors: finalOutputErrors } =
        finalizeLearnerFacingLocalePackageForWrite(loaded.pkg);

      if (finalOutputErrors.length > 0) {
        failed.push(key);
        rows.push({
          locale,
          lesson_id: lessonId,
          source_run_id: loaded.sourceRunId,
          status: "failed",
          banned_hits: finalOutputErrors.join(";"),
          unbalanced_fields: "FINALIZATION",
        });
        continue;
      }

      let writtenPath: string;
      if (outputDir) {
        writtenPath = path.join(outputDir, locale, "lessons", `${lessonId}.json`);
        await writeJson(writtenPath, sanitized);
      } else {
        writtenPath = path.join(lessonsDirForLocale(locale), `${lessonId}.json`);
        await writeJson(writtenPath, sanitized);
      }

      const finalCheck = await validateFinalLessonFile(writtenPath);
      if (!finalCheck.ok || !parity.ok) {
        failed.push(key);
        rows.push({
          locale, lesson_id: lessonId, source_run_id: loaded.sourceRunId, status: "failed",
          banned_hits: finalCheck.bannedHits.join(";"),
          unbalanced_fields: [
            ...finalCheck.unbalancedFields,
            ...(parity.ok ? [] : parity.errors.map((e) => `parity:${e}`)),
          ].join(";"),
        });
        continue;
      }

      packages.push(sanitized);
      passed.push(key);
      rows.push({ locale, lesson_id: lessonId, source_run_id: loaded.sourceRunId, status: "ok", banned_hits: "", unbalanced_fields: "" });
    }

    if (packages.length === lessonIds.length) {
      const manifest = {
        locale,
        packageStatus: "full",
        mode: "full",
        pipeline: "fragment",
        incomplete: false,
        provider: "openai-fragment",
        providerModel: openAiAdaptationModel(),
        generatedAt,
        canonicalSource: "src/lib/locale-lessons/ar-MSA",
        lessonCount: packages.length,
        requiredLessonCount: lessonIds.length,
        lessonIds: packages.map((p) => p.lessonId).sort(),
      };
      const manifestPath = outputDir
        ? path.join(outputDir, locale, "manifest.json")
        : path.join(path.dirname(lessonsDirForLocale(locale)), "manifest.json");
      await writeJson(manifestPath, manifest);
    }
  }

  let combinedManifestPath: string | undefined;
  if (outputDir) {
    combinedManifestPath = path.join(outputDir, "combined-manifest.json");
    await writeJson(combinedManifestPath, {
      generatedAt,
      mode: "full",
      pipeline: "fragment",
      sourceRuns: sources.map((s) => s.runId),
      summary: { passed: passed.length, failed: failed.length, missing: missing.length, expected: locales.length * lessonIds.length },
      lessons: rows,
    });
    const csv =
      "locale,lesson_id,source_run_id,status,banned_hits,unbalanced_fields\n" +
      rows.map((r) => [
        r.locale, r.lesson_id, r.source_run_id, r.status,
        `"${(r.banned_hits ?? "").replace(/"/g, '""')}"`,
        `"${(r.unbalanced_fields ?? "").replace(/"/g, '""')}"`,
      ].join(",")).join("\n") + "\n";
    await fs.writeFile(path.join(outputDir, "combined-manifest.csv"), csv, "utf8");
  }

  const expected = locales.length * lessonIds.length;
  const ok = passed.length === expected && failed.length === 0 && missing.length === 0;
  return { target: input.target, generatedAt, passed, failed, missing, ok, combinedManifestPath };
}

async function main() {
  const summary = await collectFragmentFullArtifacts({
    target: parseTarget(),
    lessonIdsOverride: parseLessonIdsArg(readArg("lesson_ids")),
  });
  console.log(`Fragment FULL collect: passed=${summary.passed.length} failed=${summary.failed.length} missing=${summary.missing.length}`);
  if (summary.combinedManifestPath) console.log(`Combined manifest: ${summary.combinedManifestPath}`);
  if (summary.failed.length) { console.error("Failed:"); for (const x of summary.failed) console.error(`  - ${x}`); }
  if (summary.missing.length) { console.error("Missing:"); for (const x of summary.missing) console.error(`  - ${x}`); }
  if (!summary.ok) process.exit(1);
}

if (import.meta.main) {
  main().catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
}

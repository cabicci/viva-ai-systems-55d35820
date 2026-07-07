import type { LessonPackageLocale } from "../../src/lib/locale-lessons/types.ts";
import {
  cellRequiresPaidApi,
  parsePhase13BSourceScope,
  parseShardLessonIdsArg,
  pipelineModeForLocale,
} from "./lib/phase13b-full-matrix.ts";
import { writePhase13BJobResult } from "./lib/phase13b-job-result.ts";
import { runPhase13BFullCell } from "./run-phase13b-full-cell.ts";

function readArg(name: string): string | null {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
}

function parseBool(name: string): boolean {
  const raw = readArg(name);
  if (raw === null) return false;
  return raw === "true" || raw === "1";
}

function parseLocale(): LessonPackageLocale {
  const locale = readArg("locale") ?? readArg("target");
  if (locale === "ar-MSA" || locale === "ar-Gulf" || locale === "en") return locale;
  throw new Error("--locale ar-MSA|ar-Gulf|en is required");
}

export async function runPhase13BLocaleBatch(input: {
  locale: LessonPackageLocale;
  lessonIds: string[];
  dryRun: boolean;
  confirmPaidApi: boolean;
  confirmWrite: boolean;
  generatedAt?: string;
}): Promise<{
  locale: LessonPackageLocale;
  cellCount: number;
  okCount: number;
  failedCount: number;
  dryRun: boolean;
  results: Array<{ lessonId: string; ok: boolean; errors: string[] }>;
}> {
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const results: Array<{ lessonId: string; ok: boolean; errors: string[] }> = [];

  for (const lessonId of input.lessonIds) {
    try {
      const summary = await runPhase13BFullCell({
        locale: input.locale,
        lessonId,
        dryRun: input.dryRun,
        confirmPaidApi: input.confirmPaidApi,
        confirmWrite: input.confirmWrite,
        generatedAt,
        writeJobResult: true,
      });
      results.push({
        lessonId,
        ok: summary.ok,
        errors: summary.errors,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const pipeline = pipelineModeForLocale(input.locale);
      await writePhase13BJobResult({
        locale: input.locale,
        lessonId,
        ok: false,
        pipeline,
        requiresPaidApi: cellRequiresPaidApi({ locale: input.locale, pipeline }),
        fieldCount: 0,
        errors: [message],
        generatedAt,
        mode: "error",
        skippedPaidApi: false,
      }).catch(() => undefined);
      results.push({ lessonId, ok: false, errors: [message] });
    }
  }

  const okCount = results.filter((result) => result.ok).length;
  const failedCount = results.length - okCount;

  return {
    locale: input.locale,
    cellCount: results.length,
    okCount,
    failedCount,
    dryRun: input.dryRun,
    results,
  };
}

async function main() {
  parsePhase13BSourceScope(readArg("source_scope"));
  const locale = parseLocale();
  const dryRun = parseBool("dry_run") || readArg("dry_run") === "";
  const confirmPaidApi = parseBool("confirm_paid_api");
  const confirmWrite = parseBool("confirm_write");
  const lessonIds = parseShardLessonIdsArg(
    readArg("lesson_ids") ?? readArg("lesson-ids"),
  );

  if (!dryRun && !confirmWrite) {
    throw new Error(
      "Refusing write: set confirm_write=true when dry_run=false",
    );
  }

  const summary = await runPhase13BLocaleBatch({
    locale,
    lessonIds,
    dryRun,
    confirmPaidApi,
    confirmWrite,
  });

  console.log(JSON.stringify(summary));

  if (summary.failedCount > 0) {
    process.exit(1);
  }
}

if (import.meta.main) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}

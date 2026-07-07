import type { LessonPackageLocale } from "../../src/lib/locale-lessons/types.ts";
import { deriveArMsaLearnerFinalPackage } from "./lib/derive-ar-msa-learner-final.ts";
import {
  runFragmentLocalizationPipeline,
  runFragmentLocalizationPipelineWithOpenAi,
} from "./lib/fragment-localization-pipeline.ts";
import {
  cellRequiresPaidApi,
  parsePhase13BSourceScope,
  pipelineModeForLocale,
} from "./lib/phase13b-full-matrix.ts";
import { writePhase13BJobResult, phase13BJobResultPath } from "./lib/phase13b-job-result.ts";
import { writePhase13BGeneratedLessonPackage } from "./lib/phase13b-output-writer.ts";
import { finalizeLearnerFacingLocalePackageForWrite } from "./lib/phase13-pilot-lesson-output.ts";
import { loadMsaLessonPackage, validateMsaSourcePackage } from "./lib/source-package.ts";
import {
  openAiAdaptationModel,
  requireOpenAiApiKey,
} from "./providers/types.ts";

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

function parseLessonId(): string {
  const lessonId = readArg("lesson-id") ?? readArg("lesson_id");
  if (!lessonId) throw new Error("--lesson-id is required");
  return lessonId;
}

export async function runPhase13BFullCell(input: {
  locale: LessonPackageLocale;
  lessonId: string;
  dryRun: boolean;
  confirmPaidApi: boolean;
  confirmWrite: boolean;
  generatedAt?: string;
  writeJobResult?: boolean;
}): Promise<{
  locale: LessonPackageLocale;
  lessonId: string;
  ok: boolean;
  mode: string;
  pipeline: ReturnType<typeof pipelineModeForLocale>;
  requiresPaidApi: boolean;
  fieldCount: number;
  errors: string[];
  artifactPath: string | null;
  jobResultPath: string;
  skippedPaidApi: boolean;
  wrotePackage: boolean;
}> {
  parsePhase13BSourceScope(readArg("source_scope"));
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const pipeline = pipelineModeForLocale(input.locale);
  const requiresPaidApi = cellRequiresPaidApi({ locale: input.locale, pipeline });

  const sourceValidation = await validateMsaSourcePackage();
  if (!sourceValidation.ok) {
    throw new Error(
      `Arabic Fusha source invalid:\n${sourceValidation.errors.join("\n")}`,
    );
  }

  const source = await loadMsaLessonPackage(input.lessonId);

  if (input.locale === "ar-MSA") {
    const { pkg, errors } = deriveArMsaLearnerFinalPackage(source);
    const ok = errors.length === 0;
    const shouldWrite =
      !input.dryRun && input.confirmWrite && ok;
    let artifactPath: string | null = null;

    if (shouldWrite) {
      artifactPath = await writePhase13BGeneratedLessonPackage("ar-MSA", pkg);
    }

    const jobResultPath = input.writeJobResult === false
      ? phase13BJobResultPath("ar-MSA", input.lessonId)
      : await writePhase13BJobResult({
          locale: "ar-MSA",
          lessonId: input.lessonId,
          ok,
          pipeline,
          requiresPaidApi: false,
          fieldCount: 0,
          errors,
          generatedAt,
          mode: input.dryRun ? "dry-run-derived" : shouldWrite ? "learner-final-write" : "derived-no-write",
          skippedPaidApi: true,
          artifactPath,
        });

    return {
      locale: "ar-MSA",
      lessonId: input.lessonId,
      ok,
      mode: input.dryRun ? "dry-run-derived" : shouldWrite ? "learner-final-write" : "derived-no-write",
      pipeline,
      requiresPaidApi: false,
      fieldCount: 0,
      errors,
      artifactPath,
      jobResultPath,
      skippedPaidApi: true,
      wrotePackage: shouldWrite,
    };
  }

  const locale = input.locale;
  const model = openAiAdaptationModel();
  const usePaidApi = !input.dryRun && input.confirmPaidApi;

  if (!input.dryRun && requiresPaidApi && !input.confirmPaidApi) {
    throw new Error(
      `Refusing paid adaptation for ${locale}/${input.lessonId}: set confirm_paid_api=true when dry_run=false`,
    );
  }

  const result = usePaidApi
    ? await (async () => {
        requireOpenAiApiKey();
        return runFragmentLocalizationPipelineWithOpenAi(
          source,
          locale,
          { model },
          generatedAt,
        );
      })()
    : runFragmentLocalizationPipeline(source, locale, {}, generatedAt);

  const { sanitized, errors: finalOutputErrors } =
    finalizeLearnerFacingLocalePackageForWrite(result.artifact);
  const validationErrors = [...result.validation.errors, ...finalOutputErrors];
  const ok = result.validation.ok && finalOutputErrors.length === 0;
  const shouldWrite = !input.dryRun && input.confirmWrite && ok;

  let artifactPath: string | null = null;
  if (shouldWrite) {
    artifactPath = await writePhase13BGeneratedLessonPackage(locale, sanitized);
  }

  const jobResultPath = input.writeJobResult === false
    ? phase13BJobResultPath(locale, input.lessonId)
    : await writePhase13BJobResult({
        locale,
        lessonId: input.lessonId,
        ok,
        pipeline,
        requiresPaidApi: true,
        fieldCount: result.textMap.fields.length,
        errors: validationErrors,
        generatedAt,
        mode: usePaidApi ? "openai-fragment" : "dry-run-mock",
        skippedPaidApi: !usePaidApi,
        artifactPath,
      });

  return {
    locale,
    lessonId: input.lessonId,
    ok,
    mode: usePaidApi ? "openai-fragment" : "dry-run-mock",
    pipeline,
    requiresPaidApi: true,
    fieldCount: result.textMap.fields.length,
    errors: validationErrors,
    artifactPath,
    jobResultPath,
    skippedPaidApi: !usePaidApi,
    wrotePackage: shouldWrite,
  };
}

async function main() {
  const locale = parseLocale();
  const lessonId = parseLessonId();
  const dryRun = parseBool("dry_run") || readArg("dry_run") === "";
  const confirmPaidApi = parseBool("confirm_paid_api");
  const confirmWrite = parseBool("confirm_write");

  if (!dryRun && !confirmWrite) {
    throw new Error(
      "Refusing write: set confirm_write=true when dry_run=false",
    );
  }

  try {
    const summary = await runPhase13BFullCell({
      locale,
      lessonId,
      dryRun,
      confirmPaidApi,
      confirmWrite,
    });

    console.log(JSON.stringify(summary));

    if (!summary.ok) {
      process.exit(1);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await writePhase13BJobResult({
      locale,
      lessonId,
      ok: false,
      pipeline: pipelineModeForLocale(locale),
      requiresPaidApi: cellRequiresPaidApi({
        locale,
        pipeline: pipelineModeForLocale(locale),
      }),
      fieldCount: 0,
      errors: [message],
      generatedAt: new Date().toISOString(),
      mode: "error",
    }).catch(() => undefined);
    throw error;
  }
}

if (import.meta.main) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}

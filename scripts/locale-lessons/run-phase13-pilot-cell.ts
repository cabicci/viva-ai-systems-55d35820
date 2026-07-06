import type { AdaptationTargetLocale } from "../../src/lib/locale-lessons/types.ts";
import { loadMsaLessonPackage, validateMsaSourcePackage } from "./lib/source-package.ts";
import {
  runFragmentLocalizationPipeline,
  runFragmentLocalizationPipelineWithOpenAi,
} from "./lib/fragment-localization-pipeline.ts";
import { writeFragmentPilotJobResult } from "./lib/fragment-pilot-job-result.ts";
import { writeFragmentPilotLessonPackage } from "./lib/fragment-output-writer.ts";
import { parsePhase13SourceScope } from "./lib/resolve-phase13-pilot-lesson-ids.ts";
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

function parseLocale(): AdaptationTargetLocale {
  const locale = readArg("locale") ?? readArg("target");
  if (locale === "ar-Gulf" || locale === "en") return locale;
  throw new Error("--locale ar-Gulf|en is required");
}

function parseLessonId(): string {
  const lessonId = readArg("lesson-id") ?? readArg("lesson_id");
  if (!lessonId) throw new Error("--lesson-id is required");
  return lessonId;
}

async function main() {
  parsePhase13SourceScope(readArg("source_scope"));
  const locale = parseLocale();
  const lessonId = parseLessonId();
  const dryRun = parseBool("dry_run") || readArg("dry_run") === "";
  const confirmPaidApi = parseBool("confirm_paid_api");
  const generatedAt = new Date().toISOString();

  const sourceValidation = await validateMsaSourcePackage();
  if (!sourceValidation.ok) {
    throw new Error(
      `Arabic Fusha source invalid:\n${sourceValidation.errors.join("\n")}`,
    );
  }

  const source = await loadMsaLessonPackage(lessonId);
  const model = openAiAdaptationModel();

  try {
    const result =
      dryRun || !confirmPaidApi
        ? runFragmentLocalizationPipeline(source, locale, {}, generatedAt)
        : await (async () => {
            requireOpenAiApiKey();
            return runFragmentLocalizationPipelineWithOpenAi(
              source,
              locale,
              { model },
              generatedAt,
            );
          })();

    let artifactPath: string | undefined;
    if (!dryRun && confirmPaidApi) {
      artifactPath = await writeFragmentPilotLessonPackage(locale, result.artifact);
    }

    const jobPath = await writeFragmentPilotJobResult({
      locale,
      lessonId,
      ok: result.validation.ok,
      fieldCount: result.textMap.fields.length,
      errors: result.validation.errors,
      generatedAt,
    });

    const mode = dryRun || !confirmPaidApi ? "dry-run-mock" : "openai-fragment";
    console.log(
      JSON.stringify({
        locale,
        lessonId,
        mode,
        ok: result.validation.ok,
        fieldCount: result.textMap.fields.length,
        errors: result.validation.errors,
        artifactPath: artifactPath ?? null,
        jobResultPath: jobPath,
        skippedPaidApi: dryRun || !confirmPaidApi,
      }),
    );

    if (!result.validation.ok) {
      process.exit(1);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await writeFragmentPilotJobResult({
      locale,
      lessonId,
      ok: false,
      fieldCount: 0,
      errors: [message],
      generatedAt,
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

import { promises as fs } from "node:fs";
import path from "node:path";
import type {
  AdaptationPlanManifest,
  AdaptationTargetLocale,
} from "../../src/lib/locale-lessons/types.ts";
import {
  ADAPTATION_TARGET_LOCALES,
  REQUIRED_LESSON_COUNT,
} from "../../src/lib/locale-lessons/types.ts";
import {
  adaptationPlanPathForLocale,
  loadMsaManifest,
  manifestPathForLocale,
  MSA_MANIFEST_PATH,
  packageDirForLocale,
  validateMsaSourcePackage,
} from "./lib/source-package.ts";
import { AR_GULF_PROMPT_META } from "./prompts/ar-gulf.ts";
import { EN_PROMPT_META } from "./prompts/en.ts";

const GENERATION_BLOCK_REASON =
  "No approved contextual adaptation provider is wired for lesson package generation. " +
  "scripts/adaptive-canonical reviewers call external APIs for audit only — not for localized lesson authoring. " +
  "Use dry-run planning until a dedicated adaptation provider is chartered.";

function promptMetaFor(target: AdaptationTargetLocale) {
  return target === "ar-Gulf" ? AR_GULF_PROMPT_META : EN_PROMPT_META;
}

export async function buildAdaptationPlan(
  targetLocale: AdaptationTargetLocale,
  generatedAt = new Date().toISOString(),
): Promise<AdaptationPlanManifest> {
  const sourceValidation = await validateMsaSourcePackage();
  if (!sourceValidation.ok) {
    throw new Error(
      `Arabic Fusha source package invalid:\n${sourceValidation.errors.join("\n")}`,
    );
  }

  const sourceManifest = await loadMsaManifest();
  const prompt = promptMetaFor(targetLocale);
  const outputDir = packageDirForLocale(targetLocale);

  return {
    locale: targetLocale,
    sourceLocale: "ar-MSA",
    status: "planned",
    mode: "dry-run",
    lessonCount: sourceManifest.lessonIds.length,
    requiredLessonCount: REQUIRED_LESSON_COUNT,
    lessonIds: sourceManifest.lessonIds,
    sourceManifestPath: path
      .relative(process.cwd(), MSA_MANIFEST_PATH)
      .replace(/\\/g, "/"),
    outputLessonsDir: path
      .relative(process.cwd(), path.join(outputDir, "lessons"))
      .replace(/\\/g, "/"),
    outputManifestPath: path
      .relative(process.cwd(), manifestPathForLocale(targetLocale))
      .replace(/\\/g, "/"),
    prompt,
    generationBlocked: true,
    generationBlockReason: GENERATION_BLOCK_REASON,
    generatedAt,
    nextSteps: [
      "Charter an approved contextual adaptation provider (separate from canonical audit reviewers).",
      `Implement provider adapter in scripts/locale-lessons/providers/ (not included in Phase 2B).`,
      `Run: bun run locale-lessons:generate-localized -- --target ${targetLocale} --generate`,
      `Validate: bun run locale-lessons:validate-localized -- --target ${targetLocale}`,
      "Human review adapted lessons before any runtime wiring.",
    ],
  };
}

export async function writeAdaptationPlan(
  targetLocale: AdaptationTargetLocale,
): Promise<AdaptationPlanManifest> {
  const plan = await buildAdaptationPlan(targetLocale);
  const outPath = adaptationPlanPathForLocale(targetLocale);
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, `${JSON.stringify(plan, null, 2)}\n`, "utf8");
  return plan;
}

export async function planAllAdaptations(): Promise<AdaptationPlanManifest[]> {
  const plans: AdaptationPlanManifest[] = [];
  for (const target of ADAPTATION_TARGET_LOCALES) {
    plans.push(await writeAdaptationPlan(target));
  }
  return plans;
}

async function main() {
  const plans = await planAllAdaptations();
  for (const plan of plans) {
    console.log(
      `Planned ${plan.locale}: ${plan.lessonCount}/${plan.requiredLessonCount} lessons (dry-run, generation blocked).`,
    );
    console.log(`  plan: src/lib/locale-lessons/${plan.locale}/adaptation-plan.json`);
  }
}

if (import.meta.main) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}

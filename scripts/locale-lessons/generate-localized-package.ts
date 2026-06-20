import type { AdaptationTargetLocale } from "../../src/lib/locale-lessons/types.ts";
import { buildAdaptationPlan, writeAdaptationPlan } from "./plan-adaptation.ts";
import { loadMsaLessonPackage } from "./lib/source-package.ts";
import { buildAdaptationPrompt } from "./prompts/build-prompt.ts";

function readArg(name: string): string | null {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
}

const target = readArg("target") as AdaptationTargetLocale | null;
const generate = process.argv.includes("--generate");
const dryRun = process.argv.includes("--dry-run") || !generate;

const GENERATION_NOT_WIRED =
  "Contextual lesson generation requires an approved provider adapter. " +
  "Phase 2B ships dry-run planning only — re-run with --dry-run (default).";

async function runDryRun(selectedTarget: AdaptationTargetLocale) {
  const plan = await writeAdaptationPlan(selectedTarget);
  const sampleLessonId = plan.lessonIds[0];
  const sampleSource = await loadMsaLessonPackage(sampleLessonId);
  const prompt = buildAdaptationPrompt(selectedTarget, sampleSource);

  console.log(`Dry-run adaptation plan written for ${selectedTarget}.`);
  console.log(`  lessons: ${plan.lessonCount}/${plan.requiredLessonCount}`);
  console.log(`  plan: src/lib/locale-lessons/${selectedTarget}/adaptation-plan.json`);
  console.log(`  sample prompt lesson: ${sampleLessonId}`);
  console.log(`  system prompt length: ${prompt.systemPrompt.length} chars`);
  console.log(`  user prompt length: ${prompt.userPrompt.length} chars`);
  console.log(`  generation blocked: ${plan.generationBlocked}`);
  if (plan.generationBlockReason) {
    console.log(`  reason: ${plan.generationBlockReason}`);
  }
}

async function runGenerate(selectedTarget: AdaptationTargetLocale) {
  // Scaffold only — provider integration deferred until chartered.
  await buildAdaptationPlan(selectedTarget);
  throw new Error(GENERATION_NOT_WIRED);
}

async function main() {
  if (!target || (target !== "ar-Gulf" && target !== "en")) {
    console.error(
      "Usage: bun run scripts/locale-lessons/generate-localized-package.ts -- --target ar-Gulf|en [--dry-run|--generate]",
    );
    process.exit(1);
  }

  if (dryRun) {
    await runDryRun(target);
    return;
  }

  await runGenerate(target);
}

if (import.meta.main) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}

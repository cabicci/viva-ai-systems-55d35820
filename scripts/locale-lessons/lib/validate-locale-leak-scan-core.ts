import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { ValidatorResult } from "./localization-contract-rules.ts";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

/** Post–12.5D-A banned hardcoded Arabic in wired chrome surfaces. */
const CURRICULUM_BANNED_AR = [
  "ابدأ من هنا قبل ما تدخل المسارات.",
  "قريبًا",
  "تقدّم المسار",
  "محتوى هذا المسار قيد البناء",
  "تقني — للمتقدمين",
  "لازم تعدّي",
  "ابدأ Builder",
] as const;

const PAYWALL_BANNED_AR = [
  "الدرس ده ضمن اشتراك Pro",
  "فعّل Pro",
  "رجوع للوحة",
  "اكمل المقدمة الأول",
  "ابدأ المقدمة",
] as const;

/** ar-EG-only sources — Arabic allowed; scanned for reporting only. */
const AR_EG_ONLY_ALLOWLIST = [
  "src/components/intro/lesson-continuity.ts",
  "src/components/intro/IntroLessonRenderer.tsx",
  "src/components/intro/QuizBlock.tsx",
  "src/components/intro/IntroMission.tsx",
  "src/components/learn/LessonNotes.tsx",
  "src/components/learn/DifficultyPrompt.tsx",
  "src/components/learn/CompletionReward.tsx",
  "src/components/intro/lessons",
] as const;

function readRepoFile(relativePath: string): string {
  return readFileSync(path.join(REPO_ROOT, relativePath), "utf8");
}

function containsAny(source: string, needles: readonly string[]): string[] {
  return needles.filter((needle) => source.includes(needle));
}

export function validateLocaleLeakScan(): ValidatorResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const curriculumSource = readRepoFile("src/routes/curriculum.tsx");
  for (const hit of containsAny(curriculumSource, CURRICULUM_BANNED_AR)) {
    errors.push(`curriculum.tsx contains banned hardcoded Arabic: "${hit}"`);
  }

  const paywallSource = readRepoFile("src/components/learn/PaywallCard.tsx");
  for (const hit of containsAny(paywallSource, PAYWALL_BANNED_AR)) {
    errors.push(`PaywallCard.tsx contains banned hardcoded Arabic: "${hit}"`);
  }
  if (!paywallSource.includes("useUiString")) {
    errors.push("PaywallCard.tsx must wire copy through useUiString()");
  }

  const learnSource = readRepoFile("src/routes/learn.$pathId.$lessonId.tsx");
  const continuitySource = readRepoFile("src/components/intro/lesson-continuity.ts");

  if (learnSource.includes("getContinuity(")) {
    const localeAware =
      continuitySource.includes("getContinuityForLocale") ||
      continuitySource.includes("CONTINUITY_BY_LOCALE");
    if (!localeAware) {
      errors.push(
        "learn route calls getContinuity() but lesson-continuity.ts is not locale-aware (Egyptian leak under en/ar-MSA/ar-Gulf)",
      );
    }
  }

  if (learnSource.includes('dir="rtl"') && learnSource.includes("errorComponent")) {
    warnings.push(
      "learn route errorComponent uses fixed dir=\"rtl\" (ignores locale direction)",
    );
  }

  for (const rel of AR_EG_ONLY_ALLOWLIST) {
    if (rel.endsWith("lessons")) continue;
    try {
      const source = readRepoFile(rel);
      if (/[\u0600-\u06FF]/.test(source)) {
        warnings.push(`${rel}: contains Arabic (allowed ar-EG-only surface until Batch 2)`);
      }
    } catch {
      /* optional file */
    }
  }

  return {
    name: "locale-leak-scan",
    ok: errors.length === 0,
    errors,
    warnings,
  };
}

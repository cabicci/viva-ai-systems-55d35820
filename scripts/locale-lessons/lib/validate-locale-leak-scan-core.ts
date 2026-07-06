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

const COMPLETION_BANNED_AR = [
  "خلّصت الدرس! استمر",
  "٣ أيام متتالية 🔥 العادة بتتثبّت!",
  "إغلاق",
  " يوم",
] as const;

const PREVIEW_QUIZ_BANNED_EN = "Preview quiz — answers hidden" as const;
const SCREENSHOT_BANNED_EN = [
  "Platform preview",
  "Screenshot placeholder in localized preview.",
] as const;

const INTRO_RENDERER_BANNED_AR = [
  "فيديو اختياري",
  "ليه تكمّل · القيمة",
  "روح للمهمة",
  "النتيجة المتوقعة: ",
  "مصطلحات الدرس",
] as const;

const QUIZ_BLOCK_BANNED_AR = [
  "سؤال سريع — مش امتحان",
  "فكّرت — ورّيني الخيارات",
  "إجابة صحيحة ✓",
  "جرّب تاني",
] as const;

const LESSON_NOTES_BANNED_AR = [
  "ملاحظاتي على الدرس",
  "ملاحظاتي",
  "أضف ملاحظة",
] as const;

const DIFFICULTY_BANNED_AR = [
  "Checkpoint · بعد ٣ دروس",
  "٣ دروس خلصوا",
  "تمام، هنبسّطها معاك",
] as const;

const INTRO_MISSION_BANNED_AR = [
  "تم النسخ",
  "بدأت المهمة",
  "ورّيني خطوات المهمة",
] as const;

const MISSION_RUBRIC_BANNED_AR = [
  "نقاط تساعدك ترتب إجابتك",
  "ابعت وخد Feedback",
  "اكتب إجابتك هنا ببساطة",
  "[اكتب هنا]",
] as const;

/** ar-EG-only sources — Arabic allowed; scanned for reporting only. */
const AR_EG_ONLY_ALLOWLIST = [
  "src/components/intro/lesson-continuity.ts",
  "src/components/intro/value-hooks.ts",
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
  if (!curriculumSource.includes("buildLocalizedLearnerMeta")) {
    errors.push("curriculum route head must use buildLocalizedLearnerMeta");
  }
  if (curriculumSource.includes('title: "خريطة المنهج — مسارات"')) {
    errors.push("curriculum route head still uses static Arabic meta title");
  }

  const dashboardSource = readRepoFile("src/routes/dashboard.tsx");
  if (!dashboardSource.includes("buildLocalizedLearnerMeta")) {
    errors.push("dashboard route head must use buildLocalizedLearnerMeta");
  }
  if (dashboardSource.includes('title: "اللوحة — مسارات"')) {
    errors.push("dashboard route head still uses static Arabic meta title");
  }

  const paywallSource = readRepoFile("src/components/learn/PaywallCard.tsx");
  for (const hit of containsAny(paywallSource, PAYWALL_BANNED_AR)) {
    errors.push(`PaywallCard.tsx contains banned hardcoded Arabic: "${hit}"`);
  }
  if (!paywallSource.includes("useUiString")) {
    errors.push("PaywallCard.tsx must wire copy through useUiString()");
  }

  const learnSource = readRepoFile("src/routes/learn.$pathId.$lessonId.tsx");
  const continuityResolverSource = readRepoFile(
    "src/lib/locale-curriculum/resolve-continuity.ts",
  );

  if (!learnSource.includes("getContinuityForLocale(")) {
    errors.push(
      "learn route must call getContinuityForLocale(...) for locale-aware continuity",
    );
  }
  if (/\bgetContinuity\s*\(/.test(learnSource)) {
    errors.push(
      "learn route must not call locale-blind getContinuity() (Egyptian leak under en/ar-MSA/ar-Gulf)",
    );
  }
  if (learnSource.includes("PATH_HEAD_LABEL")) {
    errors.push("learn route must not define or use PATH_HEAD_LABEL for head meta");
  }
  if (learnSource.includes("درس من مسار")) {
    errors.push("learn route head must not hardcode Arabic description template");
  }
  if (!learnSource.includes("buildLocalizedLearnerMeta")) {
    errors.push("learn route head must use buildLocalizedLearnerMeta");
  }
  if (
    !continuityResolverSource.includes("getContinuityForLocale") ||
    !continuityResolverSource.includes("CONTINUITY_BY_LOCALE")
  ) {
    errors.push(
      "resolve-continuity.ts must export getContinuityForLocale and CONTINUITY_BY_LOCALE",
    );
  }

  if (learnSource.includes('dir="rtl"') && learnSource.includes("errorComponent")) {
    errors.push(
      "learn route errorComponent must not use fixed dir=\"rtl\" (use locale-aware direction)",
    );
  }

  const completionSource = readRepoFile("src/components/learn/CompletionReward.tsx");
  if (!completionSource.includes("getUiString")) {
    errors.push("CompletionReward.tsx must wire copy through getUiString()");
  }
  for (const hit of containsAny(completionSource, COMPLETION_BANNED_AR)) {
    errors.push(`CompletionReward.tsx contains banned hardcoded Arabic: "${hit}"`);
  }

  const previewQuizSource = readRepoFile("src/components/locale/LocalePreviewQuiz.tsx");
  if (previewQuizSource.includes(PREVIEW_QUIZ_BANNED_EN)) {
    errors.push("LocalePreviewQuiz.tsx must not hardcode English preview quiz label");
  }
  if (!previewQuizSource.includes("safety.quiz.previewLabel")) {
    errors.push("LocalePreviewQuiz.tsx must use safety.quiz.previewLabel ui key");
  }

  const previewRendererSource = readRepoFile(
    "src/components/locale/LocalePackagePreviewRenderer.tsx",
  );
  for (const hit of containsAny(previewRendererSource, SCREENSHOT_BANNED_EN)) {
    errors.push(
      `LocalePackagePreviewRenderer.tsx contains banned hardcoded screenshot chrome: "${hit}"`,
    );
  }
  if (!previewRendererSource.includes("safety.screenshot.title")) {
    errors.push(
      "LocalePackagePreviewRenderer.tsx must use safety.screenshot.* ui keys",
    );
  }

  if (!learnSource.includes("LearnLessonError")) {
    errors.push("learn route must use LearnLessonError for locale-aware errorComponent");
  }

  const introRendererSource = readRepoFile("src/components/intro/IntroLessonRenderer.tsx");
  if (!introRendererSource.includes("getUiString")) {
    errors.push("IntroLessonRenderer.tsx must wire chrome through getUiString()");
  }
  if (introRendererSource.includes("getValueHook(")) {
    errors.push("IntroLessonRenderer.tsx must use getValueHookForLocale (ar-EG-only hooks)");
  }
  if (!introRendererSource.includes("getValueHookForLocale")) {
    errors.push("IntroLessonRenderer.tsx must use getValueHookForLocale for value hooks");
  }
  if (introRendererSource.includes('dir="rtl"')) {
    errors.push("IntroLessonRenderer.tsx must not use fixed dir=\"rtl\"");
  }
  for (const hit of containsAny(introRendererSource, INTRO_RENDERER_BANNED_AR)) {
    errors.push(`IntroLessonRenderer.tsx contains banned hardcoded Arabic: "${hit}"`);
  }

  const quizBlockSource = readRepoFile("src/components/intro/QuizBlock.tsx");
  if (!quizBlockSource.includes("getUiString")) {
    errors.push("QuizBlock.tsx must wire chrome through getUiString()");
  }
  for (const hit of containsAny(quizBlockSource, QUIZ_BLOCK_BANNED_AR)) {
    errors.push(`QuizBlock.tsx contains banned hardcoded Arabic: "${hit}"`);
  }

  const lessonNotesSource = readRepoFile("src/components/learn/LessonNotes.tsx");
  if (!lessonNotesSource.includes("getUiString")) {
    errors.push("LessonNotes.tsx must wire chrome through getUiString()");
  }
  if (lessonNotesSource.includes('dir="rtl"')) {
    errors.push("LessonNotes.tsx must not use fixed dir=\"rtl\"");
  }
  for (const hit of containsAny(lessonNotesSource, LESSON_NOTES_BANNED_AR)) {
    errors.push(`LessonNotes.tsx contains banned hardcoded Arabic: "${hit}"`);
  }

  const difficultySource = readRepoFile("src/components/learn/DifficultyPrompt.tsx");
  if (!difficultySource.includes("getUiString")) {
    errors.push("DifficultyPrompt.tsx must wire chrome through getUiString()");
  }
  if (difficultySource.includes('dir="rtl"')) {
    errors.push("DifficultyPrompt.tsx must not use fixed dir=\"rtl\"");
  }
  for (const hit of containsAny(difficultySource, DIFFICULTY_BANNED_AR)) {
    errors.push(`DifficultyPrompt.tsx contains banned hardcoded Arabic: "${hit}"`);
  }

  const introMissionSource = readRepoFile("src/components/intro/IntroMission.tsx");
  if (!introMissionSource.includes("getUiString")) {
    errors.push("IntroMission.tsx must wire chrome through getUiString()");
  }
  for (const hit of containsAny(introMissionSource, INTRO_MISSION_BANNED_AR)) {
    errors.push(`IntroMission.tsx contains banned hardcoded Arabic: "${hit}"`);
  }

  if (!introMissionSource.includes("mission.copy.cta")) {
    errors.push("IntroMission.tsx must use mission.copy.cta for non-ar-EG copy labels");
  }

  const missionRubricSource = readRepoFile("src/components/intro/MissionRubricSubmit.tsx");
  if (!missionRubricSource.includes("getUiString")) {
    errors.push("MissionRubricSubmit.tsx must wire chrome through getUiString()");
  }
  if (missionRubricSource.includes('dir="rtl"')) {
    errors.push("MissionRubricSubmit.tsx must not use fixed dir=\"rtl\"");
  }
  for (const hit of containsAny(missionRubricSource, MISSION_RUBRIC_BANNED_AR)) {
    errors.push(`MissionRubricSubmit.tsx contains banned hardcoded Arabic: "${hit}"`);
  }

  const accountSource = readRepoFile("src/routes/account.tsx");
  if (!accountSource.includes("buildLocalizedLearnerMeta")) {
    errors.push("account route head must use buildLocalizedLearnerMeta");
  }
  if (accountSource.includes('title: "حسابي — مسارات"')) {
    errors.push("account route head still uses static Arabic meta title");
  }

  const packagePreviewSource = readRepoFile(
    "src/components/locale/LocalePackagePreviewRenderer.tsx",
  );
  if (!packagePreviewSource.includes("intro.block.conceptsHeader")) {
    errors.push(
      "LocalePackagePreviewRenderer.tsx must use intro.block.conceptsHeader for concepts chrome",
    );
  }

  for (const rel of AR_EG_ONLY_ALLOWLIST) {
    if (rel.endsWith("lessons")) continue;
    try {
      const source = readRepoFile(rel);
      if (/[\u0600-\u06FF]/.test(source)) {
        warnings.push(`${rel}: contains Arabic (ar-EG-only surface; continuity map is ar-EG canonical)`);
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

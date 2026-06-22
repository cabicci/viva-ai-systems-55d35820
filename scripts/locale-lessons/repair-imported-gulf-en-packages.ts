/**
 * Phase 3.5 — deterministic repair for imported ar-Gulf / en lesson packages.
 *
 * - Repairs corrupted quiz structures via repairQuizSection + CORRUPTED_SOURCE_QUIZ_FALLBACKS
 * - Sanitizes quiz-key markdown leaks via sanitizeAdaptedLessonMarkdown
 * - Pairs source sections with adapted sections by learner-facing index (production
 *   reference sections stripped from source before zip)
 *
 * Does NOT call OpenAI. Does NOT touch ar-MSA, ar-EG, Supabase, Remotion, or UI.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import type {
  AdaptationTargetLocale,
  AdaptedLessonPackage,
  LocalizedLessonPackage,
  LocalizedLessonSection,
} from "../../src/lib/locale-lessons/types.ts";
import {
  alignEnglishCatalogTitle,
  isInternalProductionReferenceSection,
  repairQuizSection,
  sanitizeAdaptedLessonMarkdown,
} from "./lib/quality-warnings.ts";
import { CORRUPTED_SOURCE_QUIZ_FALLBACKS } from "./lib/quiz-structure.ts";
import {
  lessonsDirForLocale,
  listLessonJsonIds,
  loadMsaLessonPackage,
  readJsonFile,
} from "./lib/source-package.ts";

const TARGET_LOCALES: AdaptationTargetLocale[] = ["ar-Gulf", "en"];

const PLACEHOLDER_OPTION_PATTERN =
  /inappropriate (choice|option)|partial answer that misses|خيار غير ملائم|إجابة جزئية/i;

function learnerFacingSections(source: LocalizedLessonPackage) {
  return source.sections.filter(
    (section) => !isInternalProductionReferenceSection(section),
  );
}

function hasPlaceholderQuizOptions(pkg: AdaptedLessonPackage): boolean {
  for (const section of pkg.sections) {
    if (section.role !== "Quiz" || !section.quiz?.options) continue;
    for (const option of section.quiz.options) {
      if (PLACEHOLDER_OPTION_PATTERN.test(option)) return true;
    }
  }
  return false;
}

function quizSectionChanged(
  before: AdaptedLessonPackage,
  after: AdaptedLessonPackage,
): boolean {
  const beforeQuiz = before.sections.find((section) => section.role === "Quiz")?.quiz;
  const afterQuiz = after.sections.find((section) => section.role === "Quiz")?.quiz;
  return JSON.stringify(beforeQuiz) !== JSON.stringify(afterQuiz);
}

function pairSectionsForRepair(
  source: LocalizedLessonPackage,
  adapted: AdaptedLessonPackage,
): Array<{ source: LocalizedLessonSection; adapted: LocalizedLessonSection }> {
  const sourceLearnerSections = learnerFacingSections(source);
  const pairs: Array<{
    source: LocalizedLessonSection;
    adapted: LocalizedLessonSection;
  }> = [];
  let sourceIndex = 0;

  for (const adaptedSection of adapted.sections) {
    while (
      sourceIndex < sourceLearnerSections.length &&
      sourceLearnerSections[sourceIndex].role !== adaptedSection.role
    ) {
      sourceIndex++;
    }

    const sourceSection = sourceLearnerSections[sourceIndex];
    if (!sourceSection) {
      throw new Error(
        `no source section found for adapted role "${adaptedSection.role}"`,
      );
    }

    pairs.push({ source: sourceSection, adapted: adaptedSection });
    sourceIndex++;
  }

  return pairs;
}

function repairImportedPackage(
  source: LocalizedLessonPackage,
  adapted: AdaptedLessonPackage,
): AdaptedLessonPackage {
  const pairs = pairSectionsForRepair(source, adapted);
  const locale = adapted.locale as AdaptationTargetLocale;

  const repairedSections = pairs.map(({ source: sourceSection, adapted: adaptedSection }) =>
    repairQuizSection(
      sourceSection,
      adaptedSection,
      adapted.lessonId,
      locale,
    ),
  );

  const withRepairedSections = { ...adapted, sections: repairedSections };
  return sanitizeAdaptedLessonMarkdown(
    alignEnglishCatalogTitle(source, withRepairedSections),
  );
}

async function main() {
  const report = {
    filesProcessed: 0,
    filesWritten: 0,
    quizRepairsApplied: 0,
    placeholderQuizRepairs: 0,
    canonicalFallbackLessons: Object.keys(CORRUPTED_SOURCE_QUIZ_FALLBACKS),
    errors: [] as string[],
    touched: [] as string[],
  };

  for (const locale of TARGET_LOCALES) {
    const lessonsDir = lessonsDirForLocale(locale);
    const lessonIds = await listLessonJsonIds(lessonsDir);

    for (const lessonId of lessonIds) {
      report.filesProcessed++;
      const filePath = path.join(lessonsDir, `${lessonId}.json`);

      try {
        const source = await loadMsaLessonPackage(lessonId);
        const adapted = await readJsonFile<AdaptedLessonPackage>(filePath);
        const hadPlaceholder = hasPlaceholderQuizOptions(adapted);

        const repaired = repairImportedPackage(source, adapted);
        const beforeJson = JSON.stringify(adapted);
        const afterJson = JSON.stringify(repaired);

        if (afterJson !== beforeJson) {
          report.filesWritten++;
          report.touched.push(`${locale}/${lessonId}`);

          if (quizSectionChanged(adapted, repaired)) {
            report.quizRepairsApplied++;
            if (hadPlaceholder) report.placeholderQuizRepairs++;
          }

          await fs.writeFile(filePath, JSON.stringify(repaired, null, 2) + "\n", "utf8");
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        report.errors.push(`${locale}/${lessonId}: ${message}`);
      }
    }
  }

  console.log(JSON.stringify(report, null, 2));
  if (report.errors.length > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

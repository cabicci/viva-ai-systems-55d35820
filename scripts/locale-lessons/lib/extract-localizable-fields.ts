import type { LocalizedLessonPackage } from "../../../src/lib/locale-lessons/types.ts";
import { isInternalProductionReferenceSection } from "./quality-warnings.ts";
import type {
  LocalizableFieldType,
  LocalizedTextField,
  LocalizedTextMap,
} from "./localized-text-map.ts";

function pushField(
  fields: LocalizedTextField[],
  fieldPath: string,
  sourceText: string,
  fieldType: LocalizableFieldType,
): void {
  const trimmed = sourceText?.trim() ?? "";
  if (!trimmed) return;
  fields.push({ fieldPath, sourceText: trimmed, fieldType });
}

/** Extract isolated learner-facing text — structure and metadata stay on canonical JSON. */
export function extractLocalizableFields(
  pkg: LocalizedLessonPackage,
): LocalizedTextMap {
  const fields: LocalizedTextField[] = [];

  pushField(fields, "title", pkg.title, "title");
  if (pkg.titleEn) {
    pushField(fields, "titleEn", pkg.titleEn, "titleEn");
  }
  if (pkg.summary) {
    pushField(fields, "summary", pkg.summary, "summary");
  }

  pkg.sections.forEach((section, sectionIndex) => {
    if (isInternalProductionReferenceSection(section)) {
      return;
    }

    const base = `sections[${sectionIndex}]`;
    pushField(fields, `${base}.heading`, section.heading, "section.heading");
    if (section.subtitle) {
      pushField(
        fields,
        `${base}.subtitle`,
        section.subtitle,
        "section.subtitle",
      );
    }
    pushField(
      fields,
      `${base}.contentMarkdown`,
      section.contentMarkdown,
      "section.contentMarkdown",
    );

    section.bullets.forEach((bullet, bulletIndex) => {
      pushField(
        fields,
        `${base}.bullets[${bulletIndex}]`,
        bullet,
        "section.bullet",
      );
    });

    section.tables.forEach((table, tableIndex) => {
      table.headers.forEach((header, headerIndex) => {
        pushField(
          fields,
          `${base}.tables[${tableIndex}].headers[${headerIndex}]`,
          header,
          "section.table.header",
        );
      });
      table.rows.forEach((row, rowIndex) => {
        row.forEach((cell, cellIndex) => {
          pushField(
            fields,
            `${base}.tables[${tableIndex}].rows[${rowIndex}][${cellIndex}]`,
            cell,
            "section.table.cell",
          );
        });
      });
    });

    if (section.quiz) {
      if (section.quiz.question) {
        pushField(
          fields,
          `${base}.quiz.question`,
          section.quiz.question,
          "quiz.question",
        );
      }
      section.quiz.options.forEach((option, optionIndex) => {
        pushField(
          fields,
          `${base}.quiz.options[${optionIndex}]`,
          option,
          "quiz.option",
        );
      });
      if (section.quiz.explanation) {
        pushField(
          fields,
          `${base}.quiz.explanation`,
          section.quiz.explanation,
          "quiz.explanation",
        );
      }
    }

    if (section.mission) {
      if (section.mission.intro) {
        pushField(
          fields,
          `${base}.mission.intro`,
          section.mission.intro,
          "mission.intro",
        );
      }
      section.mission.delivery.forEach((line, lineIndex) => {
        pushField(
          fields,
          `${base}.mission.delivery[${lineIndex}]`,
          line,
          "mission.delivery",
        );
      });
      section.mission.rubric.forEach((row, rowIndex) => {
        pushField(
          fields,
          `${base}.mission.rubric[${rowIndex}].dimension`,
          row.dimension,
          "mission.rubric.dimension",
        );
        pushField(
          fields,
          `${base}.mission.rubric[${rowIndex}].criteria`,
          row.criteria,
          "mission.rubric.criteria",
        );
      });
    }
  });

  return {
    lessonId: pkg.lessonId,
    sourceLocale: "ar-MSA",
    canonicalVersion: pkg.canonicalVersion,
    fields,
  };
}

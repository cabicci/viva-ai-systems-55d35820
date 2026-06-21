import type {
  AdaptationTargetLocale,
  LocalizedLessonPackage,
} from "../../../src/lib/locale-lessons/types.ts";
import { extractLocalizableFields } from "./extract-localizable-fields.ts";
import type { LocalizedTextField, LocalizedTextMap } from "./localized-text-map.ts";

export interface MockLocalizeOptions {
  targetLocale: AdaptationTargetLocale;
  /** Same-lesson committed target package — deterministic mock without OpenAI. */
  referencePackage?: LocalizedLessonPackage;
}

function fallbackMockText(
  field: LocalizedTextField,
  targetLocale: AdaptationTargetLocale,
): string {
  if (targetLocale === "ar-Gulf") {
    return field.sourceText.replace(/ماذا/g, "وش").replace(/لماذا/g, "ليش");
  }

  switch (field.fieldType) {
    case "title":
    case "titleEn":
      return "Prototype lesson title";
    case "summary":
      return "Prototype summary for fragment pipeline validation.";
    case "quiz.question":
      return "What is the best first step for this lesson scenario?";
    case "quiz.option":
      return "Try a small hands-on step with the tool first.";
    case "quiz.explanation":
      return "A small real attempt teaches more than reading alone.";
    case "mission.intro":
      return "Apply the idea in one small step from your week.";
    case "mission.delivery":
      return "Write three short lines about what you tried.";
    case "mission.rubric.dimension":
      return "Clarity";
    case "mission.rubric.criteria":
      return "You stated a clear attempt and what you observed.";
    default:
      return "Learner-facing localized copy for prototype validation.";
  }
}

/** Mock adapter — copies reference target text by fieldPath or uses safe fallbacks. */
export function mockLocalizeTextMap(
  map: LocalizedTextMap,
  options: MockLocalizeOptions,
): LocalizedTextMap {
  const referenceByPath = options.referencePackage
    ? new Map(
        extractLocalizableFields(options.referencePackage).fields.map((field) => [
          field.fieldPath,
          field.sourceText,
        ]),
      )
    : null;

  return {
    ...map,
    targetLocale: options.targetLocale,
    fields: map.fields.map((field) => ({
      ...field,
      localizedText:
        referenceByPath?.get(field.fieldPath) ??
        fallbackMockText(field, options.targetLocale),
    })),
  };
}

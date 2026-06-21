import type { AdaptationTargetLocale } from "../../../src/lib/locale-lessons/types.ts";

export type AdaptationQualityFailureKind = "validation" | "quality";

export class AdaptedLessonQualityError extends Error {
  readonly lessonId: string;
  readonly targetLocale: AdaptationTargetLocale;
  readonly issues: string[];
  readonly kind: AdaptationQualityFailureKind;

  constructor(input: {
    lessonId: string;
    targetLocale: AdaptationTargetLocale;
    issues: string[];
    kind?: AdaptationQualityFailureKind;
  }) {
    const kind = input.kind ?? "quality";
    const label = kind === "validation" ? "validation" : "quality checks";
    super(
      `Adapted lesson ${label} failed for ${input.lessonId} (${input.targetLocale}):\n${input.issues.map((issue) => `  - ${issue}`).join("\n")}`,
    );
    this.name = "AdaptedLessonQualityError";
    this.lessonId = input.lessonId;
    this.targetLocale = input.targetLocale;
    this.issues = input.issues;
    this.kind = kind;
  }
}

export function isAdaptedLessonQualityError(
  error: unknown,
): error is AdaptedLessonQualityError {
  return error instanceof AdaptedLessonQualityError;
}

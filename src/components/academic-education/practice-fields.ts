/**
 * Preserve positional practice values. The only known appended-field revision
 * is the English five-task exercise: title + four tasks becomes title + five.
 * No other shape is truncated, guessed, saved, or migrated.
 */
export function normalizeAcademicPracticeValues(
  lessonId: string,
  locale: string,
  fieldCount: number,
  values: unknown,
): string[] | null {
  if (
    !Number.isInteger(fieldCount) ||
    fieldCount < 0 ||
    !Array.isArray(values) ||
    !values.every((value): value is string => typeof value === "string")
  ) {
    return null;
  }
  if (values.length === fieldCount) return values.slice();
  if (lessonId === "AC-BUS-M02-L01" && locale === "en" && fieldCount === 6 && values.length === 5) {
    return [...values, ""];
  }
  return null;
}

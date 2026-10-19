/**
 * Preserve every positional value and append empty slots only for the explicit
 * reviewed lesson/locale/count revisions below. No automatic save or truncation.
 */
export const ACADEMIC_PRACTICE_APPEND_REVISIONS: ReadonlyArray<{
  lessonId: string;
  locale: string;
  fromCount: number;
  toCount: number;
}> = [
  {
    "lessonId": "AC-BUS-M02-L01",
    "locale": "en",
    "fromCount": 5,
    "toCount": 6
  },
  {
    "lessonId": "AC-BUS-M02-L03",
    "locale": "ar-MSA",
    "fromCount": 5,
    "toCount": 7
  },
  {
    "lessonId": "AC-BUS-M03-L01",
    "locale": "ar-EG",
    "fromCount": 5,
    "toCount": 10
  },
  {
    "lessonId": "AC-BUS-M03-L05",
    "locale": "ar-EG",
    "fromCount": 5,
    "toCount": 10
  },
  {
    "lessonId": "AC-BUS-M05-L01",
    "locale": "ar-EG",
    "fromCount": 5,
    "toCount": 6
  },
  {
    "lessonId": "AC-BUS-M05-L02",
    "locale": "en",
    "fromCount": 5,
    "toCount": 6
  },
  {
    "lessonId": "AC-BUS-M05-L03",
    "locale": "ar-EG",
    "fromCount": 5,
    "toCount": 6
  },
  {
    "lessonId": "AC-BUS-M05-L04",
    "locale": "ar-EG",
    "fromCount": 5,
    "toCount": 7
  },
  {
    "lessonId": "AC-BUS-M05-L06",
    "locale": "en",
    "fromCount": 5,
    "toCount": 8
  },
  {
    "lessonId": "AC-BUS-M06-L01",
    "locale": "en",
    "fromCount": 5,
    "toCount": 6
  },
  {
    "lessonId": "AC-BUS-M06-L03",
    "locale": "ar-MSA",
    "fromCount": 5,
    "toCount": 8
  },
  {
    "lessonId": "AC-BUS-M06-L04",
    "locale": "ar-EG",
    "fromCount": 5,
    "toCount": 6
  },
  {
    "lessonId": "AC-BUS-M06-L05",
    "locale": "ar-EG",
    "fromCount": 5,
    "toCount": 6
  },
  {
    "lessonId": "AC-BUS-M06-L06",
    "locale": "en",
    "fromCount": 5,
    "toCount": 7
  },
  {
    "lessonId": "AC-BUS-M07-L04",
    "locale": "ar-Gulf",
    "fromCount": 5,
    "toCount": 8
  },
  {
    "lessonId": "AC-BUS-M07-L05",
    "locale": "ar-MSA",
    "fromCount": 5,
    "toCount": 6
  },
  {
    "lessonId": "AC-BUS-M07-L06",
    "locale": "en",
    "fromCount": 5,
    "toCount": 6
  },
  {
    "lessonId": "AC-BUS-M07-L06",
    "locale": "ar-Gulf",
    "fromCount": 5,
    "toCount": 12
  },
  {
    "lessonId": "AC-BUS-M07-L07",
    "locale": "en",
    "fromCount": 5,
    "toCount": 6
  },
  {
    "lessonId": "AC-BUS-M07-L07",
    "locale": "ar-EG",
    "fromCount": 5,
    "toCount": 6
  },
  {
    "lessonId": "AC-BUS-M07-L08",
    "locale": "en",
    "fromCount": 5,
    "toCount": 6
  },
  {
    "lessonId": "AC-BUS-M03-L04",
    "locale": "en",
    "fromCount": 5,
    "toCount": 6
  },
  {
    "lessonId": "AC-BUS-M03-L04",
    "locale": "ar-Gulf",
    "fromCount": 5,
    "toCount": 6
  },
  {
    "lessonId": "AC-BUS-M03-L03",
    "locale": "en",
    "fromCount": 5,
    "toCount": 6
  },
  {
    "lessonId": "AC-BUS-M03-L03",
    "locale": "ar-Gulf",
    "fromCount": 5,
    "toCount": 6
  }
];

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
  const revision = ACADEMIC_PRACTICE_APPEND_REVISIONS.find(
    (row) => row.lessonId === lessonId && row.locale === locale,
  );
  if (revision && fieldCount === revision.toCount && values.length === revision.fromCount) {
    return [...values, ...Array<string>(fieldCount - values.length).fill("")];
  }
  return null;
}

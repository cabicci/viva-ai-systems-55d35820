import type { LessonPackageLocale } from "./types";

/**
 * Narrow, auditable Egyptian-only markers for Block 2 / Block 7 package text.
 * Word-boundary matched. Intentionally omits forms that are valid MSA (e.g. يبقى).
 */
export const EGYPTIAN_ONLY_VISUAL_MARKERS = [
  "إزاي",
  "ازاي",
  "ازاى",
  "علشان",
  "عشان",
  "كده",
  "كدا",
  "بتاع",
  "بتاعت",
  "بتوع",
  "دلوقتي",
  "دلوقت",
  "أهو",
  "اهو",
] as const;

const ARABIC_UNICODE_RE =
  /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

const BOUNDARY = String.raw`(?:^|[\s.,،؛:!?()«»"'“”])`;
const BOUNDARY_END = String.raw`(?:$|[\s.,،؛:!?()«»"'“”])`;

const EGYPTIAN_MARKER_REGEXES: readonly RegExp[] =
  EGYPTIAN_ONLY_VISUAL_MARKERS.map(
    (marker) =>
      new RegExp(`${BOUNDARY}${escapeRegExp(marker)}${BOUNDARY_END}`, "u"),
  );

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function containsArabicUnicode(value: string): boolean {
  return ARABIC_UNICODE_RE.test(value);
}

export function containsEgyptianOnlyVisualMarker(value: string): boolean {
  return EGYPTIAN_MARKER_REGEXES.some((re) => re.test(value));
}

/**
 * True when a package-sourced learner-visible Block 2 / Block 7 string
 * may be shown for the exact locale.
 */
export function isStrictVisualPackageTextAllowed(
  locale: LessonPackageLocale,
  value: string,
): boolean {
  if (locale === "en") {
    return !containsArabicUnicode(value);
  }
  return !containsEgyptianOnlyVisualMarker(value);
}

/**
 * Accept package text for display, or omit (undefined) on policy rejection.
 * Does not mutate the input string or package objects.
 */
export function acceptStrictVisualPackageText(
  locale: LessonPackageLocale,
  value: string | undefined | null,
): string | undefined {
  if (value == null) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (!isStrictVisualPackageTextAllowed(locale, trimmed)) return undefined;
  return trimmed;
}

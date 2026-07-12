/** Pure presentation-locale contract (no Remotion/font imports). */

export type PresentationLocale = "en" | "ar-MSA" | "ar-Gulf" | "ar-EG";

/** English is LTR; undefined (legacy ar-EG) and Arabic locales stay RTL. */
export const isLtrPresentationLocale = (
  locale?: PresentationLocale | null,
): boolean => locale === "en";

/** Hardcoded chrome strings — content copy stays in scene data. */
export const presentationChrome = {
  conceptBadge: {
    default: "مصطلح",
    en: "Term",
  },
  brandTagline: {
    default: "رحلتك تبدأ من هنا",
    en: "Your journey starts here",
  },
} as const;

export const conceptBadgeLabel = (
  locale?: PresentationLocale | null,
): string =>
  isLtrPresentationLocale(locale)
    ? presentationChrome.conceptBadge.en
    : presentationChrome.conceptBadge.default;

export const brandTaglineLabel = (
  locale?: PresentationLocale | null,
): string =>
  isLtrPresentationLocale(locale)
    ? presentationChrome.brandTagline.en
    : presentationChrome.brandTagline.default;

export const presentationDirection = (
  locale?: PresentationLocale | null,
): "ltr" | "rtl" => (isLtrPresentationLocale(locale) ? "ltr" : "rtl");

export const presentationTextAlign = (
  locale?: PresentationLocale | null,
): "left" | "right" => (isLtrPresentationLocale(locale) ? "left" : "right");

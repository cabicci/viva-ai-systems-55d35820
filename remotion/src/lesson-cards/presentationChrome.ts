/** Pure presentation-locale contract (no Remotion/font imports).
 *
 * Single source of truth for learner-visible template chrome.
 * Legacy (undefined / ar-EG) chrome wording is frozen as `legacy` and must
 * remain byte-identical to the pre-gate Arabic default.
 */

export type PresentationLocale = "en" | "ar-MSA" | "ar-Gulf" | "ar-EG";

/** Localized presentation locales that must carry an explicit locale stamp. */
export const LOCALIZED_PRESENTATION_LOCALES = [
  "ar-MSA",
  "ar-Gulf",
  "en",
] as const;

export type LocalizedPresentationLocale =
  (typeof LOCALIZED_PRESENTATION_LOCALES)[number];

/** English is LTR; undefined (legacy ar-EG) and Arabic locales stay RTL. */
export const isLtrPresentationLocale = (
  locale?: PresentationLocale | null,
): boolean => locale === "en";

/**
 * Hardcoded chrome strings — content copy stays in scene data.
 * Keys: legacy (locale-undefined / ar-EG), ar-MSA, ar-Gulf, en.
 * ar-MSA and ar-Gulf currently share the same Arabic wording as legacy
 * so existing localized delivery is unchanged; only the policy surface
 * is explicit per locale.
 */
export const presentationChrome = {
  conceptBadge: {
    legacy: "مصطلح",
    "ar-MSA": "مصطلح",
    "ar-Gulf": "مصطلح",
    en: "Term",
  },
  brandTagline: {
    legacy: "رحلتك تبدأ من هنا",
    "ar-MSA": "رحلتك تبدأ من هنا",
    "ar-Gulf": "رحلتك تبدأ من هنا",
    en: "Your journey starts here",
  },
} as const;

export type PresentationChromeKey = keyof typeof presentationChrome;

/** Resolve chrome for a locale. Undefined and ar-EG → legacy (byte-frozen). */
export const resolvePresentationChrome = (
  key: PresentationChromeKey,
  locale?: PresentationLocale | null,
): string => {
  const entry = presentationChrome[key];
  if (locale === "en") return entry.en;
  if (locale === "ar-MSA") return entry["ar-MSA"];
  if (locale === "ar-Gulf") return entry["ar-Gulf"];
  return entry.legacy;
};

export const conceptBadgeLabel = (
  locale?: PresentationLocale | null,
): string => resolvePresentationChrome("conceptBadge", locale);

export const brandTaglineLabel = (
  locale?: PresentationLocale | null,
): string => resolvePresentationChrome("brandTagline", locale);

export const presentationDirection = (
  locale?: PresentationLocale | null,
): "ltr" | "rtl" => (isLtrPresentationLocale(locale) ? "ltr" : "rtl");

export const presentationTextAlign = (
  locale?: PresentationLocale | null,
): "left" | "right" => (isLtrPresentationLocale(locale) ? "left" : "right");

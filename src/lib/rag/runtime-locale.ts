export const RUNTIME_SUPPORTED_LOCALES = ["ar-EG", "ar-MSA", "ar-Gulf", "en"] as const;

export type RuntimeSupportedLocale = (typeof RUNTIME_SUPPORTED_LOCALES)[number];

export type LocaleValidationFailureReason =
  | "missing_locale"
  | "blank_locale"
  | "malformed_locale"
  | "unsupported_locale";

export type LocaleValidationResult =
  | {
      ok: true;
      locale: RuntimeSupportedLocale;
      retrievalPath: "package";
      allowProviderCalls: true;
    }
  | {
      ok: false;
      reason: LocaleValidationFailureReason;
      allowProviderCalls: false;
    };

const RUNTIME_LOCALE_SET = new Set<string>(RUNTIME_SUPPORTED_LOCALES);

/** Explicit canonical locale only — no case folding, no silent normalization. */
export function validateRuntimeLocale(locale: unknown): LocaleValidationResult {
  if (locale === null || locale === undefined) {
    return {
      ok: false,
      reason: "missing_locale",
      allowProviderCalls: false,
    };
  }
  if (typeof locale !== "string") {
    return {
      ok: false,
      reason: "malformed_locale",
      allowProviderCalls: false,
    };
  }
  if (locale.length === 0 || locale.trim().length === 0) {
    return {
      ok: false,
      reason: "blank_locale",
      allowProviderCalls: false,
    };
  }
  if (locale !== locale.trim()) {
    return {
      ok: false,
      reason: "malformed_locale",
      allowProviderCalls: false,
    };
  }
  if (!RUNTIME_LOCALE_SET.has(locale)) {
    return {
      ok: false,
      reason: "unsupported_locale",
      allowProviderCalls: false,
    };
  }
  return {
    ok: true,
    locale: locale as RuntimeSupportedLocale,
    retrievalPath: "package",
    allowProviderCalls: true,
  };
}

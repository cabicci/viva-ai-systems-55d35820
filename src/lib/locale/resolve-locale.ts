import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from "./types";

const SUPPORTED_LOCALE_SET = new Set<string>(SUPPORTED_LOCALES);

export function isSupportedLocale(value: unknown): value is SupportedLocale {
  return typeof value === "string" && SUPPORTED_LOCALE_SET.has(value);
}

export function resolveLocale(input?: string | null): SupportedLocale {
  if (input == null || input.trim() === "") {
    return DEFAULT_LOCALE;
  }

  const normalized = input.trim();
  return isSupportedLocale(normalized) ? normalized : DEFAULT_LOCALE;
}

export type SupportedLocale = "ar-EG" | "ar-MSA" | "ar-Gulf" | "en";

export const DEFAULT_LOCALE: SupportedLocale = "ar-EG";

export const SUPPORTED_LOCALES: readonly SupportedLocale[] = [
  "ar-EG",
  "ar-MSA",
  "ar-Gulf",
  "en",
] as const;

export type LocaleDirection = "rtl" | "ltr";

export interface LocaleMeta {
  lang: string;
  dir: LocaleDirection;
  displayName: string;
}

export const LOCALE_META: Record<SupportedLocale, LocaleMeta> = {
  "ar-EG": { lang: "ar", dir: "rtl", displayName: "مصري" },
  "ar-MSA": { lang: "ar", dir: "rtl", displayName: "فصحى" },
  "ar-Gulf": { lang: "ar", dir: "rtl", displayName: "خليجي" },
  en: { lang: "en", dir: "ltr", displayName: "English" },
};

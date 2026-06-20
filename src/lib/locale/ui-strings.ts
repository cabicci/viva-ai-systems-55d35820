import arEGUi from "@/locales/ar-EG/ui.json";
import arMSAUi from "@/locales/ar-MSA/ui.json";
import arGulfUi from "@/locales/ar-Gulf/ui.json";
import enUi from "@/locales/en/ui.json";
import { DEFAULT_LOCALE, type SupportedLocale } from "./types";

type UiStringMap = Record<string, string>;

export type UiStringKey = keyof typeof arEGUi & string;

const UI_STRINGS: Record<SupportedLocale, UiStringMap> = {
  "ar-EG": arEGUi,
  "ar-MSA": arMSAUi,
  "ar-Gulf": arGulfUi,
  en: enUi,
};

const FALLBACK_UI_STRINGS = UI_STRINGS[DEFAULT_LOCALE];

export function getUiString(locale: SupportedLocale, key: UiStringKey): string {
  const primary = UI_STRINGS[locale]?.[key];
  if (primary != null && primary !== "") {
    return primary;
  }

  return FALLBACK_UI_STRINGS[key] ?? key;
}

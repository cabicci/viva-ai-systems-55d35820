import { useCallback } from "react";
import { useLocale } from "./locale-context";
import { getUiString, type UiStringKey } from "./ui-strings";
import type { SupportedLocale } from "./types";

export function useUiString(): (key: UiStringKey) => string {
  const { locale } = useLocale();
  return useCallback((key: UiStringKey) => getUiString(locale, key), [locale]);
}

export function getUiStrings(locale: SupportedLocale): Record<UiStringKey, string> {
  return new Proxy({} as Record<UiStringKey, string>, {
    get(_target, prop: string) {
      return getUiString(locale, prop as UiStringKey);
    },
  });
}

export function useUiStrings(): Record<UiStringKey, string> {
  const { locale } = useLocale();
  return getUiStrings(locale);
}

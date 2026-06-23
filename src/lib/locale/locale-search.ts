import { isSupportedLocale, resolveLocale } from "./resolve-locale";
import { DEFAULT_LOCALE, type SupportedLocale } from "./types";
import { writeLocaleCookie } from "./locale-cookie";

export type LocaleSearchParams = {
  locale?: string;
};

/** Parse optional `locale` query param from raw router search. */
export function parseLocaleSearchParam(
  raw: Record<string, unknown>,
): LocaleSearchParams {
  const locale =
    typeof raw.locale === "string" && raw.locale.trim() !== ""
      ? raw.locale.trim()
      : undefined;
  return { locale };
}

/** Write cookie only for supported locale values (never unsupported or fallback). */
export function persistValidLocaleCookie(urlLocale: string | undefined): void {
  if (!urlLocale) return;
  const trimmed = urlLocale.trim();
  if (!isSupportedLocale(trimmed)) return;
  writeLocaleCookie(trimmed);
}

/** Build navigation search without emitting `previewLocale=false`. */
export function buildLocaleNavigationSearch(
  previous: Record<string, unknown> | undefined,
  nextLocale: SupportedLocale,
): Record<string, unknown> {
  const base = previous && typeof previous === "object" ? previous : {};
  const nextSearch: Record<string, unknown> = { ...base };

  if (nextLocale === DEFAULT_LOCALE) {
    delete nextSearch.locale;
  } else {
    nextSearch.locale = nextLocale;
  }

  delete nextSearch.previewLocale;
  return nextSearch;
}

export function readClientUrlLocale(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const value = new URL(window.location.href).searchParams.get("locale");
  return value?.trim() || undefined;
}

export function resolveUrlLocaleForRuntime(
  routerLocale: string | undefined,
): SupportedLocale | undefined {
  const candidate = routerLocale ?? readClientUrlLocale();
  if (!candidate) return undefined;
  return isSupportedLocale(candidate.trim()) ? resolveLocale(candidate) : undefined;
}

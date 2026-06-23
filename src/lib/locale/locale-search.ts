import { isSupportedLocale, resolveLocale } from "./resolve-locale";
import { DEFAULT_LOCALE, type SupportedLocale } from "./types";
import { writeLocaleCookie } from "./locale-cookie";

export type LocaleSearchParams = {
  locale?: string;
};

/** Drop `previewLocale=false` and other false booleans before router serialization. */
export function stripFalseBooleanSearchParams(
  raw: Record<string, unknown>,
): Record<string, unknown> {
  const next: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (value === false) continue;
    next[key] = value;
  }
  return next;
}

/** Parse optional `locale` query param from raw router search. */
export function parseLocaleSearchParam(
  raw: Record<string, unknown>,
): LocaleSearchParams {
  const sanitized = stripFalseBooleanSearchParams(raw);
  const locale =
    typeof sanitized.locale === "string" && sanitized.locale.trim() !== ""
      ? sanitized.locale.trim()
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
  const base =
    previous && typeof previous === "object"
      ? stripFalseBooleanSearchParams(previous)
      : {};
  const nextSearch: Record<string, unknown> = { ...base };

  if (nextLocale === DEFAULT_LOCALE) {
    delete nextSearch.locale;
  } else {
    nextSearch.locale = nextLocale;
  }

  delete nextSearch.previewLocale;
  return stripFalseBooleanSearchParams(nextSearch);
}

export function readUrlLocaleFromHref(href: string): string | undefined {
  try {
    const value = new URL(href, "https://masaarat.ai").searchParams.get("locale");
    return value?.trim() || undefined;
  } catch {
    return undefined;
  }
}

export function readClientUrlLocale(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return readUrlLocaleFromHref(window.location.href);
}

export function resolveUrlLocaleForRuntime(
  routerLocale: string | undefined,
): SupportedLocale | undefined {
  const candidate = routerLocale ?? readClientUrlLocale();
  if (!candidate) return undefined;
  return isSupportedLocale(candidate.trim()) ? resolveLocale(candidate) : undefined;
}

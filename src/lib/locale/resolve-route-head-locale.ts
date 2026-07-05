import { readLocaleCookie } from "./locale-cookie";
import { readLocaleRuntimeInputs } from "./read-locale-runtime-inputs";
import { resolvePublicLocale } from "./resolve-public-locale";
import { readClientUrlLocale } from "./locale-search";
import type { SupportedLocale } from "./types";

export type ResolveRouteHeadLocaleInput = {
  /** Route search `locale` param when present. */
  searchLocale?: string | null;
};

function resolveFromInputs(input: ResolveRouteHeadLocaleInput): SupportedLocale {
  const urlLocale =
    input.searchLocale != null && input.searchLocale.trim() !== ""
      ? input.searchLocale.trim()
      : undefined;

  return resolvePublicLocale({
    urlLocale: urlLocale ?? readClientUrlLocale(),
    cookieLocale: readLocaleCookie(),
  }).locale;
}

/**
 * SSR-safe locale for TanStack route `head()`.
 * Precedence matches app shell: ?locale= → cookie → geo (SSR) → ar-EG.
 */
export async function resolveRouteHeadLocale(
  input: ResolveRouteHeadLocaleInput = {},
): Promise<SupportedLocale> {
  const searchLocale =
    input.searchLocale != null && input.searchLocale.trim() !== ""
      ? input.searchLocale.trim()
      : undefined;

  try {
    const { urlLocale, cookieLocale, countryCode } =
      await readLocaleRuntimeInputs();
    return resolvePublicLocale({
      urlLocale: searchLocale ?? urlLocale,
      cookieLocale,
      countryCode,
    }).locale;
  } catch {
    return resolveFromInputs(input);
  }
}

/** Sync fallback when async request inputs are unavailable (tests / client-only). */
export function resolveRouteHeadLocaleSync(
  input: ResolveRouteHeadLocaleInput = {},
): SupportedLocale {
  return resolveFromInputs(input);
}

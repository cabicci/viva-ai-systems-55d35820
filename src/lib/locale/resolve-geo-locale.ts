import type { SupportedLocale } from "./types";

/** ISO 3166-1 alpha-2 GCC members → Gulf Arabic package. */
export const GCC_COUNTRY_CODES = [
  "SA",
  "AE",
  "KW",
  "QA",
  "BH",
  "OM",
] as const;

/** Other Arabic-speaking countries (excluding EG and GCC) → MSA package. */
export const ARABIC_COUNTRY_CODES = [
  "DZ",
  "MA",
  "TN",
  "LY",
  "SD",
  "JO",
  "LB",
  "SY",
  "IQ",
  "YE",
  "PS",
  "MR",
  "SO",
  "DJ",
  "KM",
] as const;

/** Known non-Arab / international countries → English package. */
export const INTERNATIONAL_EN_COUNTRY_CODES = [
  "US",
  "GB",
  "CA",
  "AU",
  "NZ",
  "FR",
  "DE",
  "IT",
  "ES",
  "PT",
  "NL",
  "BE",
  "CH",
  "AT",
  "SE",
  "NO",
  "DK",
  "FI",
  "IE",
  "SG",
  "IN",
  "JP",
  "KR",
  "CN",
  "BR",
  "MX",
  "PL",
  "CZ",
  "RO",
  "HU",
  "GR",
  "TR",
  "RU",
  "UA",
  "ZA",
  "NG",
  "KE",
  "PH",
  "ID",
  "MY",
  "TH",
  "VN",
] as const;

const GCC_SET = new Set<string>(GCC_COUNTRY_CODES);
const ARABIC_SET = new Set<string>(ARABIC_COUNTRY_CODES);
const EN_SET = new Set<string>(INTERNATIONAL_EN_COUNTRY_CODES);

/** Cloudflare / proxy sentinels that mean “no country”. */
const UNKNOWN_COUNTRY_CODES = new Set(["XX", "T1", "ZZ"]);

/** Normalize request country to uppercase ISO-3166 alpha-2, or undefined if invalid. */
export function normalizeCountryCode(
  raw: string | null | undefined,
): string | undefined {
  if (raw == null) return undefined;
  const code = raw.trim().toUpperCase();
  if (code.length !== 2 || !/^[A-Z]{2}$/.test(code)) return undefined;
  if (UNKNOWN_COUNTRY_CODES.has(code)) return undefined;
  return code;
}

/**
 * Map country code → supported locale.
 * Returns null for missing/unknown codes (caller uses safe default; no guessing).
 */
export function resolveGeoLocale(
  countryCode: string | null | undefined,
): SupportedLocale | null {
  const code = normalizeCountryCode(countryCode);
  if (!code) return null;
  if (code === "EG") return "ar-EG";
  if (GCC_SET.has(code)) return "ar-Gulf";
  if (ARABIC_SET.has(code)) return "ar-MSA";
  if (EN_SET.has(code)) return "en";
  return null;
}

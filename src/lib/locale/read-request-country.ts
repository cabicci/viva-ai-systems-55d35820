import { normalizeCountryCode } from "./resolve-geo-locale";

/** Request headers that may carry geo country (Cloudflare, Vercel, generic). */
export const GEO_COUNTRY_HEADER_NAMES = [
  "cf-ipcountry",
  "CF-IPCountry",
  "x-vercel-ip-country",
  "x-country-code",
  "x-geo-country",
] as const;

export function readCountryCodeFromHeaders(
  headers: Headers | Record<string, string | null | undefined>,
): string | undefined {
  const get = (name: string): string | null | undefined => {
    if (headers instanceof Headers) {
      return headers.get(name);
    }
    const direct = headers[name];
    if (direct != null) return direct;
    const lower = headers[name.toLowerCase()];
    if (lower != null) return lower;
    return undefined;
  };

  for (const name of GEO_COUNTRY_HEADER_NAMES) {
    const value = get(name);
    const normalized = normalizeCountryCode(value ?? undefined);
    if (normalized) return normalized;
  }
  return undefined;
}

/** Read geo country from the active SSR request (no-op on client). */
export async function readRequestCountryCode(): Promise<string | undefined> {
  if (!import.meta.env.SSR) return undefined;
  const { getRequest } = await import("@tanstack/react-start/server");
  const request = getRequest();
  return readCountryCodeFromHeaders(request.headers);
}

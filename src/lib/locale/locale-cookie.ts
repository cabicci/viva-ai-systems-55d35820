import type { SupportedLocale } from "./types";

export const LOCALE_COOKIE_NAME = "masaarat_locale";

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;
const COOKIE_PATH = "/";
const COOKIE_SAME_SITE = "Lax";
const COOKIE_EXPIRED = "Thu, 01 Jan 1970 00:00:00 GMT";

export function localeCookieBaseAttributes(): string {
  return `Path=${COOKIE_PATH}; SameSite=${COOKIE_SAME_SITE}`;
}

/** Cookie directive used when persisting a supported locale (for tests + Worker parity). */
export function localeCookieWriteDirective(locale: SupportedLocale): string {
  return `${LOCALE_COOKIE_NAME}=${encodeURIComponent(locale)}; ${localeCookieBaseAttributes()}; Max-Age=${COOKIE_MAX_AGE_SECONDS}`;
}

/** Cookie directives that delete masaarat_locale (Secure + non-Secure for preview/HTTPS mismatches). */
export function localeCookieDeletionDirectives(): string[] {
  const clearedValue = `${LOCALE_COOKIE_NAME}=; ${localeCookieBaseAttributes()}; Max-Age=0; Expires=${COOKIE_EXPIRED}`;
  return [clearedValue, `${clearedValue}; Secure`];
}

export function parseLocaleCookieHeader(
  cookieHeader: string | null | undefined,
): string | undefined {
  if (!cookieHeader) return undefined;
  const pattern = new RegExp(`(?:^|;\\s*)${LOCALE_COOKIE_NAME}=([^;]*)`);
  const match = cookieHeader.match(pattern);
  if (!match?.[1]) return undefined;
  const raw = match[1].trim();
  if (raw === "") return undefined;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export function readLocaleCookie(): string | undefined {
  if (typeof document === "undefined") return undefined;
  return parseLocaleCookieHeader(document.cookie);
}

export async function readRequestCookieLocale(): Promise<string | undefined> {
  if (import.meta.env.SSR) {
    const { readSsrCookieLocale } = await import("./locale-ssr-request.server");
    return readSsrCookieLocale();
  }
  return readLocaleCookie();
}

function cookieSecureSuffix(): string {
  if (typeof window === "undefined") return "";
  return window.location.protocol === "https:" ? "; Secure" : "";
}

export function writeLocaleCookie(locale: SupportedLocale): void {
  if (typeof document === "undefined") return;
  document.cookie = `${localeCookieWriteDirective(locale)}${cookieSecureSuffix()}`;
}

export function clearLocaleCookie(): void {
  if (typeof document === "undefined") return;
  for (const directive of localeCookieDeletionDirectives()) {
    document.cookie = directive;
  }
}

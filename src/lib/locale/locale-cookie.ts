import type { SupportedLocale } from "./types";

export const LOCALE_COOKIE_NAME = "masaarat_locale";

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export function parseLocaleCookieHeader(
  cookieHeader: string | null | undefined,
): string | undefined {
  if (!cookieHeader) return undefined;
  const pattern = new RegExp(`(?:^|;\\s*)${LOCALE_COOKIE_NAME}=([^;]*)`);
  const match = cookieHeader.match(pattern);
  if (!match?.[1]) return undefined;
  try {
    return decodeURIComponent(match[1].trim());
  } catch {
    return match[1].trim();
  }
}

export function readLocaleCookie(): string | undefined {
  if (typeof document === "undefined") return undefined;
  return parseLocaleCookieHeader(document.cookie);
}

export async function readRequestCookieLocale(): Promise<string | undefined> {
  if (import.meta.env.SSR) {
    const { getRequest } = await import("@tanstack/react-start/server");
    const request = getRequest();
    return parseLocaleCookieHeader(request.headers.get("cookie"));
  }
  return readLocaleCookie();
}

function cookieSecureSuffix(): string {
  if (typeof window === "undefined") return "";
  return window.location.protocol === "https:" ? "; Secure" : "";
}

export function writeLocaleCookie(locale: SupportedLocale): void {
  if (typeof document === "undefined") return;
  const secure = cookieSecureSuffix();
  document.cookie = `${LOCALE_COOKIE_NAME}=${encodeURIComponent(locale)}; Path=/; Max-Age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
}

export function clearLocaleCookie(): void {
  if (typeof document === "undefined") return;
  const secure = cookieSecureSuffix();
  document.cookie = `${LOCALE_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
}

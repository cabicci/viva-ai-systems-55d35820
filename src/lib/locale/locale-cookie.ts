import type { SupportedLocale } from "./types";

export const LOCALE_COOKIE_NAME = "masaarat_locale";

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export function readLocaleCookie(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const pattern = new RegExp(`(?:^|; )${LOCALE_COOKIE_NAME}=([^;]*)`);
  const match = document.cookie.match(pattern);
  if (!match?.[1]) return undefined;
  return decodeURIComponent(match[1]);
}

export function writeLocaleCookie(locale: SupportedLocale): void {
  if (typeof document === "undefined") return;
  document.cookie = `${LOCALE_COOKIE_NAME}=${encodeURIComponent(locale)}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}

export function clearLocaleCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${LOCALE_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
}

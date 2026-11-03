/**
 * Access-token cookie bridge for SSR document requests.
 * Session remains in localStorage; this cookie mirrors the access JWT so
 * hard navigations can fail-closed with server-side verification.
 * Same trust boundary as localStorage (XSS can already read the token).
 * Never log cookie values or raw tokens.
 */

export const ACCESS_TOKEN_COOKIE_NAME = "masaarat_access_token";

const COOKIE_PATH = "/";
const COOKIE_SAME_SITE = "Lax";
const COOKIE_EXPIRED = "Thu, 01 Jan 1970 00:00:00 GMT";
/** Align with typical Supabase access-token lifetime (~1h). */
const COOKIE_MAX_AGE_SECONDS = 60 * 60;

export function accessTokenCookieBaseAttributes(): string {
  return `Path=${COOKIE_PATH}; SameSite=${COOKIE_SAME_SITE}`;
}

export function accessTokenCookieWriteDirective(token: string): string {
  return `${ACCESS_TOKEN_COOKIE_NAME}=${encodeURIComponent(token)}; ${accessTokenCookieBaseAttributes()}; Max-Age=${COOKIE_MAX_AGE_SECONDS}`;
}

export function accessTokenCookieDeletionDirectives(): string[] {
  const cleared = `${ACCESS_TOKEN_COOKIE_NAME}=; ${accessTokenCookieBaseAttributes()}; Max-Age=0; Expires=${COOKIE_EXPIRED}`;
  return [cleared, `${cleared}; Secure`];
}

export function isCompactJwt(token: string | null | undefined): boolean {
  return !!token && token.split(".").length === 3;
}

export function parseAccessTokenCookieHeader(
  cookieHeader: string | null | undefined,
): string | undefined {
  if (!cookieHeader) return undefined;
  const pattern = new RegExp(`(?:^|;\\s*)${ACCESS_TOKEN_COOKIE_NAME}=([^;]*)`);
  const match = cookieHeader.match(pattern);
  if (!match?.[1]) return undefined;
  const raw = match[1].trim();
  if (raw === "") return undefined;
  let token: string;
  try {
    token = decodeURIComponent(raw);
  } catch {
    token = raw;
  }
  return isCompactJwt(token) ? token : undefined;
}

export function extractAccessTokenFromHeaders(headers: {
  get(name: string): string | null;
}): string | undefined {
  const authHeader = headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice("Bearer ".length).trim();
    if (isCompactJwt(token)) return token;
  }
  return parseAccessTokenCookieHeader(headers.get("cookie"));
}

function isEmbeddedHttps(): boolean {
  if (typeof window === "undefined") return false;
  if (window.location.protocol !== "https:") return false;
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

/**
 * Embedded editor preview (cross-site iframe): Lax cookies are not sent on the
 * iframe's own document requests, so SSR admin guards saw no identity and
 * redirected to /login. Only in that embedded case use SameSite=None; Secure;
 * Partitioned (scoped to the embedding site). Top-level sites keep Lax.
 */
export function accessTokenCookieWriteSuffix(embeddedHttps: boolean, https: boolean): string {
  if (embeddedHttps) return "; Secure; Partitioned".replace("; Secure", "; Secure");
  return https ? "; Secure" : "";
}

/** Client-only: mirror a verified access token into the document cookie jar. */
export function writeAccessTokenCookie(token: string): void {
  if (typeof document === "undefined") return;
  if (!isCompactJwt(token)) {
    clearAccessTokenCookie();
    return;
  }
  if (isEmbeddedHttps()) {
    document.cookie = `${ACCESS_TOKEN_COOKIE_NAME}=${encodeURIComponent(token)}; Path=${COOKIE_PATH}; SameSite=None; Secure; Partitioned; Max-Age=${COOKIE_MAX_AGE_SECONDS}`;
    return;
  }
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${accessTokenCookieWriteDirective(token)}${secure}`;
}

export function clearAccessTokenCookie(): void {
  if (typeof document === "undefined") return;
  for (const directive of accessTokenCookieDeletionDirectives()) {
    document.cookie = directive;
  }
  document.cookie = `${ACCESS_TOKEN_COOKIE_NAME}=; Path=${COOKIE_PATH}; SameSite=None; Secure; Partitioned; Max-Age=0; Expires=${COOKIE_EXPIRED}`;
}

/** Sync cookie to current session access token (or clear when logged out). */
export function syncAccessTokenCookie(accessToken: string | null | undefined): void {
  if (accessToken && isCompactJwt(accessToken)) {
    writeAccessTokenCookie(accessToken);
  } else {
    clearAccessTokenCookie();
  }
}

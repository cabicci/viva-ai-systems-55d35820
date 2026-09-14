const EXACT_LOCAL_APP_ORIGIN =
  /^http:\/\/(?:127\.0\.0\.1|localhost)(?::(?:0|[1-9]\d{0,4}))?\/?$/i;

/**
 * Accept only the app origins provisioned for credential-bearing local capture.
 * Authorized capture constants/configs use HTTP on 127.0.0.1 or localhost.
 * The previous entry guards did not admit ::1; keep that boundary unchanged.
 */
export function normalizeLocalCaptureAppOrigin(rawOrigin: string): string | null {
  const candidate = rawOrigin.trim();
  if (!EXACT_LOCAL_APP_ORIGIN.test(candidate)) return null;

  try {
    const url = new URL(candidate);
    if (
      url.protocol !== "http:" ||
      (url.hostname !== "127.0.0.1" && url.hostname !== "localhost") ||
      url.username !== "" ||
      url.password !== "" ||
      url.pathname !== "/" ||
      url.search !== "" ||
      url.hash !== ""
    ) {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
}

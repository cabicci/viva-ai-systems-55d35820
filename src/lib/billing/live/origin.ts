// Live Checkout/Portal accept only the published Masaarat site. Preview,
// lovable.app, localhost, missing or mismatched Origin/Host are refused.
export const LIVE_SITE_HOSTS = ["masaarat.ai", "www.masaarat.ai"] as const;

export function trustedLiveOrigin(origin: string | null, host: string | null): string | null {
  if (!origin || !host) return null;
  let url: URL;
  try {
    url = new URL(origin);
  } catch {
    return null;
  }
  const normalizedHost = host.trim().toLowerCase();
  if (
    url.protocol !== "https:" ||
    url.port !== "" ||
    url.pathname !== "/" ||
    url.username ||
    url.password
  )
    return null;
  if (!(LIVE_SITE_HOSTS as readonly string[]).includes(url.hostname)) return null;
  if (normalizedHost !== url.hostname) return null;
  return `https://${url.hostname}`;
}

export function trustedLiveOriginFor(request: Request): string | null {
  return trustedLiveOrigin(
    request.headers.get("Origin"),
    request.headers.get("Host") ?? new URL(request.url).host,
  );
}

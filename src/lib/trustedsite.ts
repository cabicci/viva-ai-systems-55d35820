import type { AnalyticsConsent } from "@/lib/analytics";

const TRUSTEDSITE_SCRIPT_ID = "masaarat-trustedsite-script";
const TRUSTEDSITE_SCRIPT_URL = "https://cdn.ywxi.net/js/1.js";

function currentBrowserHref(): string {
  const { pathname, search, hash } = window.location;
  return `${pathname}${search}${hash}`;
}

/**
 * TrustedSite counts visits with a tracking cookie, so load it only after consent.
 * `destinationHref` is the router's target URL. During client navigation the router
 * state changes before the browser URL, so a plain reload would return to the previous
 * page (e.g. tapping "login" bounced back to home). Load the destination instead.
 */
export function applyTrustedSiteConsent(
  consent: AnalyticsConsent,
  destinationHref?: string,
): void {
  if (typeof document === "undefined") return;

  const existing = document.getElementById(TRUSTEDSITE_SCRIPT_ID);
  if (consent !== "granted") {
    if (existing) {
      existing.remove();
      // The vendor can leave a floating widget and running code after its script loads.
      // A fresh document load clears that runtime without making another vendor request.
      if (destinationHref && destinationHref !== currentBrowserHref()) {
        window.location.assign(destinationHref);
      } else {
        window.location.reload();
      }
    }
    return;
  }

  if (existing) return;
  const script = document.createElement("script");
  script.id = TRUSTEDSITE_SCRIPT_ID;
  script.type = "text/javascript";
  script.src = TRUSTEDSITE_SCRIPT_URL;
  script.async = true;
  document.body.appendChild(script);
}

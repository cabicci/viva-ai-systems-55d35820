import type { AnalyticsConsent } from "@/lib/analytics";

const TRUSTEDSITE_SCRIPT_ID = "masaarat-trustedsite-script";
const TRUSTEDSITE_SCRIPT_URL = "https://cdn.ywxi.net/js/1.js";

/** TrustedSite counts visits with a tracking cookie, so load it only after consent. */
export function applyTrustedSiteConsent(consent: AnalyticsConsent): void {
  if (typeof document === "undefined") return;

  const existing = document.getElementById(TRUSTEDSITE_SCRIPT_ID);
  if (consent !== "granted") {
    if (existing) {
      existing.remove();
      // The vendor can leave a floating widget and running code after its script loads.
      // Reloading clears that runtime without making another vendor request.
      window.location.reload();
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

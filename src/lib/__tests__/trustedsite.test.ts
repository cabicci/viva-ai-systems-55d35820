import { afterEach, describe, expect, it } from "vitest";
import { applyTrustedSiteConsent } from "@/lib/trustedsite";

const scriptSelector = 'script[src="https://cdn.ywxi.net/js/1.js"]';

afterEach(() => {
  document.querySelector(scriptSelector)?.remove();
});

describe("TrustedSite consent", () => {
  it("does not request the tracking script before consent or after a decline", () => {
    applyTrustedSiteConsent(null);
    applyTrustedSiteConsent("denied");
    expect(document.querySelector(scriptSelector)).toBeNull();
  });

  it("loads the official script once after consent, even across route changes", () => {
    applyTrustedSiteConsent("granted");
    applyTrustedSiteConsent("granted");

    const scripts = document.querySelectorAll<HTMLScriptElement>(scriptSelector);
    expect(scripts).toHaveLength(1);
    expect(scripts[0].async).toBe(true);
    expect(scripts[0].parentElement).toBe(document.body);
  });
});

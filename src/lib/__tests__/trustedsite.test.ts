import { afterEach, describe, expect, it, vi } from "vitest";
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

  it("opens the destination page, not the previous one, when a sensitive page clears the script", () => {
    applyTrustedSiteConsent("granted");
    const assign = vi.fn();
    const reload = vi.fn();
    const original = window.location;
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { pathname: "/", search: "", hash: "", assign, reload },
    });
    try {
      applyTrustedSiteConsent("denied", "/login?returnTo=%2Fmy-learning");
    } finally {
      Object.defineProperty(window, "location", { configurable: true, value: original });
    }
    expect(assign).toHaveBeenCalledWith("/login?returnTo=%2Fmy-learning");
    expect(reload).not.toHaveBeenCalled();
    expect(document.querySelector(scriptSelector)).toBeNull();
  });
});

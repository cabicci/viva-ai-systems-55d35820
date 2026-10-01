import { beforeEach, describe, expect, it } from "vitest";
import {
  applyAnalyticsConsent,
  resetAnalyticsRuntimeForTests,
  trackAcceptedContactOnce,
  trackPageViewOnce,
} from "../analytics";

const events = () =>
  (window as unknown as { dataLayer: Record<string, unknown>[] }).dataLayer.filter(
    (entry) => entry.event === "masaarat_generate_lead" || entry.event === "masaarat_view_pricing",
  );

beforeEach(() => resetAnalyticsRuntimeForTests());

describe("nonfinancial marketing conversions", () => {
  it("requires consent and an accepted submission, and does not replay denied submissions", () => {
    const key = {};
    applyAnalyticsConsent("denied");
    expect(trackAcceptedContactOnce({ success: true }, key)).toBe(false);
    applyAnalyticsConsent("granted");
    expect(events()).toEqual([]);
    expect(trackAcceptedContactOnce({ success: false }, key)).toBe(false);
    expect(events()).toEqual([]);
    expect(trackAcceptedContactOnce({ success: true }, key)).toBe(true);
    expect(trackAcceptedContactOnce({ success: true }, key)).toBe(false);
    expect(events()).toEqual([{ event: "masaarat_generate_lead", form_id: "contact" }]);
  });

  it("excludes all submitted personal data and blocks further leads after withdrawal", () => {
    applyAnalyticsConsent("granted");
    trackAcceptedContactOnce(
      { success: true, email: "private@example.test" } as { success: boolean },
      {},
    );
    expect(JSON.stringify(events())).not.toContain("private");
    const pixel = (window as unknown as { fbq: { queue: unknown[][] } }).fbq;
    expect(pixel.queue.filter((args) => args[1] === "Lead")).toHaveLength(1);
    applyAnalyticsConsent("denied");
    expect(trackAcceptedContactOnce({ success: true }, {})).toBe(false);
    expect(pixel.queue.filter((args) => args[1] === "Lead")).toHaveLength(0);
    applyAnalyticsConsent("granted");
    expect(events()).toHaveLength(1);
  });

  it("counts pricing views once per accepted navigation, including a later return", () => {
    applyAnalyticsConsent(null);
    expect(trackPageViewOnce("/pricing")).toBe(false);
    applyAnalyticsConsent("granted");
    trackPageViewOnce("/pricing?locale=en");
    trackPageViewOnce("/pricing?locale=en");
    trackPageViewOnce("/contact");
    trackPageViewOnce("/pricing?locale=en");
    expect(events()).toEqual([
      { event: "masaarat_view_pricing" },
      { event: "masaarat_view_pricing" },
    ]);
  });

  it("keeps an accepted contact successful if a loaded vendor throws", () => {
    applyAnalyticsConsent("granted");
    const win = window as unknown as { fbq: () => void };
    win.fbq = () => {
      throw new Error("vendor unavailable");
    };
    expect(() => trackAcceptedContactOnce({ success: true }, {})).not.toThrow();
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ANALYTICS_CONSENT_STORAGE_KEY,
  applyAnalyticsConsent,
  isSensitiveAnalyticsUrl,
  resetAnalyticsRuntimeForTests,
} from "../analytics";
import {
  clearPendingRegistration,
  completePendingRegistration,
  rememberPendingRegistration,
} from "../registration-analytics";
import { TIKTOK_PIXEL_ID } from "../tiktok-pixel";

const NOW = Date.parse("2026-10-25T12:00:00Z");
const user = {
  id: "new-user",
  identities: [{ provider: "email" }],
  email_confirmed_at: null as string | null,
};
const confirmed = { ...user, email_confirmed_at: "2026-10-25T12:01:00Z" };
const layer = () =>
  (window as unknown as { dataLayer: Record<string, unknown>[] }).dataLayer.filter(
    (x) => x.event === "masaarat_sign_up",
  );
const pixel = () => (window as unknown as { fbq: { queue: unknown[][] } }).fbq.queue;
const tiktok = () => (window as unknown as { ttq: unknown[][] }).ttq;
function consent(value: "granted" | "denied") {
  localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, value);
  applyAnalyticsConsent(value);
}
beforeEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
  resetAnalyticsRuntimeForTests();
});

describe("confirmed registration measurement", () => {
  it("does not count a successful signup request, unconfirmed account or a different signed-in account", () => {
    consent("granted");
    expect(rememberPendingRegistration(user, NOW)).toBe(true);
    expect(layer()).toEqual([]);
    expect(completePendingRegistration(user, NOW + 1000)).toBe(false);
    expect(completePendingRegistration({ ...confirmed, id: "existing-user" }, NOW + 1000)).toBe(
      false,
    );
    expect(layer()).toEqual([]);
    expect(completePendingRegistration(confirmed, NOW + 60000)).toBe(true);
    expect(completePendingRegistration(confirmed, NOW + 120000)).toBe(false);
    expect(layer()).toEqual([{ event: "masaarat_sign_up", method: "email" }]);
    expect(pixel().filter((x) => x[1] === "CompleteRegistration")).toHaveLength(1);
    expect(tiktok().filter((x) => x[1] === "CompleteRegistration")).toHaveLength(1);
  });

  it("does not mistake an existing-account anti-enumeration response or ordinary login for a signup", () => {
    consent("granted");
    expect(rememberPendingRegistration({ ...user, identities: [] }, NOW)).toBe(false);
    expect(rememberPendingRegistration({ ...user, identities: undefined }, NOW)).toBe(false);
    expect(completePendingRegistration(confirmed, NOW + 60000)).toBe(false);
    expect(layer()).toEqual([]);
  });

  it("creates no marketing marker without consent and never replays a denied completion", () => {
    consent("denied");
    expect(rememberPendingRegistration(user, NOW)).toBe(false);
    consent("granted");
    rememberPendingRegistration(user, NOW);
    consent("denied");
    expect(completePendingRegistration(confirmed, NOW + 60000)).toBe(false);
    consent("granted");
    expect(completePendingRegistration(confirmed, NOW + 60000)).toBe(false);
    expect(layer()).toEqual([]);
  });

  it("clears withdrawn, expired, future-dated or corrupt pending data without producing a conversion", () => {
    consent("granted");
    rememberPendingRegistration(user, NOW);
    clearPendingRegistration();
    expect(completePendingRegistration(confirmed, NOW + 60000)).toBe(false);
    rememberPendingRegistration(user, NOW);
    expect(completePendingRegistration(confirmed, NOW + 86400001)).toBe(false);
    rememberPendingRegistration(user, NOW);
    expect(completePendingRegistration(confirmed, NOW - 1)).toBe(false);
    localStorage.setItem("masaarat.pending-registration-analytics.v1", "not-json");
    expect(() => completePendingRegistration(confirmed, NOW)).not.toThrow();
    expect(layer()).toEqual([]);
  });

  it("does not transmit name, email, user id or profile data to any event", () => {
    consent("granted");
    const privateUser = {
      ...user,
      email: "private@example.test",
      user_metadata: { full_name: "Private Person" },
    };
    rememberPendingRegistration(privateUser, NOW);
    completePendingRegistration(
      { ...privateUser, email_confirmed_at: confirmed.email_confirmed_at },
      NOW + 60000,
    );
    const payload = JSON.stringify([layer(), pixel(), tiktok()]);
    expect(payload).not.toMatch(/private@example|Private Person|new-user/);
  });

  it("keeps authentication safe when browser storage or a vendor fails", () => {
    consent("granted");
    rememberPendingRegistration(user, NOW);
    (window as unknown as { fbq: () => void }).fbq = () => {
      throw new Error("vendor down");
    };
    expect(completePendingRegistration(confirmed, NOW + 60000)).toBe(true);
    expect(layer()).toHaveLength(1);
    expect(completePendingRegistration(confirmed, NOW + 60000)).toBe(false);
    const spy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage blocked");
    });
    expect(rememberPendingRegistration(user, NOW)).toBe(false);
    expect(() => completePendingRegistration(confirmed, NOW)).not.toThrow();
    spy.mockRestore();
  });
});

describe("auth URL privacy", () => {
  it.each([
    "/signup",
    "/login?returnTo=%2Fai",
    "/reset-password",
    "/?code=secret",
    "/?email=private%40example.test",
    "/#access_token=secret",
    "/?utm_campaign=private%40example.test",
  ])("suppresses third-party trackers at %s", (href) => {
    expect(isSensitiveAnalyticsUrl(href)).toBe(true);
  });
  it.each([
    "/",
    "/ai",
    "/?locale=ar-Gulf&utm_source=google&utm_campaign=ai_sa",
    "/?gclid=nonsecret-click-id",
  ])("allows consented campaign navigation at %s", (href) => {
    expect(isSensitiveAnalyticsUrl(href)).toBe(false);
  });
});

describe("existing TikTok pixel lifecycle", () => {
  it("loads only after a grant, holds before load, and uses the existing pixel", () => {
    consent("denied");
    expect(document.querySelector('script[src*="analytics.tiktok.com"]')).toBeNull();
    consent("granted");
    const script = document.querySelector<HTMLScriptElement>(
      'script[src*="analytics.tiktok.com"]',
    )!;
    expect(new URL(script.src).searchParams.get("sdkid")).toBe(TIKTOK_PIXEL_ID);
    expect(tiktok().map((x) => x[0])).toEqual(["holdConsent", "grantConsent"]);
    consent("granted");
    expect(document.querySelectorAll('script[src*="analytics.tiktok.com"]')).toHaveLength(1);
  });
  it("drops pending events on withdrawal and cannot replay a registration after re-grant", () => {
    consent("granted");
    rememberPendingRegistration(user, NOW);
    completePendingRegistration(confirmed, NOW + 60000);
    expect(tiktok().filter((x) => x[0] === "track")).toHaveLength(1);
    consent("denied");
    expect(tiktok().filter((x) => x[0] === "track")).toHaveLength(0);
    expect(tiktok().at(-1)).toEqual(["revokeConsent"]);
    consent("granted");
    expect(completePendingRegistration(confirmed, NOW + 60000)).toBe(false);
    expect(tiktok().filter((x) => x[0] === "track")).toHaveLength(0);
  });
});

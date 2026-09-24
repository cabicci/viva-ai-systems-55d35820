import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  GTM_CONTAINER_ID,
  GA4_MEASUREMENT_ID,
  META_PIXEL_ID,
  applyAnalyticsConsent,
  resetAnalyticsRuntimeForTests,
  trackPageViewOnce,
} from "@/lib/analytics";
import { ANALYTICS_CONSENT_COPY } from "@/lib/analytics-consent-copy";
import { SUPPORTED_LOCALES } from "@/lib/locale/types";
import { PUBLIC_SITEMAP_PATHS, ROUTE_CATALOG } from "@/lib/seo/route-catalog";

const repoRoot = process.cwd();

function filesBelow(path: string): string[] {
  return readdirSync(path).flatMap((name) => {
    const child = join(path, name);
    return statSync(child).isDirectory() ? filesBelow(child) : [child];
  });
}

function sourceLiteralCount(literal: string): number {
  return filesBelow(join(repoRoot, "src"))
    .filter((path) => /\.(ts|tsx)$/.test(path))
    .map((path) => readFileSync(path, "utf8"))
    .reduce((total, text) => total + text.split(literal).length - 1, 0);
}
function dataLayerEvents(name: string) {
  const dataLayer =
    (window as unknown as Window & { dataLayer?: Array<Record<string, unknown>> }).dataLayer ?? [];
  return dataLayer.filter((entry) => entry.event === name);
}

function metaPageViews(): unknown[][] {
  const fbq = (
    window as unknown as Window & {
      fbq?: { queue?: unknown[][] };
    }
  ).fbq;
  return (fbq?.queue ?? []).filter((args) => args[0] === "track" && args[1] === "PageView");
}

function disallowRules(): string[] {
  return readFileSync(join(repoRoot, "public", "robots.txt"), "utf8")
    .split(/\r?\n/)
    .filter((line) => line.startsWith("Disallow: "))
    .map((line) => line.slice("Disallow: ".length));
}

function isDisallowed(path: string, rules: string[]): boolean {
  return rules.some((rule) => path.startsWith(rule));
}

beforeEach(() => {
  localStorage.clear();
  resetAnalyticsRuntimeForTests();
  document.title = "Masaarat test";
  window.history.replaceState({}, "", "/");
});
afterEach(() => vi.restoreAllMocks());
describe("marketing identifier ownership", () => {
  it("defines each GTM and Meta identifier once in application source", () => {
    expect(sourceLiteralCount(GTM_CONTAINER_ID)).toBe(1);
    expect(sourceLiteralCount(META_PIXEL_ID)).toBe(1);
    expect(sourceLiteralCount(GA4_MEASUREMENT_ID)).toBe(1);
  });

  it("injects one GTM and one Meta script after repeated grants", () => {
    applyAnalyticsConsent("granted");
    applyAnalyticsConsent("granted");

    expect(
      document.querySelectorAll('script[src*="googletagmanager.com/gtm.js?id="]'),
    ).toHaveLength(1);
    expect(
      document.querySelectorAll('script[src*="connect.facebook.net/en_US/fbevents.js"]'),
    ).toHaveLength(1);
  });
});

describe("consent-gated SPA page views", () => {
  it("sets denied Google consent before tracker loading, then updates before page events", () => {
    const append = vi.spyOn(document.head, "appendChild");
    applyAnalyticsConsent(null);
    expect(append).not.toHaveBeenCalled();
    const win = window as unknown as Window & {
      dataLayer: Array<Record<string, unknown> | IArguments>;
    };
    const messages = () => win.dataLayer;
    const commands = () =>
      messages()
        .filter((entry) => "0" in entry)
        .map((entry) => Array.from(entry as IArguments));
    expect(commands()[0]).toEqual([
      "consent",
      "default",
      {
        analytics_storage: "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
      },
    ]);
    applyAnalyticsConsent("granted");
    trackPageViewOnce("/");
    const grantedIndex = messages().findIndex(
      (entry) =>
        "0" in entry &&
        (entry as IArguments)[1] === "update" &&
        ((entry as IArguments)[2] as Record<string, string>).analytics_storage === "granted",
    );
    const gtmIndex = messages().findIndex((entry) => "event" in entry && entry.event === "gtm.js");
    const pageIndex = messages().findIndex(
      (entry) => "event" in entry && entry.event === "masaarat_page_view",
    );
    expect(grantedIndex).toBeGreaterThan(0);
    expect(gtmIndex).toBeGreaterThan(grantedIndex);
    expect(pageIndex).toBeGreaterThan(gtmIndex);
    expect(commands().filter((entry) => entry[1] === "default")).toHaveLength(1);
  });

  it("normalizes relative SPA URLs before deduplication and keeps return visits", () => {
    applyAnalyticsConsent("granted");
    expect(trackPageViewOnce("/contact?locale=en")).toBe(true);
    expect(trackPageViewOnce(new URL("/contact?locale=en", window.location.origin).href)).toBe(
      false,
    );
    applyAnalyticsConsent("granted");
    expect(trackPageViewOnce("/contact?locale=en")).toBe(false);
    expect(trackPageViewOnce("/pricing")).toBe(true);
    expect(trackPageViewOnce("/contact?locale=en")).toBe(true);
    expect(dataLayerEvents("masaarat_page_view")).toHaveLength(3);
    expect(dataLayerEvents("masaarat_consent_update")).toHaveLength(1);
  });

  it("disables the already-loaded Google tag and revokes Meta on withdrawal", () => {
    const win = window as unknown as Window & {
      [key: `ga-disable-${string}`]: boolean;
      gtag: (...args: unknown[]) => void;
      fbq: { queue: unknown[][] };
    };
    applyAnalyticsConsent("granted");
    expect(win[`ga-disable-${GA4_MEASUREMENT_ID}`]).toBe(false);
    const previousGtag = win.gtag;
    const disableAtUpdate: boolean[] = [];
    win.gtag = (...args) => {
      disableAtUpdate.push(win[`ga-disable-${GA4_MEASUREMENT_ID}`]);
      previousGtag(...args);
    };
    applyAnalyticsConsent("denied");
    expect(disableAtUpdate).toEqual([true]);
    expect(win.fbq.queue.at(-1)).toEqual(["consent", "revoke"]);
    expect(trackPageViewOnce("/contact")).toBe(false);
  });

  it("does not bootstrap trackers twice after withdrawal and re-grant", () => {
    const append = vi.spyOn(document.head, "appendChild");
    applyAnalyticsConsent("granted");
    trackPageViewOnce("/");
    applyAnalyticsConsent("denied");
    applyAnalyticsConsent("granted");
    expect(trackPageViewOnce("/")).toBe(true);
    expect(trackPageViewOnce("/")).toBe(false);
    expect(append).toHaveBeenCalledTimes(2);
    expect(dataLayerEvents("gtm.js")).toHaveLength(1);
    const queue = (window as unknown as Window & { fbq: { queue: unknown[][] } }).fbq.queue;
    expect(queue.filter((args) => args[0] === "init")).toHaveLength(1);
  });

  it("does not load trackers on a fresh denied session", () => {
    applyAnalyticsConsent("denied");
    expect(document.getElementById("masaarat-gtm-script")).toBeNull();
    expect(document.getElementById("masaarat-meta-pixel-script")).toBeNull();
    expect(trackPageViewOnce("/pricing")).toBe(false);
    expect(
      (window as unknown as Window & { [key: `ga-disable-${string}`]: boolean })[
        `ga-disable-${GA4_MEASUREMENT_ID}`
      ],
    ).toBe(true);
  });

  it("retries failed SDK loads on re-grant without duplicating initialization", () => {
    applyAnalyticsConsent("granted");
    const firstGtm = document.getElementById("masaarat-gtm-script")!;
    const firstMeta = document.getElementById("masaarat-meta-pixel-script")!;
    firstGtm.dispatchEvent(new Event("error"));
    firstMeta.dispatchEvent(new Event("error"));
    applyAnalyticsConsent("denied");
    applyAnalyticsConsent("granted");
    expect(document.getElementById("masaarat-gtm-script")).not.toBe(firstGtm);
    expect(document.getElementById("masaarat-meta-pixel-script")).not.toBe(firstMeta);
    expect(document.getElementById("masaarat-gtm-script")).not.toBeNull();
    expect(document.getElementById("masaarat-meta-pixel-script")).not.toBeNull();
    expect(dataLayerEvents("gtm.js")).toHaveLength(1);
    const queue = (window as unknown as Window & { fbq: { queue: unknown[][] } }).fbq.queue;
    expect(queue.filter((args) => args[0] === "init")).toHaveLength(1);
  });

  it("drops queued Meta page views when withdrawal precedes SDK loading", () => {
    applyAnalyticsConsent("granted");
    trackPageViewOnce("/");
    expect(metaPageViews()).toHaveLength(1);
    applyAnalyticsConsent("denied");
    expect(metaPageViews()).toHaveLength(0);
    applyAnalyticsConsent("granted");
    trackPageViewOnce("/contact");
    expect(metaPageViews()).toHaveLength(1);
  });

  it("does not load trackers or emit a page view before consent", () => {
    expect(trackPageViewOnce("https://masaarat.ai/")).toBe(false);
    expect(document.querySelector('script[src*="googletagmanager.com/gtm.js?id="]')).toBeNull();
    expect(dataLayerEvents("masaarat_page_view")).toHaveLength(0);
    expect(metaPageViews()).toHaveLength(0);
  });
  it("emits one page view per initial load or distinct SPA URL", () => {
    applyAnalyticsConsent("granted");

    expect(trackPageViewOnce("https://masaarat.ai/")).toBe(true);
    expect(trackPageViewOnce("https://masaarat.ai/")).toBe(false);
    expect(trackPageViewOnce("https://masaarat.ai/pricing")).toBe(true);
    expect(trackPageViewOnce("https://masaarat.ai/pricing")).toBe(false);

    expect(dataLayerEvents("masaarat_page_view")).toHaveLength(2);
    expect(metaPageViews()).toHaveLength(2);
  });

  it("stops page views and removes injected scripts after withdrawal", () => {
    applyAnalyticsConsent("granted");
    expect(trackPageViewOnce("https://masaarat.ai/")).toBe(true);

    applyAnalyticsConsent("denied");

    expect(trackPageViewOnce("https://masaarat.ai/pricing")).toBe(false);
    expect(dataLayerEvents("masaarat_page_view")).toHaveLength(1);
    expect(document.getElementById("masaarat-gtm-script")).toBeNull();
    expect(document.getElementById("masaarat-meta-pixel-script")).toBeNull();
  });
});

describe("route classification and crawler files", () => {
  it("classifies every application route source", () => {
    const actual = readdirSync(join(repoRoot, "src", "routes"))
      .filter((name) => name.endsWith(".tsx") && name !== "__root.tsx")
      .sort();
    const classified = ROUTE_CATALOG.map((route) => route.source).sort();

    expect(classified).toEqual(actual);
  });
  it("keeps private and utility routes out of robots indexing", () => {
    const rules = disallowRules();
    for (const route of ROUTE_CATALOG) {
      if (route.visibility === "public") {
        expect(isDisallowed(route.pattern, rules)).toBe(false);
      } else {
        expect(route.robotsPath).toBeTruthy();
        expect(rules).toContain(route.robotsPath);
      }
    }

    expect(isDisallowed("/roadmap", rules)).toBe(true);
    expect(isDisallowed("/roadmap/", rules)).toBe(true);
    expect(isDisallowed("/image-gallery", rules)).toBe(true);
    expect(isDisallowed("/image-gallery/", rules)).toBe(true);
    expect(isDisallowed("/learn/builder/lesson-1", rules)).toBe(true);
    expect(isDisallowed("/kids", rules)).toBe(false);
    expect(isDisallowed("/kids/l1", rules)).toBe(true);
    expect(isDisallowed("/kids/l1/2", rules)).toBe(true);
    expect(ROUTE_CATALOG.find((route) => route.source === "kids.$levelId.tsx")?.visibility).toBe(
      "utility",
    );
    expect(
      ROUTE_CATALOG.find((route) => route.source === "kids.$levelId.$lessonNumber.tsx")?.visibility,
    ).toBe("private");
  });

  it("ships valid sitemap XML with public routes only", () => {
    const xml = readFileSync(join(repoRoot, "public", "sitemap.xml"), "utf8");
    const parsed = new DOMParser().parseFromString(xml, "application/xml");
    expect(parsed.querySelector("parsererror")).toBeNull();

    const locations = Array.from(parsed.getElementsByTagName("loc")).map(
      (node) => node.textContent,
    );
    const expected = PUBLIC_SITEMAP_PATHS.map((path) =>
      path === "/" ? "https://masaarat.ai/" : "https://masaarat.ai" + path,
    );
    expect(locations).toEqual(expected);
  });
});

describe("analytics consent localization", () => {
  it("covers every supported locale with distinct language copy", () => {
    expect(Object.keys(ANALYTICS_CONSENT_COPY).sort()).toEqual([...SUPPORTED_LOCALES].sort());
    expect(ANALYTICS_CONSENT_COPY["ar-EG"].description).toContain("مش هنشغّل");
    expect(ANALYTICS_CONSENT_COPY["ar-MSA"].description).toContain("لن نشغّل");
    expect(ANALYTICS_CONSENT_COPY["ar-Gulf"].description).toContain("ما راح نشغّل");
    expect(ANALYTICS_CONSENT_COPY.en.description).toContain("We won't load");
  });
});

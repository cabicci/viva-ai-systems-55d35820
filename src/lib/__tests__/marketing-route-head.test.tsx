import { readFileSync } from "node:fs";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  HeadContent,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AnalyticsConsentGate } from "@/components/site/AnalyticsConsent";
import { ANALYTICS_CONSENT_STORAGE_KEY, resetAnalyticsRuntimeForTests } from "@/lib/analytics";
import { ANALYTICS_CONSENT_COPY } from "@/lib/analytics-consent-copy";
import { buildLocalizedPublicMeta } from "@/lib/locale/build-localized-public-meta";
import { buildLocalizedLearnerMeta } from "@/lib/locale/build-learner-route-meta";
import { SUPPORTED_LOCALES, type SupportedLocale } from "@/lib/locale/types";
import { PUBLIC_ROUTE_PATHS } from "@/lib/seo/public-route-identity";
import { PUBLIC_SITEMAP_PATHS } from "@/lib/seo/route-catalog";
import { SITE_STRUCTURED_DATA } from "@/lib/seo/site-structured-data";

vi.mock("@/lib/locale/locale-context", () => ({
  useLocale: () => ({ locale: "en", dir: "ltr", lang: "en" }),
}));
vi.mock("@/lib/trustedsite", () => ({ applyTrustedSiteConsent: vi.fn() }));

type PublicKind = keyof typeof PUBLIC_ROUTE_PATHS;
const publicHead = (locale: SupportedLocale, kind: PublicKind) =>
  kind === "curriculum"
    ? buildLocalizedLearnerMeta(locale, kind)
    : buildLocalizedPublicMeta(locale, kind);

beforeEach(() => vi.spyOn(window, "scrollTo").mockImplementation(() => {}));
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("settled localized page-view metadata", () => {
  beforeEach(() => {
    localStorage.clear();
    resetAnalyticsRuntimeForTests();
    localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, "granted");
  });
  afterEach(() => resetAnalyticsRuntimeForTests());

  function pageViews() {
    const dataLayer = (window as unknown as { dataLayer?: Record<string, unknown>[] }).dataLayer;
    return (dataLayer ?? []).filter((entry) => entry.event === "masaarat_page_view");
  }

  async function mountRouter() {
    let releaseHead: (() => void) | undefined;
    let pendingHead: Promise<void> | undefined;
    const root = createRootRoute({
      head: () => ({ meta: [{ title: "Root fallback" }] }),
      component: () => (
        <>
          <HeadContent />
          <Outlet />
          <AnalyticsConsentGate />
        </>
      ),
    });
    const curriculum = createRoute({
      getParentRoute: () => root,
      path: "/curriculum",
      validateSearch: (search: Record<string, unknown>) => ({
        locale: search.locale === "en" ? ("en" as const) : ("ar-MSA" as const),
      }),
      head: async ({ match }) => {
        await pendingHead;
        return buildLocalizedLearnerMeta(match.search.locale, "curriculum");
      },
      component: () => <main>Curriculum</main>,
    });
    const router = createRouter({
      routeTree: root.addChildren([curriculum]),
      history: createMemoryHistory({ initialEntries: ["/curriculum?locale=ar-MSA"] }),
    });
    await router.load();
    render(<RouterProvider router={router} />);
    await waitFor(() => expect(pageViews()).toHaveLength(1));
    return {
      router,
      holdHead: () => {
        pendingHead = new Promise<void>((resolve) => {
          releaseHead = resolve;
        });
      },
      releaseHead: () => {
        releaseHead?.();
        pendingHead = undefined;
      },
    };
  }

  it("waits for asynchronous locale heads and emits one matching title per settled URL", async () => {
    const fixture = await mountRouter();
    expect(pageViews()[0].page_title).toBe("خريطة المنهج — مسارات");
    for (const [locale, title] of [
      ["en", "Curriculum map — masaarat"],
      ["ar-MSA", "خريطة المنهج — مسارات"],
    ] as const) {
      const count = pageViews().length;
      fixture.holdHead();
      let navigation!: Promise<void>;
      act(() => {
        navigation = fixture.router.navigate({ to: "/curriculum", search: { locale } });
      });
      await waitFor(() => expect(fixture.router.state.isLoading).toBe(true));
      expect(pageViews()).toHaveLength(count);
      await act(async () => {
        fixture.releaseHead();
        await navigation;
      });
      await waitFor(() => expect(pageViews()).toHaveLength(count + 1));
      expect(pageViews().at(-1)).toMatchObject({
        page_location: `${window.location.origin}/curriculum?locale=${locale}`,
        page_path: `/curriculum?locale=${locale}`,
        page_title: title,
      });
      expect(document.title).toBe(title);
    }
    await act(() => fixture.router.invalidate());
    expect(pageViews()).toHaveLength(3);
  });

  it("does not emit the destination if consent is withdrawn while its head is pending", async () => {
    const fixture = await mountRouter();
    fixture.holdHead();
    let navigation!: Promise<void>;
    act(() => {
      navigation = fixture.router.navigate({ to: "/curriculum", search: { locale: "en" } });
    });
    await waitFor(() => expect(fixture.router.state.isLoading).toBe(true));
    const copy = ANALYTICS_CONSENT_COPY.en;
    fireEvent.click(screen.getByRole("button", { name: copy.settingsAria }));
    fireEvent.click(screen.getByRole("button", { name: copy.withdraw }));
    await act(async () => {
      fixture.releaseHead();
      await navigation;
    });
    expect(pageViews()).toHaveLength(1);
    expect(localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY)).toBe("denied");
  });
});

describe("public route identity", () => {
  it.each(SUPPORTED_LOCALES)(
    "keeps localized metadata and one sitemap-aligned identity for %s",
    (locale) => {
      expect(Object.values(PUBLIC_ROUTE_PATHS)).toEqual(PUBLIC_SITEMAP_PATHS);
      for (const [kind, path] of Object.entries(PUBLIC_ROUTE_PATHS)) {
        const head = publicHead(locale, kind as PublicKind);
        expect(head.links).toEqual([{ rel: "canonical", href: `https://masaarat.ai${path}` }]);
        expect(head.meta.filter((tag) => "property" in tag && tag.property === "og:url")).toEqual([
          { property: "og:url", content: `https://masaarat.ai${path}` },
        ]);
        expect(head.meta.find((tag) => "title" in tag)).toBeTruthy();
        expect(head.meta.find((tag) => "name" in tag && tag.name === "description")).toBeTruthy();
      }
    },
  );

  it("does not inherit a homepage identity from the root or utility metadata", () => {
    for (const kind of ["root", "login"] as const) {
      const head = buildLocalizedPublicMeta("en", kind);
      expect(head.links).toBeUndefined();
      expect(head.meta.some((tag) => "property" in tag && tag.property === "og:url")).toBe(false);
    }
    const root = readFileSync("src/routes/__root.tsx", "utf8");
    expect(root).not.toMatch(/rel: ["']canonical["']|property: ["']og:url["']/);
  });

  it("replaces canonical and og:url during real router SPA navigation", async () => {
    const root = createRootRoute({
      component: () => (
        <>
          <HeadContent />
          <Outlet />
        </>
      ),
    });
    const routes = Object.entries(PUBLIC_ROUTE_PATHS).map(([kind, path]) =>
      createRoute({
        getParentRoute: () => root,
        path,
        head: () => publicHead("en", kind as PublicKind),
        component: () => <main>Public route</main>,
      }),
    );
    const router = createRouter({
      routeTree: root.addChildren(routes),
      history: createMemoryHistory({ initialEntries: ["/?locale=en&utm_source=test#start"] }),
    });
    await router.load();
    render(<RouterProvider router={router} />);
    for (const path of ["/", "/contact", "/pricing", "/curriculum", "/privacy", "/terms", "/"]) {
      await act(() => router.navigate({ to: `${path}?locale=ar-MSA&utm_source=test#section` }));
      await waitFor(() => {
        expect(document.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
        expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute(
          "href",
          `https://masaarat.ai${path}`,
        );
        expect(document.querySelectorAll('meta[property="og:url"]')).toHaveLength(1);
        expect(document.querySelector('meta[property="og:url"]')).toHaveAttribute(
          "content",
          `https://masaarat.ai${path}`,
        );
      });
    }
  });
});

describe("truthful course structured data", () => {
  it("keeps five paths, reserves Builder for Pro Plus and makes no certificate claim", () => {
    const graph = JSON.parse(JSON.stringify(SITE_STRUCTURED_DATA))["@graph"] as Array<
      Record<string, unknown>
    >;
    const paths = graph.find((entry) => entry["@type"] === "ItemList")!;
    const courses = paths.itemListElement as Array<{
      position: number;
      offers: { category: string };
    }>;
    expect(paths.numberOfItems).toBe(5);
    expect(courses).toHaveLength(5);
    expect(courses.find((entry) => entry.position === 1)!.offers.category).toBe("Pro Plus");
    expect(
      courses.filter((entry) => entry.position !== 1).map((entry) => entry.offers.category),
    ).toEqual(["Pro", "Pro", "Pro", "Pro"]);
    expect(JSON.stringify(graph)).not.toMatch(
      /educationalCredentialAwarded|Certificate of Completion/,
    );
  });
});

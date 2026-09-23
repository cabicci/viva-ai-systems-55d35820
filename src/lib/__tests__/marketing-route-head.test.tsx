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
import { act, cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { buildLocalizedPublicMeta } from "@/lib/locale/build-localized-public-meta";
import { buildLocalizedLearnerMeta } from "@/lib/locale/build-learner-route-meta";
import { SUPPORTED_LOCALES, type SupportedLocale } from "@/lib/locale/types";
import { PUBLIC_ROUTE_PATHS } from "@/lib/seo/public-route-identity";
import { PUBLIC_SITEMAP_PATHS } from "@/lib/seo/route-catalog";
import { SITE_STRUCTURED_DATA } from "@/lib/seo/site-structured-data";

type PublicKind = keyof typeof PUBLIC_ROUTE_PATHS;
const publicHead = (locale: SupportedLocale, kind: PublicKind) =>
  kind === "curriculum"
    ? buildLocalizedLearnerMeta(locale, kind)
    : buildLocalizedPublicMeta(locale, kind);

afterEach(cleanup);

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

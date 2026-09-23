import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Footer } from "@/components/site/Footer";
import { LocaleProvider } from "@/lib/locale/locale-context";
import { parseLocaleSearchParam } from "@/lib/locale/locale-search";
import { getUiString } from "@/lib/locale/ui-strings";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type SupportedLocale } from "@/lib/locale/types";

async function renderFooterAt(
  urlLocale: SupportedLocale,
  contextLocale: SupportedLocale = urlLocale,
) {
  const rootRoute = createRootRoute({
    validateSearch: (raw: Record<string, unknown>) => parseLocaleSearchParam(raw),
    component: () => (
      <LocaleProvider effectiveLocale={contextLocale}>
        <Footer />
      </LocaleProvider>
    ),
  });

  const routes = ["/", "/pricing", "/privacy", "/terms"].map((path) =>
    createRoute({
      getParentRoute: () => rootRoute,
      path,
      component: () => null,
    }),
  );
  const routeTree = rootRoute.addChildren(routes);
  const search = urlLocale === DEFAULT_LOCALE ? "" : `?locale=${urlLocale}`;
  const history = createMemoryHistory({ initialEntries: [`/${search}`] });
  const router = createRouter({ routeTree, history });

  await router.load();
  const rendered = render(<RouterProvider router={router} />);
  return { ...rendered, router };
}

function expectLocaleInHref(link: HTMLElement, locale: SupportedLocale) {
  const href = link.getAttribute("href");
  expect(href).toBeTruthy();
  const linkedUrl = new URL(href!, "https://masaarat.ai");
  expect(linkedUrl.searchParams.get("locale")).toBe(locale === DEFAULT_LOCALE ? null : locale);
}

describe("Footer locale navigation", () => {
  afterEach(() => cleanup());

  it("preserves each supported locale in the public footer links and exposes support", async () => {
    for (const locale of SUPPORTED_LOCALES) {
      const rendered = await renderFooterAt(locale);

      expectLocaleInHref(
        screen.getByRole("link", { name: getUiString(locale, "nav.pricing") }),
        locale,
      );
      expectLocaleInHref(
        screen.getByRole("link", { name: getUiString(locale, "footer.privacy") }),
        locale,
      );
      expectLocaleInHref(
        screen.getByRole("link", { name: getUiString(locale, "footer.terms") }),
        locale,
      );
      expect(screen.getByRole("link", { name: "support@masaarat.ai" })).toHaveAttribute(
        "href",
        "mailto:support@masaarat.ai",
      );
      expect(
        screen.getByRole("link", { name: getUiString(locale, "trust.trustedsite.verify") }),
      ).toHaveAttribute("href", "https://www.trustedsite.com/verify?host=masaarat.ai");

      rendered.unmount();
    }
  });

  it("uses the URL locale over a stale context locale during navigation", async () => {
    const { router } = await renderFooterAt("en", "ar-EG");

    fireEvent.click(
      screen.getByRole("link", {
        name: getUiString("ar-EG", "footer.privacy"),
      }),
    );

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/privacy");
      expect(router.state.location.search).toEqual({ locale: "en" });
    });
  });
});

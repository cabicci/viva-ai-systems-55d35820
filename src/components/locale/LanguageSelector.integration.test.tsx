import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { LanguageSelector } from "@/components/locale/LanguageSelector";
import {
  LOCALE_COOKIE_NAME,
  readLocaleCookie,
} from "@/lib/locale/locale-cookie";
import { LocaleRouterProvider } from "@/lib/locale/locale-router-provider";
import { parseLocaleSearchParam } from "@/lib/locale/locale-search";
import { DEFAULT_LOCALE } from "@/lib/locale/types";

vi.mock("@/lib/locale/feature-flags", () => ({
  localeRuntimeEnabled: true,
  localeUiEnabled: true,
  localizedLessonsEnabled: true,
  localizedVideosEnabled: false,
  localizedRagEnabled: false,
}));

async function renderSelectorAt(initialUrl = "/") {
  const rootRoute = createRootRoute({
    validateSearch: (raw: Record<string, unknown>) => parseLocaleSearchParam(raw),
  });

  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => (
      <LocaleRouterProvider initialLocale={DEFAULT_LOCALE}>
        <LanguageSelector />
      </LocaleRouterProvider>
    ),
  });

  const routeTree = rootRoute.addChildren([indexRoute]);
  const history = createMemoryHistory({ initialEntries: [initialUrl] });
  const router = createRouter({
    routeTree,
    history,
  });

  await router.load();
  render(<RouterProvider router={router} />);
  return router;
}

describe("LanguageSelector integration (Phase 9.4)", () => {
  afterEach(() => {
    document.cookie = `${LOCALE_COOKIE_NAME}=; Path=/; Max-Age=0`;
  });

  it("selecting English updates URL ?locale=en and writes masaarat_locale cookie", async () => {
    const router = await renderSelectorAt("/");

    const select = screen.getByRole("combobox");
    expect(select).toHaveValue(DEFAULT_LOCALE);

    fireEvent.change(select, { target: { value: "en" } });

    await waitFor(() => {
      expect(router.state.location.search).toEqual({ locale: "en" });
      expect(readLocaleCookie()).toBe("en");
    });

    expect(router.state.location.search).not.toHaveProperty("previewLocale");
    expect(select).toHaveValue("en");
  });

  it("selecting مصري (ar-EG) removes locale from URL and clears stale cookie", async () => {
    const router = await renderSelectorAt("/?locale=en");

    const select = screen.getByRole("combobox");
    expect(select).toHaveValue("en");
    expect(readLocaleCookie()).toBe("en");

    fireEvent.change(select, { target: { value: "ar-EG" } });

    await waitFor(() => {
      expect(router.state.location.search).toEqual({});
      expect(readLocaleCookie()).toBeUndefined();
    });

    expect(router.state.location.search).not.toHaveProperty("previewLocale");
    expect(select).toHaveValue("ar-EG");
  });
});

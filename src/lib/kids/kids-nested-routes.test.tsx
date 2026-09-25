import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Route as KidsLayout } from "@/routes/kids";
import { Route as KidsIndex } from "@/routes/kids.index";
import { Route as LevelLayout } from "@/routes/kids.$levelId";
import { Route as LevelIndex } from "@/routes/kids.$levelId.index";
import { Route as Lesson } from "@/routes/kids.$levelId.$lessonNumber";

const mock = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock("@/components/site/Navbar", () => ({ Navbar: () => null }));
vi.mock("@/components/site/Footer", () => ({ Footer: () => null }));
vi.mock("@/components/kids/KidsBrand", () => ({ KidsBrand: () => <div>Kids brand</div> }));
vi.mock("@/components/kids/KidsParentPanel", () => ({
  KidsParentPanel: () => <div>Parent access pending</div>,
}));
vi.mock("@/lib/kids/parent-state", () => ({
  useKidsParentState: () => ({ state: "checking", profiles: [], refresh: vi.fn() }),
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { functions: { invoke: mock.invoke } },
}));
vi.mock("@/lib/locale/locale-context", () => ({ useLocale: () => ({ locale: "en", dir: "ltr" }) }));
vi.mock("@/lib/locale/use-locale-link-search", () => ({
  useLocaleLinkSearch: () => () => ({ locale: "en" }),
}));
vi.mock("@/lib/locale/resolve-route-head-locale", () => ({
  resolveRouteHeadLocale: async () => "en",
}));

function mountKids(start = "/kids?locale=en") {
  const root = createRootRoute({ component: Outlet });
  const kids = KidsLayout.update({
    id: "/kids",
    path: "/kids",
    getParentRoute: () => root,
  } as unknown as Parameters<typeof KidsLayout.update>[0]);
  const kidsIndex = KidsIndex.update({
    id: "/",
    path: "/",
    getParentRoute: () => kids,
  } as unknown as Parameters<typeof KidsIndex.update>[0]);
  const level = LevelLayout.update({
    id: "/$levelId",
    path: "/$levelId",
    getParentRoute: () => kids,
  } as unknown as Parameters<typeof LevelLayout.update>[0]);
  const levelIndex = LevelIndex.update({
    id: "/",
    path: "/",
    getParentRoute: () => level,
  } as unknown as Parameters<typeof LevelIndex.update>[0]);
  const lesson = Lesson.update({
    id: "/$lessonNumber",
    path: "/$lessonNumber",
    getParentRoute: () => level,
  } as unknown as Parameters<typeof Lesson.update>[0]);
  const tree = root.addChildren([
    kids.addChildren([kidsIndex, level.addChildren([levelIndex, lesson])]),
  ]);
  const router = createRouter({
    routeTree: tree,
    history: createMemoryHistory({ initialEntries: [start] }),
  });
  return { router, view: render(<RouterProvider router={router} />) };
}

afterEach(() => {
  cleanup();
  mock.invoke.mockReset();
});

describe("Kids nested routes", () => {
  it("replaces the landing with the chosen level and then a locked lesson", async () => {
    const { router } = mountKids();
    expect(
      await screen.findByRole("heading", { level: 1, name: "Masaarat Kids" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("link", { name: "Explore Masaarat Kids" })[0]);
    expect(await screen.findByRole("heading", { level: 1, name: "Level 1" })).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { level: 1, name: "Masaarat Kids" }),
    ).not.toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/kids/level-1");
    fireEvent.click(screen.getAllByRole("link", { name: "View lesson status" })[0]);
    expect(await screen.findByRole("heading", { level: 1, name: "Lesson 1" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 1, name: "Level 1" })).not.toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/kids/level-1/1");
    expect(screen.getByText(/requires parent and content approvals/)).toBeInTheDocument();
    expect(mock.invoke).not.toHaveBeenCalled();
    await act(() => router.navigate({ to: "/kids", search: { locale: "en" } }));
    expect(
      await screen.findByRole("heading", { level: 1, name: "Masaarat Kids" }),
    ).toBeInTheDocument();
  });

  it("renders a directly opened lesson at a narrow viewport without fetching child data", async () => {
    const priorWidth = window.innerWidth;
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 375 });
    try {
      mountKids("/kids/level-1/1?locale=en");
      expect(
        await screen.findByRole("heading", { level: 1, name: "Lesson 1" }),
      ).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Back to level" })).toBeInTheDocument();
      expect(
        screen.queryByRole("heading", { level: 1, name: "Masaarat Kids" }),
      ).not.toBeInTheDocument();
      expect(mock.invoke).not.toHaveBeenCalled();
    } finally {
      Object.defineProperty(window, "innerWidth", { configurable: true, value: priorWidth });
    }
  });
});

import { fireEvent, render, screen, within, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Navbar } from "./Navbar";
import { LearningLineCards } from "./LearningLines";
import {
  getLineCopy,
  LEARNING_LINES,
  LINE_PRICING,
  LINE_ROUTES,
  LINE_CURRICULUM,
} from "@/lib/learning-lines";
import { SUPPORTED_LOCALES } from "@/lib/locale/types";
const state = vi.hoisted(() => ({
  path: "/",
  locale: "en" as "en" | "ar-EG" | "ar-MSA" | "ar-Gulf",
  user: null as null | { id: string },
  admin: false,
  signOut: vi.fn(),
}));
vi.mock("@tanstack/react-router", () => ({
  useRouterState: ({ select }: { select: (state: unknown) => unknown }) =>
    select({ location: { pathname: state.path } }),
  Link: ({
    to,
    search,
    children,
    ...props
  }: {
    to: string;
    search?: Record<string, unknown>;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a
      href={
        to + (search ? `?${new URLSearchParams(search as Record<string, string>).toString()}` : "")
      }
      {...props}
    >
      {children}
    </a>
  ),
}));
vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({ user: state.user, signOut: state.signOut }),
}));
vi.mock("@/lib/entitlements", () => ({ useEntitlement: () => ({ isAdmin: state.admin }) }));
vi.mock("@/lib/locale/locale-context", () => ({
  useLocale: () => ({ dir: state.locale === "en" ? "ltr" : "rtl", locale: state.locale }),
}));
vi.mock("@/lib/locale/use-locale-link-search", () => ({
  useLocaleLinkSearch: () => (base?: Record<string, unknown>) => ({
    ...base,
    locale: state.locale,
  }),
}));
vi.mock("@/lib/locale/use-ui-strings", () => ({ useUiString: () => (key: string) => key }));
vi.mock("@/components/locale/LanguageSelector", () => ({
  LanguageSelector: () => <span>Language</span>,
}));
afterEach(cleanup);
beforeEach(() => {
  state.path = "/";
  state.locale = "en";
  state.user = null;
  state.admin = false;
  state.signOut.mockClear();
});
describe("learning lines and shared account navigation", () => {
  it.each(SUPPORTED_LOCALES)("offers three complete clickable cards preserving %s", (locale) => {
    state.locale = locale;
    render(<LearningLineCards />);
    const c = getLineCopy(locale);
    const cards = within(screen.getByRole("region", { name: c.choose })).getAllByRole("link");
    expect(cards).toHaveLength(3);
    cards.forEach((card, index) => {
      const line = LEARNING_LINES[index];
      expect(card).toHaveAttribute("href", `${LINE_ROUTES[line]}?locale=${locale}`);
      expect(within(card).getByRole("heading")).toHaveTextContent(c[line]);
      expect(within(card).getByRole("img")).toHaveAttribute(
        "src",
        `/brand/masaarat-${line === "technical" ? "tech" : line}.png`,
      );
    });
  });
  it("keeps the public home header simple and uses unified registration", () => {
    render(<Navbar />);
    const header = screen.getByRole("banner");
    expect(header).toHaveClass("sticky", "top-0");
    const nav = within(header).getByRole("navigation");
    expect(
      within(nav)
        .getAllByRole("link")
        .map((x) => new URL(x.getAttribute("href")!, "https://test").pathname),
    ).toEqual(["/about", "/contact"]);
    expect(screen.getByRole("link", { name: "nav.signup" })).toHaveAttribute(
      "href",
      "/signup?returnTo=%2Fmy-learning&locale=en",
    );
  });
  it.each(LEARNING_LINES)(
    "keeps %s pricing scoped and all lines reachable before and after sign-in",
    (line) => {
      state.path = LINE_ROUTES[line];
      render(<Navbar />);
      const c = getLineCopy(state.locale);
      const desktop = screen.getByRole("navigation");
      expect(within(desktop).getByRole("link", { name: c.plans })).toHaveAttribute(
        "href",
        `${LINE_PRICING[line]}?locale=en`,
      );
      expect(within(desktop).getByRole("link", { name: c.paths })).toHaveAttribute(
        "href",
        `${LINE_CURRICULUM[line]}?locale=en`,
      );
      fireEvent.click(screen.getByRole("button", { name: c.switch }));
      const switcher = screen.getByRole("navigation", { name: c.switch });
      expect(within(switcher).getAllByRole("link")).toHaveLength(2);
      expect(within(switcher).queryByRole("link", { name: c[line] })).not.toBeInTheDocument();
      LEARNING_LINES.filter((item) => item !== line).forEach((item) =>
        expect(within(switcher).getByRole("link", { name: c[item] })).toHaveAttribute(
          "href",
          `${LINE_ROUTES[item]}?locale=en`,
        ),
      );
      cleanup();
      state.user = { id: "adult" };
      render(<Navbar variant="account" />);
      fireEvent.click(screen.getByRole("button", { name: c.switch }));
      expect(
        within(screen.getByRole("navigation", { name: c.switch })).getAllByRole("link"),
      ).toHaveLength(2);
      expect(
        within(screen.getByRole("navigation", { name: c.switch })).queryByRole("link", {
          name: c[line],
        }),
      ).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: c.switch }));
      fireEvent.click(screen.getByRole("button", { name: "nav.myDashboard" }));
      const menu = screen.getByRole("navigation", { name: "nav.myDashboard" });
      expect(within(menu).getByRole("link", { name: "sidebar.payments" })).toHaveAttribute(
        "href",
        "/payments?locale=en",
      );
      expect(within(menu).getByRole("link", { name: "sidebar.account" })).toHaveAttribute(
        "href",
        "/account?locale=en",
      );
      LEARNING_LINES.forEach((item) =>
        expect(within(menu).getByRole("link", { name: c[item] })).toBeInTheDocument(),
      );
      fireEvent.click(within(menu).getByRole("button", { name: "sidebar.signOut" }));
      expect(state.signOut).toHaveBeenCalledOnce();
    },
  );
  it.each(SUPPORTED_LOCALES)("shows only the other two lines on mobile in %s", (locale) => {
    state.locale = locale;
    const c = getLineCopy(locale);
    for (const line of LEARNING_LINES) {
      for (const user of [null, { id: "adult" }]) {
        state.path = LINE_CURRICULUM[line];
        state.user = user;
        render(<Navbar variant={user ? "account" : "public"} />);
        fireEvent.click(screen.getByRole("button", { name: "nav.menu" }));
        const switcher = within(screen.getByRole("dialog")).getByRole("region", { name: c.switch });
        expect(within(switcher).getAllByRole("link")).toHaveLength(2);
        expect(within(switcher).queryByRole("link", { name: c[line] })).not.toBeInTheDocument();
        LEARNING_LINES.filter((item) => item !== line).forEach((item) =>
          expect(within(switcher).getByRole("link", { name: c[item] })).toHaveAttribute(
            "href",
            `${LINE_ROUTES[item]}?locale=${locale}`,
          ),
        );
        cleanup();
      }
    }
  });
  it("exposes line switching and admin commerce inside the mobile menu", () => {
    state.path = "/kids/level-1/2";
    state.user = { id: "admin" };
    state.admin = true;
    render(<Navbar variant="account" />);
    fireEvent.click(screen.getByRole("button", { name: "nav.menu" }));
    const menu = screen.getByRole("dialog");
    expect(
      within(menu).getByRole("link", { name: getLineCopy("en").technical }),
    ).toBeInTheDocument();
    expect(within(menu).getByRole("link", { name: "sidebar.commerce" })).toHaveAttribute(
      "href",
      "/admin/commerce?locale=en",
    );
  });
});

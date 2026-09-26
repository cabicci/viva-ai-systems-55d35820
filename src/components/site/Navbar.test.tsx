import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Navbar } from "./Navbar";

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    children,
    ...props
  }: {
    to: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={to} {...Object.fromEntries(Object.entries(props).filter(([key]) => key !== "search"))}>
      {children}
    </a>
  ),
}));
vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({ user: { id: "adult" }, signOut: vi.fn() }),
}));
vi.mock("@/lib/entitlements", () => ({ useEntitlement: () => ({ isAdmin: false }) }));
vi.mock("@/lib/locale/locale-context", () => ({ useLocale: () => ({ dir: "rtl" }) }));
vi.mock("@/lib/locale/use-locale-link-search", () => ({ useLocaleLinkSearch: () => () => ({}) }));
vi.mock("@/lib/locale/use-ui-strings", () => ({ useUiString: () => (key: string) => key }));
vi.mock("@/components/locale/LanguageSelector", () => ({
  LanguageSelector: () => <span>Language</span>,
}));
vi.mock("@/components/kids/KidsBrand", () => ({ KidsBrand: () => <span>Kids</span> }));

describe("shared top navigation", () => {
  it("keeps the full menu across the sticky top bar from tablet width and Kids after Contact", () => {
    render(<Navbar />);
    const header = screen.getByRole("banner");
    expect(header).toHaveClass("sticky", "top-0");
    const desktop = within(header).getByRole("navigation");
    expect(desktop).toHaveClass("md:flex");
    expect(desktop).toHaveClass("flex-wrap");
    expect(screen.getByRole("button", { name: "nav.menu" })).toHaveClass("md:hidden");
    const desktopLinks = within(desktop)
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"));
    expect(desktopLinks.slice(-2)).toEqual(["/contact", "/kids"]);

    fireEvent.click(screen.getByRole("button", { name: "nav.menu" }));
    const mobileLinks = within(screen.getByRole("dialog"))
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"));
    expect(mobileLinks.indexOf("/kids")).toBe(mobileLinks.indexOf("/contact") + 1);
  });

  it("keeps account destinations reachable from the top bar", () => {
    render(<Navbar />);
    fireEvent.click(screen.getByRole("button", { name: "nav.myDashboard" }));
    const accountMenu = screen.getByRole("navigation", { name: "nav.myDashboard" });
    expect(within(accountMenu).getByRole("link", { name: "sidebar.dashboard" })).toHaveAttribute(
      "href",
      "/dashboard",
    );
    expect(within(accountMenu).getByRole("link", { name: "sidebar.analytics" })).toHaveAttribute(
      "href",
      "/analytics",
    );
    expect(within(accountMenu).getByRole("link", { name: "sidebar.account" })).toHaveAttribute(
      "href",
      "/account",
    );
  });
});

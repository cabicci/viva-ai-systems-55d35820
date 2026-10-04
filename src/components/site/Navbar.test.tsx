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
vi.mock("@/lib/locale/locale-context", () => ({
  useLocale: () => ({ dir: "rtl", locale: "ar-EG" }),
}));
vi.mock("@/lib/locale/use-locale-link-search", () => ({ useLocaleLinkSearch: () => () => ({}) }));
vi.mock("@/lib/locale/use-ui-strings", () => ({ useUiString: () => (key: string) => key }));
vi.mock("@/components/locale/LanguageSelector", () => ({
  LanguageSelector: () => <span>Language</span>,
}));
vi.mock("@/components/kids/KidsBrand", () => ({ KidsBrand: () => <span>Kids</span> }));

describe("shared top navigation", () => {
  it("keeps the public links in one sticky row with Kids after Contact", () => {
    render(<Navbar />);
    const header = screen.getByRole("banner");
    expect(header).toHaveClass("sticky", "top-0");
    const desktop = within(header).getByRole("navigation");
    expect(desktop).toHaveClass("whitespace-nowrap", "min-[1180px]:flex");
    expect(desktop).not.toHaveClass("flex-wrap");
    expect(screen.getByRole("button", { name: "nav.menu" })).toHaveClass("min-[1180px]:hidden");
    const desktopLinks = within(desktop)
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"));
    expect(desktopLinks.slice(-2)).toEqual(["/contact", "/kids?locale=ar-EG"]);

    fireEvent.click(screen.getByRole("button", { name: "nav.menu" }));
    const mobileLinks = within(screen.getByRole("dialog"))
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"));
    expect(mobileLinks.indexOf("/kids?locale=ar-EG")).toBe(mobileLinks.indexOf("/contact") + 1);
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

  it("replaces the public links with account links in the same header on account pages", () => {
    render(<Navbar variant="account" />);
    const header = screen.getByRole("banner");
    const accountNav = within(header).getByRole("navigation", { name: "nav.myDashboard" });
    expect(
      within(accountNav)
        .getAllByRole("link")
        .map((link) => link.getAttribute("href")),
    ).toEqual(["/dashboard", "/ai-assistant", "/analytics", "/account", "/kids?locale=ar-EG"]);
    expect(within(header).queryByRole("link", { name: "nav.contact" })).not.toBeInTheDocument();
    expect(within(accountNav).getByRole("link", { name: "Kids" })).toHaveAttribute(
      "href",
      "/kids?locale=ar-EG",
    );
    expect(within(header).getByRole("button", { name: "sidebar.signOut" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "nav.menu" }));
    expect(within(screen.getByRole("dialog")).getByRole("link", { name: "Kids" })).toHaveAttribute(
      "href",
      "/kids?locale=ar-EG",
    );
  });

  it("shows the temporary TECH brand immediately after KIDS only when opted in", () => {
    const { rerender } = render(<Navbar />);
    expect(screen.queryByRole("link", { name: "التعليم الفني" })).toBeNull();
    rerender(<Navbar showTechnicalPreview />);
    const desktop = screen.getByRole("navigation");
    const links = within(desktop).getAllByRole("link");
    expect(links.slice(-2).map((link) => link.getAttribute("href"))).toEqual([
      "/kids?locale=ar-EG",
      "/experiments/technical-education?locale=ar-EG",
    ]);
    expect(within(desktop).getByRole("link", { name: "التعليم الفني" })).toHaveTextContent("TECH");
    fireEvent.click(screen.getByRole("button", { name: "nav.menu" }));
    const mobile = within(screen.getByRole("dialog")).getAllByRole("link");
    const kids = mobile.findIndex((link) => link.getAttribute("href") === "/kids?locale=ar-EG");
    expect(mobile[kids + 1]).toHaveAttribute(
      "href",
      "/experiments/technical-education?locale=ar-EG",
    );
  });
});

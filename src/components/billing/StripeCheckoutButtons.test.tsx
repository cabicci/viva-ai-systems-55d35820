import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StripeCheckoutButtons } from "./StripeCheckoutButtons";

const mock = vi.hoisted(() => ({ invoke: vi.fn(), getSession: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { auth: { getSession: mock.getSession }, functions: { invoke: mock.invoke } },
}));
vi.mock("@/lib/locale/locale-context", () => ({ useLocale: () => ({ locale: "en" }) }));
vi.mock("@/lib/locale/use-ui-strings", () => ({
  useUiString: () => (key: string) => key,
}));
vi.mock("@/lib/locale/use-locale-link-search", () => ({
  useLocaleLinkSearch: () => () => ({ locale: "en" }),
}));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, hash }: { children: React.ReactNode; hash?: string }) => (
    <a href={`/pricing?locale=en#${hash}`}>{children}</a>
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("adult checkout Kids notice", () => {
  it("shows Kids at plan selection and requires an adult-only confirmation before invoking checkout", () => {
    render(<StripeCheckoutButtons plan="pro" variant="violet" />);
    expect(screen.getByText("Interested in adding a Kids family plan?")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View Kids prices" })).toHaveAttribute(
      "href",
      "/pricing?locale=en#kids",
    );
    fireEvent.click(screen.getByRole("button", { name: "pricing.cta.payMonthly" }));
    expect(
      screen.getByText(
        "Kids is an optional separate plan. It will not be added to this order or charged now.",
      ),
    ).toBeInTheDocument();
    expect(mock.invoke).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Back to plan selection" }));
    expect(
      screen.queryByRole("group", { name: "Review your selection before test checkout" }),
    ).not.toBeInTheDocument();
    expect(mock.invoke).not.toHaveBeenCalled();
  });
});

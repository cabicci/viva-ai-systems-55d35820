import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StripeCheckoutButtons } from "./StripeCheckoutButtons";

const mock = vi.hoisted(() => ({
  invoke: vi.fn(),
  getSession: vi.fn(),
  command: vi.fn().mockResolvedValue([]),
}));
vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock("@/lib/commerce/commerce.functions", () => ({ commerceCommand: mock.command }));
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
  Link: ({
    children,
    to,
    search,
  }: {
    children: React.ReactNode;
    to: string;
    search?: { locale?: string };
  }) => <a href={`${to}${search?.locale ? `?locale=${search.locale}` : ""}`}>{children}</a>,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("adult checkout Kids notice", () => {
  it("shows the optional Kids plan inside checkout before invoking any payment action", async () => {
    render(<StripeCheckoutButtons plan="pro" variant="violet" />);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.queryByRole("link", { name: "View Kids prices" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "pricing.cta.payMonthly" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("link", { name: "View Kids prices" })).toHaveAttribute(
      "href",
      "/kids/pricing?locale=en",
    );
    expect(
      within(dialog).getByText(
        "Kids is an optional, separate plan. Subscribe in its pricing section before or after this checkout.",
      ),
    ).toBeInTheDocument();
    expect(mock.invoke).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole("button", { name: "Back to packages" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(mock.getSession).not.toHaveBeenCalled();
  });
});

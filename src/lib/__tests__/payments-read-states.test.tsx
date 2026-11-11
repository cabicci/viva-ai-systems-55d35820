import type { ComponentType, ReactNode } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { getUiString } from "@/lib/locale/ui-strings";
import type { SupportedLocale } from "@/lib/locale/types";
const state = vi.hoisted(() => ({
  Page: undefined as ComponentType | undefined,
  locale: "en" as SupportedLocale,
  order: undefined as string | undefined,
  authLoading: false,
  user: { id: "synthetic-user" } as { id: string } | null,
  navigate: vi.fn(),
  command: vi.fn(),
  refetch: vi.fn(),
  targetRefetch: vi.fn(),
  rows: {} as Record<string, unknown>,
  target: {} as Record<string, unknown>,
}));
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: { component: ComponentType }) => {
    state.Page = options.component;
    return { ...options, useSearch: () => ({ order: state.order }) };
  },
  useNavigate: () => state.navigate,
  Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
}));
vi.mock("@tanstack/react-query", () => ({
  useQuery: ({ queryKey }: { queryKey: string[] }) =>
    queryKey[0] === "commerce-my"
      ? state.rows
      : queryKey[0] === "commerce-order"
        ? state.target
        : {},
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));
vi.mock("@tanstack/react-start", () => ({ useServerFn: () => state.command }));
vi.mock("@/lib/commerce/commerce.functions", () => ({ commerceCommand: {} }));
vi.mock("@/lib/commerce/access-notice.functions", () => ({ accessNoticeCommand: {} }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({ user: state.user, loading: state.authLoading }),
}));
vi.mock("@/lib/locale/locale-context", () => ({ useLocale: () => ({ locale: state.locale }) }));
vi.mock("@/lib/locale/use-ui-strings", () => ({
  useUiString: () => (key: Parameters<typeof getUiString>[1]) => getUiString(state.locale, key),
}));
vi.mock("@/components/dashboard/Sidebar", () => ({ Sidebar: () => null }));
vi.mock("@/components/commerce/RedeemOffer", () => ({ RedeemOffer: () => null }));
vi.mock("@/components/commerce/ReceiptUpload", () => ({
  ReceiptUpload: () => null,
  ReceiptView: () => null,
}));
import "@/routes/payments";
beforeEach(() => {
  vi.clearAllMocks();
  state.locale = "en";
  state.order = undefined;
  state.authLoading = false;
  state.user = { id: "synthetic-user" };
  state.rows = { isLoading: false, isSuccess: false, isError: false, refetch: state.refetch };
  state.target = {
    isLoading: false,
    isSuccess: false,
    isError: false,
    refetch: state.targetRefetch,
  };
});
afterEach(cleanup);
function setup() {
  const Page = state.Page!;
  return render(<Page />);
}
it("keeps focus on the same main landmark when authentication finishes", () => {
  state.authLoading = true;
  state.user = null;
  const Page = state.Page!;
  const { rerender } = render(<Page />);
  const main = screen.getByRole("main");

  expect(main).toHaveAttribute("id", "main-content");
  expect(main).toHaveAttribute("tabindex", "-1");
  expect(screen.queryByRole("heading", { name: "Orders" })).toBeNull();
  expect(state.navigate).not.toHaveBeenCalled();
  main.focus();

  state.authLoading = false;
  state.user = { id: "synthetic-user" };
  rerender(<Page />);

  expect(screen.getByRole("main")).toBe(main);
  expect(main).toHaveFocus();
  expect(screen.getByRole("heading", { name: "Orders" })).toBeVisible();
  expect(state.navigate).not.toHaveBeenCalled();
});
it("redirects a signed-out visitor without mounting protected orders", () => {
  state.user = null;
  state.order = "synthetic-order";
  setup();

  expect(screen.getByRole("main")).toHaveAttribute("id", "main-content");
  expect(screen.queryByRole("heading", { name: "Orders" })).toBeNull();
  expect(state.navigate).toHaveBeenCalledWith({
    to: "/login",
    search: { order: "synthetic-order", paymentView: "customer" },
    replace: true,
  });
  expect(state.command).not.toHaveBeenCalled();
});
it("shows loading without a premature empty or access-loss message", () => {
  state.rows.isLoading = true;
  setup();
  expect(screen.getByRole("status")).toHaveTextContent("Loading orders and access records");
  expect(screen.queryByText("No orders are recorded here yet.")).toBeNull();
  expect(state.command).not.toHaveBeenCalled();
});
it.each(["en", "ar-EG", "ar-MSA", "ar-Gulf"] as const)(
  "distinguishes successful empty lists in %s without asserting entitlement loss",
  (locale) => {
    state.locale = locale;
    state.rows = { ...state.rows, isSuccess: true, data: { orders: [], entitlements: [] } };
    setup();
    expect(screen.getByText(getUiString(locale, "payments.state.noOrders"))).toBeTruthy();
    expect(screen.getByText(getUiString(locale, "payments.state.noEntitlements"))).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(state.command).not.toHaveBeenCalled();
  },
);
it("shows a read error with an explicit read retry and no successful-empty claim", () => {
  state.rows.isError = true;
  setup();
  expect(screen.getByRole("alert")).toHaveTextContent("We could not load your records");
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  expect(state.refetch).toHaveBeenCalledTimes(1);
  expect(state.command).not.toHaveBeenCalled();
  expect(screen.queryByText("No orders are recorded here yet.")).toBeNull();
});
it("distinguishes a requested-order loading failure and retries both reads", () => {
  state.order = "synthetic-order";
  state.target.isError = true;
  setup();
  expect(screen.getByRole("alert")).toHaveTextContent("We could not load the requested order");
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  expect(state.refetch).toHaveBeenCalledTimes(1);
  expect(state.targetRefetch).toHaveBeenCalledTimes(1);
  expect(state.command).not.toHaveBeenCalled();
});
it("explains a successful requested-order read that returns no available order", () => {
  state.order = "synthetic-order";
  state.target = { ...state.target, isSuccess: true, data: null };
  setup();
  expect(screen.getByRole("status")).toHaveTextContent("The requested order was not found");
  expect(state.command).not.toHaveBeenCalled();
});

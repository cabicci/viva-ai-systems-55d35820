import React from "react";
import { render, screen, within, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { StripeCheckoutButtons } from "@/components/billing/StripeCheckoutButtons";
import { KidsCheckoutButtons } from "@/components/kids/KidsCheckoutButtons";
import { CommercialPurchases } from "@/components/billing/CommercialPurchases";
import { Route as AcademicRoute } from "@/routes/academic.pricing";
import { Route as TechnicalRoute } from "@/routes/technical.pricing";
import { BillingUnavailableError } from "@/lib/billing/checkout-client";
import { commercialCopy } from "@/lib/billing/commercial-copy";
const live = vi.hoisted(() => ({
  locale: "en",
  checkout: vi.fn(),
  command: vi.fn(),
  rpc: vi.fn(),
  session: vi.fn(),
}));
vi.mock("@/components/site/Navbar", () => ({ Navbar: () => null }));
vi.mock("@/components/site/Footer", () => ({ Footer: () => null }));
vi.mock("@/components/site/LearningLines", () => ({ LineIntroduction: () => null }));
vi.mock("@/lib/locale/resolve-route-head-locale", () => ({ resolveRouteHeadLocale: () => "en" }));
vi.mock("@/lib/academic-education/client", () => ({
  academicCatalogue: vi.fn(),
  academicCommand: vi.fn(),
}));
vi.mock("@/lib/technical-education/client", () => ({
  useTechnicalProgress: () => ({ stripe: false }),
}));
vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: unknown) => ({ options }),
  Link: ({ children }: React.PropsWithChildren) => <a>{children}</a>,
}));
vi.mock("@tanstack/react-query", () => ({
  useQuery: ({ queryKey }: { queryKey: unknown[] }) => ({
    isSuccess: true,
    isPending: false,
    isError: false,
    error: null,
    data:
      queryKey[0] === "commercial-purchase-options"
        ? {
            curricula: [
              { area: "kids", course: "lab-kids", title: "Lab curriculum" },
              { area: "technical", course: "furniture", title: "Unlocalized placeholder" },
            ],
            children: [{ id: "55555555-5555-4555-8555-555555555501", name: "Lab child" }],
          }
        : queryKey[0] === "academic-catalogue"
          ? [{ released: true }]
          : { stripe: false },
  }),
}));
vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({ user: { id: "55555555-5555-4555-8555-555555555502" }, loading: false }),
}));
vi.mock("@/lib/locale/locale-context", () => ({ useLocale: () => ({ locale: live.locale }) }));
vi.mock("@/lib/locale/use-ui-strings", () => ({
  useUiString: () => (key: string) =>
    ({
      "pricing.cta.payMonthly": "Pay monthly",
      "pricing.cta.payYearly": "Pay yearly",
      "pricing.plan.pro.name": "Pro",
      "pricing.plan.proPlus.name": "Pro Plus",
      "pricing.price.month": "Month",
      "pricing.price.year": "Year",
      "pricing.price.taxExclusive": "Prices exclude tax",
      "pricing.checkout.error": "Checkout failed",
    })[key] ?? key,
}));
vi.mock("@/lib/locale/use-locale-link-search", () => ({
  useLocaleLinkSearch: () => () => ({ locale: live.locale }),
}));
vi.mock("@/lib/commerce/commerce.functions", () => ({ commerceCommand: live.command }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: { getSession: live.session },
    rpc: live.rpc,
    functions: {
      invoke: () => {
        throw new Error("Unexpected direct provider call");
      },
    },
  },
}));
vi.mock("@/lib/billing/checkout-client", () => ({
  resolveCheckoutUrl: live.checkout,
  billingUnavailableMessage: () => "Billing unavailable",
  resolvePortalUrl: () => {
    throw new Error("Unexpected portal");
  },
  loadCommercialPurchaseOptions: () => {
    throw new Error("Unexpected service query");
  },
  BillingUnavailableError: class extends Error {
    constructor(public code: string) {
      super(code);
    }
  },
}));
const Academic = AcademicRoute.options.component as React.ComponentType;
const Technical = TechnicalRoute.options.component as React.ComponentType;
const w = commercialCopy("en");
async function submit(label = "Continue") {
  const dialog = screen.getByRole("dialog");
  fireEvent.click(within(dialog).getByRole("button", { name: label }));
  return dialog;
}
async function expectVisibleError(dialog: HTMLElement) {
  await waitFor(() => expect(within(dialog).getByRole("alert").textContent).toBeTruthy());
}
function purchaseArticle(kind: "lifetime" | "topup") {
  return screen.getByRole("heading", { name: w[kind] }).closest("article")!;
}
beforeEach(() => {
  live.locale = "en";
  live.checkout.mockReset().mockRejectedValue(new Error("Synthetic unavailable"));
  live.command.mockReset().mockImplementation(async ({ data }) => {
    if (data.action === "methods") return [];
    throw new Error("Unexpected financial command");
  });
  live.rpc.mockReset().mockResolvedValue({ data: true, error: null });
  live.session.mockReset().mockResolvedValue({
    data: { session: { user: { id: "55555555-5555-4555-8555-555555555502" } } },
  });
});
afterEach(cleanup);
describe("Actual checkout parent integration F2/F3", () => {
  for (const plan of ["pro", "pro_plus"] as const)
    it(`shows ${plan} selected monthly price and its caught error inside the dialog`, async () => {
      render(<StripeCheckoutButtons plan={plan} variant="outline" />);
      fireEvent.click(screen.getByRole("button", { name: "Pay monthly" }));
      const dialog = await screen.findByRole("dialog");
      expect(dialog.textContent).toContain(plan === "pro" ? "$6.99" : "$12.99");
      expect(dialog.textContent).toContain("Prices exclude tax");
      await submit("Continue with adult plan only");
      await expectVisibleError(dialog);
      expect(live.checkout).toHaveBeenCalledTimes(1);
    });
  it("shows Kids annual base price and guarded callback failure within the dialog", async () => {
    render(<KidsCheckoutButtons market="EG" />);
    fireEvent.click(screen.getByRole("button", { name: "Subscribe yearly" }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog.textContent).toContain("1,990.00");
    expect(dialog.textContent).toContain(w.family);
    await submit("Subscribe yearly");
    await expectVisibleError(dialog);
    expect(live.rpc).toHaveBeenCalledWith("kids_parent_can_manage_profiles");
    expect(live.checkout).toHaveBeenCalledTimes(1);
  });
  for (const [name, Component] of [
    ["academic", Academic],
    ["technical", Technical],
  ] as const)
    it(`shows ${name} price and ordinary caught checkout failure inside the dialog`, async () => {
      render(<Component />);
      fireEvent.click(screen.getByRole("button", { name: "Continue" }));
      const dialog = await screen.findByRole("dialog");
      expect(dialog.textContent).toContain("309.00");
      expect(dialog.textContent).toContain(w.included);
      await submit();
      await expectVisibleError(dialog);
      expect(live.checkout).toHaveBeenCalledTimes(1);
    });
  it("reviews the exact child and curriculum for a Kids lifetime purchase", async () => {
    render(<CommercialPurchases area="kids" />);
    fireEvent.change(screen.getByRole("combobox", { name: w.curriculum }), {
      target: { value: "lab-kids" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: w.child }), {
      target: { value: "55555555-5555-4555-8555-555555555501" },
    });
    fireEvent.click(within(purchaseArticle("lifetime")).getByRole("button", { name: w.buy }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog.textContent).toContain("Lab curriculum");
    expect(dialog.textContent).toContain("Lab child");
    expect(dialog.textContent).toContain(w.lifetimePrice);
    await submit(w.buy);
    await expectVisibleError(dialog);
  });
  it("uses the same localized technical curriculum label in selection and summary", async () => {
    render(<CommercialPurchases area="technical" />);
    fireEvent.change(screen.getByRole("combobox", { name: w.curriculum }), {
      target: { value: "furniture" },
    });
    fireEvent.click(within(purchaseArticle("lifetime")).getByRole("button", { name: w.buy }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog.textContent).toContain("Carpentry and furniture making");
    expect(dialog.textContent).not.toContain("Unlocalized placeholder");
  });
  for (const area of ["ai", "kids"] as const)
    it(`names the ${area === "kids" ? "family" : "account"} top-up wallet inside checkout`, async () => {
      render(<CommercialPurchases area={area} />);
      fireEvent.click(within(purchaseArticle("topup")).getByRole("button", { name: w.buy }));
      const dialog = await screen.findByRole("dialog");
      expect(dialog.textContent).toContain(area === "kids" ? w.familyAccount : w.account);
      expect(dialog.textContent).toContain(w.topupPrice);
    });
  it("makes unknown one-time failure visible while preserving the request ID on retry", async () => {
    render(<CommercialPurchases area="ai" />);
    fireEvent.click(within(purchaseArticle("topup")).getByRole("button", { name: w.buy }));
    const dialog = await screen.findByRole("dialog");
    await submit(w.buy);
    await expectVisibleError(dialog);
    await submit(w.buy);
    await waitFor(() => expect(live.checkout).toHaveBeenCalledTimes(2));
    expect(live.checkout.mock.calls[0][0].requestId).toBe(live.checkout.mock.calls[1][0].requestId);
  });
  it("preserves the existing explicit expired-request rotation contract", async () => {
    live.checkout
      .mockRejectedValueOnce(new BillingUnavailableError("COMMERCIAL_REQUEST_EXPIRED"))
      .mockRejectedValue(new Error("Unknown result"));
    render(<CommercialPurchases area="ai" />);
    fireEvent.click(within(purchaseArticle("topup")).getByRole("button", { name: w.buy }));
    const dialog = await screen.findByRole("dialog");
    await submit(w.buy);
    await expectVisibleError(dialog);
    await submit(w.buy);
    await waitFor(() => expect(live.checkout).toHaveBeenCalledTimes(2));
    expect(live.checkout.mock.calls[0][0].requestId).not.toBe(
      live.checkout.mock.calls[1][0].requestId,
    );
  });
});

describe("Checkout error belongs to selected purchase", () => {
  it("does not carry a failure between purchase types", async () => {
    render(<CommercialPurchases area="technical" />);
    fireEvent.change(screen.getByRole("combobox", { name: w.curriculum }), {
      target: { value: "furniture" },
    });
    fireEvent.click(within(purchaseArticle("topup")).getByRole("button", { name: w.buy }));
    let dialog = await screen.findByRole("dialog");
    await submit(w.buy);
    await expectVisibleError(dialog);
    fireEvent.click(within(dialog).getByRole("button", { name: "Back to packages" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    fireEvent.click(within(purchaseArticle("lifetime")).getByRole("button", { name: w.buy }));
    dialog = await screen.findByRole("dialog");
    expect(within(dialog).queryByRole("alert")).toBeNull();
    expect(live.checkout).toHaveBeenCalledTimes(1);
  });
  for (const [name, Component] of [
    ["academic", Academic],
    ["technical", Technical],
  ] as const)
    it(`clears the prior ${name} error for another selected period`, async () => {
      render(<Component />);
      fireEvent.click(screen.getByRole("button", { name: "Continue" }));
      let dialog = await screen.findByRole("dialog");
      await submit();
      await expectVisibleError(dialog);
      fireEvent.click(within(dialog).getByRole("button", { name: "Back to packages" }));
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
      fireEvent.change(screen.getByRole("combobox", { name: "Duration" }), {
        target: { value: "year" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Continue" }));
      dialog = await screen.findByRole("dialog");
      expect(within(dialog).queryByRole("alert")).toBeNull();
      expect(dialog.textContent).toContain("3,090.00");
      expect(live.checkout).toHaveBeenCalledTimes(1);
    });
});

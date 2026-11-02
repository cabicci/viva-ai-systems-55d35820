import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CommercialPurchases } from "./CommercialPurchases";

const mock = vi.hoisted(() => ({
  locale: "en",
  user: { id: "test-parent" } as { id: string } | null,
  options: vi.fn(),
  checkout: vi.fn(),
  command: vi.fn(),
}));
vi.mock("@/lib/auth-context", () => ({ useAuth: () => ({ user: mock.user, loading: false }) }));
vi.mock("@/lib/locale/locale-context", () => ({ useLocale: () => ({ locale: mock.locale }) }));
vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock("@/lib/commerce/commerce.functions", () => ({
  commerceCommand: mock.command,
  uploadCommerceReceipt: vi.fn(),
  readCommerceReceipt: vi.fn(),
}));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));
vi.mock("@/lib/billing/checkout-client", () => ({
  BillingUnavailableError: class extends Error {
    constructor(public code: string) {
      super(code);
    }
  },
  loadCommercialPurchaseOptions: mock.options,
  resolveCheckoutUrl: mock.checkout,
}));

beforeEach(() => {
  mock.locale = "en";
  mock.user = { id: "test-parent" };
  mock.options.mockReset().mockResolvedValue({
    curricula: [
      { area: "ai", course: "ai-complete", title: "Complete AI curriculum" },
      { area: "academic", course: "AC-BUS", title: "Business curriculum" },
      { area: "kids", course: "KIDS-ONE", title: "Kids curriculum" },
      { area: "technical", course: "furniture", title: "Technical — furniture" },
    ],
    children: [
      { id: "owned-child-one", name: "First child" },
      { id: "owned-child-two", name: "Second child" },
    ],
  });
  mock.checkout.mockReset().mockRejectedValue(new Error("uncertain response"));
  mock.command
    .mockReset()
    .mockImplementation(async ({ data }: { data: { action: string } }) =>
      data.action === "methods" ? [] : { original_minor: 5000, final_minor: 4000, currency: "EGP" },
    );
});
afterEach(cleanup);
function setup(area: "ai" | "kids" = "ai") {
  return render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <CommercialPurchases area={area} />
    </QueryClientProvider>,
  );
}
describe("one-time commercial purchases", () => {
  it.each(["en", "ar-EG", "ar-MSA", "ar-Gulf"])(
    "labels furniture for customers in %s",
    async (locale) => {
      mock.locale = locale;
      setup();
      fireEvent.change(screen.getByLabelText(locale === "en" ? "Learning path" : "المسار"), {
        target: { value: "technical" },
      });
      await screen.findByRole("option", {
        name: locale === "en" ? "Carpentry and furniture making" : "النجارة وصناعة الأثاث",
      });
      expect(screen.queryByRole("option", { name: "Technical — furniture" })).toBeNull();
    },
  );
  it("binds lifetime purchase to the chosen curriculum and preserves the retry identity", async () => {
    setup();
    await screen.findByRole("option", { name: "Complete AI curriculum" });
    expect(screen.getAllByRole("button", { name: "Continue to payment" })[0]).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Choose one curriculum"), {
      target: { value: "ai-complete" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: "Continue to payment" })[0]);
    await screen.findByRole("alert");
    const first = mock.checkout.mock.calls[0][0];
    expect(first).toMatchObject({
      product: "curriculum_lifetime",
      area: "ai",
      course: "ai-complete",
      marketCode: "EG",
    });
    expect(first).not.toHaveProperty("childId");
    fireEvent.click(screen.getAllByRole("button", { name: "Continue to payment" })[0]);
    await waitFor(() => expect(mock.checkout).toHaveBeenCalledTimes(2));
    expect(mock.checkout.mock.calls[1][0].requestId).toBe(first.requestId);
    await screen.findByRole("alert");
    fireEvent.change(screen.getByLabelText("Learning path"), { target: { value: "academic" } });
    expect(screen.getByLabelText("Choose one curriculum")).toHaveValue("");
    fireEvent.change(screen.getByLabelText("Choose one curriculum"), {
      target: { value: "AC-BUS" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: "Continue to payment" })[0]);
    await waitFor(() => expect(mock.checkout).toHaveBeenCalledTimes(3));
    expect(mock.checkout.mock.calls[2][0]).toMatchObject({ area: "academic", course: "AC-BUS" });
    expect(mock.checkout.mock.calls[2][0].requestId).not.toBe(first.requestId);
  });

  it("requires one owned child for Kids and sends family top-ups independently of the curriculum", async () => {
    setup("kids");
    await screen.findByRole("option", { name: "Kids curriculum" });
    fireEvent.change(screen.getByLabelText("Choose one curriculum"), {
      target: { value: "KIDS-ONE" },
    });
    expect(screen.getAllByRole("button", { name: "Continue to payment" })[0]).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Choose one child"), {
      target: { value: "owned-child-two" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: "Continue to payment" })[0]);
    await screen.findByRole("alert");
    expect(mock.checkout.mock.calls[0][0]).toMatchObject({
      product: "curriculum_lifetime",
      area: "kids",
      course: "KIDS-ONE",
      childId: "owned-child-two",
    });
    fireEvent.click(screen.getAllByRole("button", { name: "Continue to payment" })[1]);
    await waitFor(() => expect(mock.checkout).toHaveBeenCalledTimes(2));
    expect(mock.checkout.mock.calls[1][0]).toMatchObject({
      product: "question_topup",
      walletScope: "family",
    });
    expect(mock.checkout.mock.calls[1][0]).not.toHaveProperty("course");
    expect(mock.checkout.mock.calls[1][0]).not.toHaveProperty("childId");
  });

  it("allows account top-up without a current curriculum selection and binds an explicit coupon", async () => {
    setup();
    fireEvent.change(screen.getByLabelText("Offer code (optional)"), {
      target: { value: " extra100 " },
    });
    expect(screen.getAllByRole("button", { name: "Continue to payment" })[1]).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Review price" }));
    await waitFor(() =>
      expect(screen.getAllByRole("button", { name: "Continue to payment" })[1]).toBeEnabled(),
    );
    fireEvent.click(screen.getAllByRole("button", { name: "Continue to payment" })[1]);
    await screen.findByRole("alert");
    expect(mock.checkout.mock.calls[0][0]).toMatchObject({
      product: "question_topup",
      walletScope: "account",
      offer: { code: "EXTRA100" },
    });
    await screen.findByRole("option", { name: "Complete AI curriculum" });
    fireEvent.change(screen.getByLabelText("Choose one curriculum"), {
      target: { value: "ai-complete" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: "Continue to payment" })[0]);
    await waitFor(() => expect(mock.checkout).toHaveBeenCalledTimes(2));
    expect(mock.checkout.mock.calls[1][0].product).toBe("curriculum_lifetime");
    expect(mock.checkout.mock.calls[1][0]).not.toHaveProperty("offer");
  });

  it.each(["en", "ar-EG", "ar-MSA", "ar-Gulf"])(
    "explains the one-month allowance and permanent purchased credit in %s without loading private options when signed out",
    (locale) => {
      mock.user = null;
      mock.locale = locale;
      setup();
      expect(
        screen
          .getByText(
            locale === "en"
              ? /first month only/
              : locale === "ar-EG"
                ? /لأول شهر بس/
                : /للشهر الأول فقط/,
          )
          .closest("li"),
      ).not.toBeNull();
      expect(
        screen
          .getByText(
            locale === "en"
              ? /never expire/
              : locale === "ar-EG"
                ? /مش بتنتهي/
                : locale === "ar-Gulf"
                  ? /وما تنتهي/
                  : /لا تنتهي صلاحيتها/,
          )
          .closest("li"),
      ).not.toBeNull();
      expect(mock.options).not.toHaveBeenCalled();
      expect(screen.getByRole("link")).toHaveAttribute("href", `/login?locale=${locale}`);
    },
  );
});

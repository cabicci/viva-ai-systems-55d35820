import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, fireEvent, waitFor } from "@testing-library/react";
import { LocaleProvider } from "@/lib/locale/locale-context";
import { getUiString } from "@/lib/locale/ui-strings";
import { commerceCopy } from "@/lib/commerce/copy";
import type { SupportedLocale } from "@/lib/locale/types";
import { PaymentMethods } from "./PaymentMethods";
const state = vi.hoisted(() => ({
  command: vi.fn(),
  stripe: vi.fn(),
  checkout: vi.fn(),
  quote: {} as Record<string, unknown>,
}));
vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));
vi.mock("@/lib/commerce/commerce.functions", () => ({ commerceCommand: state.command }));
vi.mock("./ReceiptUpload", () => ({ ReceiptUpload: () => null }));
vi.mock("@/lib/billing/checkout-client", () => ({
  resolveCheckoutUrl: state.checkout,
  billingUnavailableMessage: () => "Synthetic checkout stopped",
}));
function page(locale: SupportedLocale = "en", extra: Record<string, unknown> = {}) {
  const props = {
    packageKey: "kids",
    interval: "month",
    market: "EG",
    stripe: state.stripe,
    ...extra,
  };
  return (
    <LocaleProvider initialLocale={locale} effectiveLocale={locale}>
      <PaymentMethods {...(props as any)}>Continue</PaymentMethods>
    </LocaleProvider>
  );
}
async function review(locale: SupportedLocale = "en") {
  fireEvent.change(screen.getByLabelText(commerceCopy(locale).code), {
    target: { value: "SYNTHETIC" },
  });
  fireEvent.click(screen.getByRole("button", { name: commerceCopy(locale).quote }));
  await waitFor(() =>
    expect(state.command.mock.calls.some(([input]) => input.data.action !== "methods")).toBe(true),
  );
  await screen.findByText(new RegExp(commerceCopy(locale).original));
}
beforeEach(() => {
  state.stripe.mockReset();
  state.checkout.mockReset().mockRejectedValue(new Error("NO_REAL_CHECKOUT"));
  state.quote = {
    original_minor: 19900,
    final_minor: 15920,
    currency: "EGP",
    offer_kind: "percent",
    offer_id: "synthetic",
    live_stripe_available: true,
  };
  state.command.mockReset().mockImplementation(async ({ data }: any) =>
    data.action === "methods"
      ? [
          {
            code: "instapay",
            enabled: true,
            currencies: ["EGP"],
            destination: "Synthetic",
            instructions: "Synthetic",
          },
          {
            code: "wallet",
            enabled: true,
            currencies: ["EGP"],
            destination: "Synthetic",
            instructions: "Synthetic",
          },
        ]
      : data.action.includes("quote")
        ? { ...state.quote }
        : {
            id: "synthetic-order",
            reference: "Synthetic receipt",
            final_minor: state.quote.final_minor,
            currency: state.quote.currency,
            review_status: "confirmed",
            expires_at: "2026-12-01",
            instructions_snapshot: { instructions: "Synthetic", destination: "Synthetic" },
          },
  );
  vi.stubGlobal(
    "fetch",
    vi.fn(() => {
      throw new Error("NETWORK_FORBIDDEN");
    }),
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
it("permits a server-authorized coupon without rewriting the checkout offer", async () => {
  render(page());
  await review();
  await waitFor(() => expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled());
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  await waitFor(() => expect(state.checkout).toHaveBeenCalled());
  expect(state.checkout.mock.calls[0][0]).toMatchObject({
    product: "kids",
    billingInterval: "month",
    marketCode: "EG",
    offer: { code: "SYNTHETIC", renewal: false },
  });
  expect(state.stripe).not.toHaveBeenCalled();
});
it.each(["en", "ar-EG", "ar-MSA", "ar-Gulf"] as const)(
  "explains unavailable card coupons in %s without recommending unavailable EGP rails for USD",
  async (locale) => {
    state.quote = { ...state.quote, currency: "USD", live_stripe_available: false };
    render(page(locale, { market: "INTL" }));
    await review(locale);
    expect(
      await screen.findByText(getUiString(locale, "commerce.coupon.cardUnavailable")),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
    const w = commerceCopy(locale);
    expect(screen.queryByText(`${w.methods}: ${w.instapay} / ${w.wallet}`)).toBeNull();
    expect(state.checkout).not.toHaveBeenCalled();
    expect(state.stripe).not.toHaveBeenCalled();
  },
);
it("allows the existing manual renewal path when the quote refuses Stripe", async () => {
  state.quote = { ...state.quote, live_stripe_available: false, term_renewal: true };
  render(page());
  await waitFor(() => expect(screen.getByRole("option", { name: "InstaPay" })).toBeEnabled());
  fireEvent.change(screen.getByRole("combobox"), { target: { value: "instapay" } });
  fireEvent.click(screen.getByRole("checkbox"));
  await review();
  await waitFor(() => expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled());
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  await waitFor(() =>
    expect(state.command.mock.calls.some(([input]) => input.data.action === "create_order")).toBe(
      true,
    ),
  );
  expect(
    state.command.mock.calls.find(([input]) => input.data.action === "create_order")![0].data.data,
  ).toMatchObject({ method: "instapay", renewal: true, code: "SYNTHETIC" });
  expect(state.checkout).not.toHaveBeenCalled();
  expect(state.stripe).not.toHaveBeenCalled();
});
it.each(["en", "ar-EG", "ar-MSA", "ar-Gulf"] as const)(
  "retains the coded server recheck when the automatic Kids discount wins in %s",
  async (locale) => {
    state.quote = {
      original_minor: 19900,
      final_minor: 17910,
      currency: "EGP",
      automatic_discount: true,
      offer_id: null,
      phone_required: false,
      live_stripe_available: true,
    };
    render(page(locale));
    await review(locale);
    expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled();
    expect(screen.getByText(getUiString(locale, "commerce.coupon.automaticBetter"))).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    await waitFor(() => expect(state.checkout).toHaveBeenCalledTimes(1));
    expect(state.checkout.mock.calls[0][0]).toMatchObject({
      product: "kids",
      marketCode: "EG",
      billingInterval: "month",
      offer: { code: "SYNTHETIC" },
    });
    expect(state.stripe).not.toHaveBeenCalled();
  },
);
it.each([true, false])(
  "allows coded topup card checkout only with server eligibility %s",
  async (available) => {
    state.quote = {
      ...state.quote,
      original_minor: 5000,
      final_minor: 4500,
      live_stripe_available: available,
    };
    render(
      page("en", {
        packageKey: undefined,
        interval: undefined,
        oneTime: { kind: "question_topup", wallet_scope: "account" },
      }),
    );
    await review();
    const button = screen.getByRole("button", { name: "Continue" });
    await waitFor(() => (available ? expect(button).toBeEnabled() : expect(button).toBeDisabled()));
    if (available) {
      fireEvent.click(button);
      await waitFor(() => expect(state.stripe).toHaveBeenCalledWith({ code: "SYNTHETIC" }));
    } else {
      expect(button).toBeDisabled();
      expect(state.stripe).not.toHaveBeenCalled();
    }
    expect(state.checkout).not.toHaveBeenCalled();
  },
);
it("preserves a manually eligible topup without a Stripe mapping", async () => {
  state.quote = {
    ...state.quote,
    original_minor: 5000,
    final_minor: 4500,
    live_stripe_available: false,
  };
  render(
    page("en", {
      packageKey: undefined,
      interval: undefined,
      oneTime: { kind: "question_topup", wallet_scope: "family" },
    }),
  );
  await waitFor(() => expect(screen.getByRole("option", { name: "Wallet" })).toBeEnabled());
  fireEvent.change(screen.getByRole("combobox"), { target: { value: "wallet" } });
  await review();
  await waitFor(() => expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled());
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  await waitFor(() =>
    expect(
      state.command.mock.calls.some(([input]) => input.data.action === "create_one_time_order"),
    ).toBe(true),
  );
  expect(
    state.command.mock.calls.find(([input]) => input.data.action === "create_one_time_order")![0]
      .data.data,
  ).toMatchObject({
    method: "wallet",
    kind: "question_topup",
    wallet_scope: "family",
    code: "SYNTHETIC",
  });
  expect(state.stripe).not.toHaveBeenCalled();
});
it("keeps complimentary activation on its existing admin order path", async () => {
  state.quote = {
    ...state.quote,
    final_minor: 0,
    offer_kind: "complimentary",
    live_stripe_available: false,
  };
  render(page());
  await review();
  await waitFor(() => expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled());
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  await waitFor(() =>
    expect(state.command.mock.calls.some(([input]) => input.data.action === "create_order")).toBe(
      true,
    ),
  );
  expect(
    state.command.mock.calls.find(([input]) => input.data.action === "create_order")![0].data.data
      .method,
  ).toBe("admin");
  expect(state.stripe).not.toHaveBeenCalled();
  expect(state.checkout).not.toHaveBeenCalled();
});

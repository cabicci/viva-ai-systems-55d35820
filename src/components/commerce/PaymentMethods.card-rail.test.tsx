import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/lib/locale/locale-context";
import { PaymentMethods } from "./PaymentMethods";

const mock = vi.hoisted(() => ({ command: vi.fn() }));
vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock("@/lib/commerce/commerce.functions", () => ({
  commerceCommand: mock.command,
  uploadCommerceReceipt: vi.fn(),
  readCommerceReceipt: vi.fn(),
}));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));
beforeEach(() => {
  mock.command.mockReset();
  mock.command.mockImplementation(async ({ data }: { data: { action: string } }) =>
    data.action === "methods"
      ? [
          {
            code: "instapay",
            enabled: true,
            destination: "SYNTHETIC",
            instructions: "Synthetic",
            currencies: ["EGP"],
          },
        ]
      : { original_minor: 16900, final_minor: 16900, currency: "EGP" },
  );
});
afterEach(cleanup);

describe("card presentation preserves rail selection", () => {
  it("drops a now-unavailable manual method and an in-flight EGP quote when the market becomes USD", async () => {
    let complete!: (value: unknown) => void;
    mock.command.mockImplementation(({ data }: { data: { action: string } }) =>
      data.action === "methods"
        ? Promise.resolve([
            {
              code: "wallet",
              enabled: true,
              destination: "Fixture",
              instructions: "Fixture",
              currencies: ["EGP"],
            },
          ])
        : new Promise((resolve) => {
            complete = resolve;
          }),
    );
    const stripe = vi.fn();
    const ui = (market: "EG" | "INTL") => (
      <LocaleProvider initialLocale="en">
        <PaymentMethods packageKey="academic" interval="year" market={market} stripe={stripe}>
          Continue
        </PaymentMethods>
      </LocaleProvider>
    );
    const { rerender } = render(ui("EG"));
    await waitFor(() => expect(screen.getByRole("option", { name: "Wallet" })).toBeEnabled());
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "wallet" } });
    fireEvent.click(screen.getByRole("button", { name: "Review price" }));
    rerender(ui("INTL"));
    expect(screen.getByRole("combobox")).toHaveValue("stripe");
    expect(screen.getByRole("option", { name: /Wallet/ })).toBeDisabled();
    await act(async () =>
      complete({ original_minor: 309000, final_minor: 309000, currency: "EGP" }),
    );
    expect(screen.queryByText(/Original price:/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(stripe).toHaveBeenCalledOnce();
    expect(mock.command.mock.calls.some(([arg]) => arg.data.action === "create_order")).toBe(false);
  });
  it.each(["lifetime_course", "question_topup"] as const)(
    "uses the same receipt flow for %s without calling Stripe or subscription creation",
    async (kind) => {
      const stripe = vi.fn();
      mock.command.mockImplementation(async ({ data }: { data: { action: string } }) =>
        data.action === "methods"
          ? [
              {
                code: "instapay",
                enabled: true,
                destination: "Fixture",
                instructions: "Fixture instructions",
                currencies: ["EGP"],
              },
            ]
          : data.action === "one_time_quote"
            ? { original_minor: 5000, final_minor: 5000, currency: "EGP" }
            : {
                id: "00000000-0000-4000-8000-000000000001",
                reference: "MS-FIXTURE",
                final_minor: 5000,
                currency: "EGP",
                expires_at: "2026-12-01T00:00:00Z",
                review_status: "awaiting_receipt",
                instructions_snapshot: {
                  instructions: "Fixture instructions",
                  destination: "Fixture",
                },
              },
      );
      render(
        <LocaleProvider initialLocale="en">
          <PaymentMethods
            market="EG"
            oneTime={{
              kind,
              wallet_scope: "account",
              ...(kind === "lifetime_course" ? { area: "ai", course: "ai" } : {}),
            }}
            stripe={stripe}
          >
            Continue
          </PaymentMethods>
        </LocaleProvider>,
      );
      await waitFor(() => expect(screen.getByRole("option", { name: "InstaPay" })).toBeEnabled());
      fireEvent.change(screen.getByRole("combobox"), { target: { value: "instapay" } });
      expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
      fireEvent.click(screen.getByRole("button", { name: "Review price" }));
      await waitFor(() => expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled());
      fireEvent.click(screen.getByRole("button", { name: "Continue" }));
      await screen.findByText("MS-FIXTURE");
      expect(screen.getByText("Fixture instructions")).toBeVisible();
      expect(screen.getByText(/A receipt does not confirm payment/)).toBeVisible();
      expect(screen.getByLabelText("Payment receipt")).toHaveAttribute("type", "file");
      expect(stripe).not.toHaveBeenCalled();
      const create = mock.command.mock.calls.find(
        ([arg]) => arg.data.action === "create_one_time_order",
      )?.[0];
      expect(create.data.data).toMatchObject({ kind, wallet_scope: "account", method: "instapay" });
      expect(create.data.data).not.toHaveProperty("package");
      expect(mock.command.mock.calls.some(([arg]) => arg.data.action === "create_order")).toBe(
        false,
      );
    },
  );
  for (const locale of ["en", "ar-EG", "ar-MSA", "ar-Gulf"] as const) {
    it.each(["pro", "pro_plus", "kids", "academic", "technical"] as const)(
      `${locale}: %s keeps Stripe callback and manual quote gating separate`,
      async (packageKey) => {
        const stripe = vi.fn();
        render(
          <LocaleProvider initialLocale={locale}>
            <PaymentMethods packageKey={packageKey} interval="month" market="EG" stripe={stripe}>
              Continue
            </PaymentMethods>
          </LocaleProvider>,
        );
        const select = screen.getByRole("combobox");
        expect(select).toHaveAccessibleName();
        expect(select).toHaveValue("stripe");
        fireEvent.click(screen.getByRole("button", { name: "Continue" }));
        expect(stripe).toHaveBeenCalledOnce();
        await waitFor(() => expect(mock.command).toHaveBeenCalled());
        fireEvent.change(select, { target: { value: "instapay" } });
        expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
        expect(mock.command.mock.calls.some(([arg]) => arg.data.action === "create_order")).toBe(
          false,
        );
        fireEvent.change(select, { target: { value: "stripe" } });
        fireEvent.click(screen.getByRole("button", { name: "Continue" }));
        expect(stripe).toHaveBeenCalledTimes(2);
      },
    );
  }
});

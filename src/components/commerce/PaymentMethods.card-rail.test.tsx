import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/lib/locale/locale-context";
import { PaymentMethods } from "./PaymentMethods";

const mock = vi.hoisted(() => ({ command: vi.fn() }));
vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock("@/lib/commerce/commerce.functions", () => ({
  commerceCommand: mock.command, uploadCommerceReceipt: vi.fn(), readCommerceReceipt: vi.fn(),
}));
vi.mock("@tanstack/react-router", () => ({ Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a> }));
beforeEach(() => {
  mock.command.mockReset();
  mock.command.mockImplementation(async ({ data }: { data: { action: string } }) => data.action === "methods"
    ? [{ code: "instapay", enabled: true, destination: "SYNTHETIC", instructions: "Synthetic", currencies: ["EGP"] }]
    : { original_minor: 16900, final_minor: 16900, currency: "EGP" });
});
afterEach(cleanup);

describe("card presentation preserves rail selection", () => {
  for (const locale of ["en", "ar-EG", "ar-MSA", "ar-Gulf"] as const) {
    it.each(["pro", "pro_plus", "kids", "academic", "technical"] as const)(`${locale}: %s keeps Stripe callback and manual quote gating separate`, async (packageKey) => {
      const stripe = vi.fn();
      render(<LocaleProvider initialLocale={locale}>
        <PaymentMethods packageKey={packageKey} interval="month" market="EG" stripe={stripe}>Continue</PaymentMethods>
      </LocaleProvider>);
      const select = screen.getByRole("combobox");
      expect(select).toHaveAccessibleName();
      expect(select).toHaveValue("stripe");
      fireEvent.click(screen.getByRole("button", { name: "Continue" }));
      expect(stripe).toHaveBeenCalledOnce();
      await waitFor(() => expect(mock.command).toHaveBeenCalled());
      fireEvent.change(select, { target: { value: "instapay" } });
      expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
      expect(mock.command.mock.calls.some(([arg]) => arg.data.action === "create_order")).toBe(false);
      fireEvent.change(select, { target: { value: "stripe" } });
      fireEvent.click(screen.getByRole("button", { name: "Continue" }));
      expect(stripe).toHaveBeenCalledTimes(2);
    });
  }
});
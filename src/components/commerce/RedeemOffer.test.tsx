import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RedeemOffer } from "./RedeemOffer";

const mock = vi.hoisted(() => ({ resolve: vi.fn().mockRejectedValue(new Error("blocked")) }));
vi.mock("@/lib/locale/locale-context", () => ({ useLocale: () => ({ locale: "en" }) }));
vi.mock("@/lib/billing/checkout-client", () => ({ resolveCheckoutUrl: mock.resolve, billingUnavailableMessage: () => "Unavailable" }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { functions: { invoke: vi.fn() } } }));
vi.mock("./PaymentMethods", () => ({ PaymentMethods: ({ stripe }: { stripe: () => void }) => <button onClick={stripe}>Verify selection</button> }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });
describe("offer-page checkout handoff", () => {
  it("passes selected Kids annual international purchase directly to the existing mode resolver", async () => {
    render(<RedeemOffer />);
    const controls = screen.getAllByRole("combobox");
    fireEvent.change(controls[0], { target: { value: "kids" } });
    fireEvent.change(controls[1], { target: { value: "INTL" } });
    fireEvent.change(controls[2], { target: { value: "year" } });
    fireEvent.click(screen.getByRole("button", { name: "Verify selection" }));
    await waitFor(() => expect(mock.resolve).toHaveBeenCalledWith(
      { product: "kids", marketCode: "INTL", billingInterval: "year", locale: "en" }, expect.any(Function)));
    await screen.findByRole("alert");
    expect(mock.resolve).toHaveBeenCalledTimes(1);
  });
});
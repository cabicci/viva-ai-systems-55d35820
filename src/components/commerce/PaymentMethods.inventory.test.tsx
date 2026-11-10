import React from "react";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { PaymentMethods } from "./PaymentMethods";
const live = vi.hoisted(() => ({
  locale: "en",
  command: vi.fn(),
  stripe: vi.fn(),
  checkout: vi.fn(),
}));
vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: React.PropsWithChildren) => <a>{children}</a>,
}));
vi.mock("@/lib/locale/locale-context", () => ({ useLocale: () => ({ locale: live.locale }) }));
vi.mock("@/lib/commerce/commerce.functions", () => ({ commerceCommand: live.command }));
vi.mock("@/lib/billing/checkout-client", () => ({
  resolveCheckoutUrl: live.checkout,
  billingUnavailableMessage: () => "No checkout",
}));
const configured = {
  code: "instapay",
  enabled: true,
  currencies: ["EGP"],
  destination: "Synthetic destination",
  instructions: "Synthetic instructions",
};
const page = () => (
  <PaymentMethods packageKey="pro" interval="month" market="EG" stripe={live.stripe}>
    Continue
  </PaymentMethods>
);
beforeEach(() => {
  live.locale = "en";
  live.command.mockReset();
  live.stripe.mockReset();
  live.checkout.mockReset();
});
afterEach(cleanup);
class Boundary extends React.Component<React.PropsWithChildren, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? <p>Uncaught widget failure</p> : this.props.children;
  }
}
describe("Payment-method inventory truth and recovery", () => {
  it("shows pending inventory without enabling an unknown manual method", async () => {
    let resolve!: (value: unknown) => void;
    live.command.mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );
    render(page());
    expect(screen.getByRole("status").textContent).toMatch(/loading/i);
    expect(
      (screen.getByRole("option", { name: /InstaPay|إنستا باي/ }) as HTMLOptionElement).disabled,
    ).toBe(true);
    resolve([]);
    await waitFor(() => expect(screen.queryByRole("status")).toBeNull());
    expect(live.command).toHaveBeenCalledTimes(1);
  });
  for (const locale of ["en", "ar-EG", "ar-MSA", "ar-Gulf"]) {
    it(`shows failure and retries the actual inventory in ${locale} without payment side effects`, async () => {
      live.locale = locale;
      live.command
        .mockRejectedValueOnce(new Error("synthetic inventory unavailable"))
        .mockResolvedValueOnce([configured]);
      render(page());
      const alert = await screen.findByRole("alert");
      expect(alert.textContent).toBeTruthy();
      const retry = alert.querySelector("button");
      expect(retry).not.toBeNull();
      fireEvent.click(retry!);
      await waitFor(() =>
        expect(
          (screen.getByRole("option", { name: /InstaPay|إنستا باي/ }) as HTMLOptionElement)
            .disabled,
        ).toBe(false),
      );
      expect(screen.queryByRole("alert")).toBeNull();
      expect(live.command.mock.calls.map(([input]) => input.data.action)).toEqual([
        "methods",
        "methods",
      ]);
      expect(live.stripe).not.toHaveBeenCalled();
      expect(live.checkout).not.toHaveBeenCalled();
    });
  }
  it("keeps an unresolved manual default from automatically starting card checkout", async () => {
    live.command.mockRejectedValue(new Error("synthetic inventory unavailable"));
    render(
      <PaymentMethods
        packageKey="pro"
        interval="month"
        market="EG"
        initialMethod="instapay"
        stripe={live.stripe}
      >
        Continue
      </PaymentMethods>,
    );
    await screen.findByRole("alert");
    const confirm = screen.getByRole("button", { name: "Continue" });
    expect(confirm).toBeDisabled();
    fireEvent.click(confirm);
    expect(live.stripe).not.toHaveBeenCalled();

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "stripe" } });
    expect(confirm).toBeEnabled();
    fireEvent.click(confirm);
    await waitFor(() => expect(live.stripe).toHaveBeenCalledTimes(1));
  });

  it("treats malformed inventory as unavailable instead of crashing or inventing methods", async () => {
    live.command.mockResolvedValue([null]);
    render(<Boundary>{page()}</Boundary>);
    await screen.findByRole("alert");
    expect(screen.queryByText("Uncaught widget failure")).toBeNull();
    expect(live.stripe).not.toHaveBeenCalled();
  });
});

describe("Serialized payment inventory compatibility", () => {
  it("accepts nullable QR inventory for configured manual methods", async () => {
    live.command.mockResolvedValue([
      {
        code: "stripe",
        enabled: true,
        currencies: ["EGP", "USD"],
        destination: "",
        instructions: "",
        instructions_localized: {},
        qr_url: null,
      },
      { ...configured, instructions_localized: { en: "Synthetic instructions" }, qr_url: null },
      {
        code: "wallet",
        enabled: false,
        currencies: ["EGP"],
        destination: "",
        instructions: "",
        instructions_localized: {},
        qr_url: null,
      },
      {
        code: "bank",
        enabled: false,
        currencies: [],
        destination: "",
        instructions: "",
        instructions_localized: {},
        qr_url: null,
      },
      {
        code: "paymob",
        enabled: false,
        currencies: ["EGP"],
        destination: "",
        instructions: "",
        instructions_localized: {},
        qr_url: null,
      },
    ]);
    render(page());
    await waitFor(() =>
      expect(
        (screen.getByRole("option", { name: /InstaPay|إنستا باي/ }) as HTMLOptionElement).disabled,
      ).toBe(false),
    );
    expect(screen.queryByRole("alert")).toBeNull();
    expect(live.stripe).not.toHaveBeenCalled();
  });
  it("rejects malformed non-string QR metadata", async () => {
    live.command.mockResolvedValue([{ ...configured, qr_url: 42 }]);
    render(page());
    await screen.findByRole("alert");
    expect(
      (screen.getByRole("option", { name: /InstaPay|إنستا باي/ }) as HTMLOptionElement).disabled,
    ).toBe(true);
    expect(live.stripe).not.toHaveBeenCalled();
  });
});

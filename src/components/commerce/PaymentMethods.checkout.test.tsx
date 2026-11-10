import React from "react";
import { render, screen, fireEvent, waitFor, cleanup, act } from "@testing-library/react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { PaymentMethods } from "./PaymentMethods";
import { formatAmount } from "@/lib/commerce/copy";
const live = vi.hoisted(() => ({ locale: "en", command: vi.fn(), stripe: vi.fn() }));
vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: React.PropsWithChildren) => <a>{children}</a>,
}));
vi.mock("@/lib/locale/locale-context", () => ({ useLocale: () => ({ locale: live.locale }) }));
vi.mock("@/lib/commerce/commerce.functions", () => ({
  commerceCommand: live.command,
  uploadCommerceReceipt: vi.fn(() => {
    throw new Error("Unexpected receipt upload");
  }),
  readCommerceReceipt: vi.fn(() => {
    throw new Error("Unexpected receipt download");
  }),
}));
const method = {
  code: "instapay",
  enabled: true,
  currencies: ["EGP"],
  destination: "Synthetic account",
  instructions: "Synthetic transfer instructions",
};
const quote = {
  original_minor: 10000,
  final_minor: 9000,
  currency: "EGP",
  offer_kind: "discount",
  phone_required: false,
};
const order = {
  id: "synthetic-order",
  reference: "LAB-ORDER-01",
  final_minor: 9000,
  currency: "EGP",
  expires_at: "2030-01-01T00:00:00Z",
  review_status: "pending",
  instructions_snapshot: method,
};
const page = (interval: "month" | "year" = "month") => (
  <PaymentMethods
    packageKey="pro"
    interval={interval}
    market="EG"
    stripe={live.stripe}
    checkout={{ title: "Selected plan", summary: <p>Selected period: {interval}</p> }}
  >
    Confirm checkout
  </PaymentMethods>
);
const actions = (name: string) =>
  live.command.mock.calls.filter(([input]) => input.data.action === name);
async function open() {
  fireEvent.click(screen.getByRole("button", { name: "Confirm checkout" }));
  await screen.findByRole("dialog");
  await waitFor(() => expect(screen.queryByText("Loading payment methods…")).toBeNull());
}
async function manual() {
  await waitFor(() =>
    expect((screen.getByRole("option", { name: /InstaPay/ }) as HTMLOptionElement).disabled).toBe(
      false,
    ),
  );
  fireEvent.change(screen.getByRole("combobox"), { target: { value: "instapay" } });
}
async function review() {
  fireEvent.click(screen.getByRole("button", { name: "Review price" }));
  await screen.findByText(formatAmount(9000, "EGP", "en").replace(/\s+/g, " "));
}
async function close() {
  fireEvent.click(screen.getByRole("button", { name: /Back to packages|العودة إلى الباقات/ }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
}
beforeEach(() => {
  live.locale = "en";
  live.stripe.mockReset();
  live.command.mockReset();
  live.command.mockImplementation(async ({ data }) => {
    if (data.action === "methods") return [method];
    if (data.action === "quote") return quote;
    if (data.action === "create_order") return order;
    throw new Error("Unexpected financial action");
  });
});
afterEach(cleanup);
describe("Package selection to checkout presentation", () => {
  it("keeps payment steps out of the package card and restores focus after Escape", async () => {
    render(page());
    const trigger = screen.getByRole("button", { name: "Confirm checkout" });
    trigger.focus();
    expect(screen.queryByRole("combobox")).toBeNull();
    expect(screen.queryByText("Card provider")).toBeNull();
    await open();
    expect(screen.getByRole("dialog").textContent).toContain("Selected plan");
    expect(screen.getByRole("dialog").textContent).toContain("Selected period: month");
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });
  it("preserves selected method, coupon and authoritative manual order through close and reopen", async () => {
    render(page());
    await open();
    await manual();
    fireEvent.change(screen.getByRole("textbox", { name: "Offer code (optional)" }), {
      target: { value: "LABCODE" },
    });
    await review();
    await close();
    await open();
    expect(
      (screen.getByRole("textbox", { name: "Offer code (optional)" }) as HTMLInputElement).value,
    ).toBe("LABCODE");
    expect((screen.getByRole("combobox") as HTMLSelectElement).value).toBe("instapay");
    expect(screen.queryByText("Synthetic transfer instructions")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Confirm checkout" }));
    await screen.findByText("LAB-ORDER-01");
    expect(screen.getByText("Synthetic transfer instructions")).toBeTruthy();
    await close();
    await open();
    expect(screen.getByText("LAB-ORDER-01")).toBeTruthy();
    expect(actions("create_order")).toHaveLength(1);
  });
  it("keeps the financial request key when an unknown result is retried after reopening", async () => {
    let attempts = 0;
    live.command.mockImplementation(async ({ data }) => {
      if (data.action === "methods") return [method];
      if (data.action === "quote") return quote;
      if (data.action === "create_order") {
        if (++attempts === 1) throw new Error("Unknown result");
        return order;
      }
      throw new Error("Unexpected");
    });
    render(page());
    await open();
    await manual();
    await review();
    fireEvent.click(screen.getByRole("button", { name: "Confirm checkout" }));
    await screen.findByRole("alert");
    await close();
    await open();
    fireEvent.click(screen.getByRole("button", { name: "Confirm checkout" }));
    await screen.findByText("LAB-ORDER-01");
    const calls = actions("create_order");
    expect(calls).toHaveLength(2);
    expect(calls[0][0].data.data.key).toBe(calls[1][0].data.data.key);
  });
  it("prevents dismissing an in-flight manual order and permits close after it settles", async () => {
    let finish!: (value: unknown) => void;
    live.command.mockImplementation(({ data }) =>
      data.action === "methods"
        ? Promise.resolve([method])
        : data.action === "quote"
          ? Promise.resolve(quote)
          : new Promise((resolve) => {
              finish = resolve;
            }),
    );
    render(page());
    await open();
    await manual();
    await review();
    fireEvent.click(screen.getByRole("button", { name: "Confirm checkout" }));
    await waitFor(() =>
      expect(
        (screen.getByRole("button", { name: "Back to packages" }) as HTMLButtonElement).disabled,
      ).toBe(true),
    );
    fireEvent.click(screen.getByRole("button", { name: "Confirm checkout" }));
    expect(actions("create_order")).toHaveLength(1);
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(screen.getByRole("dialog")).toBeTruthy();
    await act(async () => finish(order));
    await screen.findByText("LAB-ORDER-01");
    await close();
  });
  for (const locale of ["en", "ar-EG", "ar-MSA", "ar-Gulf"])
    it(`provides an accessible checkout title and direction for ${locale}`, async () => {
      live.locale = locale;
      render(page());
      await open();
      const dialog = screen.getByRole("dialog", { name: /Selected plan/ });
      expect(dialog.getAttribute("dir")).toBe(locale === "en" ? "ltr" : "rtl");
      expect(dialog.getAttribute("aria-describedby")).toBeTruthy();
    });
  it("retains existing inline callers until their presentation is explicitly selected", async () => {
    render(
      <PaymentMethods packageKey="pro" interval="month" market="EG" stripe={live.stripe}>
        Continue
      </PaymentMethods>,
    );
    expect(screen.getByRole("combobox")).toBeTruthy();
    expect(screen.queryByRole("dialog")).toBeNull();
  });
  it("retires a quote when the actual period changes without treating closing as a selection change", async () => {
    const view = render(page());
    await open();
    await manual();
    await review();
    await close();
    view.rerender(page("year"));
    await open();
    expect(screen.queryByText(formatAmount(9000, "EGP", "en").replace(/\s+/g, " "))).toBeNull();
    expect(actions("create_order")).toHaveLength(0);
  });
  it("awaits card handoff so the checkout cannot dismiss or submit twice while pending", async () => {
    let finish!: () => void;
    live.stripe.mockReturnValue(
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
    );
    render(page());
    await open();
    fireEvent.click(screen.getByRole("button", { name: "Confirm checkout" }));
    await waitFor(() =>
      expect(
        (screen.getByRole("button", { name: "Back to packages" }) as HTMLButtonElement).disabled,
      ).toBe(true),
    );
    fireEvent.click(screen.getByRole("button", { name: "Confirm checkout" }));
    expect(live.stripe).toHaveBeenCalledTimes(1);
    await act(async () => finish());
  });
});

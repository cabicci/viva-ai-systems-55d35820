import { render, screen, within, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { afterEach, describe, it, expect, vi } from "vitest";
import { LocaleProvider } from "@/lib/locale/locale-context";
import { commerceCopy, formatAmount } from "@/lib/commerce/copy";
import { commandSchemas, type AdminData, type Order } from "@/lib/commerce/contracts";
import { AdminPayments } from "./AdminPayments";
import { adminPaymentsPresentation } from "@/lib/commerce/admin-payments-presentation";
vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock("@/lib/commerce/commerce.functions", () => ({ commerceCommand: vi.fn() }));
vi.mock("./ReceiptUpload", () => ({ ReceiptUpload: () => null, ReceiptView: () => null }));
afterEach(cleanup);
const payment = "00000000-0000-4000-8000-000000000001",
  order = "00000000-0000-4000-8000-000000000002";
const empty: AdminData = {
  groups: [],
  invitations: [],
  orders: [],
  payments: [],
  grants: [],
  offers: [],
  refunds: [],
  allocations: [],
  methods: [],
  entitlements: [],
};
const sample: AdminData = {
  ...empty,
  payments: [
    {
      id: payment,
      amount_minor: 40000,
      currency: "EGP",
      method: "instapay",
      transaction_reference: "SYNTHETIC-TRANSFER",
    },
  ],
  allocations: [{ payment_id: payment, order_id: order, amount_minor: 33800 }],
  orders: [{ id: order, reference: "SYNTHETIC-PAID-ORDER" } as Order],
};
function setup(locale: "en" | "ar-EG" | "ar-MSA" | "ar-Gulf" = "en", data = sample, busy = false) {
  const run = vi.fn().mockResolvedValue({ ok: true });
  const view = (current: AdminData, b = busy) => (
    <LocaleProvider initialLocale={locale}>
      <AdminPayments data={current} orders={[]} access={[]} run={run} busy={b} />
    </LocaleProvider>
  );
  const rendered = render(view(data)),
    w = commerceCopy(locale),
    p = adminPaymentsPresentation(locale);
  fireEvent.click(
    within(screen.getByRole("navigation", { name: p.tasks })).getByRole("button", {
      name: p.refund,
    }),
  );
  const form = within(screen.getByRole("button", { name: w.refund }).closest("form")!);
  function fill(target = `${payment}:unallocated`, amount = "62") {
    fireEvent.change(form.getByLabelText(w.payments), { target: { value: target } });
    const currency = data.payments.find((p) => p.id === target.split(":")[0])!.currency;
    fireEvent.change(form.getByLabelText(`${w.amount} (${currency})`), {
      target: { value: amount },
    });
    fireEvent.change(form.getByLabelText(w.transaction), { target: { value: "SYNTHETIC-REFUND" } });
    fireEvent.change(form.getByLabelText(w.reason), {
      target: { value: "Synthetic external return" },
    });
    fireEvent.click(form.getByLabelText(w.funds));
  }
  async function saved() {
    expect(await form.findByRole("status")).toHaveTextContent(w.saved);
    await waitFor(() => expect(form.getByLabelText(w.payments)).toBeEnabled());
  }
  return {
    run,
    w,
    form,
    fill,
    saved,
    rerender: (next: AdminData, b = busy) => rendered.rerender(view(next, b)),
  };
}
describe("administrator records only the remaining unallocated refund", () => {
  it.each(["en", "ar-EG", "ar-MSA", "ar-Gulf"] as const)(
    "offers localized unallocated funds and preserves the paid order in %s",
    async (locale) => {
      const { run, w, form, fill, saved } = setup(locale);
      const option = form.getByRole("option", {
        name: `SYNTHETIC-TRANSFER · ${w.remaining} · ${formatAmount(6200, "EGP", locale)}`,
      });
      expect(option).toHaveValue(`${payment}:unallocated`);
      fill();
      expect(form.queryByLabelText(w.refundAccess)).toBeNull();
      fireEvent.click(form.getByRole("button", { name: w.refund }));
      expect(run).toHaveBeenCalledTimes(1);
      const payload = run.mock.calls[0]![1];
      expect(run.mock.calls[0]![0]).toBe("refund");
      expect(commandSchemas.refund.safeParse(payload).success).toBe(true);
      expect(payload).toMatchObject({
        payment_id: payment,
        order_id: undefined,
        amount_minor: 6200,
        revoke_access: false,
        funds_verified: true,
      });
      await saved();
    },
  );
  it("deducts cumulative unallocated returns, blocks an over-cap amount and suppresses exhausted choices", async () => {
    const data = {
      ...sample,
      refunds: [{ id: "refund1", payment_id: payment, order_id: null, amount_minor: 2000 }],
    };
    const { run, w, form, fill, saved, rerender } = setup("en", data);
    fill(undefined, "42.01");
    expect(form.getByRole("button", { name: w.refund })).toBeDisabled();
    fireEvent.submit(form.getByRole("button", { name: w.refund }).closest("form")!);
    expect(run).not.toHaveBeenCalled();
    fireEvent.change(form.getByLabelText(`${w.amount} (EGP)`), { target: { value: "42" } });
    fireEvent.click(form.getByRole("button", { name: w.refund }));
    expect(run.mock.calls[0]![1]).toMatchObject({ amount_minor: 4200 });
    await saved();
    rerender({
      ...data,
      refunds: [
        ...data.refunds,
        { id: "refund2", payment_id: payment, order_id: null, amount_minor: 4200 },
      ],
    });
    expect(form.getByLabelText(w.payments)).toBeEnabled();
    expect(form.queryByRole("option", { name: /Unallocated funds/ })).toBeNull();
    expect(form.getByRole("button", { name: w.refund })).toBeDisabled();
    fireEvent.submit(form.getByRole("button", { name: w.refund }).closest("form")!);
    expect(run).toHaveBeenCalledTimes(1);
  });
  it("keeps allocated refunds separate and cannot carry their revocation flag into unallocated funds", async () => {
    const { run, w, form, fill, saved } = setup();
    fill(`${payment}:${order}`, "10");
    fireEvent.click(form.getByLabelText(w.refundAccess));
    fireEvent.click(form.getByRole("button", { name: w.refund }));
    expect(run.mock.calls[0]![1]).toMatchObject({
      order_id: order,
      revoke_access: true,
      amount_minor: 1000,
    });
    await saved();
    fireEvent.change(form.getByLabelText(w.payments), {
      target: { value: `${payment}:unallocated` },
    });
    expect(form.queryByLabelText(w.refundAccess)).toBeNull();
    expect(form.getByRole("button", { name: w.refund })).toBeDisabled();
    fireEvent.click(form.getByLabelText(w.funds));
    fireEvent.click(form.getByRole("button", { name: w.refund }));
    expect(run.mock.calls[1]![1]).toMatchObject({ order_id: undefined, revoke_access: false });
    await saved();
  });
  it("preserves the same request key for an uncertain retry and never allocates again", async () => {
    const { run, w, form, fill } = setup();
    run.mockResolvedValue(undefined);
    fill();
    fireEvent.click(form.getByRole("button", { name: w.refund }));
    fireEvent.click(form.getByRole("button", { name: w.refund }));
    expect(run).toHaveBeenCalledTimes(1);
    expect(await form.findByRole("alert")).toHaveTextContent(
      adminPaymentsPresentation("en").savedInputs,
    );
    await waitFor(() => expect(form.getByRole("button", { name: w.refund })).toBeEnabled());
    fireEvent.click(form.getByRole("button", { name: w.refund }));
    expect(await form.findByRole("alert")).toHaveTextContent(
      adminPaymentsPresentation("en").savedInputs,
    );
    await waitFor(() => expect(form.getByRole("button", { name: w.refund })).toBeEnabled());
    expect(run).toHaveBeenCalledTimes(2);
    expect(run.mock.calls[1]).toEqual(run.mock.calls[0]);
    expect(run.mock.calls.every((call) => call[0] === "refund")).toBe(true);
  });
  it("shows exact USD cents independently and refuses busy or unverified submissions", async () => {
    const data = {
      ...empty,
      payments: [{ ...sample.payments[0], currency: "USD", amount_minor: 699 }],
    };
    const { run, w, form, fill, saved, rerender } = setup("en", data);
    fill(undefined, "6.99");
    expect(form.getByRole("option", { name: /Unallocated funds/ })).toHaveTextContent(
      formatAmount(699, "USD", "en"),
    );
    rerender(data, true);
    fireEvent.submit(form.getByRole("button", { name: w.refund }).closest("form")!);
    expect(run).not.toHaveBeenCalled();
    rerender(data, false);
    fireEvent.click(form.getByLabelText(w.funds));
    fireEvent.submit(form.getByRole("button", { name: w.refund }).closest("form")!);
    expect(run).not.toHaveBeenCalled();
    fireEvent.click(form.getByLabelText(w.funds));
    fireEvent.click(form.getByRole("button", { name: w.refund }));
    expect(run.mock.calls[0]![1]).toMatchObject({ amount_minor: 699, revoke_access: false });
    await saved();
  });
});

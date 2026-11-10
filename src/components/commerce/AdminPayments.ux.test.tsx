import React from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { render, screen, within, fireEvent, cleanup, act } from "@testing-library/react";
import type { AdminData, Order, Entitlement } from "@/lib/commerce/contracts";
import type { SupportedLocale } from "@/lib/locale/types";
import { commerceCopy } from "@/lib/commerce/copy";
import {
  adminPaymentsPresentation,
  type AdminPaymentTask,
} from "@/lib/commerce/admin-payments-presentation";

const h = vi.hoisted(() => ({
  locale: "en" as SupportedLocale,
  pending: false,
  error: null as unknown,
  refetch: vi.fn(),
  command: vi.fn(),
  detail: { receipts: [] } as unknown,
}));
vi.mock("@/lib/locale/locale-context", () => ({ useLocale: () => ({ locale: h.locale }) }));
vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({
    data: h.detail,
    isPending: h.pending,
    isFetching: false,
    error: h.error,
    refetch: h.refetch,
  }),
}));
vi.mock("@tanstack/react-start", () => ({ useServerFn: () => h.command }));
vi.mock("@/lib/commerce/commerce.functions", () => ({
  commerceCommand: () => {
    throw Error("REAL_SERVER_FORBIDDEN");
  },
}));
vi.mock("@/components/ui/button", () => ({
  Button: ({ variant, ...props }: any) => <button {...props} />,
}));
vi.mock("./ReceiptUpload", () => ({
  ReceiptUpload: () => <div>Receipt upload boundary</div>,
  ReceiptView: () => <div>Receipt view boundary</div>,
}));
import { AdminPayments } from "./AdminPayments";

const empty = (): AdminData => ({
  groups: [],
  orders: [],
  invitations: [],
  payments: [],
  entitlements: [],
  offers: [],
  grants: [],
  refunds: [],
  allocations: [],
  methods: [],
});
const order = (id = "order-a", override: Partial<Order> = {}): Order => ({
  id,
  reference: `REF-${id}`,
  user_id: "synthetic-user",
  recipient_email: `${id}@example.test`,
  package: "pro",
  billing_interval: "month",
  review_status: "pending",
  method: "bank",
  group_id: null,
  original_minor: 10000,
  final_minor: 10000,
  currency: "EGP",
  expires_at: "2099-01-01T00:00:00Z",
  instructions_snapshot: {
    code: "bank",
    enabled: true,
    instructions: "Synthetic only",
    destination: "Synthetic",
    currencies: ["EGP"],
  },
  ...override,
});
const entitlement = (id: string): Entitlement => ({
  id,
  user_id: "synthetic-user",
  package: "pro",
  order_id: "order-a",
  grant_id: null,
  starts_at: "2020-01-01T00:00:00Z",
  ends_at: "2099-01-01T00:00:00Z",
  revoked_at: null,
});
beforeEach(() => {
  vi.clearAllMocks();
  h.locale = "en";
  h.pending = false;
  h.error = null;
  h.detail = { receipts: [] };
});
afterEach(cleanup);
function setup(
  data = { ...empty(), orders: [order()] },
  options: { orders?: Order[]; access?: Entitlement[]; initial?: string; busy?: boolean } = {},
) {
  const run = vi
    .fn<(action: string, data: unknown) => Promise<unknown>>()
    .mockResolvedValue({ ok: true });
  const view = (busy = options.busy ?? false) => (
    <AdminPayments
      data={data}
      orders={options.orders ?? data.orders}
      access={options.access ?? data.entitlements}
      initialOrderId={options.initial}
      run={run}
      busy={busy}
    />
  );
  const rendered = render(view());
  const p = adminPaymentsPresentation(h.locale),
    w = commerceCopy(h.locale);
  const choose = (task: AdminPaymentTask) =>
    fireEvent.click(
      within(screen.getByRole("navigation", { name: p.tasks })).getByRole("button", {
        name: p[task],
      }),
    );
  const section = (task: AdminPaymentTask) => within(screen.getByRole("region", { name: p[task] }));
  return { run, p, w, choose, section, rerender: (busy: boolean) => rendered.rerender(view(busy)) };
}
const input = (scope: ReturnType<typeof within>, label: string, value: string) =>
  fireEvent.change(scope.getByLabelText(label), { target: { value } });
async function submit(scope: ReturnType<typeof within>) {
  await act(async () =>
    fireEvent.submit(
      scope
        .getAllByRole("button")
        .find((b: HTMLElement) => b.getAttribute("type") === "submit")!
        .closest("form")!,
    ),
  );
}
function paymentInputs(s: ReturnType<typeof setup>, verify = true) {
  s.choose("record");
  const form = s.section("record");
  input(form, `${s.w.received} (EGP)`, "100");
  input(form, s.w.transaction, "TRANSFER-100");
  input(form, s.w.receivedAt, "2026-11-05T10:00");
  if (verify) fireEvent.click(form.getByLabelText(s.w.funds));
  return form;
}

it.each(["en", "ar-EG", "ar-MSA", "ar-Gulf"] as const)(
  "separates the actual task views and explains empty results in %s",
  (locale) => {
    h.locale = locale;
    const s = setup(empty());
    const nav = screen.getByRole("navigation", { name: s.p.tasks });
    expect(nav.querySelectorAll("button")).toHaveLength(4);
    expect(nav.closest("[dir]")?.getAttribute("dir")).toBe(locale === "en" ? "ltr" : "rtl");
    expect(s.section("review").getByText(s.p.noOrders)).toBeTruthy();
    expect(screen.queryByRole("region", { name: s.p.refund })).toBeNull();
    s.choose("record");
    expect(s.section("record").getByText(s.p.noEligible)).toBeTruthy();
    s.choose("access");
    expect(s.section("access").getByText(s.p.noAccess)).toBeTruthy();
    s.choose("refund");
    expect(s.section("refund").getByText(s.p.noRefunds)).toBeTruthy();
    expect(s.run).not.toHaveBeenCalled();
    expect(h.command).not.toHaveBeenCalled();
  },
);
it("uses the supplied filtered orders/access and preserves the initial order selection in its summary", () => {
  const a = order(),
    b = order("hidden-order"),
    first = entitlement("shown-access"),
    other = entitlement("hidden-access");
  const s = setup(
    { ...empty(), orders: [a, b], entitlements: [first, other] },
    { orders: [a], access: [first], initial: a.id },
  );
  expect(s.section("review").getByText(a.reference)).toBeTruthy();
  expect(s.section("review").queryByText(b.reference)).toBeNull();
  s.choose("record");
  const summary = s.section("record").getByRole("region", { name: s.p.selection });
  expect(summary.textContent).toContain(a.reference);
  expect(summary.textContent).toContain(a.recipient_email);
  s.choose("access");
  expect(s.section("access").getAllByRole("article")).toHaveLength(1);
  expect(s.run).not.toHaveBeenCalled();
});
it("shows pending/failed receipt reads separately and retries without a financial command", () => {
  h.pending = true;
  h.detail = undefined;
  const s = setup();
  expect(s.section("review").getByText(s.p.receiptLoading)).toBeTruthy();
  h.pending = false;
  h.error = new Error("synthetic read failure");
  s.rerender(false);
  expect(s.section("review").getByRole("alert").textContent).toContain(s.p.receiptFailed);
  fireEvent.click(s.section("review").getByRole("button", { name: s.p.retry }));
  expect(h.refetch).toHaveBeenCalledTimes(1);
  expect(s.run).not.toHaveBeenCalled();
});
it("keeps confirmation inputs and the exact request key through a failed result and task switching", async () => {
  const s = setup(undefined, { initial: "order-a" });
  s.run.mockResolvedValueOnce(undefined);
  let form = paymentInputs(s);
  await submit(form);
  expect(form.getByRole("alert").textContent).toBe(s.p.savedInputs);
  const first = s.run.mock.calls[0];
  expect(first[0]).toBe("confirm");
  expect(first[1]).toEqual({
    key: expect.any(String),
    method: "bank",
    currency: "EGP",
    group_id: undefined,
    amount_minor: 10000,
    transaction_reference: "TRANSFER-100",
    received_at: new Date("2026-11-05T10:00").toISOString(),
    funds_verified: true,
    reuse_review: "",
    allocations: [{ order_id: "order-a", amount_minor: 10000 }],
  });
  s.choose("access");
  s.choose("record");
  form = s.section("record");
  expect((form.getByLabelText(s.w.transaction) as HTMLInputElement).value).toBe("TRANSFER-100");
  expect((form.getByLabelText(s.w.funds) as HTMLInputElement).checked).toBe(true);
  await submit(form);
  expect(s.run.mock.calls[1]).toEqual(first);
  expect(form.getByRole("status").textContent).toBe(s.w.paymentRecorded);
});
it("blocks direct form submission when funds are unverified or the parent is busy", async () => {
  const s = setup(undefined, { initial: "order-a" });
  const form = paymentInputs(s, false);
  await submit(form);
  expect(s.run).not.toHaveBeenCalled();
  fireEvent.click(form.getByLabelText(s.w.funds));
  s.rerender(true);
  await submit(s.section("record"));
  expect(s.run).not.toHaveBeenCalled();
  expect(screen.getByText(s.p.saving)).toBeTruthy();
});
it("explains incompatible selected orders and makes no financial call", async () => {
  const s = setup(
    { ...empty(), orders: [order(), order("other", { currency: "USD" })] },
    { initial: "order-a" },
  );
  const form = paymentInputs(s);
  fireEvent.click(form.getByRole("checkbox", { name: /REF-other/ }));
  expect(form.getByRole("alert").textContent).toBe(s.p.incompatible);
  await submit(form);
  expect(s.run).not.toHaveBeenCalled();
});
it("retains allocation arguments and rejects a payment owned by an incompatible source", async () => {
  const data = {
    ...empty(),
    orders: [order()],
    payments: [
      {
        id: "payment-a",
        amount_minor: 12000,
        currency: "EGP",
        method: "bank",
        user_id: "synthetic-user",
        transaction_reference: "EXISTING-A",
      },
      {
        id: "payment-other",
        amount_minor: 12000,
        currency: "EGP",
        method: "bank",
        user_id: "other-user",
        transaction_reference: "EXISTING-OTHER",
      },
    ],
  };
  const s = setup(data, { initial: "order-a" });
  s.choose("record");
  const form = s.section("record");
  input(form, s.w.allocateExisting, "payment-other");
  fireEvent.click(form.getByLabelText(s.w.funds));
  expect(form.getByRole("alert").textContent).toBe(s.p.incompatibleSource);
  await submit(form);
  expect(s.run).not.toHaveBeenCalled();
  input(form, s.w.allocateExisting, "payment-a");
  input(form, s.w.reason, "Reviewed balance");
  await submit(form);
  expect(s.run.mock.calls[0]).toEqual([
    "allocate",
    {
      payment_id: "payment-a",
      key: expect.any(String),
      reuse_review: "Reviewed balance",
      allocations: [{ order_id: "order-a", amount_minor: 10000 }],
    },
  ]);
});
it("locks task switching and prevents a duplicate while a local command is unresolved", async () => {
  const s = setup(undefined, { initial: "order-a" });
  let resolve!: (value: unknown) => void;
  s.run.mockImplementationOnce(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  const form = paymentInputs(s);
  await submit(form);
  await submit(form);
  expect(s.run).toHaveBeenCalledTimes(1);
  const accessButton = within(screen.getByRole("navigation", { name: s.p.tasks })).getByRole(
    "button",
    { name: s.p.access },
  ) as HTMLButtonElement;
  expect(accessButton.disabled).toBe(true);
  expect(form.getByLabelText(s.w.transaction).closest("fieldset")?.disabled).toBe(true);
  await act(async () => resolve(undefined));
  expect(accessButton.disabled).toBe(false);
  expect(form.getByRole("alert").textContent).toBe(s.p.savedInputs);
});
it("preserves a failed unallocated refund and its key through task switches without revoking order access", async () => {
  const data = {
    ...empty(),
    orders: [order()],
    payments: [
      {
        id: "payment-a",
        amount_minor: 12000,
        currency: "EGP",
        method: "bank",
        transaction_reference: "EXISTING-A",
      },
    ],
    allocations: [{ payment_id: "payment-a", order_id: "order-a", amount_minor: 10000 }],
  };
  const s = setup(data);
  s.run.mockRejectedValueOnce(new Error("synthetic"));
  s.choose("refund");
  let form = s.section("refund");
  input(form, s.w.payments, "payment-a:unallocated");
  input(form, `${s.w.amount} (EGP)`, "20");
  input(form, s.w.transaction, "RETURN-20");
  input(form, s.w.reason, "Returned externally");
  fireEvent.click(form.getByLabelText(s.w.funds));
  expect(form.queryByLabelText(s.w.refundAccess)).toBeNull();
  expect(form.getByRole("region", { name: s.p.refundTarget }).textContent).toContain("EXISTING-A");
  await submit(form);
  const first = s.run.mock.calls[0];
  expect(first).toEqual([
    "refund",
    {
      payment_id: "payment-a",
      order_id: undefined,
      amount_minor: 2000,
      reference: "RETURN-20",
      reason: "Returned externally",
      funds_verified: true,
      revoke_access: false,
      key: expect.any(String),
    },
  ]);
  expect(form.getByRole("alert").textContent).toBe(s.p.savedInputs);
  s.choose("review");
  s.choose("refund");
  form = s.section("refund");
  await submit(form);
  expect(s.run.mock.calls[1]).toEqual(first);
  expect(form.getByRole("status").textContent).toBe(s.w.saved);
});
it("keeps allocated refund target/revocation arguments and blocks over-cap or unverified values", async () => {
  const data = {
    ...empty(),
    orders: [order()],
    payments: [
      {
        id: "payment-a",
        amount_minor: 10000,
        currency: "EGP",
        method: "bank",
        transaction_reference: "EXISTING-A",
      },
    ],
    allocations: [{ payment_id: "payment-a", order_id: "order-a", amount_minor: 10000 }],
  };
  const s = setup(data);
  s.choose("refund");
  const form = s.section("refund");
  input(form, s.w.payments, "payment-a:order-a");
  input(form, `${s.w.amount} (EGP)`, "101");
  input(form, s.w.transaction, "RETURN");
  input(form, s.w.reason, "Returned externally");
  await submit(form);
  expect(s.run).not.toHaveBeenCalled();
  fireEvent.click(form.getByLabelText(s.w.funds));
  await submit(form);
  expect(s.run).not.toHaveBeenCalled();
  input(form, `${s.w.amount} (EGP)`, "10");
  fireEvent.click(form.getByLabelText(s.w.refundAccess));
  await submit(form);
  expect(s.run.mock.calls[0]).toEqual([
    "refund",
    {
      payment_id: "payment-a",
      order_id: "order-a",
      amount_minor: 1000,
      reference: "RETURN",
      reason: "Returned externally",
      funds_verified: true,
      revoke_access: true,
      key: expect.any(String),
    },
  ]);
});
it("keeps order review failure beside the order and preserves its reason and exact action", async () => {
  const s = setup();
  s.run.mockResolvedValueOnce(undefined);
  const card = within(s.section("review").getByRole("article"));
  input(card, s.w.reason, "Receipt needs review");
  await act(async () => fireEvent.click(card.getByRole("button", { name: s.w.reject })));
  expect(s.run.mock.calls[0]).toEqual([
    "review",
    { id: "order-a", status: "rejected", reason: "Receipt needs review" },
  ]);
  expect(card.getByRole("alert").textContent).toBe(s.p.savedInputs);
  s.choose("access");
  s.choose("review");
  expect((card.getByLabelText(s.w.reason) as HTMLInputElement).value).toBe("Receipt needs review");
});
it("keeps access actions scoped and retains the request key and reason after a failed revoke", async () => {
  const s = setup({ ...empty(), orders: [order()], entitlements: [entitlement("access-a")] });
  s.run.mockResolvedValueOnce(undefined);
  s.choose("access");
  const panel = s.section("access");
  expect(panel.queryByRole("button", { name: s.w.extend })).toBeNull();
  input(panel, s.w.reason, "Synthetic scoped revocation");
  await act(async () => fireEvent.click(panel.getByRole("button", { name: s.w.revoke })));
  const first = s.run.mock.calls[0];
  expect(first).toEqual([
    "manage_access",
    {
      id: "access-a",
      operation: "revoke",
      reason: "Synthetic scoped revocation",
      key: expect.any(String),
    },
  ]);
  expect(panel.getByRole("alert").textContent).toBe(s.p.savedInputs);
  s.choose("review");
  s.choose("access");
  await act(async () =>
    fireEvent.click(s.section("access").getByRole("button", { name: s.w.revoke })),
  );
  expect(s.run.mock.calls[1]).toEqual(first);
});

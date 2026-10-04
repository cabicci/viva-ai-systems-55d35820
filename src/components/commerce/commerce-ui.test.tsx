import { AdminOffers } from "./AdminOffers";
import { adminOfferCopy } from "@/lib/commerce/admin-offer-copy";
import { render, screen, fireEvent, waitFor, cleanup, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LocaleProvider } from "@/lib/locale/locale-context";
import { PaymentMethods } from "./PaymentMethods";
import { ReceiptView } from "./ReceiptUpload";
import { AdminGroups } from "./AdminGroups";
import { AdminPayments } from "./AdminPayments";
import { AdminSettings } from "./AdminSettings";
import { moneyToMinor } from "@/lib/commerce/admin-ui";
import { commerceCopy } from "@/lib/commerce/copy";
import { commandSchemas, type AdminData, type Order } from "@/lib/commerce/contracts";
const mock = vi.hoisted(() => ({
  command: vi.fn(),
  upload: vi.fn(),
  dispatch: vi.fn(),
  read: vi.fn(),
}));
vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock("@/lib/commerce/commerce.functions", () => ({
  commerceCommand: mock.command,
  uploadCommerceReceipt: mock.upload,
  readCommerceReceipt: mock.read,
  previewCommerceInvitation: vi.fn(),
  dispatchCommerceInvitations: mock.dispatch,
}));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));
const empty: AdminData = {
  groups: [{ id: "00000000-0000-4000-8000-000000000001", name: "Synthetic", send_state: "paused" }],
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
beforeEach(() => {
  vi.clearAllMocks();
  mock.command.mockImplementation(async ({ data }: { data: { action: string } }) =>
    data.action === "methods"
      ? [
          {
            code: "instapay",
            enabled: true,
            destination: "SYNTHETIC",
            instructions: "Synthetic instructions",
            currencies: ["EGP"],
          },
        ]
      : { original_minor: 16900, final_minor: 16900, currency: "EGP" },
  );
});
afterEach(cleanup);
describe("administrator payment amounts", () => {
  const order: Order = {
    id: "00000000-0000-4000-8000-000000000009",
    reference: "SYNTHETIC-ORDER",
    user_id: "synthetic-user",
    recipient_email: "buyer@example.test",
    package: "pro",
    billing_interval: "month",
    review_status: "pending",
    method: "instapay",
    currency: "EGP",
    original_minor: 16900,
    final_minor: 16900,
    expires_at: "2099-01-01T00:00:00Z",
    group_id: null,
    instructions_snapshot: {
      code: "instapay",
      enabled: true,
      instructions: "Synthetic",
      destination: "Synthetic",
      currencies: ["EGP"],
    },
  };
  function setup(
    locale: "ar-EG" | "ar-MSA" | "ar-Gulf" | "en",
    sample = order,
    initialOrderId?: string,
  ) {
    const run = vi.fn().mockResolvedValue({ id: "synthetic-payment" });
    render(
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <LocaleProvider initialLocale={locale}>
          <AdminPayments
            initialOrderId={initialOrderId}
            data={{ ...empty, orders: [sample] }}
            orders={[sample]}
            access={[]}
            run={run}
            busy={false}
          />
        </LocaleProvider>
      </QueryClientProvider>,
    );
    const w = commerceCopy(locale);
    const form = within(screen.getByRole("button", { name: w.confirm }).closest("form")!);
    if (initialOrderId) return { run, form, w };
    fireEvent.click(form.getByRole("checkbox", { name: /SYNTHETIC-ORDER/ }));
    fireEvent.change(form.getByLabelText(w.transaction), {
      target: { value: "synthetic-transfer" },
    });
    fireEvent.click(form.getByRole("checkbox", { name: w.funds }));
    return { run, form, w };
  }
  it.each(["ar-EG", "ar-MSA", "ar-Gulf", "en"] as const)(
    "records 169 EGP as 16900 minor units and displays confirmation in %s",
    async (locale) => {
      const { run, form, w } = setup(locale);
      expect(form.getByLabelText(`${w.paymentAllocation} (EGP)`)).toHaveValue(169);
      fireEvent.change(form.getByLabelText(`${w.received} (EGP)`), { target: { value: "169" } });
      fireEvent.click(form.getByRole("button", { name: w.confirm }));
      await waitFor(() =>
        expect(run).toHaveBeenCalledWith(
          "confirm",
          expect.objectContaining({
            amount_minor: 16900,
            allocations: [{ order_id: order.id, amount_minor: 16900 }],
          }),
        ),
      );
      expect(await form.findByText(w.paymentRecorded)).toBeInTheDocument();
    },
  );
  it("opens an emailed pending order with its allocation ready but still requires funds verification", () => {
    const { form, w } = setup("en", order, order.id);
    expect(form.getByLabelText(`${w.paymentAllocation} (EGP)`)).toHaveValue(169);
    expect(form.getByRole("button", { name: w.confirm })).toBeDisabled();
  });
  it("preserves cents exactly for a supported USD payment", async () => {
    const { run, form, w } = setup("en", {
      ...order,
      method: "bank",
      currency: "USD",
      original_minor: 699,
      final_minor: 699,
    });
    fireEvent.change(form.getByLabelText(`${w.received} (USD)`), { target: { value: "6.99" } });
    fireEvent.click(form.getByRole("button", { name: w.confirm }));
    await waitFor(() =>
      expect(run).toHaveBeenCalledWith(
        "confirm",
        expect.objectContaining({
          amount_minor: 699,
          allocations: [{ order_id: order.id, amount_minor: 699 }],
        }),
      ),
    );
  });
  it("explains partial allocations before and after saving", async () => {
    const { run, form, w } = setup("en");
    fireEvent.change(form.getByLabelText(`${w.received} (EGP)`), { target: { value: "1.69" } });
    fireEvent.change(form.getByLabelText(`${w.paymentAllocation} (EGP)`), {
      target: { value: "1.69" },
    });
    expect(form.getByText(w.partialPaymentWarning)).toBeInTheDocument();
    fireEvent.click(form.getByRole("button", { name: w.confirm }));
    expect(await form.findByText(w.partialPaymentRecorded)).toBeInTheDocument();
    expect(run).toHaveBeenCalledWith("confirm", expect.objectContaining({ amount_minor: 169 }));
    expect(form.queryByText(w.paymentRecorded)).toBeNull();
  });
  it("blocks an invalid amount and keeps a server failure next to the confirmation button", async () => {
    const { run, form, w } = setup("en");
    fireEvent.change(form.getByLabelText(`${w.received} (EGP)`), { target: { value: "169.001" } });
    expect(form.getByRole("button", { name: w.confirm })).toBeDisabled();
    fireEvent.change(form.getByLabelText(`${w.received} (EGP)`), { target: { value: "169" } });
    run.mockResolvedValue(undefined);
    fireEvent.click(form.getByRole("button", { name: w.confirm }));
    expect(await form.findByRole("alert")).toHaveTextContent(w.error);
    expect(form.queryByText(w.paymentRecorded)).toBeNull();
  });
  it("parses major units without rounding or accepting invalid precision", () => {
    expect(moneyToMinor("169")).toBe(16900);
    expect(moneyToMinor("6.99")).toBe(699);
    expect(moneyToMinor("١٦٩٫٥٠")).toBe(16950);
    for (const value of ["", "-1", "1.001", "1e3", "10000001"])
      expect(moneyToMinor(value)).toBeNaN();
  });
  it.each(["instapay", "wallet"] as const)(
    "restricts %s configuration to EGP in both UI and server validation",
    (code) => {
      const method = {
        code,
        enabled: true,
        destination: "Synthetic",
        instructions: "Synthetic",
        currencies: ["EGP"],
      };
      render(
        <AdminSettings
          data={{ ...empty, methods: [method] }}
          w={commerceCopy("en")}
          run={vi.fn()}
          busy={false}
        />,
      );
      const form = screen.getByRole("heading", { name: commerceCopy("en")[code] }).closest("form")!;
      expect(within(form).queryByRole("option", { name: "USD" })).toBeNull();
      expect(commandSchemas.configure_method.safeParse(method).success).toBe(true);
      expect(
        commandSchemas.configure_method.safeParse({ ...method, currencies: ["USD"] }).success,
      ).toBe(false);
      expect(
        commandSchemas.configure_method.safeParse({ ...method, currencies: ["EGP", "USD"] })
          .success,
      ).toBe(false);
    },
  );
});
describe("private receipt preview", () => {
  const createUrl = vi.fn(() => "blob:receipt-preview"),
    revokeUrl = vi.fn();
  beforeEach(() => {
    vi.stubGlobal(
      "URL",
      class extends URL {
        static createObjectURL = createUrl;
        static revokeObjectURL = revokeUrl;
      },
    );
    mock.read.mockResolvedValue({ mime: "image/png", base64: btoa("synthetic receipt") });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });
  it.each(["ar-EG", "ar-MSA", "ar-Gulf", "en"] as const)(
    "previews without downloading, offers an explicit download and releases bytes on close in %s",
    async (locale) => {
      const automaticDownload = vi
        .spyOn(HTMLAnchorElement.prototype, "click")
        .mockImplementation(() => {});
      const w = commerceCopy(locale);
      render(
        <LocaleProvider initialLocale={locale}>
          <ReceiptView id="receipt-1" />
        </LocaleProvider>,
      );
      fireEvent.click(screen.getByRole("button", { name: w.viewReceipt }));
      expect(screen.getByRole("dialog", { name: w.viewReceipt })).toHaveAttribute(
        "dir",
        locale === "en" ? "ltr" : "rtl",
      );
      expect(await screen.findByRole("img", { name: w.receipt })).toHaveAttribute(
        "src",
        "blob:receipt-preview",
      );
      expect(automaticDownload).not.toHaveBeenCalled();
      expect(screen.getByRole("link", { name: w.downloadReceipt })).toHaveAttribute(
        "download",
        "receipt-receipt-1.png",
      );
      fireEvent.click(screen.getByRole("button", { name: w.closeReceipt }));
      expect(screen.queryByRole("dialog")).toBeNull();
      expect(revokeUrl).toHaveBeenCalledWith("blob:receipt-preview");
      fireEvent.click(screen.getByRole("button", { name: w.viewReceipt }));
      await screen.findByRole("img", { name: w.receipt });
      expect(mock.read).toHaveBeenCalledTimes(2);
    },
  );
  it("embeds PDFs with an explicit download fallback", async () => {
    mock.read.mockResolvedValue({ mime: "application/pdf", base64: btoa("%PDF-synthetic") });
    render(
      <LocaleProvider initialLocale="en">
        <ReceiptView id="pdf-1" />
      </LocaleProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "View receipt" }));
    expect(await screen.findByLabelText("Payment receipt")).toHaveAttribute(
      "type",
      "application/pdf",
    );
    expect(screen.getByRole("link", { name: "Download receipt" })).toHaveAttribute(
      "download",
      "receipt-pdf-1.pdf",
    );
  });
  it("shows an access failure without exposing or downloading a file", async () => {
    mock.read.mockRejectedValue(new Error("Receipt access denied"));
    render(
      <LocaleProvider initialLocale="en">
        <ReceiptView id="denied" />
      </LocaleProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "View receipt" }));
    await screen.findByRole("alert");
    expect(createUrl).not.toHaveBeenCalled();
    expect(screen.queryByRole("link", { name: "Download receipt" })).toBeNull();
  });
  it("does not keep receipt bytes when closed before the read finishes", async () => {
    let finish!: (receipt: { mime: string; base64: string }) => void;
    mock.read.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    render(
      <LocaleProvider initialLocale="en">
        <ReceiptView id="slow" />
      </LocaleProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "View receipt" }));
    fireEvent.click(screen.getByRole("button", { name: "Close preview" }));
    finish({ mime: "image/jpeg", base64: btoa("synthetic") });
    await Promise.resolve();
    expect(createUrl).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
describe("commerce journeys", () => {
  it.each(["ar-EG", "ar-MSA", "ar-Gulf", "en"] as const)(
    "renders the frozen order instructions in the selected locale %s",
    async (locale) => {
      const localized = {
        "ar-EG": "تعليمات التحويل المصرية",
        "ar-MSA": "تعليمات التحويل بالفصحى",
        "ar-Gulf": "تعليمات التحويل الخليجية",
        en: "English transfer instructions",
      };
      const w = commerceCopy(locale);
      mock.command.mockImplementation(async ({ data }: { data: { action: string } }) => {
        if (data.action === "methods")
          return [
            {
              code: "instapay",
              enabled: true,
              destination: "Synthetic QR",
              instructions: "Fallback",
              currencies: ["EGP"],
            },
          ];
        if (data.action === "quote")
          return { original_minor: 16900, final_minor: 16900, currency: "EGP" };
        return {
          id: "00000000-0000-4000-8000-000000000009",
          reference: "SYNTHETIC",
          final_minor: 16900,
          currency: "EGP",
          review_status: "confirmed",
          expires_at: "2027-01-01T00:00:00Z",
          instructions_snapshot: {
            instructions: "Fallback",
            instructions_localized: localized,
            destination: "Synthetic QR",
            qr_url: "https://example.test/qr.png",
          },
        };
      });
      render(
        <LocaleProvider initialLocale={locale}>
          <PaymentMethods packageKey="pro" interval="month" market="EG" stripe={vi.fn()}>
            {w.continue}
          </PaymentMethods>
        </LocaleProvider>,
      );
      await waitFor(() => expect(screen.getByRole("option", { name: w.instapay })).toBeEnabled());
      fireEvent.change(screen.getByRole("combobox"), { target: { value: "instapay" } });
      fireEvent.click(screen.getByRole("button", { name: w.quote }));
      await waitFor(() => expect(screen.getByRole("button", { name: w.continue })).toBeEnabled());
      fireEvent.click(screen.getByRole("button", { name: w.continue }));
      await waitFor(() => expect(screen.getByText(localized[locale])).toBeInTheDocument());
      expect(screen.queryByText("Fallback")).toBeNull();
      expect(screen.getByRole("img", { name: "QR" })).toHaveAttribute(
        "src",
        "https://example.test/qr.png",
      );
    },
  );
  it.each(["ar-EG", "ar-MSA", "ar-Gulf", "en"] as const)(
    "shows a provider-neutral wallet and hides deferred bank transfer in %s",
    async (locale) => {
      const w = commerceCopy(locale);
      render(
        <LocaleProvider initialLocale={locale}>
          <PaymentMethods packageKey="pro" interval="month" market="EG" stripe={vi.fn()}>
            Continue
          </PaymentMethods>
        </LocaleProvider>,
      );
      await waitFor(() => expect(mock.command).toHaveBeenCalled());
      expect(
        screen.getByRole("option", {
          name: `${locale === "en" ? "Wallet" : "محفظة"} — ${w.unavailable}`,
        }),
      ).toBeDisabled();
      expect(screen.queryByRole("option", { name: new RegExp(w.bank) })).toBeNull();
    },
  );
  it("shows bank transfer only when fully configured for the customer's currency", async () => {
    const bank = {
      code: "bank",
      enabled: true,
      destination: "SYNTHETIC",
      instructions: "Synthetic",
      currencies: ["USD"],
    };
    mock.command.mockResolvedValue([bank]);
    const view = render(
      <LocaleProvider initialLocale="en">
        <PaymentMethods packageKey="pro" interval="month" market="EG" stripe={vi.fn()}>
          Continue
        </PaymentMethods>
      </LocaleProvider>,
    );
    await waitFor(() => expect(mock.command).toHaveBeenCalled());
    expect(screen.queryByRole("option", { name: /Bank transfer/ })).toBeNull();
    view.unmount();
    mock.command.mockResolvedValue([{ ...bank, currencies: ["EGP"] }]);
    render(
      <LocaleProvider initialLocale="en">
        <PaymentMethods packageKey="pro" interval="month" market="EG" stripe={vi.fn()}>
          Continue
        </PaymentMethods>
      </LocaleProvider>,
    );
    await waitFor(() =>
      expect(screen.getByRole("option", { name: "Bank transfer" })).toBeEnabled(),
    );
  });
  it("preserves Stripe checkout and requires a server quote before transfer orders", async () => {
    const stripe = vi.fn();
    render(
      <LocaleProvider initialLocale="en">
        <PaymentMethods packageKey="pro" interval="month" market="EG" stripe={stripe}>
          Continue
        </PaymentMethods>
      </LocaleProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(stripe).toHaveBeenCalledOnce();
    expect(screen.queryByRole("option", { name: "Administrator-approved access" })).toBeNull();
    expect(screen.getByRole("option", { name: /Paymob/ })).toBeDisabled();
    await waitFor(() => expect(mock.command).toHaveBeenCalled());
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "instapay" } });
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Review price" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Continue" })).not.toBeDisabled(),
    );
    expect(mock.command.mock.calls.some(([x]) => x.data.action === "create_order")).toBe(false);
  });
  it.each(["ar-EG", "ar-MSA", "ar-Gulf", "en"] as const)(
    "requires explicit preview, server validation and commit in %s",
    async (locale) => {
      const run = vi.fn(async () => []);
      const w = commerceCopy(locale);
      render(
        <QueryClientProvider client={new QueryClient()}>
          <LocaleProvider initialLocale={locale}>
            <AdminGroups data={empty} w={w} run={run} busy={false} />
          </LocaleProvider>
        </QueryClientProvider>,
      );
      fireEvent.change(screen.getByRole("combobox", { name: w.groupName }), {
        target: { value: empty.groups[0].id },
      });
      fireEvent.change(screen.getByLabelText(w.paste), {
        target: { value: "member@example.test" },
      });
      fireEvent.click(screen.getByRole("button", { name: w.preview }));
      expect(run).not.toHaveBeenCalled();
      expect(mock.dispatch).not.toHaveBeenCalled();
      const previews = screen.getAllByRole("button", { name: w.preview });
      fireEvent.click(previews[previews.length - 1]);
      expect(screen.getByRole("button", { name: new RegExp(`${w.import}.*1`) })).toBeDisabled();
      expect(screen.getByRole("button", { name: w.send })).toBeDisabled();
    },
  );
});

describe("simple administrator offers", () => {
  function setup(locale: "ar-EG" | "ar-MSA" | "ar-Gulf" | "en") {
    const run = vi.fn().mockImplementation(async (action: string, p: Record<string, unknown>) =>
      action === "simple_offer"
        ? {
            id: "synthetic-offer",
            code: p.code,
            package: p.package,
            kind: "percent",
            value_minor: p.percent,
            delivery_mode: p.delivery,
            enabled: true,
            valid_until: null,
            max_redemptions: 2,
          }
        : { group_id: empty.groups[0].id },
    );
    mock.command.mockResolvedValue([
      {
        package: "pro",
        market: "EG",
        billing_interval: "month",
        original_minor: 16900,
        currency: "EGP",
      },
      {
        package: "pro_plus",
        market: "EG",
        billing_interval: "year",
        original_minor: 249000,
        currency: "EGP",
      },
    ]);
    render(
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <LocaleProvider initialLocale={locale}>
          <AdminOffers data={empty} run={run} busy={false} />
        </LocaleProvider>
      </QueryClientProvider>,
    );
    return { run, s: adminOfferCopy(locale), w: commerceCopy(locale) };
  }
  it.each(["ar-EG", "ar-MSA", "ar-Gulf", "en"] as const)(
    "creates a 100 percent email-only coupon after review in %s",
    async (locale) => {
      const { run, s } = setup(locale);
      await screen.findByRole("option", { name: /Pro.*169/ });
      fireEvent.change(screen.getByLabelText(s.emails), {
        target: { value: "member@example.test" },
      });
      expect(screen.queryByLabelText(commerceCopy(locale).name)).toBeNull();
      fireEvent.click(screen.getByRole("button", { name: s.review }));
      expect(run).not.toHaveBeenCalled();
      expect(screen.getByText(s.reviewTitle)).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: s.confirm }));
      await screen.findByText(s.created);
      expect(run).toHaveBeenCalledWith(
        "simple_offer",
        expect.objectContaining({
          audience: "individual",
          emails: ["member@example.test"],
          percent: 100,
          expected_price_minor: 16900,
          delivery: "coupon",
        }),
      );
      expect(mock.dispatch).not.toHaveBeenCalled();
    },
  );
  it("keeps time-only/count-only limits mutually exclusive and permits a restricted direct invitation", async () => {
    const { run, s, w } = setup("en");
    await screen.findByRole("option", { name: /Pro.*169/ });
    fireEvent.click(screen.getByRole("radio", { name: s.public }));
    expect(screen.queryByLabelText(s.emails)).toBeNull();
    fireEvent.change(screen.getByLabelText(s.limitMode), { target: { value: "count" } });
    expect(screen.queryByLabelText(s.until)).toBeNull();
    fireEvent.change(screen.getByLabelText(s.total), { target: { value: "2" } });
    fireEvent.change(screen.getByLabelText(s.percent), { target: { value: "20" } });
    fireEvent.click(screen.getByRole("button", { name: s.review }));
    fireEvent.click(screen.getByRole("button", { name: s.confirm }));
    await screen.findByText(s.created);
    expect(run).toHaveBeenCalledWith(
      "simple_offer",
      expect.objectContaining({ valid_until: null, max_redemptions: 2, percent: 20 }),
    );
    fireEvent.click(screen.getByRole("button", { name: s.another }));
    fireEvent.click(screen.getByRole("radio", { name: s.group }));
    fireEvent.change(screen.getByLabelText(s.emails), {
      target: { value: "member@example.test\nother@example.test" },
    });
    fireEvent.change(screen.getByLabelText(w.kind), { target: { value: "invitation" } });
    fireEvent.click(screen.getByRole("button", { name: s.review }));
    fireEvent.click(screen.getByRole("button", { name: s.confirm }));
    await screen.findByText(s.sendHint);
    expect(mock.dispatch).not.toHaveBeenCalled();
    mock.dispatch.mockResolvedValue({ accepted: 2, claimed: 2, pending: 0 });
    fireEvent.click(screen.getAllByRole("button", { name: s.send })[0]);
    await waitFor(() =>
      expect(mock.dispatch).toHaveBeenCalledWith({ data: { groupId: empty.groups[0].id } }),
    );
  });
  it("requires a normalized phone for free redemption, without invoking Stripe or receipt upload", async () => {
    const stripe = vi.fn(),
      s = adminOfferCopy("en"),
      w = commerceCopy("en");
    mock.command.mockImplementation(async ({ data }: { data: { action: string } }) =>
      data.action === "methods"
        ? []
        : data.action === "quote"
          ? {
              original_minor: 16900,
              final_minor: 0,
              currency: "EGP",
              offer_kind: "complimentary",
              phone_required: true,
            }
          : {
              id: "free-order",
              reference: "FREE",
              final_minor: 0,
              currency: "EGP",
              review_status: "confirmed",
            },
    );
    render(
      <LocaleProvider initialLocale="en">
        <PaymentMethods packageKey="pro" interval="month" market="EG" stripe={stripe}>
          {w.continue}
        </PaymentMethods>
      </LocaleProvider>,
    );
    fireEvent.change(screen.getByLabelText(w.code), { target: { value: "FREE100" } });
    fireEvent.click(screen.getByRole("button", { name: w.quote }));
    await screen.findByLabelText(s.phone);
    expect(screen.getByRole("button", { name: w.continue })).toBeDisabled();
    fireEvent.change(screen.getByLabelText(s.phone), { target: { value: "+20 10 1234 5678" } });
    fireEvent.click(screen.getByRole("button", { name: w.continue }));
    await screen.findByText(/FREE/);
    expect(mock.command).toHaveBeenCalledWith({
      data: {
        action: "create_order",
        data: expect.objectContaining({ method: "admin", phone: "+201012345678", code: "FREE100" }),
      },
    });
    expect(stripe).not.toHaveBeenCalled();
    expect(mock.upload).not.toHaveBeenCalled();
    expect(screen.queryByText(w.receiptNote)).toBeNull();
  });
});

import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LocaleProvider } from "@/lib/locale/locale-context";
import { PaymentMethods } from "./PaymentMethods";
import { ReceiptView } from "./ReceiptUpload";
import { AdminGroups } from "./AdminGroups";
import { commerceCopy } from "@/lib/commerce/copy";
import type { AdminData } from "@/lib/commerce/contracts";
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

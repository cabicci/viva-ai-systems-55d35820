import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LocaleProvider } from "@/lib/locale/locale-context";
import { PaymentMethods } from "./PaymentMethods";
import { AdminGroups } from "./AdminGroups";
import { commerceCopy } from "@/lib/commerce/copy";
import type { AdminData } from "@/lib/commerce/contracts";
const mock = vi.hoisted(() => ({ command: vi.fn(), upload: vi.fn(), dispatch: vi.fn() }));
vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock("@/lib/commerce/commerce.functions", () => ({
  commerceCommand: mock.command,
  uploadCommerceReceipt: mock.upload,
  readCommerceReceipt: vi.fn(),
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

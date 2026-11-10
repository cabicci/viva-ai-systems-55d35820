import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SupportedLocale } from "@/lib/locale/types";
const mocks = vi.hoisted(() => ({
  locale: "en" as SupportedLocale,
  load: vi.fn(),
  send: vi.fn(),
  check: vi.fn(),
}));
vi.mock("@/lib/auth-context", () => ({ useAuth: () => ({ user: { id: "test-actor" } }) }));
vi.mock("@/lib/locale/locale-context", () => ({
  useLocale: () => ({ locale: mocks.locale, dir: mocks.locale === "en" ? "ltr" : "rtl" }),
}));
vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock("@/lib/communications/phone.functions", () => ({
  getAccountPhone: mocks.load,
  sendAccountPhoneCode: mocks.send,
  verifyAccountPhoneCode: mocks.check,
}));
import { PhoneVerification } from "./PhoneVerification";
const renderPhone = () =>
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })}
    >
      <PhoneVerification />
    </QueryClientProvider>,
  );
beforeEach(() => {
  vi.clearAllMocks();
  mocks.locale = "en";
  mocks.load.mockResolvedValue({
    ok: true,
    value: { enabled: true, channels: ["whatsapp", "sms"], phone: null, verifiedAt: null },
  });
});
afterEach(cleanup);
describe("account phone verification UI", () => {
  it.each(["ar-EG", "ar-MSA", "ar-Gulf", "en"] as SupportedLocale[])(
    "shows a disabled localized service without send controls in %s",
    async (locale) => {
      mocks.locale = locale;
      mocks.load.mockResolvedValue({
        ok: true,
        value: { enabled: false, channels: ["sms"], phone: null, verifiedAt: null },
      });
      const { container } = renderPhone();
      await screen.findByText(
        locale === "en"
          ? "Phone verification is currently unavailable."
          : locale === "ar-Gulf"
            ? "تأكيد الجوال غير متاح حاليًا."
            : "تأكيد الهاتف غير متاح حاليًا.",
      );
      expect(container.querySelector("section")).toHaveAttribute(
        "dir",
        locale === "en" ? "ltr" : "rtl",
      );
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
      expect(mocks.send).not.toHaveBeenCalled();
    },
  );
  it("sends once, does not treat send acceptance or a wrong code as ownership, then reloads committed verification", async () => {
    const id = "00000000-0000-4000-8000-000000000001";
    mocks.send.mockResolvedValue({
      ok: true,
      value: { challengeId: id, expiresAt: new Date(Date.now() + 600000).toISOString() },
    });
    mocks.check
      .mockResolvedValueOnce({ ok: true, value: { verified: false } })
      .mockResolvedValueOnce({ ok: true, value: { verified: true } });
    renderPhone();
    await screen.findByLabelText("Phone number with country code");
    fireEvent.change(screen.getByLabelText("Phone number with country code"), {
      target: { value: "+201012345678" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send verification code" }));
    await screen.findByLabelText("Verification code — 6 digits");
    expect(mocks.send).toHaveBeenCalledTimes(1);
    expect(mocks.send).toHaveBeenCalledWith({
      data: { phone: "+201012345678", locale: "en", channel: "whatsapp" },
    });
    expect(screen.queryByText(/Number verified/)).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Verification code — 6 digits"), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Verify number" }));
    await screen.findByText("Incorrect code. Check it and try again.");
    expect(screen.getByLabelText("Verification code — 6 digits")).toHaveValue("");
    mocks.load.mockResolvedValue({
      ok: true,
      value: {
        enabled: true,
        channels: ["whatsapp", "sms"],
        phone: "+201012345678",
        verifiedAt: new Date().toISOString(),
      },
    });
    fireEvent.change(screen.getByLabelText("Verification code — 6 digits"), {
      target: { value: "654321" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Verify number" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Number verified"));
    expect(mocks.check).toHaveBeenLastCalledWith({ data: { challengeId: id, code: "654321" } });
  });
  it("reports uncertain send without automatic retry", async () => {
    mocks.send.mockResolvedValue({ ok: false, error: "unavailable" });
    renderPhone();
    await screen.findByLabelText("Phone number with country code");
    fireEvent.change(screen.getByLabelText("Phone number with country code"), {
      target: { value: "+201012345678" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send verification code" }));
    await screen.findByRole("alert");
    expect(mocks.send).toHaveBeenCalledTimes(1);
    expect(mocks.check).not.toHaveBeenCalled();
  });
  it("allows SMS as an explicit alternative and locks channel choice during an attempt", async () => {
    mocks.send.mockResolvedValue({
      ok: true,
      value: { challengeId: "test", expiresAt: new Date(Date.now() + 600000).toISOString() },
    });
    renderPhone();
    expect(await screen.findByRole("radio", { name: "WhatsApp" })).toBeChecked();
    fireEvent.click(screen.getByRole("radio", { name: "SMS — text message" }));
    fireEvent.change(screen.getByLabelText("Phone number with country code"), {
      target: { value: "+201012345678" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send verification code" }));
    await screen.findByLabelText("Verification code — 6 digits");
    expect(mocks.send).toHaveBeenCalledWith({
      data: { phone: "+201012345678", locale: "en", channel: "sms" },
    });
    expect(screen.getByRole("radio", { name: "WhatsApp" })).toBeDisabled();
    expect(screen.getByRole("radio", { name: "SMS — text message" })).toBeDisabled();
  });
  it("allows resetting an expired attempt without automatically sending another message", async () => {
    mocks.send.mockResolvedValue({
      ok: true,
      value: { challengeId: "expired", expiresAt: "2000-01-01T00:00:00Z" },
    });
    renderPhone();
    await screen.findByLabelText("Phone number with country code");
    fireEvent.change(screen.getByLabelText("Phone number with country code"), {
      target: { value: "+201012345678" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send verification code" }));
    await screen.findByText(
      "This attempt has expired or been exhausted. Request a new code after the waiting period.",
    );
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(screen.getByRole("button", { name: "Send verification code" })).toBeInTheDocument();
    expect(mocks.send).toHaveBeenCalledTimes(1);
  });
});

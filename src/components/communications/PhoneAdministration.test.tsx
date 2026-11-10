import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ load: vi.fn(), save: vi.fn(), users: vi.fn() }));
vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock("@/lib/auth-context", () => ({ useAuth: () => ({ user: { id: "admin" } }) }));
vi.mock("@/lib/admin.functions", () => ({ listUsers: mocks.users }));
vi.mock("@/lib/communications/phone-admin.functions", () => ({
  getPhoneAdministration: mocks.load,
  configurePhoneAdministration: mocks.save,
}));
import { PhoneAdministration } from "./PhoneAdministration";
import type { SupportedLocale } from "@/lib/locale/types";
const settings = {
  revision: 3,
  enabled: false,
  channels: ["sms"],
  dailyCap: 20,
  testUsers: [],
  sentToday: 2,
  verifiedAccounts: 1,
  recent: [],
};
const renderControls = (locale: SupportedLocale = "en") =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
        })
      }
    >
      <PhoneAdministration locale={locale} />
    </QueryClientProvider>,
  );
beforeEach(() => {
  vi.clearAllMocks();
  mocks.load.mockResolvedValue(settings);
  mocks.users.mockResolvedValue({ users: [], hasMore: false });
  mocks.save.mockResolvedValue(settings);
});
afterEach(cleanup);
describe("phone administration controls", () => {
  it("loads actual usage and saves once with the loaded revision", async () => {
    renderControls();
    const cap = await screen.findByLabelText("Daily limit across all accounts");
    fireEvent.change(cap, { target: { value: "30" } });
    fireEvent.click(screen.getByRole("button", { name: "Save settings" }));
    await waitFor(() => expect(mocks.save).toHaveBeenCalledOnce());
    expect(mocks.save).toHaveBeenCalledWith({
      data: { revision: 3, enabled: false, channels: ["sms"], testUsers: [], dailyCap: 30 },
    });
  });
  it("shows an error instead of inventing zero usage", async () => {
    mocks.load.mockRejectedValue(new Error("unavailable"));
    renderControls();
    expect(await screen.findByRole("alert")).toHaveTextContent("could not be loaded");
    expect(screen.queryByText(/Today's sends/)).not.toBeInTheDocument();
  });
  it("keeps selected values and reports conflicts", async () => {
    mocks.save.mockRejectedValue(new Error("PHONE_CONTROL_CONFLICT"));
    renderControls();
    const cap = await screen.findByLabelText("Daily limit across all accounts");
    fireEvent.change(cap, { target: { value: "30" } });
    fireEvent.click(screen.getByRole("button", { name: "Save settings" }));
    expect(await screen.findByText(/changed in another session/)).toBeVisible();
    expect(cap).toHaveValue(30);
    expect(mocks.save).toHaveBeenCalledOnce();
  });
  it("disables invalid caps and displays only the last four phone digits", async () => {
    mocks.load.mockResolvedValue({
      ...settings,
      recent: [
        {
          id: "attempt",
          createdAt: "2026-11-08T20:00:00Z",
          channel: "sms",
          phoneTail: "5678",
          state: "pending",
        },
      ],
    });
    renderControls();
    const cap = await screen.findByLabelText("Daily limit across all accounts");
    fireEvent.change(cap, { target: { value: "101" } });
    expect(screen.getByRole("button", { name: "Save settings" })).toBeDisabled();
    expect(screen.getByText("••••5678")).toBeVisible();
    expect(mocks.save).not.toHaveBeenCalled();
  });
});

describe("phone dates in the four interface locales", () => {
  it.each(["ar-EG", "ar-MSA", "ar-Gulf", "en"] as SupportedLocale[])(
    "renders the actual timestamp without treating %s as an Intl locale",
    async (locale) => {
      mocks.load.mockResolvedValue({
        ...settings,
        recent: [
          {
            id: "attempt",
            createdAt: "2026-11-08T20:00:00Z",
            channel: "sms",
            phoneTail: "5678",
            state: "pending",
          },
        ],
      });
      const { container } = renderControls(locale);
      await screen.findByText("••••5678");
      expect(container.querySelector("time")).toHaveAttribute("datetime", "2026-11-08T20:00:00Z");
      expect(container.querySelector("time")?.textContent).not.toBe("");
    },
  );
});

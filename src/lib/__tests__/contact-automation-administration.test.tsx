import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
const mocks = vi.hoisted(() => ({ load: vi.fn(), withdraw: vi.fn(), close: vi.fn() }));
vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock("@/lib/auth-context", () => ({ useAuth: () => ({ user: { id: "admin" } }) }));
vi.mock("@/lib/contact-automation-admin.functions", () => ({
  getContactAutomationAdministration: mocks.load,
  withdrawContactProcessing: mocks.withdraw,
  closeContactIntakeManually: mocks.close,
}));
import { ContactAutomationAdministration } from "@/components/communications/ContactAutomationAdministration";
const id = "22222222-2222-4222-8222-222222222222";
const snapshot = {
  ownerConfigured: true,
  total: 1,
  counts: {
    awaitingOwner: 0,
    ownerReconciliation: 1,
    retryWindowExpired: 0,
    messageWindowExpired: 0,
    intakeReconciliation: 0,
    inFlight: 0,
    withdrawn: 0,
  },
  recent: [
    {
      id,
      recipientMasked: "***@example.test",
      locale: "en",
      stream: "sales",
      createdAt: "2026-11-08T08:00:00Z",
      dueAt: "2026-11-08T08:00:00Z",
      withdrawnAt: null,
      closedAt: null,
      resolutionReference: null,
      ackState: "accepted",
      followupState: "owner_reconciliation_required",
      inFlight: false,
    },
  ],
};
const mount = () =>
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <ContactAutomationAdministration locale="en" />
    </QueryClientProvider>,
  );
beforeEach(() => {
  vi.clearAllMocks();
  mocks.load.mockResolvedValue(snapshot);
  mocks.close.mockResolvedValue({ ...snapshot, recent: [] });
  mocks.withdraw.mockResolvedValue({
    ...snapshot,
    recent: [{ ...snapshot.recent[0], withdrawnAt: "2026-11-08T09:00:00Z" }],
  });
});
afterEach(cleanup);
describe("contact administration consumer", () => {
  it("shows an address reconciliation and invokes the actual withdrawal action for its request", async () => {
    mount();
    expect(await screen.findByText(/Owner address changed or missing/)).toBeVisible();
    expect(screen.getByText(/Provider accepted; delivery not confirmed/)).toBeVisible();
    expect(screen.getByText(/\*\*\*@example.test/)).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Record consent withdrawal" }));
    await waitFor(() =>
      expect(mocks.withdraw).toHaveBeenCalledExactlyOnceWith({ data: { requestId: id } }),
    );
    expect(await screen.findByText(/Consent withdrawal recorded/)).toBeVisible();
  });
  it("does not invent status when the protected read fails", async () => {
    mocks.load.mockRejectedValue(new Error("unavailable"));
    mount();
    expect(await screen.findByRole("alert")).toHaveTextContent("Actual status could not be loaded");
    expect(
      screen.queryByRole("button", { name: "Record consent withdrawal" }),
    ).not.toBeInTheDocument();
  });
  it("can find an older request by reference without exposing message content", async () => {
    mount();
    await screen.findByText(/Owner address changed or missing/);
    fireEvent.change(screen.getByLabelText("Contact request reference"), { target: { value: id } });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    await waitFor(() => expect(mocks.load).toHaveBeenCalledWith({ data: { requestId: id } }));
  });
});

describe("manual intake resolution", () => {
  it("calls the protected close action with a review reference without claiming acceptance", async () => {
    mocks.load.mockResolvedValue({
      ...snapshot,
      recent: [{ ...snapshot.recent[0], ackState: "intake_reconciliation_required" }],
    });
    mount();
    const input = await screen.findByLabelText("Review reference");
    fireEvent.change(input, { target: { value: "SUPPORT-123" } });
    fireEvent.click(
      screen.getByRole("button", {
        name: "Close for manual handling without confirming acceptance",
      }),
    );
    await waitFor(() =>
      expect(mocks.close).toHaveBeenCalledExactlyOnceWith({
        data: { requestId: id, reference: "SUPPORT-123" },
      }),
    );
  });
});

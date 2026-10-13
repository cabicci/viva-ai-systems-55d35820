import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LocaleProvider } from "@/lib/locale/locale-context";
import { AdminEmailAccess } from "./AdminEmailAccess";
const mock = vi.hoisted(() => ({ command: vi.fn() }));
vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock("@/lib/commerce/email-access.functions", () => ({ emailAccessCommand: mock.command }));
const data = { catalogues: [{ id: "academic:AC-BUS", title: "Academic business" }], grants: [] };
beforeEach(() => { vi.clearAllMocks(); mock.command.mockImplementation(async ({ data: input }) => input.action === "list" ? data : { id: "synthetic" }); });
afterEach(cleanup);
const setup = () => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
  <LocaleProvider initialLocale="en"><AdminEmailAccess /></LocaleProvider>
</QueryClientProvider>);
describe("administrator pre-registration email grants", () => {
  it("defaults invitation off and submits permanent selected access without a user account", async () => {
    setup();
    await waitFor(() => expect(screen.getByRole("button", { name: "Grant access" })).toBeEnabled());
    fireEvent.change(screen.getByLabelText("Recipient email"), { target: { value: "future@example.test" } });
    fireEvent.change(screen.getByLabelText("Access scope"), { target: { value: "selected" } });
    expect(screen.getByRole("button", { name: "Grant access" })).toBeDisabled();
    fireEvent.click(screen.getByLabelText("Academic business"));
    fireEvent.click(screen.getByLabelText("Permanent"));
    expect(screen.getByLabelText("Send invitation email")).not.toBeChecked();
    fireEvent.click(screen.getByRole("button", { name: "Grant access" }));
    await waitFor(() => expect(mock.command).toHaveBeenCalledWith({ data: { action: "create", data: expect.objectContaining({
      email: "future@example.test", scope_mode: "selected", catalogues: ["academic:AC-BUS"], duration_days: null, invitation: false,
    }) } }));
    const call = mock.command.mock.calls.find(c => c[0].data.action === "create")![0];
    expect(call.data.data).not.toHaveProperty("user_id"); expect(call.data.data).not.toHaveProperty("role");
  });
  it("retains an idempotency key when create response is uncertain", async () => {
    mock.command.mockImplementation(async ({ data: input }) => { if (input.action === "list") return data; throw Error("uncertain"); });
    setup(); await waitFor(() => expect(screen.getByRole("button", { name: "Grant access" })).toBeEnabled());
    fireEvent.change(screen.getByLabelText("Recipient email"), { target: { value: "future@example.test" } });
    fireEvent.click(screen.getByRole("button", { name: "Grant access" }));
    await screen.findByRole("alert");
    fireEvent.click(screen.getByRole("button", { name: "Grant access" }));
    await waitFor(() => expect(mock.command.mock.calls.filter(c => c[0].data.action === "create")).toHaveLength(2));
    const calls = mock.command.mock.calls.filter(c => c[0].data.action === "create");
    expect(calls[0][0].data.data.key).toBe(calls[1][0].data.data.key);
  });
  it("shows pending, active, expired and revoked audit history, revokes pending and extends active access", async () => {
    const base = { scope_mode: "all_published", catalogues: [], duration_days: 30, activated_at: null, ends_at: null, revoked_at: null, user_id: null, created_at: "2026-10-13", invitation_status: null, audit: [{ id: "audit", actor: "synthetic-admin", action: "created", created_at: "2026-10-13", details: {} }] };
    const grants = [{ ...base, id: "pending", recipient_email: "pending@example.test", status: "pending_registration" },
      { ...base, id: "active", recipient_email: "active@example.test", status: "active", user_id: "synthetic-user", activated_at: "2026-10-13", ends_at: "2027-01-01" },
      { ...base, id: "expired", recipient_email: "expired@example.test", status: "expired" },
      { ...base, id: "revoked", recipient_email: "revoked@example.test", status: "revoked" }];
    mock.command.mockImplementation(async ({ data: input }) => input.action === "list" ? { ...data, grants } : { id: "synthetic" });
    setup(); await screen.findByText("pending@example.test");
    expect(screen.getByRole("heading", { name: /pending@example.test.*Pending registration/ })).toBeTruthy(); expect(screen.getAllByText(/^Created/)).toHaveLength(4);
    fireEvent.click(screen.getAllByRole("button", { name: "Revoke" })[0]);
    await waitFor(() => expect(mock.command).toHaveBeenCalledWith({ data: { action: "revoke", data: expect.objectContaining({ id: "pending" }) } }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Extend" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Extend" }));
    await waitFor(() => expect(mock.command).toHaveBeenCalledWith({ data: { action: "extend", data: expect.objectContaining({ id: "active", duration_days: 30 }) } }));
  });
});


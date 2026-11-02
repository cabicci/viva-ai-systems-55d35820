import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CommercialInvitations } from "./CommercialInvitations";
const api = vi.hoisted(() => ({ get: vi.fn(), accept: vi.fn() }));
vi.mock("@/lib/billing/commercial-invitations.functions", () => ({
  getCommercialInvitations: api.get,
  acceptCommercialInvitation: api.accept,
}));
const userId = "11111111-1111-4111-8111-111111111111";
beforeEach(() => vi.resetAllMocks());
function show() {
  return render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <CommercialInvitations userId={userId} locale="en" />
    </QueryClientProvider>,
  );
}
describe("invitation acceptance", () => {
  it("shows independent 100-question course and 300-question comprehensive invitations without a subscription", async () => {
    api.get.mockResolvedValue([
      {
        id: "single",
        scope_mode: "selected",
        grant_kind: "single_curriculum",
        monthly_questions: 100,
        catalogues: ["academic:course"],
        catalogue_details: [{ id: "academic:course", title: "Course title" }],
        duration_days: 30,
        accepted_at: null,
        ends_at: null,
      },
      {
        id: "full",
        scope_mode: "all_published",
        grant_kind: "comprehensive",
        monthly_questions: 300,
        catalogues: [],
        duration_days: null,
        accepted_at: null,
        ends_at: null,
      },
    ]);
    show();
    expect(await screen.findByText(/100 monthly questions/)).toBeInTheDocument();
    expect(screen.getByText(/300 monthly questions/)).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: "Accept invitation and start access" }),
    ).toHaveLength(2);
    expect(api.accept).not.toHaveBeenCalled();
  });
  it("shows exact curricula and duration without automatically starting the grant", async () => {
    api.get.mockResolvedValue([
      {
        id: "grant",
        scope_mode: "selected",
        catalogues: ["academic:course"],
        catalogue_details: [{ id: "academic:course", title: "Course title" }],
        duration_days: 30,
        accepted_at: null,
        ends_at: null,
      },
    ]);
    api.accept.mockResolvedValue({ id: "grant" });
    show();
    expect(await screen.findByText("Course title")).toBeInTheDocument();
    expect(screen.getByText("30 days from acceptance")).toBeInTheDocument();
    expect(api.accept).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Accept invitation and start access" }));
    await waitFor(() =>
      expect(api.accept).toHaveBeenCalledWith({
        data: { expectedAccountId: userId, invitationId: "grant" },
      }),
    );
  });
  it("retains failed invitations for retry", async () => {
    api.get.mockResolvedValue([
      {
        id: "grant",
        scope_mode: "all_published",
        catalogues: [],
        duration_days: null,
        accepted_at: null,
        ends_at: null,
      },
    ]);
    api.accept.mockRejectedValue(new Error("offline"));
    show();
    fireEvent.click(
      await screen.findByRole("button", { name: "Accept invitation and start access" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent("Could not accept");
  });
});

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { KidsConsentControl } from "./KidsConsentControl";
const mock = vi.hoisted(() => ({
  from: vi.fn(),
  rpc: vi.fn(),
  locale: "en",
  user: { id: "parent-1" },
}));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: mock.from, rpc: mock.rpc } }));
vi.mock("@/lib/auth-context", () => ({ useAuth: () => ({ user: mock.user }) }));
vi.mock("@/lib/locale/locale-context", () => ({ useLocale: () => ({ locale: mock.locale }) }));
function queries(receipts: unknown[] = []) {
  mock.from.mockImplementation((table) => {
    const response = { data: table === "kids_profile_consents" ? receipts : [], error: null };
    const query = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      then: (resolve: (value: unknown) => void) => Promise.resolve(response).then(resolve),
    };
    return query;
  });
  mock.rpc.mockImplementation((name) =>
    Promise.resolve(
      name === "kids_parent_privacy_record"
        ? {
            data: [
              { policy_id: "policy-1", policy_version: "v1", attested_at: "2026-09-25T00:00:00Z" },
            ],
            error: null,
          }
        : { error: null },
    ),
  );
}
beforeEach(() => {
  vi.resetAllMocks();
  mock.locale = "en";
  mock.user = { id: "parent-1" };
  queries();
});
describe("Child consent control", () => {
  it.each(["en", "ar-EG", "ar-MSA", "ar-Gulf"])(
    "shows the saved consent and policy link in account settings without repeating the notice in %s",
    async (locale) => {
      mock.locale = locale;
      render(<KidsConsentControl />);
      expect(await screen.findByText(/v1/)).toBeInTheDocument();
      expect(screen.getByRole("link")).toHaveAttribute("href", `/kids/privacy?locale=${locale}`);
      expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
      expect(mock.from).not.toHaveBeenCalledWith("kids_consent_policies");
    },
  );
  it("allows withdrawal in account settings and refreshes open lesson consumers", async () => {
    queries([
      {
        profile_id: "profile-1",
        accepted_at: "2026-09-25T00:00:00Z",
        withdrawn_at: null,
        kids_profiles: { display_name: "Explorer" },
        kids_consent_policies: { version: "v1" },
      },
    ]);
    const changed = vi.fn();
    window.addEventListener("kids-consent-changed", changed);
    render(<KidsConsentControl />);
    fireEvent.click(await screen.findByRole("button", { name: "Withdraw consent" }));
    await waitFor(() =>
      expect(mock.rpc).toHaveBeenCalledWith("kids_parent_withdraw_consent", {
        p_profile: "profile-1",
      }),
    );
    expect(changed).toHaveBeenCalled();
    window.removeEventListener("kids-consent-changed", changed);
  });
  it("distinguishes a refunded Stripe test payment from an independent active Kids grant", async () => {
    mock.rpc.mockImplementation((name) => {
      if (name === "kids_parent_privacy_record") {
        return Promise.resolve({
          data: [
            { policy_id: "policy-1", policy_version: "v1", attested_at: "2026-09-25T00:00:00Z" },
          ],
          error: null,
        });
      }
      if (name === "get_my_kids_subscription") {
        return Promise.resolve({
          data: [{ status: "refunded", paid_through: "2026-10-28T00:00:00Z" }],
          error: null,
        });
      }
      if (name === "get_my_kids_access_status") {
        return Promise.resolve({
          data: [{ access_source: "test_grant", active_until: "2027-09-27T00:00:00Z" }],
          error: null,
        });
      }
      return Promise.resolve({ error: null });
    });
    render(<KidsConsentControl />);
    expect(await screen.findByText(/Stripe test subscription: Refunded/)).toBeInTheDocument();
    expect(
      screen.getByText(/Paid Kids lesson access: Active until 2027-09-27 \(separate test grant\)/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Last paid period through/)).not.toBeInTheDocument();
  });
});

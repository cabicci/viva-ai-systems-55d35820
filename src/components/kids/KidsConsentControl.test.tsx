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
const policy = {
  id: "policy-1",
  notice_text: "Full published privacy notice",
  consent_text: "I consent to learning data for this child",
  version: "v1",
};
function queries(policies = [policy], receipts: unknown[] = []) {
  mock.from.mockImplementation((table) => {
    const response = { data: table === "kids_consent_policies" ? policies : receipts, error: null };
    const query = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      then: (resolve: (value: unknown) => void) => Promise.resolve(response).then(resolve),
    };
    return query;
  });
}
beforeEach(() => {
  vi.resetAllMocks();
  mock.locale = "en";
  mock.user = { id: "parent-1" };
  queries();
});
describe("Child consent control", () => {
  it.each(["en", "ar-EG", "ar-MSA", "ar-Gulf"])(
    "requires explicit consent and displays exact server policy in %s",
    async (locale) => {
      mock.locale = locale;
      const consent = vi.fn();
      render(<KidsConsentControl canCreate onConsent={consent} onWithdraw={vi.fn()} />);
      const checkbox = await screen.findByRole("checkbox");
      expect(checkbox).not.toBeChecked();
      expect(screen.getByText(policy.notice_text)).toBeInTheDocument();
      fireEvent.click(checkbox);
      expect(consent).toHaveBeenLastCalledWith("policy-1");
      fireEvent.click(checkbox);
      expect(consent).toHaveBeenLastCalledWith(undefined);
    },
  );
  it("does not invent a policy when no approved version exists", async () => {
    queries([]);
    render(<KidsConsentControl canCreate onConsent={vi.fn()} onWithdraw={vi.fn()} />);
    await waitFor(() => expect(mock.from).toHaveBeenCalledWith("kids_consent_policies"));
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(screen.getByText(/creation remains closed/)).toBeInTheDocument();
  });
  it("allows withdrawal while the market is closed and refreshes open lesson consumers", async () => {
    queries(
      [],
      [
        {
          profile_id: "profile-1",
          accepted_at: "2026-09-25T00:00:00Z",
          withdrawn_at: null,
          kids_profiles: { display_name: "Explorer" },
          kids_consent_policies: { version: "v1" },
        },
      ],
    );
    mock.rpc.mockResolvedValue({ error: null });
    const withdraw = vi.fn();
    const changed = vi.fn();
    window.addEventListener("kids-consent-changed", changed);
    render(<KidsConsentControl canCreate={false} onConsent={vi.fn()} onWithdraw={withdraw} />);
    fireEvent.click(await screen.findByRole("button", { name: "Withdraw consent" }));
    await waitFor(() =>
      expect(mock.rpc).toHaveBeenCalledWith("kids_parent_withdraw_consent", {
        p_profile: "profile-1",
      }),
    );
    expect(withdraw).toHaveBeenCalled();
    expect(changed).toHaveBeenCalled();
    window.removeEventListener("kids-consent-changed", changed);
  });
});

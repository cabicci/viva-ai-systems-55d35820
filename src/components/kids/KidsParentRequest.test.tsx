import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { KidsParentRequest } from "./KidsParentRequest";

const mock = vi.hoisted(() => ({
  useAuth: vi.fn(),
  rpc: vi.fn(),
  from: vi.fn(),
  locale: "en",
  request: null as null | { status: string; country_code: string },
  marketOpen: true,
}));
vi.mock("@/lib/auth-context", () => ({ useAuth: mock.useAuth }));
vi.mock("@/lib/locale/locale-context", () => ({ useLocale: () => ({ locale: mock.locale }) }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { rpc: mock.rpc, from: mock.from } }));

const policy = {
  id: "policy-1",
  notice_text: "Published children’s privacy policy for the account holder",
  consent_text: "I have read and agree to the children's privacy policy",
  version: "v1",
};

beforeEach(() => {
  vi.resetAllMocks();
  mock.locale = "en";
  mock.request = null;
  mock.marketOpen = true;
  mock.useAuth.mockReturnValue({ user: { id: "parent-1" } });
  mock.from.mockImplementation((table: string) => {
    const data =
      table === "kids_parent_access_requests"
        ? mock.request
        : table === "kids_market_release"
          ? { accepts_child_data: mock.marketOpen }
          : [policy];
    return {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
      then: (resolve: (value: unknown) => void) =>
        Promise.resolve({ data, error: null }).then(resolve),
    };
  });
  mock.rpc.mockResolvedValue({ data: "pending", error: null });
});

describe("parent privacy consent", () => {
  it("collects country first, then requires one unchecked privacy checkbox", async () => {
    render(<KidsParentRequest onRefresh={vi.fn()} />);
    const continueButton = await screen.findByRole("button", {
      name: "Continue to children's policy",
    });
    expect(continueButton).toBeDisabled();
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "EG" } });
    fireEvent.click(continueButton);
    await waitFor(() =>
      expect(mock.rpc).toHaveBeenCalledWith("kids_parent_request_review", {
        p_acknowledged: true,
        p_country_code: "EG",
        p_adult_confirmed: true,
      }),
    );
    expect(await screen.findByText(policy.notice_text)).toBeInTheDocument();
    const checkbox = screen.getByRole("checkbox");
    const accept = screen.getByRole("button", { name: "I agree and activate my parent account" });
    expect(checkbox).not.toBeChecked();
    expect(accept).toBeDisabled();
    fireEvent.click(checkbox);
    fireEvent.click(accept);
    await waitFor(() =>
      expect(mock.rpc).toHaveBeenCalledWith("kids_parent_confirm_privacy", {
        p_policy_id: "policy-1",
        p_accepted: true,
      }),
    );
  });

  it("loads the pending account policy without a manual reviewer", async () => {
    mock.request = { status: "pending", country_code: "EG" };
    render(<KidsParentRequest onRefresh={vi.fn()} />);
    expect(await screen.findByText(policy.notice_text)).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).not.toBeChecked();
  });

  it("does not offer consent when the market is closed", async () => {
    mock.request = { status: "pending", country_code: "EG" };
    mock.marketOpen = false;
    render(<KidsParentRequest onRefresh={vi.fn()} />);
    expect(await screen.findByText(/not available in your country/)).toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  it("clears residence on account change", async () => {
    const { rerender } = render(<KidsParentRequest onRefresh={vi.fn()} />);
    await screen.findByRole("combobox");
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "SA" } });
    mock.useAuth.mockReturnValue({ user: { id: "parent-2" } });
    rerender(<KidsParentRequest onRefresh={vi.fn()} />);
    expect(await screen.findByRole("combobox")).toHaveValue("");
  });

  it.each(["ar-EG", "ar-MSA", "ar-Gulf"])("shows Arabic countries in %s", async (locale) => {
    mock.locale = locale;
    render(<KidsParentRequest onRefresh={vi.fn()} />);
    expect(await screen.findByLabelText("بلد إقامة وليّ الأمر")).toHaveValue("");
    expect(screen.getByRole("option", { name: "مصر" })).toHaveValue("EG");
  });
});

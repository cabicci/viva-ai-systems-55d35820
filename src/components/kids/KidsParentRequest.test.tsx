import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { KidsParentRequest } from "./KidsParentRequest";

const mock = vi.hoisted(() => ({ useAuth: vi.fn(), rpc: vi.fn(), from: vi.fn(), locale: "en" }));
vi.mock("@/lib/auth-context", () => ({ useAuth: mock.useAuth }));
vi.mock("@/lib/locale/locale-context", () => ({ useLocale: () => ({ locale: mock.locale }) }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { rpc: mock.rpc, from: mock.from } }));

beforeEach(() => {
  vi.resetAllMocks();
  mock.locale = "en";
  mock.useAuth.mockReturnValue({ user: { id: "parent-1" } });
  const query = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
  mock.from.mockReturnValue(query);
  mock.rpc.mockResolvedValue({ data: "pending", error: null });
});

describe("adult-only Kids parent request", () => {
  it("requires an explicit residence and both confirmations before submitting only adult fields", async () => {
    render(<KidsParentRequest onRefresh={vi.fn()} />);
    const button = await screen.findByRole("button", { name: "Request parent review" });
    expect(button).toBeDisabled();
    const country = screen.getByRole("combobox");
    expect(country).toHaveValue("");
    expect(screen.getAllByRole("option")).toHaveLength(23);
    fireEvent.change(country, { target: { value: "EG" } });
    fireEvent.click(screen.getByLabelText(/I confirm I am legally an adult/));
    expect(button).toBeDisabled();
    fireEvent.click(screen.getByLabelText(/I understand this request/));
    fireEvent.click(button);
    await waitFor(() =>
      expect(mock.rpc).toHaveBeenCalledWith("kids_parent_request_review", {
        p_acknowledged: true,
        p_country_code: "EG",
        p_adult_confirmed: true,
      }),
    );
    expect(await screen.findByText(/Your request was received/)).toBeInTheDocument();
  });

  it("clears residence and confirmations when the signed-in account changes", async () => {
    const { rerender } = render(<KidsParentRequest onRefresh={vi.fn()} />);
    await screen.findByRole("combobox");
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "SA" } });
    for (const checkbox of screen.getAllByRole("checkbox")) fireEvent.click(checkbox);
    mock.useAuth.mockReturnValue({ user: { id: "parent-2" } });
    rerender(<KidsParentRequest onRefresh={vi.fn()} />);
    await screen.findByRole("combobox");
    expect(screen.getByRole("combobox")).toHaveValue("");
    for (const checkbox of screen.getAllByRole("checkbox")) expect(checkbox).not.toBeChecked();
    expect(screen.getByRole("button", { name: "Request parent review" })).toBeDisabled();
    expect(mock.rpc).not.toHaveBeenCalled();
  });

  it.each(["ar-EG", "ar-MSA", "ar-Gulf"])(
    "shows Arabic residence choices for %s",
    async (locale) => {
      mock.locale = locale;
      render(<KidsParentRequest onRefresh={vi.fn()} />);
      expect(await screen.findByLabelText("بلد إقامة وليّ الأمر")).toHaveValue("");
      expect(screen.getByRole("option", { name: "مصر" })).toHaveValue("EG");
      expect(screen.getByRole("option", { name: "جزر القمر" })).toHaveValue("KM");
    },
  );

  it("does not show a request form when the backend is missing", async () => {
    mock.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: { code: "42P01" } }),
    });
    render(<KidsParentRequest onRefresh={vi.fn()} />);
    expect(await screen.findByText(/parent review service is unavailable/)).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(mock.rpc).not.toHaveBeenCalled();
  });
});

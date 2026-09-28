import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { KidsParentPanel } from "./KidsParentPanel";

const mock = vi.hoisted(() => ({
  state: "ready",
  createProfile: vi.fn(),
  record: { policy_id: "accepted-policy", policy_version: "v1", attested_at: "2026-09-25" },
}));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));
vi.mock("@/lib/locale/locale-context", () => ({
  useLocale: () => ({ locale: "ar-EG" }),
}));
vi.mock("@/lib/locale/use-locale-link-search", () => ({
  useLocaleLinkSearch: () => () => ({}),
}));
vi.mock("@/lib/kids/parent-state", () => ({
  useKidsParentState: () => ({
    state: mock.state,
    profiles: [{ id: "child-1", display_name: "سارة", level_id: "level-1" }],
    createProfile: mock.createProfile,
    refresh: vi.fn(),
  }),
}));
vi.mock("@/lib/kids/privacy-record", () => ({
  useKidsPrivacyRecord: () => ({ record: mock.record, loading: false, error: false }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mock.state = "ready";
  mock.createProfile.mockResolvedValue(undefined);
});

describe("returning Kids parent", () => {
  it("opens profiles without repeating policy, and creates another child using the accepted version", async () => {
    render(<KidsParentPanel />);
    expect(screen.getByText("سارة", { exact: false })).toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(screen.queryByText(/سياسة خصوصية الأطفال/)).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/اسم مختصر/), { target: { value: "عمر" } });
    fireEvent.click(screen.getByRole("button", { name: /احفظ الملف/ }));
    await waitFor(() =>
      expect(mock.createProfile).toHaveBeenCalledWith("عمر", "level-1", "accepted-policy"),
    );
  });
});

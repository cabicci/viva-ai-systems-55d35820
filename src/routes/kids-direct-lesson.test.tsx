import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { KidsLessonPage } from "./kids.$levelId.$lessonNumber";

const mock = vi.hoisted(() => ({
  refresh: vi.fn(),
  useKidsParentState: vi.fn(),
  invoke: vi.fn(),
}));
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: object) => ({
    ...options,
    useParams: () => ({ levelId: "level-2", lessonNumber: "1" }),
  }),
  Link: ({ children }: { children: React.ReactNode }) => <a href="#">{children}</a>,
  notFound: () => new Error("Not found"),
}));
vi.mock("@/components/site/Navbar", () => ({ Navbar: () => null }));
vi.mock("@/components/site/Footer", () => ({ Footer: () => null }));
vi.mock("@/components/kids/KidsLessonBody", () => ({
  KidsLessonBody: () => <div>Opened protected lesson</div>,
}));
vi.mock("@/lib/kids/lesson-client", () => ({
  parseProtectedLesson: () => ({ locale: "en", title: "Protected" }),
  parseProtectedPlayback: () => "https://player.mediadelivery.net/embed/761387/test",
}));
vi.mock("@/components/kids/KidsParentPanel", () => ({
  KidsParentPanel: ({ onProfileCreated }: { onProfileCreated?: () => void }) => (
    <button onClick={onProfileCreated}>Create profile here</button>
  ),
}));
vi.mock("@/lib/kids/parent-state", () => ({ useKidsParentState: mock.useKidsParentState }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { functions: { invoke: mock.invoke } },
}));
vi.mock("@/lib/locale/locale-context", () => ({
  useLocale: () => ({ locale: "en", dir: "ltr" }),
}));
vi.mock("@/lib/locale/use-locale-link-search", () => ({
  useLocaleLinkSearch: () => () => ({ locale: "en" }),
}));

beforeEach(() => {
  vi.resetAllMocks();
  mock.invoke.mockResolvedValue({ data: {}, error: null });
  mock.useKidsParentState.mockReturnValue({
    state: "ready",
    profiles: [],
    refresh: mock.refresh,
  });
});

describe("Kids direct lesson route", () => {
  it("lets an approved parent create a profile for the lesson level and then refreshes choices", () => {
    render(<KidsLessonPage />);
    const create = screen.getByRole("button", { name: "Create profile here" });
    expect(screen.getByText("No profile for this level.")).toBeInTheDocument();
    fireEvent.click(create);
    expect(mock.refresh).toHaveBeenCalledOnce();
  });

  it("does not restore a previously opened lesson from memory after the parent grant recheck", async () => {
    const ready = {
      state: "ready",
      profiles: [{ id: "profile-1", level_id: "level-2", display_name: "Explorer" }],
      refresh: mock.refresh,
    };
    mock.useKidsParentState.mockReturnValue(ready);
    const { rerender } = render(<KidsLessonPage />);
    fireEvent.change(screen.getByLabelText("Choose a profile for this level"), {
      target: { value: "profile-1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "View lesson status" }));
    expect(await screen.findByText("Opened protected lesson")).toBeInTheDocument();
    expect(mock.invoke).toHaveBeenCalledTimes(2);

    mock.useKidsParentState.mockReturnValue({ ...ready, state: "checking", profiles: [] });
    rerender(<KidsLessonPage />);
    expect(screen.queryByText("Opened protected lesson")).not.toBeInTheDocument();

    mock.useKidsParentState.mockReturnValue(ready);
    rerender(<KidsLessonPage />);
    expect(screen.queryByText("Opened protected lesson")).not.toBeInTheDocument();
    expect(mock.invoke).toHaveBeenCalledTimes(2);
  });
});

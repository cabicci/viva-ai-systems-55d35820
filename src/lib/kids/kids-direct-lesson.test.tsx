import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { KidsLessonPage } from "../../routes/kids.$levelId.$lessonNumber";

const mock = vi.hoisted(() => ({
  refresh: vi.fn(),
  useKidsParentState: vi.fn(),
  invoke: vi.fn(),
  isAdmin: false,
  params: { levelId: "level-2", lessonNumber: "1" },
}));
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: object) => ({
    ...options,
    useParams: () => mock.params,
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
vi.mock("@/lib/kids/parent-state", () => ({ useKidsParentState: mock.useKidsParentState }));
vi.mock("@/lib/auth-context", () => ({ useAuth: () => ({ user: { id: "parent-1" } }) }));
vi.mock("@/lib/entitlements", () => ({ useEntitlement: () => ({ isAdmin: mock.isAdmin }) }));
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
  mock.isAdmin = false;
  localStorage.clear();
  mock.params = { levelId: "level-2", lessonNumber: "1" };
  mock.invoke.mockResolvedValue({ data: {}, error: null });
  mock.useKidsParentState.mockReturnValue({
    state: "ready",
    profiles: [],
    refresh: mock.refresh,
  });
});

describe("Kids direct lesson route", () => {
  it("opens administrator lessons with the administrator account scope and clears access when the role is revoked", async () => {
    mock.isAdmin = true;
    mock.params = { levelId: "level-3", lessonNumber: "12" };
    mock.useKidsParentState.mockReturnValue({ state: "pending", profiles: [] });
    const page = render(<KidsLessonPage />);
    expect(await screen.findByText("Opened protected lesson")).toBeInTheDocument();
    for (const name of ["kids-lesson-content", "kids-playback"])
      expect(mock.invoke).toHaveBeenCalledWith(name, {
        body: { profileId: "parent-1", levelId: "level-3", lessonNumber: 12, locale: "en" },
      });
    expect(localStorage.length).toBe(0);
    expect(screen.queryByRole("button", { name: "Exit child profile" })).not.toBeInTheDocument();
    mock.isAdmin = false;
    page.rerender(<KidsLessonPage />);
    expect(screen.queryByText("Opened protected lesson")).not.toBeInTheDocument();
  });
  it("does not expose cached administrator content when either protected request fails", async () => {
    mock.isAdmin = true;
    mock.useKidsParentState.mockReturnValue({ state: "pending", profiles: [] });
    const page = render(<KidsLessonPage />);
    expect(await screen.findByText("Opened protected lesson")).toBeInTheDocument();
    mock.invoke.mockResolvedValue({ data: null, error: new Error("Access denied") });
    mock.params = { levelId: "level-2", lessonNumber: "12" };
    page.rerender(<KidsLessonPage />);
    expect(
      await screen.findByText("This lesson is not ready. Video and content were not loaded."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Opened protected lesson")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Go to parent space" })).not.toBeInTheDocument();
  });
  it("sends an approved parent without a matching profile to the separate family page", () => {
    render(<KidsLessonPage />);
    expect(screen.getByText("No profile for this level.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to parent space" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Create child profile" })).not.toBeInTheDocument();
  });

  it("shows sign-in when the browser has no parent session", () => {
    mock.useKidsParentState.mockReturnValue({ state: "signed-out", profiles: [] });
    render(<KidsLessonPage />);
    expect(screen.getByText(/Use your existing Masaarat account/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in" })).toBeInTheDocument();
    expect(
      screen.queryByText("This lesson is not ready. Video and content were not loaded."),
    ).not.toBeInTheDocument();
    expect(mock.invoke).not.toHaveBeenCalled();
  });

  it("keeps the chosen profile across lessons, then permits switching only after exit", async () => {
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
    expect(await screen.findByText("Opened protected lesson")).toBeInTheDocument();
    expect(mock.invoke).toHaveBeenCalledTimes(2);

    mock.params = { levelId: "level-2", lessonNumber: "2" };
    rerender(<KidsLessonPage />);
    expect(await screen.findByText("Opened protected lesson")).toBeInTheDocument();
    expect(mock.invoke).toHaveBeenCalledTimes(4);
    expect(screen.queryByLabelText("Choose a profile for this level")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Exit child profile" }));
    expect(screen.getByLabelText("Choose a profile for this level")).toBeInTheDocument();
    expect(screen.queryByText("Opened protected lesson")).not.toBeInTheDocument();
  });

  it("opens the next lesson quietly while both protected requests run", async () => {
    mock.useKidsParentState.mockReturnValue({
      state: "ready",
      profiles: [{ id: "profile-1", level_id: "level-2", display_name: "Explorer" }],
    });
    const page = render(<KidsLessonPage />);
    fireEvent.change(screen.getByLabelText("Choose a profile for this level"), {
      target: { value: "profile-1" },
    });
    expect(await screen.findByText("Opened protected lesson")).toBeInTheDocument();

    const releases: Array<(value: { data: object; error: null }) => void> = [];
    mock.invoke.mockImplementation(
      () =>
        new Promise((resolve) => {
          releases.push(resolve);
        }),
    );
    mock.params = { levelId: "level-2", lessonNumber: "2" };
    page.rerender(<KidsLessonPage />);
    expect(await screen.findByRole("status", { name: "Opening lesson..." })).toBeInTheDocument();
    expect(screen.queryByText(/Checking access|server grant/i)).not.toBeInTheDocument();
    expect(screen.queryByText("Opened protected lesson")).not.toBeInTheDocument();
    expect(mock.invoke).toHaveBeenCalledTimes(4);
    releases.forEach((release) => release({ data: {}, error: null }));
    expect(await screen.findByText("Opened protected lesson")).toBeInTheDocument();
  });

  it("rechecks the server grant before showing a saved profile's lesson after focus", async () => {
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
    expect(await screen.findByText("Opened protected lesson")).toBeInTheDocument();

    mock.useKidsParentState.mockReturnValue({ ...ready, state: "checking", profiles: [] });
    rerender(<KidsLessonPage />);
    expect(screen.queryByText("Opened protected lesson")).not.toBeInTheDocument();

    mock.useKidsParentState.mockReturnValue(ready);
    rerender(<KidsLessonPage />);
    expect(await screen.findByText("Opened protected lesson")).toBeInTheDocument();
    expect(mock.invoke).toHaveBeenCalledTimes(4);
  });

  it("restores the active profile after a page remount and blocks another level until exit", async () => {
    mock.useKidsParentState.mockReturnValue({
      state: "ready",
      profiles: [
        { id: "profile-1", level_id: "level-2", display_name: "Explorer" },
        { id: "profile-2", level_id: "level-1", display_name: "Creator" },
      ],
    });
    const page = render(<KidsLessonPage />);
    fireEvent.change(screen.getByLabelText("Choose a profile for this level"), {
      target: { value: "profile-1" },
    });
    expect(await screen.findByText("Opened protected lesson")).toBeInTheDocument();
    page.unmount();

    mock.params = { levelId: "level-1", lessonNumber: "1" };
    render(<KidsLessonPage />);
    expect(screen.getByText(/This profile is for another level/)).toBeInTheDocument();
    expect(screen.queryByLabelText("Choose a profile for this level")).not.toBeInTheDocument();
    expect(mock.invoke).toHaveBeenCalledTimes(2);
    fireEvent.click(screen.getByRole("button", { name: "Exit child profile" }));
    expect(screen.getByLabelText("Choose a profile for this level")).toBeInTheDocument();
  });
});

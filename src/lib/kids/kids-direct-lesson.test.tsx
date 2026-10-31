import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { KidsLessonPage } from "../../routes/kids.$levelId.$lessonNumber";

const mock = vi.hoisted(() => ({
  refresh: vi.fn(), useKidsParentState: vi.fn(), invoke: vi.fn(),
  parseLesson: vi.fn(), parsePlayback: vi.fn(),
  getActive: vi.fn(), setActive: vi.fn(), clearActive: vi.fn(),
  isAdmin: false, actorId: "parent-1" as string | null, authLoading: false,
  freeTargets: [] as string[], campaignRpc: vi.fn(),
  authRef: { current: Object.freeze({ value: 0 }) as Readonly<{ value: number }> },
  parentLease: { current: {} },
  locale: "en",
  params: { levelId: "level-2", lessonNumber: "1" },
  parentStateRead: undefined as (() => void) | undefined,
  parentProfilesRead: undefined as (() => void) | undefined,
  functionsRead: undefined as (() => void) | undefined,
  invokeRead: undefined as (() => void) | undefined,
  parseLessonRead: undefined as (() => void) | undefined,
  parsePlaybackRead: undefined as (() => void) | undefined,
  actualBody: false, freshFunctions: false, receivers: [] as object[], bodyCalls: [] as unknown[],
}));
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: object) => ({ ...options, useParams: () => mock.params }),
  Link: ({ children }: { children: React.ReactNode }) => <a href="#">{children}</a>,
  notFound: () => new Error("Not found"),
}));
vi.mock("@/components/site/Navbar", () => ({ Navbar: () => null }));
vi.mock("@/components/site/Footer", () => ({ Footer: () => null }));
vi.mock("@/components/journey/JourneyVisitRecorder", () => ({ JourneyVisitRecorder: () => null }));
vi.mock("@/components/journey/KidsStepCompletion", () => ({ KidsStepCompletion: () => null }));
vi.mock("@/components/assistant/CourseLessonAssistant", () => ({ CourseLessonAssistant: () => null }));
vi.mock("@/components/kids/KidsLessonBody", async () => {
  const actual = await vi.importActual<typeof import("@/components/kids/KidsLessonBody")>("@/components/kids/KidsLessonBody");
  return {
  KidsLessonBody: (props: React.ComponentProps<typeof actual.KidsLessonBody>) => {
    mock.bodyCalls.push(props);
    if (mock.actualBody) return <actual.KidsLessonBody {...props} />;
    return <section><div>Opened protected lesson</div><output data-testid="opened-context">{JSON.stringify({
      title: props.lesson.title, profileId: props.profileId, levelId: props.levelId,
      lessonNumber: props.lessonNumber, locale: props.locale,
    })}</output></section>;
  },
}; });
vi.mock("@/lib/kids/lesson-client", () => ({
  get parseProtectedLesson() { mock.parseLessonRead?.(); return mock.parseLesson; },
  get parseProtectedPlayback() { mock.parsePlaybackRead?.(); return mock.parsePlayback; },
}));
vi.mock("@/lib/kids/parent-state", () => ({ useKidsParentState: mock.useKidsParentState }));
vi.mock("@/lib/auth-context", () => ({ useAuth: () => ({
  user: mock.actorId ? { id: mock.actorId } : null, loading: mock.authLoading,
  authGeneration: mock.authRef.current,
  isAuthGenerationCurrent: (captured: object) => captured === mock.authRef.current,
}) }));
vi.mock("@/lib/entitlements", () => ({ useEntitlement: () => ({ isAdmin: mock.isAdmin, freeTargets: mock.freeTargets }) }));
vi.mock("@/integrations/supabase/client", () => {
  const make = () => ({ get invoke() { mock.invokeRead?.(); return mock.invoke; } });
  const stable = make();
  return { supabase: { rpc: mock.campaignRpc, get functions() {
    mock.functionsRead?.();
    const receiver = mock.freshFunctions ? make() : stable;
    mock.receivers.push(receiver);
    return receiver;
  } } };
});
vi.mock("@/lib/kids/active-profile", () => ({
  getActiveKidsProfile: mock.getActive, setActiveKidsProfile: mock.setActive,
  clearActiveKidsProfile: mock.clearActive,
}));
vi.mock("@/lib/locale/locale-context", () => ({
  useLocale: () => ({ locale: mock.locale, dir: mock.locale === "en" ? "ltr" : "rtl" }),
}));
vi.mock("@/lib/locale/use-locale-link-search", () => ({
  useLocaleLinkSearch: () => () => ({ locale: mock.locale }),
}));
vi.mock("@/lib/locale/locale-search", () => ({ parseLocaleSearchParam: (value: unknown) => value }));
vi.mock("@/lib/locale/resolve-route-head-locale", () => ({ resolveRouteHeadLocale: async () => "en" }));
vi.mock("@/lib/locale/build-localized-public-meta", () => ({ buildLocalizedPublicMeta: () => ({ meta: [] }) }));

type ParentFixture = { state: string; profiles: Array<{ id: string; level_id: string; display_name: string }>; refresh?: unknown };
function setParent(data: ParentFixture) {
  const lease = {};
  const generation = mock.authRef.current;
  mock.parentLease.current = lease;
  const current = () => mock.parentLease.current === lease && mock.authRef.current === generation;
  const api = {
    get state() { mock.parentStateRead?.(); return current() ? data.state : "checking"; },
    get profiles() { mock.parentProfilesRead?.(); return current() && data.state === "ready" ? data.profiles : []; },
    refresh: () => { if (current()) mock.refresh(); },
  };
  mock.useKidsParentState.mockReturnValue(api);
  return api;
}
function rotateAuth(actorId: string | null = "parent-1") {
  mock.authRef.current = Object.freeze({ value: mock.authRef.current.value + 1 });
  mock.actorId = actorId;
}
const preferenceKey = (user: string) => "masaarat:kids:active-profile:" + user;
const profile = { id: "profile-1", level_id: "level-2", display_name: "Explorer" };
function readyParent(id = profile.id) { return setParent({ state: "ready", profiles: [{ ...profile, id }] }); }
beforeEach(() => {
  for (const fn of [mock.refresh, mock.useKidsParentState, mock.invoke, mock.parseLesson,
    mock.parsePlayback, mock.getActive, mock.setActive, mock.clearActive]) fn.mockReset();
  mock.isAdmin = false; mock.actorId = "parent-1"; mock.authLoading = false;
  mock.freeTargets = []; mock.campaignRpc.mockReset(); mock.campaignRpc.mockResolvedValue({ data: true, error: null });
  mock.authRef.current = Object.freeze({ value: 0 });
  mock.parentLease.current = {}; mock.locale = "en";
  mock.parentStateRead = mock.parentProfilesRead = mock.functionsRead = mock.invokeRead = undefined;
  mock.parseLessonRead = mock.parsePlaybackRead = undefined;
  mock.actualBody = false; mock.freshFunctions = false; mock.receivers = []; mock.bodyCalls = [];
  localStorage.clear();
  mock.params = { levelId: "level-2", lessonNumber: "1" };
  mock.invoke.mockResolvedValue({ data: {}, error: null });
  mock.parseLesson.mockImplementation((data: { tag?: string }, _level: string, _lesson: number, locale: string) =>
    ({ locale, title: data?.tag ?? "Protected" }));
  mock.parsePlayback.mockReturnValue("https://player.mediadelivery.net/embed/761387/test");
  mock.getActive.mockImplementation((user: string) => localStorage.getItem(preferenceKey(user)));
  mock.setActive.mockImplementation((user: string, id: string) => localStorage.setItem(preferenceKey(user), id));
  mock.clearActive.mockImplementation((user: string) => localStorage.removeItem(preferenceKey(user)));
  mock.refresh.mockImplementation(() => setParent({ state: "checking", profiles: [] }));
  setParent({ state: "ready", profiles: [] });
});
afterEach(() => cleanup());


describe("campaign expiry composed with current Kids ownership", () => {
  it("retires an open delivery on campaign expiry while a separately paid family remains open", async () => {
    mock.freeTargets = ["kids"]; readyParent();
    localStorage.setItem(preferenceKey("parent-1"), profile.id);
    const page = render(<KidsLessonPage />);
    expect(await screen.findByText("Opened protected lesson")).toBeInTheDocument();
    await waitFor(() => expect(mock.campaignRpc).toHaveBeenCalledTimes(1));
    // An independently paid family still passes the authoritative SQL gate.
    mock.freeTargets = []; page.rerender(<KidsLessonPage />);
    await waitFor(() => expect(mock.campaignRpc).toHaveBeenCalledTimes(2));
    expect(screen.getByText("Opened protected lesson")).toBeInTheDocument();
    mock.freeTargets = ["kids"]; page.rerender(<KidsLessonPage />);
    await waitFor(() => expect(mock.campaignRpc).toHaveBeenCalledTimes(3));
    const context = (mock.bodyCalls.at(-1) as { actionContext: { isCurrent(): boolean } }).actionContext;
    mock.campaignRpc.mockResolvedValue({ data: false, error: null });
    mock.freeTargets = []; page.rerender(<KidsLessonPage />);
    await waitFor(() => expect(screen.queryByText("Opened protected lesson")).toBeNull());
    expect(context.isCurrent()).toBe(false);
  });
  it("ignores a campaign denial returned after the account generation is retired", async () => {
    mock.freeTargets = ["kids"]; readyParent();
    localStorage.setItem(preferenceKey("parent-1"), profile.id);
    const page = render(<KidsLessonPage />);
    expect(await screen.findByText("Opened protected lesson")).toBeInTheDocument();
    const old = deferred<{ data: boolean; error: null }>();
    mock.campaignRpc.mockReturnValueOnce(old.promise);
    mock.freeTargets = []; page.rerender(<KidsLessonPage />);
    await waitFor(() => expect(mock.campaignRpc).toHaveBeenCalledTimes(2));
    rotateAuth(); readyParent(); page.rerender(<KidsLessonPage />);
    expect(await screen.findByText("Opened protected lesson")).toBeInTheDocument();
    await act(async () => { old.resolve({ data: false, error: null }); await Promise.resolve(); });
    expect(screen.getByText("Opened protected lesson")).toBeInTheDocument();
  });
});

describe("Kids direct lesson route", () => {
  it("opens administrator lessons with the administrator account scope and clears access when the role is revoked", async () => {
    mock.isAdmin = true;
    mock.params = { levelId: "level-3", lessonNumber: "12" };
    setParent({ state: "pending", profiles: [] });
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
    setParent({ state: "pending", profiles: [] });
    const page = render(<KidsLessonPage />);
    expect(await screen.findByText("Opened protected lesson")).toBeInTheDocument();
    mock.invoke.mockResolvedValue({ data: null, error: new Error("Access denied") });
    mock.params = { levelId: "level-2", lessonNumber: "12" };
    page.rerender(<KidsLessonPage />);
    expect(
      await screen.findByText("This step is not ready. Video and content were not loaded."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Opened protected lesson")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Go to parent space" })).not.toBeInTheDocument();
  });
  it("sends an approved parent without a matching profile to the separate family page", () => {
    render(<KidsLessonPage />);
    expect(screen.getByText("No profile for this path.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to parent space" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Create child profile" })).not.toBeInTheDocument();
  });

  it("shows sign-in when the browser has no parent session", () => {
    setParent({ state: "signed-out", profiles: [] });
    render(<KidsLessonPage />);
    expect(screen.getByText(/Use your existing Masaarat account/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in" })).toBeInTheDocument();
    expect(
      screen.queryByText("This step is not ready. Video and content were not loaded."),
    ).not.toBeInTheDocument();
    expect(mock.invoke).not.toHaveBeenCalled();
  });

  it("keeps the chosen profile across lessons, then permits switching only after exit", async () => {
    const ready = {
      state: "ready",
      profiles: [{ id: "profile-1", level_id: "level-2", display_name: "Explorer" }],
      refresh: mock.refresh,
    };
    setParent(ready);
    const { rerender } = render(<KidsLessonPage />);
    fireEvent.change(screen.getByLabelText("Choose a profile for this path"), {
      target: { value: "profile-1" },
    });
    expect(await screen.findByText("Opened protected lesson")).toBeInTheDocument();
    expect(mock.invoke).toHaveBeenCalledTimes(2);

    mock.params = { levelId: "level-2", lessonNumber: "2" };
    rerender(<KidsLessonPage />);
    expect(await screen.findByText("Opened protected lesson")).toBeInTheDocument();
    expect(mock.invoke).toHaveBeenCalledTimes(4);
    expect(screen.queryByLabelText("Choose a profile for this path")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Exit child profile" }));
    expect(screen.getByLabelText("Choose a profile for this path")).toBeInTheDocument();
    expect(screen.queryByText("Opened protected lesson")).not.toBeInTheDocument();
  });

  it("opens the next lesson quietly while both protected requests run", async () => {
    setParent({
      state: "ready",
      profiles: [{ id: "profile-1", level_id: "level-2", display_name: "Explorer" }],
    });
    const page = render(<KidsLessonPage />);
    fireEvent.change(screen.getByLabelText("Choose a profile for this path"), {
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
    expect(await screen.findByRole("status", { name: "Opening step..." })).toBeInTheDocument();
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
    setParent(ready);
    const { rerender } = render(<KidsLessonPage />);
    fireEvent.change(screen.getByLabelText("Choose a profile for this path"), {
      target: { value: "profile-1" },
    });
    expect(await screen.findByText("Opened protected lesson")).toBeInTheDocument();

    setParent({ ...ready, state: "checking", profiles: [] });
    rerender(<KidsLessonPage />);
    expect(screen.queryByText("Opened protected lesson")).not.toBeInTheDocument();

    setParent(ready);
    rerender(<KidsLessonPage />);
    expect(await screen.findByText("Opened protected lesson")).toBeInTheDocument();
    expect(mock.invoke).toHaveBeenCalledTimes(4);
  });

  it("restores the active profile after a page remount and blocks another level until exit", async () => {
    setParent({
      state: "ready",
      profiles: [
        { id: "profile-1", level_id: "level-2", display_name: "Explorer" },
        { id: "profile-2", level_id: "level-1", display_name: "Creator" },
      ],
    });
    const page = render(<KidsLessonPage />);
    fireEvent.change(screen.getByLabelText("Choose a profile for this path"), {
      target: { value: "profile-1" },
    });
    expect(await screen.findByText("Opened protected lesson")).toBeInTheDocument();
    page.unmount();

    mock.params = { levelId: "level-1", lessonNumber: "1" };
    render(<KidsLessonPage />);
    expect(screen.getByText(/This profile is for another path/)).toBeInTheDocument();
    expect(screen.queryByLabelText("Choose a profile for this path")).not.toBeInTheDocument();
    expect(mock.invoke).toHaveBeenCalledTimes(2);
    fireEvent.click(screen.getByRole("button", { name: "Exit child profile" }));
    expect(screen.getByLabelText("Choose a profile for this path")).toBeInTheDocument();
  });
  it("preserves admin scope during parent refresh and rechecks both protected endpoints on focus", async () => {
    mock.isAdmin = true;
    setParent({ state: "ready", profiles: [] });
    const page = render(<KidsLessonPage />);
    expect(await screen.findByText("Opened protected lesson")).toBeInTheDocument();
    setParent({ state: "checking", profiles: [] });
    page.rerender(<KidsLessonPage />);
    expect(screen.getByText("Opened protected lesson")).toBeInTheDocument();
    expect(mock.invoke).toHaveBeenCalledTimes(2);
    await act(async () => window.dispatchEvent(new Event("focus")));
    expect(await screen.findByText("Opened protected lesson")).toBeInTheDocument();
    expect(mock.invoke).toHaveBeenCalledTimes(4);
    mock.invoke.mockResolvedValue({ data: null, error: new Error("Access denied") });
    await act(async () => window.dispatchEvent(new Event("focus")));
    expect(
      await screen.findByText("This step is not ready. Video and content were not loaded."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Opened protected lesson")).toBeNull();
  });
});

type Reply = { data: unknown; error: unknown };
function deferred<T = Reply>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
function queuedCalls() {
  const calls: Array<{ name: string; body: Record<string, unknown>; result: ReturnType<typeof deferred<Reply>> }> = [];
  mock.invoke.mockImplementation((name: string, options: { body: Record<string, unknown> }) => {
    const result = deferred();
    calls.push({ name, body: { ...options.body }, result });
    return result.promise;
  });
  return calls;
}
async function settle(work: () => void) {
  await act(async () => { work(); await Promise.resolve(); await Promise.resolve(); });
}
async function pair(calls: ReturnType<typeof queuedCalls>, offset: number, tag: string, denied = false) {
  expect(calls.length).toBeGreaterThanOrEqual(offset + 2);
  await settle(() => {
    calls[offset].result.resolve({ data: { tag }, error: denied ? new Error("synthetic denial") : null });
    calls[offset + 1].result.resolve({ data: { tag }, error: null });
  });
}
async function opened(tag?: string) {
  await screen.findByText("Opened protected lesson");
  if (tag) expect(JSON.parse(screen.getByTestId("opened-context").textContent!).title).toBe(tag);
}
function choose(id = profile.id) {
  fireEvent.change(screen.getByLabelText("Choose a profile for this path"), { target: { value: id } });
}
function savedHandler(element: Element, name: "onClick" | "onChange") {
  // Capture the callback actually installed by React on this mounted DOM control.
  const key = Object.keys(element).find((key) => key.startsWith("__reactProps$"));
  expect(key).toBeTruthy();
  const fn = (element as unknown as Record<string, Record<string, unknown>>)[key!][name];
  expect(typeof fn).toBe("function");
  return fn as (event?: unknown) => void;
}

describe("Kids route currentness", () => {
  it.each(["replace", "logout"] as const)("masks same-UUID %s before cleanup and requires fresh paired reads", async (mode) => {
    mock.isAdmin = true;
    const calls = queuedCalls();
    const page = render(<KidsLessonPage />);
    await pair(calls, 0, "old");
    await opened("old");
    rotateAuth(mode === "logout" ? null : "parent-1");
    page.rerender(<KidsLessonPage />);
    expect(screen.queryByText("Opened protected lesson")).toBeNull();
    if (mode === "logout") {
      expect(calls).toHaveLength(2);
      rotateAuth(); page.rerender(<KidsLessonPage />);
    }
    expect(calls).toHaveLength(4);
    await pair(calls, 2, "fresh");
    await opened("fresh");
  });

  it("never shows either partial response or navigation before both current validations", async () => {
    mock.isAdmin = true;
    const calls = queuedCalls();
    render(<KidsLessonPage />);
    await settle(() => calls[0].result.resolve({ data: { tag: "partial" }, error: null }));
    expect(mock.bodyCalls).toHaveLength(0);
    expect(screen.queryByRole("link", { name: "Next step" })).toBeNull();
    expect(screen.getByRole("status", { name: "Opening step..." })).toBeInTheDocument();
    await settle(() => calls[1].result.resolve({ data: {}, error: null }));
    await opened("partial");
    expect(mock.parseLesson).toHaveBeenCalledTimes(1);
    expect(mock.parsePlayback).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["content", "success", "success"], ["content", "error", "success"], ["content", "reject", "success"],
    ["playback", "success", "success"], ["playback", "error", "success"], ["playback", "reject", "success"],
    ["content", "success", "denial"], ["content", "error", "denial"], ["content", "reject", "denial"],
    ["playback", "success", "denial"], ["playback", "error", "denial"], ["playback", "reject", "denial"],
  ] as const)("ignores stale %s %s and finally after newer %s", async (leg, outcome, newer) => {
    mock.isAdmin = true;
    const calls = queuedCalls();
    const page = render(<KidsLessonPage />);
    const staleIndex = leg === "content" ? 0 : 1;
    await settle(() => calls[1 - staleIndex].result.resolve({ data: { tag: "old-other" }, error: null }));
    rotateAuth(); page.rerender(<KidsLessonPage />);
    await pair(calls, 2, "new", newer === "denial");
    if (newer === "success") await opened("new");
    else expect(await screen.findByText("This step is not ready. Video and content were not loaded.")).toBeInTheDocument();
    const parses = [mock.parseLesson.mock.calls.length, mock.parsePlayback.mock.calls.length];
    await settle(() => outcome === "reject"
      ? calls[staleIndex].result.reject(new Error("synthetic stale rejection"))
      : calls[staleIndex].result.resolve({ data: { tag: "old" }, error: outcome === "error" ? new Error("stale denied") : null }));
    expect([mock.parseLesson.mock.calls.length, mock.parsePlayback.mock.calls.length]).toEqual(parses);
    if (newer === "success") await opened("new");
    else expect(screen.queryByText("Opened protected lesson")).toBeNull();
    expect(mock.invoke).toHaveBeenCalledTimes(4);
  });

  it("old denial/finally cannot end a new request's quiet loading state", async () => {
    mock.isAdmin = true;
    const calls = queuedCalls();
    const page = render(<KidsLessonPage />);
    rotateAuth(); page.rerender(<KidsLessonPage />);
    await pair(calls, 0, "old", true);
    expect(screen.getByRole("status", { name: "Opening step..." })).toBeInTheDocument();
    expect(screen.queryByText("This step is not ready. Video and content were not loaded.")).toBeNull();
    await settle(() => calls[2].result.resolve({ data: { tag: "current" }, error: null }));
    expect(mock.bodyCalls).toHaveLength(0);
    await settle(() => calls[3].result.resolve({ data: {}, error: null }));
    await opened("current");
  });

  it.each(["auth", "parent"] as const)("a first eager invocation retiring %s prevents the second and safely observes rejection", async (boundary) => {
    readyParent();
    mock.invoke.mockImplementationOnce(() => {
      if (boundary === "auth") rotateAuth(null);
      else mock.refresh();
      return Promise.reject(new Error("synthetic already-started rejection"));
    });
    const page = render(<KidsLessonPage />);
    choose();
    await settle(() => {});
    expect(mock.invoke).toHaveBeenCalledTimes(1);
    expect(mock.parseLesson).not.toHaveBeenCalled();
    expect(mock.parsePlayback).not.toHaveBeenCalled();
    expect(mock.bodyCalls).toHaveLength(0);
    page.rerender(<KidsLessonPage />);
    expect(screen.queryByText("Opened protected lesson")).toBeNull();
  });

  it.each(["functions", "invoke"] as const)("retirement during SDK %s access prevents invocation", async (boundary) => {
    mock.isAdmin = true;
    const retire = () => rotateAuth(null);
    if (boundary === "functions") mock.functionsRead = retire;
    else mock.invokeRead = retire;
    render(<KidsLessonPage />);
    await settle(() => {});
    expect(mock.invoke).not.toHaveBeenCalled();
    expect(mock.bodyCalls).toHaveLength(0);
  });

  it("current dispatch uses each actual method receiver once without inventing a backend identity", async () => {
    mock.isAdmin = true; mock.freshFunctions = true;
    render(<KidsLessonPage />);
    await opened();
    expect(mock.invoke).toHaveBeenCalledTimes(2);
    expect(mock.invoke.mock.contexts).toEqual(mock.receivers);
    expect(mock.receivers[0]).not.toBe(mock.receivers[1]);
    expect(mock.invoke.mock.calls.map(([name]) => name)).toEqual(["kids-lesson-content", "kids-playback"]);
    for (const [, options] of mock.invoke.mock.calls) expect(options).toEqual({
      body: { profileId: "parent-1", levelId: "level-2", lessonNumber: 1, locale: "en" },
    });
  });

  it.each(["first", "second"] as const)("current synchronous %s invocation errors remain quiet and closed", async (which) => {
    mock.isAdmin = true;
    if (which === "second") mock.invoke.mockRejectedValueOnce(new Error("synthetic first eager rejection"));
    mock.invoke.mockImplementationOnce(() => { throw new Error("synthetic synchronous throw"); });
    render(<KidsLessonPage />);
    expect(await screen.findByText("This step is not ready. Video and content were not loaded.")).toBeInTheDocument();
    expect(mock.invoke).toHaveBeenCalledTimes(which === "first" ? 1 : 2);
    expect(mock.bodyCalls).toHaveLength(0);
  });

  it.each(["state", "profiles"] as const)("live parent %s getter retirement cannot start protected work", async (kind) => {
    readyParent();
    const retire = () => {
      mock.parentStateRead = mock.parentProfilesRead = undefined;
      mock.refresh();
    };
    if (kind === "state") mock.parentStateRead = retire;
    else mock.parentProfilesRead = retire;
    render(<KidsLessonPage />);
    await settle(() => {});
    expect(mock.invoke).not.toHaveBeenCalled();
    expect(mock.getActive).not.toHaveBeenCalled();
    expect(mock.bodyCalls).toHaveLength(0);
  });

  it("parent reauthorization closes existing content and requires a fresh current pair", async () => {
    readyParent();
    const calls = queuedCalls();
    const page = render(<KidsLessonPage />);
    choose(); await pair(calls, 0, "old"); await opened("old");
    mock.refresh(); page.rerender(<KidsLessonPage />);
    expect(screen.queryByText("Opened protected lesson")).toBeNull();
    expect(mock.clearActive).not.toHaveBeenCalled();
    readyParent(); page.rerender(<KidsLessonPage />);
    expect(calls).toHaveLength(4);
    await pair(calls, 2, "reauthorized"); await opened("reauthorized");
  });

  it("cosmetic parent API object replacement is not permission or a reason to replay requests", async () => {
    const api = readyParent();
    mock.useKidsParentState.mockImplementation(() => ({
      get state() { return api.state; }, get profiles() { return api.profiles; }, refresh: api.refresh,
    }));
    const page = render(<KidsLessonPage />);
    choose(); await opened();
    page.rerender(<KidsLessonPage />);
    expect(screen.getByText("Opened protected lesson")).toBeInTheDocument();
    expect(mock.invoke).toHaveBeenCalledTimes(2);
  });

  it("preview and child selectors with identical UUID bytes cannot share a result", async () => {
    mock.isAdmin = true;
    readyParent("parent-1");
    const calls = queuedCalls();
    const page = render(<KidsLessonPage />);
    await pair(calls, 0, "preview"); await opened("preview");
    mock.isAdmin = false; page.rerender(<KidsLessonPage />);
    expect(screen.queryByText("Opened protected lesson")).toBeNull();
    expect(mock.setActive).not.toHaveBeenCalled();
    choose("parent-1");
    expect(calls).toHaveLength(4);
    await pair(calls, 2, "child"); await opened("child");
    expect(mock.setActive).toHaveBeenCalledWith("parent-1", "parent-1");
    expect(screen.getByRole("button", { name: "Exit child profile" })).toBeInTheDocument();
  });

  it("exit and reselect of the same child cannot revive a pending result or saved controls", async () => {
    setParent({ state: "ready", profiles: [profile, { ...profile, id: "profile-2", display_name: "Second" }] });
    const calls = queuedCalls();
    render(<KidsLessonPage />);
    const oldSelect = savedHandler(screen.getByLabelText("Choose a profile for this path"), "onChange");
    choose();
    const oldExit = savedHandler(screen.getByRole("button", { name: "Exit child profile" }), "onClick");
    fireEvent.click(screen.getByRole("button", { name: "Exit child profile" }));
    choose();
    const clearCalls = mock.clearActive.mock.calls.length;
    act(() => { oldSelect({ target: { value: "profile-2" } }); oldExit(); });
    expect(mock.clearActive).toHaveBeenCalledTimes(clearCalls);
    expect(localStorage.getItem(preferenceKey("parent-1"))).toBe("profile-1");
    expect(calls).toHaveLength(4);
    await pair(calls, 2, "reselected"); await opened("reselected");
    await pair(calls, 0, "retired"); await opened("reselected");
  });

  it.each(["lesson", "locale"] as const)("never revives old %s A-B-A requests", async (kind) => {
    mock.isAdmin = true;
    const calls = queuedCalls();
    const page = render(<KidsLessonPage />);
    if (kind === "lesson") mock.params = { ...mock.params, lessonNumber: "2" };
    else mock.locale = "ar-EG";
    page.rerender(<KidsLessonPage />);
    if (kind === "lesson") mock.params = { ...mock.params, lessonNumber: "1" };
    else mock.locale = "en";
    page.rerender(<KidsLessonPage />);
    expect(calls).toHaveLength(6);
    await pair(calls, 4, "new-A"); await opened("new-A");
    await pair(calls, 0, "old-A"); await pair(calls, 2, "B", true);
    await opened("new-A");
    expect(JSON.parse(screen.getByTestId("opened-context").textContent!)).toMatchObject({ lessonNumber: 1, locale: "en" });
  });

  it("old admin focus and visibility callbacks cannot retire a new request", async () => {
    const win = vi.spyOn(window, "addEventListener");
    const doc = vi.spyOn(document, "addEventListener");
    mock.isAdmin = true;
    const page = render(<KidsLessonPage />);
    await opened();
    const focus = win.mock.calls.find(([name]) => name === "focus")![1] as EventListener;
    const visible = doc.mock.calls.find(([name]) => name === "visibilitychange")![1] as EventListener;
    win.mockRestore(); doc.mockRestore();
    mock.params = { ...mock.params, lessonNumber: "2" }; page.rerender(<KidsLessonPage />);
    await opened();
    act(() => { focus(new Event("focus")); visible(new Event("visibilitychange")); });
    expect(mock.invoke).toHaveBeenCalledTimes(4);
    expect(screen.getByText("Opened protected lesson")).toBeInTheDocument();
  });

  it("visibility getter retirement is checked before an admin recheck", async () => {
    mock.isAdmin = true;
    const page = render(<KidsLessonPage />); await opened();
    const visible = vi.spyOn(document, "visibilityState", "get").mockImplementationOnce(() => {
      rotateAuth(null); return "visible";
    });
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    visible.mockRestore();
    expect(mock.invoke).toHaveBeenCalledTimes(2);
    page.rerender(<KidsLessonPage />);
    expect(screen.queryByText("Opened protected lesson")).toBeNull();
  });

  it("restore helper reentrancy cannot clear a replacement context's preference", async () => {
    readyParent();
    localStorage.setItem(preferenceKey("parent-1"), "new-preference");
    mock.getActive.mockImplementationOnce(() => { rotateAuth(); return "unknown-retired"; });
    render(<KidsLessonPage />);
    expect(mock.clearActive).not.toHaveBeenCalled();
    expect(mock.invoke).not.toHaveBeenCalled();
    expect(localStorage.getItem(preferenceKey("parent-1"))).toBe("new-preference");
  });

  it.each(["save", "clear"] as const)("rechecks after %s storage helper reentrancy without dispatch or follow-up writes", async (operation) => {
    readyParent();
    render(<KidsLessonPage />);
    if (operation === "save") {
      mock.setActive.mockImplementationOnce(() => { rotateAuth(); });
      choose();
      expect(mock.invoke).not.toHaveBeenCalled();
      expect(mock.clearActive).not.toHaveBeenCalled();
    } else {
      choose(); await opened();
      mock.clearActive.mockImplementationOnce(() => {
        localStorage.setItem(preferenceKey("parent-1"), "replacement-preference");
        rotateAuth();
      });
      fireEvent.click(screen.getByRole("button", { name: "Exit child profile" }));
      expect(mock.invoke).toHaveBeenCalledTimes(2);
      expect(localStorage.getItem(preferenceKey("parent-1"))).toBe("replacement-preference");
      expect(mock.setActive).toHaveBeenCalledTimes(1);
    }
  });

  it.each(["lesson-get", "lesson-call", "playback-get", "playback-call"] as const)("parser %s reentrancy never publishes a retired pair", async (boundary) => {
    mock.isAdmin = true;
    if (boundary === "lesson-get") mock.parseLessonRead = () => rotateAuth();
    if (boundary === "playback-get") mock.parsePlaybackRead = () => rotateAuth();
    if (boundary === "lesson-call") mock.parseLesson.mockImplementationOnce(() => {
      rotateAuth(); return { locale: "en", title: "retired" };
    });
    if (boundary === "playback-call") mock.parsePlayback.mockImplementationOnce(() => {
      rotateAuth(); return "https://synthetic.invalid/retired";
    });
    const page = render(<KidsLessonPage />);
    await settle(() => {});
    expect(mock.bodyCalls).toHaveLength(0);
    if (boundary.startsWith("lesson")) expect(mock.parsePlayback).not.toHaveBeenCalled();
    page.rerender(<KidsLessonPage />);
    expect(screen.queryByText("Opened protected lesson")).toBeNull();
  });

  it.each(["lesson", "playback"] as const)("a current invalid %s parser result stays localized and closed", async (which) => {
    mock.isAdmin = true;
    if (which === "lesson") mock.parseLesson.mockReturnValueOnce(null);
    else mock.parsePlayback.mockReturnValueOnce(null);
    render(<KidsLessonPage />);
    expect(await screen.findByText("This step is not ready. Video and content were not loaded.")).toBeInTheDocument();
    expect(mock.bodyCalls).toHaveLength(0);
  });

  it("unmount/remount preserves preference while old pair and exit callbacks are inert", async () => {
    readyParent();
    const calls = queuedCalls();
    const first = render(<KidsLessonPage />); choose();
    const oldExit = savedHandler(screen.getByRole("button", { name: "Exit child profile" }), "onClick");
    first.unmount();
    render(<KidsLessonPage />);
    expect(calls).toHaveLength(4);
    act(() => oldExit());
    expect(mock.clearActive).not.toHaveBeenCalled();
    await pair(calls, 2, "remounted"); await opened("remounted");
    await pair(calls, 0, "unmounted"); await opened("remounted");
    expect(localStorage.getItem(preferenceKey("parent-1"))).toBe("profile-1");
  });

  it("root StrictMode replay isolates the first paired request without extra current dispatches", async () => {
    mock.isAdmin = true;
    const calls = queuedCalls();
    render(<KidsLessonPage />, { reactStrictMode: true });
    expect(calls).toHaveLength(4);
    await pair(calls, 0, "replayed");
    expect(mock.bodyCalls).toHaveLength(0);
    await pair(calls, 2, "current"); await opened("current");
    expect(calls).toHaveLength(4);
  });

  it("auth loading never restores or starts endpoints until fresh current parent evidence exists", async () => {
    mock.authLoading = true; readyParent();
    const page = render(<KidsLessonPage />);
    expect(mock.invoke).not.toHaveBeenCalled();
    expect(mock.getActive).not.toHaveBeenCalled();
    mock.authLoading = false; readyParent();
    page.rerender(<KidsLessonPage />);
    choose(); await opened();
    expect(mock.invoke).toHaveBeenCalledTimes(2);
  });
});


describe("Kids rejected-leg compatibility decisive", () => {
  it.each([0, 1])("decisive rejected leg %i denies while its peer stays unresolved", async (leg) => {
    mock.isAdmin = true;
    const calls = queuedCalls();
    render(<KidsLessonPage />);
    expect(calls).toHaveLength(2);
    let peerSettled = false;
    void calls[1 - leg].result.promise.then(
      () => { peerSettled = true; }, () => { peerSettled = true; },
    );
    await settle(() => calls[leg].result.reject(new Error("synthetic current rejected leg")));
    expect(peerSettled).toBe(false);
    expect(screen.queryByText("This step is not ready. Video and content were not loaded.")).toBeInTheDocument();
    expect(screen.queryByRole("status", { name: "Opening step..." })).toBeNull();
    expect(screen.queryByText("Opened protected lesson")).toBeNull();
    expect(screen.queryByRole("navigation")).toBeNull();
    expect(mock.parseLesson).not.toHaveBeenCalled();
    expect(mock.parsePlayback).not.toHaveBeenCalled();
  });
});


describe("Kids rejected-leg compatibility controls", () => {
  const unavailable = "This step is not ready. Video and content were not loaded.";
  function deniedNow() {
    expect(screen.getByText(unavailable)).toBeInTheDocument();
    expect(screen.queryByRole("status", { name: "Opening step..." })).toBeNull();
    expect(screen.queryByText("Opened protected lesson")).toBeNull();
    expect(screen.queryByRole("navigation")).toBeNull();
  }
  it.each([[0, "fulfill"], [0, "reject"], [1, "fulfill"], [1, "reject"]] as const)(
    "late peer %s/%s cannot resurrect a denied current request",
    async (leg, outcome) => {
      mock.isAdmin = true;
      const calls = queuedCalls(); render(<KidsLessonPage />);
      await settle(() => calls[leg].result.reject(new Error("synthetic immediate rejection")));
      deniedNow();
      await settle(() => outcome === "reject"
        ? calls[1 - leg].result.reject(new Error("synthetic late peer rejection"))
        : calls[1 - leg].result.resolve({ data: { tag: "late peer" }, error: null }));
      deniedNow();
      expect(mock.parseLesson).not.toHaveBeenCalled();
      expect(mock.parsePlayback).not.toHaveBeenCalled();
      expect(mock.invoke).toHaveBeenCalledTimes(2);
    },
  );

  it.each([0, 1])("old rejected leg %i cannot replace fresh success while old peer remains pending", async (leg) => {
    mock.isAdmin = true;
    const calls = queuedCalls(); const page = render(<KidsLessonPage />);
    rotateAuth(); page.rerender(<KidsLessonPage />);
    await pair(calls, 2, "fresh"); await opened("fresh");
    await settle(() => calls[leg].result.reject(new Error("synthetic old rejection")));
    await opened("fresh");
    expect(mock.invoke).toHaveBeenCalledTimes(4);
    expect(screen.queryByText(unavailable)).toBeNull();
  });

  it.each([0, 1])("old rejected leg %i and finally cannot end replacement loading", async (leg) => {
    mock.isAdmin = true;
    const calls = queuedCalls(); const page = render(<KidsLessonPage />);
    rotateAuth(); page.rerender(<KidsLessonPage />);
    await settle(() => calls[leg].result.reject(new Error("synthetic retired rejection")));
    expect(screen.getByRole("status", { name: "Opening step..." })).toBeInTheDocument();
    expect(screen.queryByText(unavailable)).toBeNull();
    await pair(calls, 2, "replacement"); await opened("replacement");
  });

  it("observes a first eager promise after synchronous retirement and skips the second invocation", async () => {
    mock.isAdmin = true;
    const started = deferred();
    mock.invoke.mockImplementationOnce(() => { rotateAuth(null); return started.promise; });
    const page = render(<KidsLessonPage />);
    expect(mock.invoke).toHaveBeenCalledTimes(1);
    await settle(() => started.reject(new Error("synthetic abandoned first rejection")));
    page.rerender(<KidsLessonPage />);
    expect(screen.queryByText("Opened protected lesson")).toBeNull();
    expect(screen.queryByText(unavailable)).toBeNull();
    expect(mock.invoke).toHaveBeenCalledTimes(1);
    // Vitest unhandled-rejection detection stays enabled.
  });

  it("observes first-leg rejection after second invocation throws without an unhandled derivative", async () => {
    mock.isAdmin = true;
    const started = deferred();
    mock.invoke.mockReturnValueOnce(started.promise);
    mock.invoke.mockImplementationOnce(() => { throw new Error("synthetic second invoke throw"); });
    render(<KidsLessonPage />);
    await settle(() => {});
    deniedNow();
    await settle(() => started.reject(new Error("synthetic first rejection after throw")));
    deniedNow();
    expect(mock.invoke).toHaveBeenCalledTimes(2);
  });

  it("current paired success still needs both fulfillments and keeps receiver/dispatch-once/body", async () => {
    mock.isAdmin = true; mock.freshFunctions = true;
    const calls = queuedCalls(); render(<KidsLessonPage />);
    await settle(() => calls[0].result.resolve({ data: { tag: "current" }, error: null }));
    expect(screen.getByRole("status", { name: "Opening step..." })).toBeInTheDocument();
    expect(screen.queryByRole("navigation")).toBeNull();
    expect(mock.bodyCalls).toHaveLength(0);
    expect(mock.parseLesson).not.toHaveBeenCalled();
    await settle(() => calls[1].result.resolve({ data: {}, error: null }));
    await opened("current");
    expect(screen.getByRole("navigation")).toBeInTheDocument();
    expect(mock.invoke).toHaveBeenCalledTimes(2);
    expect(mock.invoke.mock.contexts).toEqual(mock.receivers);
    for (const call of calls) expect(call.body).toEqual({
      profileId: "parent-1", levelId: "level-2", lessonNumber: 1, locale: "en",
    });
  });

  it.each([0, 1])("fulfilled SDK error in leg %i waits for peer as before", async (leg) => {
    mock.isAdmin = true;
    const calls = queuedCalls(); render(<KidsLessonPage />);
    await settle(() => calls[leg].result.resolve({ data: null, error: new Error("synthetic fulfilled SDK error") }));
    expect(screen.getByRole("status", { name: "Opening step..." })).toBeInTheDocument();
    expect(screen.queryByText(unavailable)).toBeNull();
    expect(mock.parseLesson).not.toHaveBeenCalled();
    await settle(() => calls[1 - leg].result.resolve({ data: {}, error: null }));
    deniedNow();
  });

  it("parser-invalid fulfillment is inspected only after the peer also fulfills", async () => {
    mock.isAdmin = true; mock.parseLesson.mockReturnValueOnce(null);
    const calls = queuedCalls(); render(<KidsLessonPage />);
    await settle(() => calls[0].result.resolve({ data: {}, error: null }));
    expect(screen.getByRole("status", { name: "Opening step..." })).toBeInTheDocument();
    expect(mock.parseLesson).not.toHaveBeenCalled();
    await settle(() => calls[1].result.resolve({ data: {}, error: null }));
    deniedNow();
    expect(mock.parseLesson).toHaveBeenCalledTimes(1);
  });

  it.each([0, 1])("late peer rejection after denial in leg %i cannot affect a fresh replacement success", async (leg) => {
    mock.isAdmin = true;
    const calls = queuedCalls(); const page = render(<KidsLessonPage />);
    await settle(() => calls[leg].result.reject(new Error("synthetic current rejection")));
    deniedNow();
    rotateAuth(); page.rerender(<KidsLessonPage />);
    await pair(calls, 2, "fresh after denial"); await opened("fresh after denial");
    await settle(() => calls[1 - leg].result.reject(new Error("synthetic late abandoned peer")));
    await opened("fresh after denial");
    expect(mock.invoke).toHaveBeenCalledTimes(4);
  });
});


describe("Kids route body action connection", () => {
  async function flush(work: () => void = () => undefined) {
    await act(async () => { work(); for (let n = 0; n < 12; n += 1) await Promise.resolve(); });
  }
  function prepare() {
    mock.actualBody = true; readyParent(); mock.getActive.mockReturnValue(profile.id);
    mock.parseLesson.mockImplementation(() => ({ locale: "en", title: "Connected lesson",
      hints: [{ question: "Connected hint?", source: "concept" }],
      quiz: [{ id: "q1", question: "Connected quiz", options: ["Yes", "No"] }],
    }));
    const hint = () => ({ data: { question: "Connected hint?", answer: "Connected answer",
      citation: { product: "kids", levelId: "level-2", lessonNumber: 1, locale: "en", sourceId: "concept" } }, error: null });
    mock.invoke.mockImplementation((name: string) => Promise.resolve(name === "kids-lesson-help" ? hint() : { data: {}, error: null }));
    return hint;
  }
  function savedClick(element: Element) {
    const key = Object.keys(element).find((name) => name.startsWith("__reactProps$"))!;
    return (element as unknown as Record<string, { onClick: () => void }>)[key].onClick;
  }
  it("RC01 actual request context remains stable, then same UUID auth replacement retires it before cleanup", async () => {
    const reply = prepare(), page = render(<KidsLessonPage />);
    const button = await screen.findByRole("button", { name: "Connected hint?" });
    const props = mock.bodyCalls.at(-1) as React.ComponentProps<typeof import("@/components/kids/KidsLessonBody").KidsLessonBody>;
    expect(props.actionContext.kind).toBe("kids_profile"); expect(props.actionContext.isCurrent()).toBe(true);
    page.rerender(<KidsLessonPage />);
    const next = mock.bodyCalls.at(-1) as typeof props;
    expect(next.actionContext.incarnation).toBe(props.actionContext.incarnation);
    const callback = savedClick(button); const pending = deferred();
    mock.invoke.mockReturnValueOnce(pending.promise); fireEvent.click(button); await flush();
    rotateAuth(); expect(props.actionContext.isCurrent()).toBe(false);
    const calls = mock.invoke.mock.calls.length; act(() => callback()); expect(mock.invoke).toHaveBeenCalledTimes(calls);
    await flush(() => pending.resolve(reply()));
    expect(screen.queryByText("Connected answer")).not.toBeInTheDocument();
    readyParent(); page.rerender(<KidsLessonPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Connected hint?" }));
    expect(await screen.findByText("Connected answer")).toBeInTheDocument();
  });
  it("RC02 actual administrator focus retirement refreshes both route reads and permits a fresh body action", async () => {
    const reply = prepare(); mock.isAdmin = true; setParent({ state: "pending", profiles: [] });
    const page = render(<KidsLessonPage />); const button = await screen.findByRole("button", { name: "Connected hint?" });
    const props = mock.bodyCalls.at(-1) as React.ComponentProps<typeof import("@/components/kids/KidsLessonBody").KidsLessonBody>;
    expect(props.actionContext.kind).toBe("administrator_preview");
    const old = deferred(); mock.invoke.mockReturnValueOnce(old.promise); fireEvent.click(button); await flush();
    const callback = savedClick(button);
    act(() => window.dispatchEvent(new Event("focus")));
    expect(props.actionContext.isCurrent()).toBe(false);
    const calls = mock.invoke.mock.calls.length; act(() => callback()); expect(mock.invoke).toHaveBeenCalledTimes(calls);
    await flush(() => old.resolve(reply()));
    expect(screen.queryByText("Connected answer")).not.toBeInTheDocument();
    const fresh = await screen.findByRole("button", { name: "Connected hint?" }); fireEvent.click(fresh);
    expect(await screen.findByText("Connected answer")).toBeInTheDocument();
    expect(mock.invoke.mock.calls.filter(([name]) => name === "kids-playback")).toHaveLength(2);
    expect(mock.invoke.mock.calls.filter(([name, options]) => name === "kids-lesson-content" && !options.body.action)).toHaveLength(2);
    page.unmount();
  });
});

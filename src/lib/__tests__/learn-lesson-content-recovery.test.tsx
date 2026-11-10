import type { ComponentType, ReactNode } from "react";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, fireEvent, waitFor } from "@testing-library/react";
import { getUiString } from "@/lib/locale/ui-strings";
import type { SupportedLocale } from "@/lib/locale/types";
const state = vi.hoisted(() => ({
  load: vi.fn(),
  packageLoad: vi.fn(),
  invalidate: vi.fn(),
  data: null as any,
  locale: "en" as SupportedLocale,
  user: "learner-a",
  generation: { value: 1 },
  gate: "open",
  ready: true,
  access: { contentSource: "canonical", effectiveLocale: "en" },
  options: null as any,
}));
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: any) => {
    state.options = options;
    return {
      ...options,
      useLoaderData: () => state.data,
      useSearch: () => ({ locale: state.locale }),
      useParams: () => ({ pathId: state.data.pathId, lessonId: state.data.lesson.slug }),
    };
  },
  Link: ({ children }: { children: ReactNode }) => <a>{children}</a>,
  notFound: () => new Error("not found"),
  useNavigate: () => vi.fn(),
  useRouter: () => ({ invalidate: state.invalidate }),
}));
vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({
    user: { id: state.user },
    authGeneration: state.generation,
    isAuthGenerationCurrent: (generation: object) => generation === state.generation,
  }),
}));
vi.mock("@/lib/auth-route-guard", () => ({
  AuthSessionGate: ({ children }: { children: ReactNode }) => <>{children}</>,
  AuthLoadingShell: () => null,
}));
vi.mock("@/lib/kids/auth-intent", () => ({ parseAuthIntentSearch: (value: unknown) => value }));
vi.mock("@/lib/learner-route-guard", () => ({ learnerLessonAccess: {} }));
vi.mock("@/lib/locale/locale-context", () => ({
  useLocale: () => ({ locale: state.locale, dir: state.locale === "en" ? "ltr" : "rtl" }),
}));
vi.mock("@/components/intro/lessons", () => ({ loadIntroLessonContent: state.load }));
vi.mock("@/components/intro/IntroLessonRenderer", () => ({
  IntroLessonRenderer: ({ content, lessonId }: any) => (
    <section data-testid="rendered" data-lesson={lessonId}>
      {content[0]?.title}
    </section>
  ),
}));
vi.mock("@/components/locale/LocalePackageLessonRenderer", () => ({
  LocalePackageLessonRenderer: ({ pkg }: any) => (
    <section data-testid="package">{pkg.title}</section>
  ),
}));
vi.mock("@/lib/locale-lessons/load-locale-package-lesson", () => ({
  loadLocalePackageLesson: state.packageLoad,
}));
vi.mock("@/lib/locale-lessons/registry", () => ({ isPackageLocale: () => true }));
vi.mock("@/lib/locale-lessons/resolve-lesson-access", () => ({
  resolveLessonAccess: () => ({ contentSource: "canonical", effectiveLocale: "en" }),
}));
vi.mock("@/lib/locale-lessons/lesson-preview-search", () => ({
  buildLessonLocaleSearch: (value: unknown) => value,
  parseLessonPreviewSearch: (value: unknown) => value,
  resolveRouteLessonAccess: () => state.access,
}));
vi.mock("@/lib/locale/locale-cookie", () => ({ readRequestCookieLocale: async () => "en" }));
vi.mock("@/lib/locale/read-locale-runtime-inputs", () => ({
  readLocaleRuntimeInputs: async () => ({ cookieLocale: "en", countryCode: null }),
}));
vi.mock("@/lib/locale/resolve-route-head-locale", () => ({
  resolveRouteHeadLocale: async () => "en",
}));
vi.mock("@/lib/locale/build-learner-route-meta", () => ({ buildLocalizedLearnerMeta: () => ({}) }));
vi.mock("@/lib/locale/use-locale-link-search", () => ({
  useLocaleLinkSearch: () => () => ({ locale: state.locale }),
}));
vi.mock("@/lib/locale-curriculum/resolve-curriculum-label", () => ({
  getCurriculumModuleLabel: () => "Synthetic module",
  getCurriculumLessonLabel: (_locale: string, id: string) => id,
}));
vi.mock("@/lib/locale-curriculum/resolve-continuity", () => ({
  getContinuityForLocale: () => "Synthetic continuity",
}));
vi.mock("@/lib/curriculum-data", () => ({
  getPath: () => ({
    modules: [
      {
        id: "synthetic-module",
        title: "Synthetic module",
        order: 1,
        lessons: ["synthetic-a", "synthetic-b"].map((id) => ({
          id,
          title: id,
          state: "available",
          route: `/learn/intro/${id}`,
        })),
      },
    ],
  }),
}));
vi.mock("@/lib/lesson-progress", () => ({
  useLessonProgress: () => ({
    isLoaded: state.ready,
    getStatus: () => "not_started",
    refetch: vi.fn(),
  }),
}));
vi.mock("@/lib/entitlements", () => ({
  useEntitlement: () => ({ isAdmin: false }),
  useStreak: () => ({ recordActivity: vi.fn() }),
  useLessonGate: () => ({
    gate: { kind: state.gate },
    entitlement: { isAdmin: false },
    isLoaded: state.ready,
  }),
}));
vi.mock(import("@/lib/mission-gate"), async (importOriginal) => ({
  ...(await importOriginal()),
  useMissionGateForPage: (_id, shape) => ({
    kind: shape === undefined ? "loading" : "no-mission",
  }),
}));
vi.mock("@/lib/learner-events", () => ({ logLearnerEvent: vi.fn() }));
vi.mock("@/lib/assistant/resolve-assistant-learner-context", () => ({
  buildLocalizedAssistantContextOverride: () => null,
}));
vi.mock("@/components/dashboard/Sidebar", () => ({ Sidebar: () => null }));
vi.mock("@/components/journey/JourneyVisitRecorder", () => ({ JourneyVisitRecorder: () => null }));
vi.mock("@/components/learn/LessonProgressFeedback", () => ({
  LessonProgressFeedback: () => null,
}));
vi.mock("@/components/learn/AiLessonCompletionAction", () => ({
  AiLessonCompletionAction: ({ disabled }: { disabled: boolean }) => (
    <button disabled={disabled}>Complete test lesson</button>
  ),
}));
vi.mock("@/components/learn/PaywallCard", () => ({
  PaywallCard: () => <p>Paywall boundary</p>,
  IntroGateCard: () => <p>Intro gate boundary</p>,
}));
vi.mock("@/components/learn/DifficultyPrompt", () => ({ DifficultyPrompt: () => null }));
vi.mock("@/components/learn/ReadingProgressBar", () => ({ ReadingProgressBar: () => null }));
vi.mock("@/components/assistant/CourseLessonAssistant", () => ({
  CourseLessonAssistant: () => null,
}));
import { Route } from "@/routes/learn.$pathId.$lessonId";
const Page = (Route as unknown as { component: ComponentType }).component;
function pending() {
  let resolve!: (value: any) => void, reject!: (reason: Error) => void;
  const promise = new Promise<any>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
const content = (label: string) => [
  { id: "synthetic", title: label, block: { kind: "paragraphs", paragraphs: ["Synthetic only"] } },
];
function data(id = "synthetic-a", pathId = "intro") {
  return {
    pathId,
    lesson: {
      id,
      slug: id,
      moduleId: "synthetic-module",
      title: id,
      moduleTitle: "Synthetic module",
      moduleOrder: 1,
      globalOrder: 1,
    },
    lessonAccess: { contentSource: "canonical", effectiveLocale: state.locale },
    localizedPackage: null,
  };
}
beforeEach(() => {
  state.load.mockReset();
  state.packageLoad.mockReset();
  state.invalidate.mockReset();
  state.user = "learner-a";
  state.generation = { value: 1 };
  state.locale = "en";
  state.gate = "open";
  state.ready = true;
  state.access = { contentSource: "canonical", effectiveLocale: "en" };
  state.data = data();
});
afterEach(cleanup);
it.each(["en", "ar-EG", "ar-MSA", "ar-Gulf"] as const)(
  "recovers a rejected lazy lesson with localized retry in %s",
  async (locale) => {
    state.locale = locale;
    const first = pending(),
      second = pending();
    state.load.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    render(<Page />);
    await act(async () => first.reject(new Error("synthetic private chunk path")));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      getUiString(locale, "learn.error.load"),
    );
    expect(screen.queryByText("synthetic private chunk path")).toBeNull();
    expect(screen.getByRole("button", { name: "Complete test lesson" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: getUiString(locale, "learn.content.reload") }),
    ).toBeVisible();
    fireEvent.click(
      screen.getByRole("button", { name: getUiString(locale, "learn.content.retry") }),
    );
    await waitFor(() => expect(state.load).toHaveBeenCalledTimes(2));
    expect(screen.getByRole("status")).toHaveTextContent(
      getUiString(locale, "learn.content.loading"),
    );
    await act(async () => second.resolve(content("Confirmed retried content")));
    expect(await screen.findByTestId("rendered")).toHaveTextContent("Confirmed retried content");
    expect(screen.getByRole("button", { name: "Complete test lesson" })).toBeEnabled();
  },
);
it("keeps unregistered content distinct from a failed chunk", async () => {
  state.load.mockResolvedValue(null);
  render(<Page />);
  expect(
    await screen.findByText(getUiString("en", "learn.content.unavailable.title")),
  ).toBeVisible();
  expect(screen.queryByRole("alert")).toBeNull();
  expect(screen.queryByRole("status")).toBeNull();
});
it.each(["lesson", "route", "account", "session", "locale"])(
  "does not release stale content after a %s change",
  async (change) => {
    const first = pending(),
      next = pending();
    state.load.mockReturnValueOnce(first.promise).mockReturnValueOnce(next.promise);
    const page = render(<Page />);
    await act(async () => {});
    if (change === "lesson") state.data = data("synthetic-b");
    if (change === "route") state.data = data("synthetic-a", "builder");
    if (change === "account") {
      state.user = "learner-b";
      state.generation = { value: 2 };
    }
    if (change === "session") state.generation = { value: 2 };
    if (change === "locale") state.locale = "ar-Gulf";
    page.rerender(<Page />);
    await act(async () => next.resolve(content("Active scope")));
    expect(await screen.findByTestId("rendered")).toHaveTextContent("Active scope");
    await act(async () => first.resolve(content("Stale scope")));
    expect(screen.getByTestId("rendered")).toHaveTextContent("Active scope");
    expect(screen.queryByText("Stale scope")).toBeNull();
  },
);
it("does not publish a completion after auth generation changes before rerender", async () => {
  const first = pending();
  state.load.mockReturnValue(first.promise);
  render(<Page />);
  await act(async () => {});
  state.generation = { value: 2 };
  await act(async () => first.resolve(content("Stale auth generation")));
  expect(screen.queryByTestId("rendered")).toBeNull();
});
it.each(["resolve", "reject"])("ignores %s after page unmount", async (kind) => {
  const first = pending();
  state.load.mockReturnValue(first.promise);
  const page = render(<Page />);
  await act(async () => {});
  page.unmount();
  await act(async () =>
    kind === "resolve"
      ? first.resolve(content("Unmounted"))
      : first.reject(new Error("unmounted rejection")),
  );
  expect(screen.queryByTestId("rendered")).toBeNull();
});
it.each(["paywall", "complete-intro-first"])(
  "does not request canonical content while the %s gate is closed",
  async (gate) => {
    state.gate = gate;
    state.load.mockRejectedValue(new Error("synthetic chunk failure"));
    render(<Page />);
    await act(async () => {});
    expect(
      screen.getByText(gate === "paywall" ? "Paywall boundary" : "Intro gate boundary"),
    ).toBeVisible();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.queryByTestId("rendered")).toBeNull();
    expect(state.load).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Complete test lesson" })).toBeNull();
  },
);
it("preserves successful content across an unrelated render", async () => {
  state.load.mockResolvedValue(content("Stable content"));
  const page = render(<Page />);
  await screen.findByTestId("rendered");
  page.rerender(<Page />);
  expect(screen.getByTestId("rendered")).toHaveTextContent("Stable content");
  expect(state.load).toHaveBeenCalledTimes(1);
});
it("switches to the package consumer without releasing the pending canonical import", async () => {
  const first = pending();
  state.load.mockReturnValue(first.promise);
  const page = render(<Page />);
  await act(async () => {});
  state.data = {
    ...state.data,
    lessonAccess: { contentSource: "locale-package-json", effectiveLocale: "en" },
    localizedPackage: { title: "Active package" },
  };
  page.rerender(<Page />);
  await act(async () => first.resolve(content("Canonical response")));
  expect(screen.getByTestId("package")).toHaveTextContent("Active package");
  expect(screen.queryByTestId("rendered")).toBeNull();
});
it.each(["en", "ar-EG", "ar-MSA", "ar-Gulf"] as const)(
  "retries the actual failed package route loader in %s",
  async (locale) => {
    state.locale = locale;
    state.access = { contentSource: "locale-package-json", effectiveLocale: locale };
    state.packageLoad
      .mockRejectedValueOnce(new Error("synthetic package chunk URL"))
      .mockResolvedValueOnce({ title: "Recovered package" });
    const input = { params: { pathId: "intro", lessonId: "synthetic-a" }, deps: { locale } };
    await expect(state.options.loader(input)).rejects.toThrow("synthetic package chunk URL");
    const recovered = vi.fn();
    state.invalidate.mockImplementation(() => state.options.loader(input).then(recovered));
    const ErrorPage = state.options.errorComponent as ComponentType<{ error: Error }>;
    render(<ErrorPage error={new Error("synthetic package chunk URL")} />);
    expect(screen.getByRole("alert")).toHaveTextContent(getUiString(locale, "learn.error.load"));
    expect(screen.queryByText("synthetic package chunk URL")).toBeNull();
    fireEvent.click(
      screen.getByRole("button", { name: getUiString(locale, "learn.content.retry") }),
    );
    await waitFor(() => expect(recovered).toHaveBeenCalled());
    expect(state.packageLoad).toHaveBeenCalledTimes(2);
    expect(recovered.mock.calls[0][0].localizedPackage.title).toBe("Recovered package");
  },
);

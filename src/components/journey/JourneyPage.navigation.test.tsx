import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory, createRootRoute, createRoute, createRouter, Outlet, RouterProvider,
} from "@tanstack/react-router";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { Session } from "@supabase/supabase-js";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  session: null as Session | null,
  listener: undefined as ((event: string, session: Session | null) => void) | undefined,
  middleware: undefined as ((input: { next: (input: { headers: Record<string, string> }) => Promise<unknown> }) => Promise<unknown>) | undefined,
  headers: new Headers(),
  documentRequest: false,
  verified: true,
  visits: [] as unknown[],
  trace: [] as string[],
  claims: vi.fn(),
  loader: vi.fn(),
  rpc: vi.fn(),
}));

// Adapt only the framework dispatch boundary. The registered generated client
// middleware, learner handler, request resolver and route guard run unchanged.
vi.mock("@tanstack/react-start", () => ({
  createMiddleware: () => ({ client: (fn: typeof state.middleware) => {
    state.middleware = fn;
    return {};
  } }),
  createServerFn: () => ({ handler: (fn: () => Promise<unknown>) => async () => {
    if (state.documentRequest) return fn();
    return state.middleware!({ next: async ({ headers }) => {
      state.trace.push(headers.Authorization ? "rpc:bearer" : "rpc:anonymous");
      state.headers = new Headers(headers);
      return fn();
    } });
  } }),
}));
vi.mock("@tanstack/react-start/server", () => ({
  getRequest: () => ({ headers: state.headers }),
}));
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ auth: { getClaims: state.claims } }),
}));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {
  auth: {
    getSession: async () => ({ data: { session: state.session }, error: null }),
    onAuthStateChange: (listener: typeof state.listener) => {
      state.listener = listener;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    },
    signOut: vi.fn().mockResolvedValue({ error: null }),
  },
  rpc: state.rpc,
  from: () => ({ select: () => ({ eq: () => ({
    maybeSingle: async () => ({ data: null, error: null }),
  }) }) }),
  channel: () => { const c = { on: () => c, subscribe: () => c }; return c; },
  removeChannel: vi.fn(),
} }));
// Reproduce a document request with no cookie bridge, without reading any real
// browser cookies/tokens or asserting why the deployed preview omitted identity.
vi.mock("@/lib/auth-access-token-cookie", async (original) => ({
  ...(await original<object>()), syncAccessTokenCookie: vi.fn(),
}));
vi.mock("@/components/site/Navbar", () => ({ Navbar: () => null }));
vi.mock("@/components/site/Footer", () => ({ Footer: () => null }));
vi.mock("@/lib/locale/locale-context", () => ({
  useLocale: () => ({ locale: "ar-EG", dir: "rtl" }),
}));
vi.mock("@/lib/entitlements", async (original) => ({
  ...(await original<object>()),
  useEntitlement: () => ({ tier: "free", isAdmin: false, isLoaded: true }),
}));
vi.mock("@/lib/lesson-progress", () => ({ useLessonProgress: () => ({
  isLoaded: true, isError: false, getStatus: () => "not-started",
}) }));
vi.mock("@/lib/journey/client", () => ({ useJourneyVisits: () => ({
  data: state.visits, isSuccess: true, isError: false,
}) }));
vi.mock("@/lib/kids/parent-state", () => ({ useKidsParentStateSource: () => ({
  state: "ready", profiles: [],
}) }));
vi.mock("@/lib/technical-education/client", () => ({
  technicalCompleted: () => 0,
  technicalCommand: async () => { throw new Error("isolated secondary source unavailable"); },
}));
vi.mock("@/lib/academic-education/client", () => ({
  academicCatalogue: async () => [], academicCommand: vi.fn(),
}));

import "@/integrations/supabase/auth-attacher";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { AuthSessionGate } from "@/lib/auth-route-guard";
import { requireLearnerBeforeLoad } from "@/lib/learner-route-guard";
import { JourneyPage } from "./JourneyPage";
import { journeyCopy } from "@/lib/journey/copy";

const lessonPath = "/learn/intro/intro-m1-l1-what-is-ai";
const session = {
  access_token: "synthetic.learner.signature",
  user: { id: "synthetic-learner", aud: "authenticated", user_metadata: {}, app_metadata: {} },
} as Session;
let clients: QueryClient[] = [];

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("SUPABASE_URL", "https://isolated-auth.invalid");
  vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "explicit_test_public_fixture");
  state.session = session;
  state.listener = undefined;
  state.headers = new Headers();
  state.documentRequest = false;
  state.verified = true;
  state.visits = [];
  state.trace = [];
  state.claims.mockImplementation(async () => {
    state.trace.push("server:getClaims");
    return state.verified
      ? { data: { claims: { sub: session.user.id } }, error: null }
      : { data: null, error: new Error("synthetic invalid identity") };
  });
  state.rpc.mockResolvedValue({ data: null, error: null });
  window.scrollTo = vi.fn();
});
afterEach(() => {
  cleanup();
  clients.forEach((c) => c.clear()); clients = [];
  vi.unstubAllEnvs();
});

async function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  clients.push(client);
  const root = createRootRoute({ component: () => (
    <QueryClientProvider client={client}><AuthProvider><Outlet /></AuthProvider></QueryClientProvider>
  ) });
  const journey = createRoute({ getParentRoute: () => root, path: "/my-learning",
    component: () => <AuthSessionGate><JourneyPage /></AuthSessionGate>,
  });
  function Lesson() {
    const { user } = useAuth();
    return <AuthSessionGate><div>verified lesson for {user?.id}</div></AuthSessionGate>;
  }
  const lesson = createRoute({ getParentRoute: () => root, path: lessonPath,
    validateSearch: (s: Record<string, unknown>) => ({ locale: String(s.locale ?? "ar-EG") }),
    beforeLoad: requireLearnerBeforeLoad, loader: state.loader, component: Lesson,
  });
  const login = createRoute({ getParentRoute: () => root, path: "/login",
    validateSearch: (s: Record<string, unknown>) => s,
    component: () => <div>أهلاً بعودتك</div>,
  });
  const router = createRouter({ routeTree: root.addChildren([journey, lesson, login]),
    history: createMemoryHistory({ initialEntries: ["/my-learning?locale=ar-EG"] }),
  });
  await act(async () => { await router.load(); render(<RouterProvider router={router} />); });
  await screen.findByRole("heading", { name: "رحلتي في مسارات" });
  return router;
}

async function clickJourney(link: HTMLElement, router: Awaited<ReturnType<typeof setup>>) {
  // jsdom has no document navigation. Model its request boundary only when the
  // real click was NOT consumed by the real TanStack Link event handler.
  let documentNavigation: Promise<void> | undefined;
  const onNativeNavigation = (event: MouseEvent) => {
    if (event.defaultPrevented) return;
    event.preventDefault();
    state.trace.push("native:document");
    state.documentRequest = true;
    state.headers = new Headers();
    documentNavigation = (async () => {
      try {
        await requireLearnerBeforeLoad({ location: { pathname: lessonPath }, search: { locale: "ar-EG" } });
      } catch (error) {
        const redirect = error as { options: { search: Record<string, unknown> } };
        await router.navigate({ to: "/login", search: redirect.options.search });
      }
    })();
  };
  document.addEventListener("click", onNativeNavigation);
  try {
    await act(async () => { fireEvent.click(link); await documentNavigation; });
  } finally { document.removeEventListener("click", onNativeNavigation); }
}

it("denies a document without verified request identity even when the isolated SDK has a session", async () => {
  state.documentRequest = true;
  await expect(requireLearnerBeforeLoad({ location: { pathname: lessonPath }, search: { locale: "ar-EG" } }))
    .rejects.toMatchObject({ options: { to: "/login", search: { locale: "ar-EG", returnTo: lessonPath } } });
  expect(state.claims).not.toHaveBeenCalled();
  expect(state.loader).not.toHaveBeenCalled();
});

it.each([false, true])("keeps the verified principal through %s resume/start navigation despite unavailable document identity", async (resume) => {
  if (resume) state.visits = [{ line: "ai", course_id: "ai", subject_id: session.user.id,
    lesson_id: "intro-m1-l1-what-is-ai", visited_at: "2026-10-31T00:00:00Z" }];
  const router = await setup();
  const card = document.querySelector('[data-journey-path="ai:ai"]') as HTMLElement;
  expect(card).toHaveTextContent("0 / 7");
  const link = resume
    ? within((await screen.findByRole("heading", { name: journeyCopy("ar-EG").resume })).closest("section")!).getByRole("link")
    : within(card).getByRole("link", { name: "ابدأ المسار" });
  expect(link).toHaveAttribute("href", `${lessonPath}?locale=ar-EG`);
  await clickJourney(link, router);
  await screen.findByText(`verified lesson for ${session.user.id}`);
  expect(router.state.location.href).toBe(`${lessonPath}?locale=ar-EG`);
  expect(state.trace).toEqual(["rpc:bearer", "server:getClaims"]);
  expect(state.loader).toHaveBeenCalledTimes(1);
  expect(screen.queryByText("أهلاً بعودتك")).toBeNull();
});

it.each(["missing SDK session", "unverifiable claims"])("blocks a stale journey link after %s without invoking its lesson loader", async (reason) => {
  const router = await setup();
  if (reason === "missing SDK session") state.session = null;
  else state.verified = false;
  const card = document.querySelector('[data-journey-path="ai:ai"]') as HTMLElement;
  await clickJourney(within(card).getByRole("link", { name: "ابدأ المسار" }), router);
  await screen.findByText("أهلاً بعودتك");
  await waitFor(() => expect(router.state.location.pathname).toBe("/login"));
  expect(router.state.location.search).toMatchObject({ locale: "ar-EG", returnTo: lessonPath });
  expect(state.loader).not.toHaveBeenCalled();
});

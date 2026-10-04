import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authListener: undefined as ((event: string, session: Session | null) => void) | undefined,
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  unsubscribe: vi.fn(),
  rpc: vi.fn(),
  from: vi.fn(),
  channel: vi.fn(),
  removeChannel: vi.fn(),
  syncCookie: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: mocks.getSession,
      onAuthStateChange: mocks.onAuthStateChange,
      signInWithPassword: mocks.signInWithPassword,
      signOut: mocks.signOut,
    },
    rpc: mocks.rpc,
    from: mocks.from,
    channel: mocks.channel,
    removeChannel: mocks.removeChannel,
  },
}));

vi.mock("@/lib/auth-access-token-cookie", () => ({
  syncAccessTokenCookie: mocks.syncCookie,
}));

vi.mock("sonner", () => ({
  toast: {
    error: mocks.toastError,
    success: mocks.toastSuccess,
  },
}));

vi.mock("@/components/auth/AuthShell", () => ({
  AuthShell: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}));
vi.mock("@/lib/locale/use-ui-strings", () => ({
  useUiString: () => (key: string) => key,
}));
vi.mock("@/lib/locale/locale-context", () => ({
  useLocale: () => ({ locale: "en", dir: "ltr" }),
}));
vi.mock("@/components/site/Navbar", () => ({ Navbar: () => null }));
vi.mock("@/components/site/Footer", () => ({ Footer: () => null }));
vi.mock("@/components/billing/StripeCheckoutButtons", () => ({
  StripeCheckoutButtons: () => null,
}));
vi.mock("@/components/kids/KidsFamilyPricing", () => ({ KidsFamilyPricing: () => null }));

import { AuthProvider } from "@/lib/auth-context";
import { AuthSessionGate, requireAuthBeforeLoad } from "@/lib/auth-route-guard";
import { Route as LoginFileRoute } from "@/routes/login";
import { Route as PricingFileRoute } from "@/routes/pricing";

const SESSION = {
  access_token: "header.payload.signature",
  refresh_token: "refresh-token",
  expires_in: 3600,
  token_type: "bearer",
  user: {
    id: "central1-auth-user",
    email: "learner@example.test",
    user_metadata: {},
    app_metadata: {},
    aud: "authenticated",
    created_at: "2026-09-14T00:00:00.000Z",
  },
} as unknown as Session;

const LoginComponent = LoginFileRoute.options.component;

function configureDataClients() {
  const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
  const eq = vi.fn().mockReturnValue({ maybeSingle });
  const select = vi.fn().mockReturnValue({ eq });
  mocks.from.mockReturnValue({ select });
  const channel = {
    on: vi.fn(),
    subscribe: vi.fn(),
  };
  channel.on.mockReturnValue(channel);
  channel.subscribe.mockReturnValue(channel);
  mocks.channel.mockReturnValue(channel);
}

beforeEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
  window.scrollTo = vi.fn();
  mocks.authListener = undefined;
  mocks.getSession.mockResolvedValue({
    data: { session: null },
    error: null,
  });
  mocks.onAuthStateChange.mockImplementation(
    (listener: (event: string, session: Session | null) => void) => {
      mocks.authListener = listener;
      return {
        data: {
          subscription: { unsubscribe: mocks.unsubscribe },
        },
      };
    },
  );
  mocks.signOut.mockResolvedValue({ error: null });
  mocks.rpc.mockResolvedValue({ data: null, error: null });
  mocks.removeChannel.mockResolvedValue({ error: null });
  configureDataClients();
});
afterEach(() => {
  localStorage.clear();
});

async function renderAt(
  initialEntry: string,
  { guardDashboard = false }: { guardDashboard?: boolean } = {},
) {
  const rootRoute = createRootRoute({
    component: () => (
      <AuthProvider>
        <Outlet />
      </AuthProvider>
    ),
  });

  const loginRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/login",
    validateSearch: LoginFileRoute.options.validateSearch,
    component: LoginComponent,
  });

  const dashboardRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/dashboard",
    ...(guardDashboard ? { beforeLoad: requireAuthBeforeLoad } : {}),
    component: () => (
      <AuthSessionGate fallback={<div>auth-fallback</div>}>
        <div>protected-dashboard</div>
      </AuthSessionGate>
    ),
  });

  const history = createMemoryHistory({ initialEntries: [initialEntry] });
  const pricingRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/pricing",
    beforeLoad: (context) =>
      PricingFileRoute.options.beforeLoad?.(
        // The isolated router omits the production root's query client;
        // this compatibility guard reads only location and search.
        context as unknown as Parameters<
          NonNullable<typeof PricingFileRoute.options.beforeLoad>
        >[0],
      ),
    validateSearch: PricingFileRoute.options.validateSearch,
    component: PricingFileRoute.options.component,
  });
  const paymentRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/payments",
    validateSearch: (raw: Record<string, unknown>) => ({ order: String(raw.order ?? "") }),
    component: PaymentGate,
  });
  function PaymentGate() {
    const { order } = paymentRoute.useSearch();
    return (
      <AuthSessionGate loginSearch={order ? { order, paymentView: "customer" } : undefined}>
        <div>protected-payment</div>
      </AuthSessionGate>
    );
  }
  const router = createRouter({
    routeTree: rootRoute.addChildren([
      loginRoute,
      dashboardRoute,
      pricingRoute,
      paymentRoute,
      ...(
        [
          "/my-learning",
          "/ai",
          "/kids",
          "/kids/pricing",
          "/technical",
          "/technical/pricing",
        ] as const
      ).map((path) =>
        createRoute({
          getParentRoute: () => rootRoute,
          path,
          component: () => <div>line-destination</div>,
        }),
      ),
    ]),
    history,
  });

  await act(async () => {
    await router.load();
    render(<RouterProvider router={router} />);
    await Promise.resolve();
  });
  return router;
}

function fillLoginForm() {
  fireEvent.change(screen.getByRole("textbox"), {
    target: { value: "learner@example.test" },
  });
  const password = document.querySelector<HTMLInputElement>('input[type="password"]');
  expect(password).not.toBeNull();
  fireEvent.change(password!, { target: { value: "correct horse battery staple" } });
}

describe("central1 auth integration", () => {
  it.each(["/my-learning", "/ai", "/kids", "/kids/pricing", "/technical", "/technical/pricing"])(
    "returns to %s with the chosen locale after login",
    async (destination) => {
      const router = await renderAt(`/login?returnTo=${encodeURIComponent(destination)}&locale=en`);
      mocks.signInWithPassword.mockImplementation(async () => {
        mocks.getSession.mockResolvedValue({ data: { session: SESSION }, error: null });
        mocks.authListener?.("SIGNED_IN", SESSION);
        return { data: { session: SESSION }, error: null };
      });
      fillLoginForm();
      fireEvent.click(screen.getByRole("button", { name: "auth.login.submit" }));
      await waitFor(() => expect(router.state.location.pathname).toBe(destination));
      expect(router.state.location.search).toMatchObject({ locale: "en" });
    },
  );

  it("preserves the legacy Kids pricing URL and locale", async () => {
    const router = await renderAt("/pricing?locale=ar-gulf#kids");
    await waitFor(() => expect(router.state.location.pathname).toBe("/kids/pricing"));
    expect(router.state.location.search).toMatchObject({ locale: "ar-gulf" });
  });

  it("preserves an emailed payment order through the hydration gate and successful login", async () => {
    const order = "00000000-0000-4000-8000-000000000009";
    const router = await renderAt(`/payments?order=${order}`);
    await waitFor(() => expect(router.state.location.pathname).toBe("/login"));
    expect(router.state.location.search).toMatchObject({ order, paymentView: "customer" });
    expect(screen.queryByText("protected-payment")).not.toBeInTheDocument();
    mocks.signInWithPassword.mockImplementation(async () => {
      mocks.getSession.mockResolvedValue({ data: { session: SESSION }, error: null });
      mocks.authListener?.("SIGNED_IN", SESSION);
      return { data: { session: SESSION }, error: null };
    });
    fillLoginForm();
    fireEvent.click(screen.getByRole("button", { name: "auth.login.submit" }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/payments"));
    expect(router.state.location.search).toMatchObject({ order });
    expect(await screen.findByText("protected-payment")).toBeInTheDocument();
  });

  it("shows the supplied fallback without protected content while auth hydrates", async () => {
    mocks.getSession.mockReturnValue(new Promise(() => {}));

    await renderAt("/dashboard");

    expect(screen.getByText("auth-fallback")).toBeInTheDocument();
    expect(screen.queryByText("protected-dashboard")).not.toBeInTheDocument();
  });
  it("redirects a settled anonymous session without exposing protected content", async () => {
    const router = await renderAt("/dashboard");

    expect(screen.queryByText("protected-dashboard")).not.toBeInTheDocument();
    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/login");
    });
    expect(screen.queryByText("protected-dashboard")).not.toBeInTheDocument();
  });

  it("renders protected content after AuthProvider hydrates a valid session", async () => {
    mocks.getSession.mockResolvedValue({
      data: { session: SESSION },
      error: null,
    });

    await renderAt("/dashboard");

    expect(await screen.findByText("protected-dashboard")).toBeInTheDocument();
    expect(screen.queryByText("auth-fallback")).not.toBeInTheDocument();
    expect(mocks.signOut).not.toHaveBeenCalled();
  });

  it("keeps the signed-in session through SPA navigation to the dashboard", async () => {
    mocks.signInWithPassword.mockImplementation(async () => {
      mocks.getSession.mockResolvedValue({
        data: { session: SESSION },
        error: null,
      });
      mocks.authListener?.("SIGNED_IN", SESSION);
      return {
        data: { session: SESSION, user: SESSION.user },
        error: null,
      };
    });
    const router = await renderAt("/login", { guardDashboard: true });
    fillLoginForm();

    fireEvent.click(screen.getByRole("button", { name: /auth\.login\.submit/ }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/dashboard");
    });
    expect(await screen.findByText("protected-dashboard")).toBeInTheDocument();
    expect(mocks.getSession).toHaveBeenCalledTimes(2);
    expect(router.state.location.pathname).toBe("/dashboard");
    expect(screen.queryByText("auth-fallback")).not.toBeInTheDocument();
    expect(mocks.signOut).not.toHaveBeenCalled();
    expect(mocks.toastSuccess).toHaveBeenCalledWith("auth.login.toast.success");
  });

  it("stays on login and does not navigate when sign-in fails", async () => {
    mocks.signInWithPassword.mockResolvedValue({
      data: { session: null, user: null },
      error: { code: "invalid_credentials", message: "invalid credentials" },
    });
    const router = await renderAt("/login");
    fillLoginForm();

    fireEvent.click(screen.getByRole("button", { name: /auth\.login\.submit/ }));

    await waitFor(() => {
      expect(mocks.toastError).toHaveBeenCalledWith("auth.login.error.credentials");
    });
    expect(router.state.location.pathname).toBe("/login");
    expect(screen.getByRole("alert")).toHaveTextContent("auth.login.error.credentials");
    expect(screen.getByRole("link", { name: "auth.link.resetPassword" })).toBeInTheDocument();
    expect(screen.queryByText("protected-dashboard")).not.toBeInTheDocument();
  });

  it.each([
    [{ name: "AuthRetryableFetchError", status: 0 }, "auth.login.error.connection"],
    [{ code: "over_request_rate_limit", status: 429 }, "auth.login.error.rateLimit"],
    [{ code: "email_not_confirmed" }, "auth.login.error.unconfirmed"],
    [{ code: "unexpected_failure", message: "internal details" }, "auth.login.failedMessage"],
  ])("shows the correct category without a password-reset prompt for %j", async (error, key) => {
    mocks.signInWithPassword.mockResolvedValue({ data: { session: null }, error });
    const router = await renderAt("/login");
    fillLoginForm();
    fireEvent.click(screen.getByRole("button", { name: /auth\.login\.submit/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent(key);
    expect(mocks.toastError).toHaveBeenCalledWith(key);
    expect(screen.queryByRole("link", { name: "auth.link.resetPassword" })).not.toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/login");
    expect(screen.getByRole("button", { name: /auth\.login\.submit/ })).toBeEnabled();
  });

  it("settles a thrown network error and permits a successful retry", async () => {
    mocks.signInWithPassword.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    mocks.signInWithPassword.mockImplementationOnce(async () => {
      mocks.authListener?.("SIGNED_IN", SESSION);
      return { data: { session: SESSION }, error: null };
    });
    const router = await renderAt("/login");
    fillLoginForm();
    fireEvent.click(screen.getByRole("button", { name: /auth\.login\.submit/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent("auth.login.error.connection");
    const retry = screen.getByRole("button", { name: /auth\.login\.submit/ });
    expect(retry).toBeEnabled();
    fireEvent.click(retry);
    await waitFor(() => expect(router.state.location.pathname).toBe("/dashboard"));
    expect(mocks.signInWithPassword).toHaveBeenLastCalledWith({
      email: "learner@example.test",
      password: "correct horse battery staple",
    });
    expect(await screen.findByText("protected-dashboard")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("associates login labels and exposes password-manager autocomplete", async () => {
    await renderAt("/login");
    expect(screen.getByLabelText("auth.field.email")).toHaveAttribute("autocomplete", "username");
    expect(screen.getByLabelText("auth.field.password")).toHaveAttribute(
      "autocomplete",
      "current-password",
    );
  });

  it.each([false, true])("routes the Free CTA for authenticated=%s", async (signedIn) => {
    mocks.getSession.mockResolvedValue({
      data: { session: signedIn ? SESSION : null },
      error: null,
    });
    await renderAt("/pricing");
    await waitFor(() =>
      expect(screen.getByRole("link", { name: "pricing.cta.startFree" })).toHaveAttribute(
        "href",
        signedIn ? "/dashboard" : "/signup",
      ),
    );
  });
});

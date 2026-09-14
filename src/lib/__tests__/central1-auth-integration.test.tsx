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
  authListener: undefined as
    | ((event: string, session: Session | null) => void)
    | undefined,
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

import { AuthProvider } from "@/lib/auth-context";
import {
  AuthSessionGate,
  requireAuthBeforeLoad,
} from "@/lib/auth-route-guard";
import { Route as LoginFileRoute } from "@/routes/login";

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
  initialEntry: "/login" | "/dashboard",
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
  const router = createRouter({
    routeTree: rootRoute.addChildren([loginRoute, dashboardRoute]),
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
  const password = document.querySelector<HTMLInputElement>(
    'input[type="password"]',
  );
  expect(password).not.toBeNull();
  fireEvent.change(password!, { target: { value: "correct horse battery staple" } });
}

describe("central1 auth integration", () => {
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

    fireEvent.click(
      screen.getByRole("button", { name: /auth\.login\.submit/ }),
    );

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/dashboard");
    });
    expect(await screen.findByText("protected-dashboard")).toBeInTheDocument();
    expect(mocks.getSession).toHaveBeenCalledTimes(2);
    expect(router.state.location.pathname).toBe("/dashboard");
    expect(screen.queryByText("auth-fallback")).not.toBeInTheDocument();
    expect(mocks.signOut).not.toHaveBeenCalled();
    expect(mocks.toastSuccess).toHaveBeenCalledWith(
      "auth.login.toast.success",
    );
  });

  it("stays on login and does not navigate when sign-in fails", async () => {
    mocks.signInWithPassword.mockResolvedValue({
      data: { session: null, user: null },
      error: { message: "invalid credentials" },
    });
    const router = await renderAt("/login");
    fillLoginForm();

    fireEvent.click(
      screen.getByRole("button", { name: /auth\.login\.submit/ }),
    );

    await waitFor(() => {
      expect(mocks.toastError).toHaveBeenCalledWith("invalid credentials");
    });
    expect(router.state.location.pathname).toBe("/login");
    expect(screen.getByText("auth.login.failedMessage")).toBeInTheDocument();
    expect(screen.queryByText("protected-dashboard")).not.toBeInTheDocument();
  });
});

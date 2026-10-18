import type { ComponentType, ReactNode } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  authReturnNavigation,
  parseRecoveryIntentSearch,
  recoveryRedirectUrl,
} from "@/lib/auth-return";

const state = vi.hoisted(() => ({
  pages: {} as Record<string, ComponentType>,
  search: {} as Record<string, unknown>,
  navigate: vi.fn(),
  reset: vi.fn(),
  update: vi.fn(),
  login: vi.fn(),
}));
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: (path: string) => (options: { component: ComponentType }) => {
    state.pages[path] = options.component;
    return { ...options, useSearch: () => state.search };
  },
  useNavigate: () => state.navigate,
  Link: ({
    to,
    search,
    children,
    ...props
  }: {
    to: string;
    search?: Record<string, unknown>;
    children: ReactNode;
  }) => {
    const query = new URLSearchParams(
      Object.entries(search ?? {}).filter(([, v]) => typeof v === "string") as [string, string][],
    );
    return (
      <a href={to + "?" + query.toString()} {...props}>
        {children}
      </a>
    );
  },
}));
vi.mock("@/components/auth/AuthShell", () => ({
  AuthShell: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}));
vi.mock("@/lib/locale/use-ui-strings", () => ({ useUiString: () => (key: string) => key }));
vi.mock("@/lib/locale/locale-context", () => ({ useLocale: () => ({ locale: "en", dir: "ltr" }) }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      resetPasswordForEmail: state.reset,
      updateUser: state.update,
      signInWithPassword: state.login,
      getSession: vi.fn(async () => ({ data: { session: { access_token: "synthetic" } } })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
  },
}));
import "@/routes/login";
import "@/routes/forgot-password";
import "@/routes/reset-password";
const lesson = "/learn/builder/builder-m1-l1-what-is-llm";
beforeEach(() => {
  vi.clearAllMocks();
  state.search = {
    locale: "en",
    returnTo: lesson,
    email: "private@example.test",
    order: "private-order",
  };
  state.reset.mockResolvedValue({ error: null });
  state.update.mockResolvedValue({ error: null });
});
afterEach(cleanup);
function page(path: string) {
  const Page = state.pages[path];
  return render(<Page />);
}
it.each(["en", "ar-EG", "ar-MSA", "ar-Gulf"])(
  "carries validated %s and the exact lesson through recovery",
  (locale) => {
    const url = new URL(recoveryRedirectUrl("https://masaarat.ai", { ...state.search, locale }));
    expect(url.pathname).toBe("/reset-password");
    expect(Object.fromEntries(url.searchParams)).toEqual({ locale, returnTo: lesson });
    expect(authReturnNavigation({ ...state.search, locale })).toEqual({
      to: "/learn/$pathId/$lessonId",
      params: { pathId: "builder", lessonId: "builder-m1-l1-what-is-llm" },
      search: { locale },
      replace: true,
    });
  },
);
it.each([
  "https://evil.test",
  "//evil.test",
  "/admin",
  "/learn/builder/%2e%2e",
  lesson + "?next=evil",
  "/build-logs/extra",
])("rejects untrusted recovery destination %s", (returnTo) => {
  expect(
    parseRecoveryIntentSearch({ returnTo, locale: "invalid", email: "private@example.test" }),
  ).toEqual({ locale: undefined, returnTo: undefined, intent: undefined });
  const nav = authReturnNavigation({ returnTo, locale: "en" });
  expect(nav.to).toBe("/dashboard");
  expect(new URL(recoveryRedirectUrl("https://masaarat.ai", { returnTo })).search).toBe("");
});
it("login recovery links retain safe context without copying the invitation email", () => {
  page("/login");
  const link = screen.getByRole("link", { name: "auth.link.forgotPassword" });
  const url = new URL(link.getAttribute("href")!, "https://masaarat.ai");
  expect(Object.fromEntries(url.searchParams)).toEqual({ locale: "en", returnTo: lesson });
  expect(state.reset).not.toHaveBeenCalled();
});
it("only the explicit recovery submission calls the mocked email API and retains context on the login link", async () => {
  page("/forgot-password");
  expect(state.reset).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText("auth.field.email"), {
    target: { value: "synthetic@example.test" },
  });
  fireEvent.submit(screen.getByRole("button", { name: "auth.forgot.submit" }).closest("form")!);
  await waitFor(() => expect(state.reset).toHaveBeenCalledTimes(1));
  expect(state.reset).toHaveBeenCalledWith("synthetic@example.test", {
    redirectTo: recoveryRedirectUrl(window.location.origin, state.search),
  });
  const url = new URL(
    screen.getByRole("link", { name: "auth.link.backToLogin" }).getAttribute("href")!,
    window.location.origin,
  );
  expect(Object.fromEntries(url.searchParams)).toEqual({ locale: "en", returnTo: lesson });
});
it("returns to the shared validated lesson only after a successful mocked password update", async () => {
  const { container } = page("/reset-password");
  await screen.findByRole("button", { name: "auth.reset.submit" });
  expect(state.update).not.toHaveBeenCalled();
  const fields = container.querySelectorAll('input[type="password"]');
  for (const field of fields) fireEvent.change(field, { target: { value: "synthetic-only" } });
  fireEvent.submit(screen.getByRole("button", { name: "auth.reset.submit" }).closest("form")!);
  await waitFor(() =>
    expect(state.navigate).toHaveBeenCalledWith(authReturnNavigation(state.search)),
  );
  expect(state.update).toHaveBeenCalledTimes(1);
});
it("does not navigate when the mocked password update fails", async () => {
  state.update.mockResolvedValue({ error: { message: "Synthetic failure" } });
  const { container } = page("/reset-password");
  await screen.findByRole("button", { name: "auth.reset.submit" });
  for (const field of container.querySelectorAll('input[type="password"]'))
    fireEvent.change(field, { target: { value: "synthetic-only" } });
  fireEvent.submit(screen.getByRole("button", { name: "auth.reset.submit" }).closest("form")!);
  await waitFor(() => expect(state.update).toHaveBeenCalledTimes(1));
  expect(state.navigate).not.toHaveBeenCalled();
});

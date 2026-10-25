import type { ReactNode } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { parseAuthIntentSearch } from "@/lib/kids/auth-intent";

const mock = vi.hoisted(() => ({
  search: { locale: "ar-Gulf", email: "invited+one@example.test" },
  signup: vi.fn(),
  login: vi.fn(),
  navigate: vi.fn(),
}));
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: unknown) => ({ options, useSearch: () => mock.search }),
  useNavigate: () => mock.navigate,
  Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
}));
vi.mock("@/components/auth/AuthShell", () => ({
  AuthShell: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}));
vi.mock("@/lib/locale/use-ui-strings", () => ({ useUiString: () => (key: string) => key }));
vi.mock("@/lib/locale/locale-context", () => ({ useLocale: () => ({ locale: "ar-Gulf" }) }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { auth: { signUp: mock.signup, signInWithPassword: mock.login } },
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
import { Route as SignupRoute } from "@/routes/signup";
import { Route as LoginRoute } from "@/routes/login";
beforeEach(() => {
  vi.clearAllMocks();
  mock.signup.mockResolvedValue({ error: null });
  mock.login.mockResolvedValue({ error: null });
});
afterEach(cleanup);
describe("invited recipient auth forms", () => {
  it("prefills signup without registering automatically and submits the editable email", async () => {
    const Page = SignupRoute.options.component!;
    render(<Page />);
    expect(screen.getByLabelText("auth.field.email")).toHaveValue(mock.search.email);
    expect(mock.signup).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("auth.field.fullName"), {
      target: { value: "Synthetic Learner" },
    });
    fireEvent.change(screen.getByLabelText("auth.field.email"), {
      target: { value: "edited@example.test" },
    });
    fireEvent.change(document.querySelector('input[type="password"]')!, {
      target: { value: "synthetic-test-only" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "auth.signup.submit" }).closest("form")!);
    await waitFor(() =>
      expect(mock.signup).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "edited@example.test",
          options: expect.objectContaining({
            data: { full_name: "Synthetic Learner", preferred_locale: "ar-Gulf" },
          }),
        }),
      ),
    );
    await waitFor(() =>
      expect(mock.navigate).toHaveBeenCalledWith({
        to: "/login",
        search: mock.search,
        replace: true,
      }),
    );
  });
  it("also prefills the existing-account login without an automatic sign-in", () => {
    const Page = LoginRoute.options.component!;
    render(<Page />);
    expect(screen.getByLabelText("auth.field.email")).toHaveValue(mock.search.email);
    expect(mock.login).not.toHaveBeenCalled();
  });
  it("treats an invitation email as a form hint, never as an access token or redirect", () => {
    expect(
      parseAuthIntentSearch({
        email: mock.search.email,
        returnTo: "https://evil.test",
        grant: "forged",
      }),
    ).toEqual({ email: mock.search.email, intent: undefined, locale: undefined });
  });
});

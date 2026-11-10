import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { parseAuthIntentSearch } from "@/lib/kids/auth-intent";

const mock = vi.hoisted(() => ({
  search: { locale: "ar-Gulf", email: "invited+one@example.test" },
  signup: vi.fn(),
  login: vi.fn(),
  navigate: vi.fn(),
  command: vi.fn(),
  invitationId: "11111111-1111-4111-8111-111111111111",
  userId: null as string | null,
}));
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: unknown) => ({
    options,
    useSearch: () => mock.search,
    useParams: () => ({ invitationId: mock.invitationId }),
  }),
  useNavigate: () => mock.navigate,
  Link: ({
    children,
    to,
    search,
  }: {
    children: ReactNode;
    to: string;
    search?: Record<string, string>;
  }) => <a href={search ? `${to}?${new URLSearchParams(search)}` : to}>{children}</a>,
}));
vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({ loading: false, user: mock.userId ? { id: mock.userId } : null }),
}));
vi.mock("@/components/site/Navbar", () => ({ Navbar: () => null }));
vi.mock(import("@tanstack/react-start"), async (importOriginal) => ({
  ...(await importOriginal()),
  useServerFn: () => mock.command,
}));
vi.mock("@/lib/commerce/commerce.functions", () => ({ commerceCommand: vi.fn() }));
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
import { Route as InvitationRoute } from "@/routes/invitations.$invitationId";
beforeEach(() => {
  vi.clearAllMocks();
  mock.invitationId = "11111111-1111-4111-8111-111111111111";
  mock.userId = null;
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

describe("direct invitation page", () => {
  function renderInvitation() {
    const Page = InvitationRoute.options.component!;
    return render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <Page />
      </QueryClientProvider>,
    );
  }

  it("links a signed-out learner to login with the same invitation and language", () => {
    renderInvitation();
    const link = screen.getByRole("link") as HTMLAnchorElement;
    const url = new URL(link.href);
    expect(url.pathname).toBe("/login");
    expect(url.searchParams.get("locale")).toBe("ar-Gulf");
    expect(url.searchParams.get("returnTo")).toBe(`/invitations/${mock.invitationId}`);
    expect(mock.command).not.toHaveBeenCalled();
  });

  it("does not request malformed invitations even when signed in", () => {
    mock.invitationId = "invalid";
    mock.userId = "22222222-2222-4222-8222-222222222222";
    renderInvitation();
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(mock.command).not.toHaveBeenCalled();
  });

  it("never offers acceptance when the signed-in account is denied", async () => {
    mock.userId = "22222222-2222-4222-8222-222222222222";
    mock.command.mockRejectedValueOnce(new Error("INVITATION_NOT_FOUND"));
    renderInvitation();
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(mock.command).toHaveBeenCalledExactlyOnceWith({
      data: {
        action: "invitation",
        expectedAccountId: mock.userId,
        data: { id: mock.invitationId },
      },
    });
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});

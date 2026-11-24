import type { ReactNode } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ signup: vi.fn(), navigate: vi.fn() }));
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: unknown) => ({
    options,
    useSearch: () => ({ locale: "ar-EG", returnTo: "/my-learning" }),
  }),
  useNavigate: () => state.navigate,
  Link: ({ to, children }: { to: string; children: ReactNode }) => <a href={to}>{children}</a>,
}));
vi.mock("@/components/auth/AuthShell", () => ({
  AuthShell: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}));
vi.mock("@/lib/locale/use-ui-strings", () => ({ useUiString: () => (key: string) => key }));
vi.mock("@/lib/locale/locale-context", () => ({ useLocale: () => ({ locale: "ar-EG" }) }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: { signUp: state.signup } } }));
vi.mock("@/lib/registration-analytics", () => ({ rememberPendingRegistration: vi.fn() }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
import { Route } from "@/routes/signup";
afterEach(cleanup);
beforeEach(() => vi.clearAllMocks());

function fill() {
  const Page = Route.options.component!;
  render(<Page />);
  fireEvent.change(screen.getByLabelText("auth.field.fullName"), {
    target: { value: "Test Learner" },
  });
  fireEvent.change(screen.getByLabelText("auth.field.email"), {
    target: { value: "learner@example.test" },
  });
  fireEvent.change(screen.getByLabelText("auth.field.password"), {
    target: { value: "test-password-only" },
  });
  return screen.getByRole("button", { name: "auth.signup.submit" }).closest("form")!;
}
describe("mobile signup recovery and continuation", () => {
  it("recovers after a rejected network request and permits a successful retry", async () => {
    state.signup
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce({ data: { user: null, session: null }, error: null });
    const form = fill();
    fireEvent.submit(form);
    expect(await screen.findByRole("alert")).toHaveTextContent("auth.signup.error.connection");
    expect(screen.getByRole("button", { name: "auth.signup.submit" })).toBeEnabled();
    fireEvent.submit(form);
    expect(await screen.findByRole("status")).toHaveTextContent("auth.signup.toast.success");
    expect(state.signup).toHaveBeenCalledTimes(2);
    expect(state.navigate).not.toHaveBeenCalled();
  });
  it("prevents duplicate submissions while a request is in flight", async () => {
    let resolve!: (value: unknown) => void;
    state.signup.mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    const form = fill();
    fireEvent.submit(form);
    fireEvent.submit(form);
    expect(state.signup).toHaveBeenCalledTimes(1);
    resolve({ data: { user: null, session: null }, error: null });
    await screen.findByRole("status");
  });
  it("keeps returned registration errors visible and the form usable", async () => {
    state.signup.mockResolvedValueOnce({ data: null, error: { message: "Rate limit" } });
    fireEvent.submit(fill());
    expect(await screen.findByRole("alert")).toHaveTextContent("Rate limit");
    expect(screen.getByRole("button", { name: "auth.signup.submit" })).toBeEnabled();
  });
  it("continues an immediately authenticated signup through the validated return", async () => {
    state.signup.mockResolvedValueOnce({
      data: { user: { id: "synthetic" }, session: { user: { id: "synthetic" } } },
      error: null,
    });
    fireEvent.submit(fill());
    await waitFor(() =>
      expect(state.navigate).toHaveBeenCalledWith(
        expect.objectContaining({ to: "/my-learning", replace: true }),
      ),
    );
  });
});

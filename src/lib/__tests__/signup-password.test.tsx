import type { ReactNode } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  signup: vi.fn(),
  navigate: vi.fn(),
  error: vi.fn(),
  success: vi.fn(),
}));
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: Record<string, unknown>) => ({
    ...options,
    useSearch: () => ({ locale: "en" }),
  }),
  useNavigate: () => mocks.navigate,
  Link: ({ children }: { children: ReactNode }) => <a>{children}</a>,
}));
vi.mock("@/components/auth/AuthShell", () => ({
  AuthShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/lib/locale/locale-context", () => ({ useLocale: () => ({ locale: "en" }) }));
vi.mock("@/lib/locale/use-ui-strings", () => ({ useUiString: () => (key: string) => key }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: { signUp: mocks.signup } } }));
vi.mock("sonner", () => ({ toast: { error: mocks.error, success: mocks.success } }));
import { Route } from "@/routes/signup";
beforeEach(() => {
  vi.clearAllMocks();
  mocks.signup.mockResolvedValue({ error: null });
});
afterEach(cleanup);
function form() {
  const Component = (Route as unknown as { component: () => ReactNode }).component;
  const view = render(<Component />);
  fireEvent.change(screen.getByLabelText("auth.field.fullName"), {
    target: { value: "Synthetic Name" },
  });
  fireEvent.change(view.container.querySelector('input[type="email"]')!, {
    target: { value: "synthetic@example.test" },
  });
  fireEvent.change(screen.getByLabelText("auth.field.password"), {
    target: { value: "SyntheticPassword" },
  });
  return view.container.querySelector("form")!;
}
describe("signup confirmation", () => {
  it("rejects a mismatch before contacting Auth", () => {
    const element = form();
    fireEvent.change(screen.getByLabelText("auth.field.passwordConfirm"), {
      target: { value: "DifferentPassword" },
    });
    fireEvent.submit(element);
    expect(mocks.signup).not.toHaveBeenCalled();
    expect(mocks.error).toHaveBeenCalledWith("auth.reset.toast.passwordMismatch");
  });
  it("sends only the original matching password and preserves signup metadata", async () => {
    const element = form();
    fireEvent.change(screen.getByLabelText("auth.field.passwordConfirm"), {
      target: { value: "SyntheticPassword" },
    });
    fireEvent.submit(element);
    await waitFor(() => expect(mocks.signup).toHaveBeenCalledTimes(1));
    const request = mocks.signup.mock.calls[0][0];
    expect(request.password).toBe("SyntheticPassword");
    expect(request).not.toHaveProperty("confirmPassword");
    expect(request.options.data).toEqual({ full_name: "Synthetic Name", preferred_locale: "en" });
    expect(screen.getAllByRole("button", { name: "Show password" })).toHaveLength(2);
  });
});

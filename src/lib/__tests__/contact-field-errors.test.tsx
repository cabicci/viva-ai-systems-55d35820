import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { getUiString } from "@/lib/locale/ui-strings";
import type { SupportedLocale } from "@/lib/locale/types";
const state = vi.hoisted(() => ({ submit: vi.fn(), locale: "en" as SupportedLocale }));
vi.mock("@tanstack/react-start", () => ({ useServerFn: () => state.submit }));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("@/lib/contact-form.functions", () => ({ submitContactForm: {} }));
vi.mock("@/lib/analytics", () => ({ trackAcceptedContactOnce: vi.fn() }));
vi.mock("@/lib/locale/locale-context", () => ({
  useLocale: () => ({
    locale: state.locale,
    lang: state.locale === "en" ? "en" : "ar",
    countryCode: "EG",
  }),
}));
vi.mock("@/lib/locale/use-ui-strings", () => ({
  useUiString: () => (key: Parameters<typeof getUiString>[1]) => getUiString(state.locale, key),
}));
vi.mock("@/lib/locale/use-locale-link-search", () => ({ useLocaleLinkSearch: () => () => ({}) }));
vi.mock("@/components/auth/TurnstileWidget", () => ({
  TurnstileWidget: ({ onVerify }: { onVerify: (token: string) => void }) => (
    <button type="button" onClick={() => onVerify("synthetic-fixture")}>
      Synthetic verification
    </button>
  ),
}));
import { ContactForm } from "@/components/site/ContactForm";
beforeEach(() => {
  vi.clearAllMocks();
  state.locale = "en";
});
afterEach(cleanup);
it.each(["en", "ar-EG", "ar-MSA", "ar-Gulf"] as const)(
  "associates localized errors and focuses the first invalid field in %s without submitting",
  (locale) => {
    state.locale = locale;
    const { container } = render(<ContactForm />);
    const first = container.querySelector('[name="firstName"]')!;
    const email = container.querySelector('[name="email"]')!;
    const message = container.querySelector('[name="message"]')!;
    fireEvent.change(email, { target: { value: "invalid-email" } });
    fireEvent.change(message, { target: { value: "abc" } });
    fireEvent.submit(container.querySelector("form")!);
    expect(first).toHaveFocus();
    for (const field of [first, email, message]) {
      expect(field).toHaveAttribute("aria-invalid", "true");
      const ids = field.getAttribute("aria-describedby")!.split(" ");
      expect(ids.every((id) => document.getElementById(id))).toBe(true);
    }
    expect(screen.getByRole("alert")).toHaveTextContent(
      getUiString(locale, "contact.error.summary"),
    );
    fireEvent.click(
      screen.getByRole("button", { name: getUiString(locale, "contact.error.messageLength") }),
    );
    expect(message).toHaveFocus();
    expect(email).toHaveValue("invalid-email");
    expect(message).toHaveValue("abc");
    expect(state.submit).not.toHaveBeenCalled();
    fireEvent.change(first, { target: { value: "Synthetic" } });
    expect(first).not.toHaveAttribute("aria-invalid");
  },
);
it("keeps service errors separate from field validation and retains input after a mocked failure", async () => {
  state.submit.mockResolvedValue({ success: false, error: "service_unavailable" });
  const { container } = render(<ContactForm />);
  for (const [name, value] of Object.entries({
    firstName: "Synthetic",
    email: "synthetic@example.test",
    message: "A synthetic message",
  })) {
    fireEvent.change(container.querySelector(`[name="${name}"]`)!, { target: { value } });
  }
  fireEvent.click(container.querySelector('[name="consentToProcess"]')!);
  fireEvent.click(screen.getByRole("button", { name: "Synthetic verification" }));
  fireEvent.submit(container.querySelector("form")!);
  await waitFor(() => expect(state.submit).toHaveBeenCalledTimes(1));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    getUiString("en", "contact.error.service"),
  );
  expect(container.querySelector('[aria-invalid="true"]')).toBeNull();
  expect(container.querySelector('[name="message"]')).toHaveValue("A synthetic message");
});

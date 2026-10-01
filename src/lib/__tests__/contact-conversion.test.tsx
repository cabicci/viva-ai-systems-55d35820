import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { ContactForm } from "@/components/site/ContactForm";

const mocks = vi.hoisted(() => ({ submit: vi.fn(), track: vi.fn() }));
vi.mock("@tanstack/react-start", () => ({ useServerFn: () => mocks.submit }));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("@/lib/contact-form.functions", () => ({ submitContactForm: {} }));
vi.mock("@/lib/analytics", () => ({ trackAcceptedContactOnce: mocks.track }));
vi.mock("@/lib/locale/locale-context", () => ({
  useLocale: () => ({ locale: "en", lang: "en", countryCode: "EG" }),
}));
vi.mock("@/lib/locale/use-ui-strings", () => ({ useUiString: () => (key: string) => key }));
vi.mock("@/lib/locale/use-locale-link-search", () => ({ useLocaleLinkSearch: () => () => ({}) }));
vi.mock("@/components/auth/TurnstileWidget", () => ({
  TurnstileWidget: ({ onVerify }: { onVerify: (token: string) => void }) => (
    <button type="button" onClick={() => onVerify("offline-fixture")}>
      verify
    </button>
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

function prepare() {
  const { container } = render(<ContactForm />);
  fireEvent.change(container.querySelector('[name="firstName"]')!, {
    target: { value: "Fixture" },
  });
  fireEvent.change(container.querySelector('[name="email"]')!, {
    target: { value: "fixture@example.test" },
  });
  fireEvent.change(container.querySelector('[name="message"]')!, {
    target: { value: "Offline contact fixture" },
  });
  fireEvent.click(container.querySelector('[name="consentToProcess"]')!);
  fireEvent.click(screen.getByText("verify"));
  return container.querySelector("form")!;
}

it("measures only the accepted server response, never a validation or provider failure", async () => {
  mocks.submit.mockResolvedValue({ success: false, error: "service_unavailable" });
  const form = prepare();
  fireEvent.submit(form);
  await waitFor(() => expect(mocks.submit).toHaveBeenCalledTimes(1));
  await screen.findByText("contact.error.service");
  expect(mocks.track).not.toHaveBeenCalled();
  fireEvent.click(screen.getByText("verify"));
  mocks.submit.mockResolvedValue({ success: true });
  fireEvent.submit(form);
  await waitFor(() => expect(mocks.track).toHaveBeenCalledTimes(1));
  expect(mocks.track.mock.calls[0][0]).toEqual({ success: true });
  expect(mocks.track.mock.calls[0][1]).toEqual({});
});

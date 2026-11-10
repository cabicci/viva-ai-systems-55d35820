import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { contactAttemptIdentity, contactAttemptFingerprint } from "../contact-automation-attempt";
import { ContactForm } from "@/components/site/ContactForm";
import { webcrypto } from "node:crypto";

const mocks = vi.hoisted(() => ({ submit: vi.fn(), track: vi.fn(), recover: vi.fn() }));
vi.mock("@tanstack/react-start", () => ({
  useServerFn: (fn: unknown) => (fn === "recover" ? mocks.recover : mocks.submit),
}));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("@/lib/contact-form.functions", () => ({
  submitContactForm: {},
  getContactSubmissionState: "recover",
}));
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
  vi.stubGlobal("crypto", webcrypto);
  sessionStorage.clear();
});
afterEach(() => vi.unstubAllGlobals());

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
  expect(mocks.submit.mock.calls[0][0].data.attemptId).toBe(
    mocks.submit.mock.calls[1][0].data.attemptId,
  );
});

it.each(["captcha", "rate_limit", "invalid_phone"])(
  "keeps a pending identity after %s so a retry cannot duplicate intake",
  async (error) => {
    mocks.submit.mockResolvedValueOnce({ success: false, error: "pending_review" });
    const form = prepare();
    fireEvent.submit(form);
    await waitFor(() => expect(mocks.submit).toHaveBeenCalledTimes(1));
    await screen.findByText(/We cannot yet confirm/);
    const id = JSON.parse(sessionStorage.getItem("masaarat.contact.attempt")!).id;
    mocks.submit.mockResolvedValueOnce({ success: false, error });
    fireEvent.click(screen.getByText("verify"));
    fireEvent.submit(form);
    await waitFor(() => expect(mocks.submit).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "contact.submit" })).not.toBeDisabled(),
    );
    expect(JSON.parse(sessionStorage.getItem("masaarat.contact.attempt")!).id).toBe(id);
    expect(mocks.track).not.toHaveBeenCalled();
  },
);
it.each(["closed_manual", "accepted", "withdrawn"])(
  "recovers %s after reload without reentering personal data",
  async (state) => {
    const prior = contactAttemptIdentity("a".repeat(64), null);
    sessionStorage.setItem("masaarat.contact.attempt", JSON.stringify(prior));
    mocks.recover.mockResolvedValue({ state });
    render(<ContactForm />);
    await screen.findByText("Start a new request");
    expect(mocks.recover).toHaveBeenCalledExactlyOnceWith({
      data: { attemptId: prior.id, recoveryToken: prior.recoveryToken },
    });
    expect(mocks.submit).not.toHaveBeenCalled();
    expect(mocks.track).not.toHaveBeenCalled();
  },
);
it("keeps an unknown outcome without claiming server storage", async () => {
  sessionStorage.setItem(
    "masaarat.contact.attempt",
    JSON.stringify(contactAttemptIdentity("a".repeat(64), null)),
  );
  mocks.recover.mockResolvedValue({ state: "unknown" });
  render(<ContactForm />);
  await waitFor(() => expect(mocks.recover).toHaveBeenCalledTimes(1));
  expect(screen.getByText(/We cannot yet confirm/)).toBeInTheDocument();
  expect(screen.queryByText(/Your request is saved/)).not.toBeInTheDocument();
  expect(screen.queryByText("Start a new request")).not.toBeInTheDocument();
});

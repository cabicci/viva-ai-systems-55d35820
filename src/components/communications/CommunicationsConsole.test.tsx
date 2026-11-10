import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CommunicationsConsole } from "./CommunicationsConsole";
import type { SupportedLocale } from "@/lib/locale/types";

vi.mock("./PhoneAdministration", () => ({
  PhoneAdministration: () => <div data-testid="phone-controls" />,
}));
vi.mock("./ContactAutomationAdministration", () => ({ ContactAutomationAdministration: () => <div data-testid="contact-controls" /> }));
afterEach(cleanup);
describe("communications console", () => {
  it.each(["ar-EG", "ar-MSA", "ar-Gulf", "en"] as SupportedLocale[])(
    "connects the controls and explains optional verification in %s",
    (locale) => {
      const en = locale === "en";
      const refresh = vi.fn();
      const { container } = render(
        <CommunicationsConsole
          locale={locale}
          loading={false}
          error={false}
          refresh={refresh}
          readiness={{
            credentialsConfigured: true,
            verifyConfigured: true,
            verifyReachable: null,
            messagingConfigured: false,
            whatsappSenderConfigured: false,
            activationAvailable: false,
          }}
        />,
      );
      expect(container.querySelector("main")).toHaveAttribute("dir", en ? "ltr" : "rtl");
      expect(screen.getByTestId("phone-controls")).toBeInTheDocument();
    expect(screen.getByTestId("contact-controls")).toBeInTheDocument();
      expect(screen.getByRole("status")).toHaveTextContent(
        en ? "requires a separate sending test" : "بتجربة إرسال منفصلة",
      );
      expect(
        screen.getByText(en ? /optional for registration and sign-in/ : /اختياري للتسجيل والدخول/),
      ).toBeVisible();
      fireEvent.click(
        screen.getByRole("button", { name: en ? "Check configuration" : "تحقق من الإعداد" }),
      );
      expect(refresh).toHaveBeenCalledOnce();
    },
  );
  it("shows a read failure separately from missing configuration", () => {
    render(<CommunicationsConsole locale="en" loading={false} error refresh={() => {}} />);
    expect(screen.getByRole("alert")).toHaveTextContent("could not be checked");
    expect(screen.queryByText("Verify configuration is incomplete.")).not.toBeInTheDocument();
  });
});

describe("provider connection result", () => {
  it("distinguishes configured credentials from a failed connection", () => {
    render(
      <CommunicationsConsole
        locale="en"
        loading={false}
        error={false}
        refresh={() => {}}
        readiness={{
          credentialsConfigured: true,
          verifyConfigured: true,
          verifyReachable: false,
          messagingConfigured: false,
          whatsappSenderConfigured: false,
          activationAvailable: false,
        }}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("could not be reached or rejected");
    expect(screen.queryByText(/responded to the connection check/)).not.toBeInTheDocument();
  });
});

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CommunicationsConsole } from "./CommunicationsConsole";
import type { SupportedLocale } from "@/lib/locale/types";

afterEach(cleanup);
describe("communications setup console", () => {
  it.each(["ar-EG", "ar-MSA", "ar-Gulf", "en"] as SupportedLocale[])(
    "shows an honest draft and disabled activation in %s",
    (locale) => {
      const en = locale === "en",
        refresh = vi.fn();
      const { container } = render(
        <CommunicationsConsole
          locale={locale}
          loading={false}
          error={false}
          refresh={refresh}
          readiness={{
            credentialsConfigured: true,
            verifyConfigured: true,
            verifyReachable: true,
            messagingConfigured: true,
            whatsappSenderConfigured: true,
            activationAvailable: false,
          }}
        />,
      );
      expect(container.querySelector("main")).toHaveAttribute("dir", en ? "ltr" : "rtl");
      expect(screen.getByRole("status")).toHaveTextContent(en ? "Setup draft" : "مسودة الإعداد");
      expect(
        screen.getAllByRole("button", {
          name: en ? "Off until setup and testing are complete" : "متوقف حتى اكتمال الربط والتجربة",
        }),
      ).toHaveLength(3);
      screen
        .getAllByRole("button", {
          name: en ? "Off until setup and testing are complete" : "متوقف حتى اكتمال الربط والتجربة",
        })
        .forEach((button) => expect(button).toBeDisabled());
      fireEvent.click(
        screen.getByRole("button", { name: en ? "Check configuration" : "تحقق من الإعداد" }),
      );
      expect(refresh).toHaveBeenCalledOnce();
      fireEvent.click(
        screen.getByRole("button", { name: en ? "Message templates" : "قوالب الرسائل" }),
      );
      expect(container.querySelectorAll("article")).toHaveLength(7);
      expect(
        screen.getByText(
          en
            ? "Welcome {{name}}, your Masaarat account has been created."
            : "مرحبًا {{name}}، تم إنشاء حسابك في مسارات.",
        ),
      ).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: en ? "Delivery log" : "سجل الإرسال" }));
      expect(
        screen.getByText(
          en ? /This integration has sent no messages/ : /لم يُرسل هذا الربط أي رسالة/,
        ),
      ).toBeInTheDocument();
    },
  );
});

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { SupportedLocale } from "@/lib/locale/types";
const settings = vi.hoisted(() => ({ locale: "en" as SupportedLocale }));
vi.mock("@/lib/locale/locale-context", () => ({ useLocale: () => ({ locale: settings.locale }) }));
import { PasswordInput } from "./PasswordInput";
afterEach(cleanup);
describe("password visibility controls", () => {
  it.each(["ar-EG", "ar-MSA", "ar-Gulf", "en"] as SupportedLocale[])(
    "toggles each field independently without submitting in %s",
    (locale) => {
      settings.locale = locale;
      const submit = vi.fn((e) => e.preventDefault());
      render(
        <form onSubmit={submit} dir={locale === "en" ? "ltr" : "rtl"}>
          <label htmlFor="first">Password</label>
          <PasswordInput id="first" value="SYNTHETIC PASSWORD" readOnly />
          <label htmlFor="second">Confirm</label>
          <PasswordInput id="second" value="SYNTHETIC PASSWORD" readOnly />
        </form>,
      );
      const first = screen.getByLabelText("Password"),
        second = screen.getByLabelText("Confirm");
      expect(first).toHaveAttribute("type", "password");
      expect(second).toHaveAttribute("type", "password");
      const button = screen.getAllByRole("button", {
        name: locale === "en" ? "Show password" : "إظهار كلمة المرور",
      })[0];
      expect(button).toHaveAttribute("type", "button");
      expect(button).toHaveAttribute("aria-controls", "first");
      fireEvent.click(button);
      expect(first).toHaveAttribute("type", "text");
      expect(second).toHaveAttribute("type", "password");
      expect(first).toHaveValue("SYNTHETIC PASSWORD");
      expect(button).toHaveAttribute("aria-pressed", "true");
      fireEvent.click(button);
      expect(first).toHaveAttribute("type", "password");
      expect(submit).not.toHaveBeenCalled();
    },
  );
});

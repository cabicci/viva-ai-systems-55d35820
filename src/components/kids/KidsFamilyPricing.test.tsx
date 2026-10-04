import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { KidsFamilyPricing } from "./KidsFamilyPricing";

const state = vi.hoisted(() => ({ locale: "en" }));
vi.mock("@/lib/locale/locale-context", () => ({ useLocale: () => state }));

describe("Kids family offer", () => {
  it.each(["en", "ar-EG", "ar-MSA", "ar-Gulf"])(
    "shows independent family prices and distinguishes manual payments in %s",
    (locale) => {
      state.locale = locale;
      render(<KidsFamilyPricing />);
      expect(
        screen.getByText(locale === "en" ? /up to 3 children/ : /حتى 3 أطفال/),
      ).toBeInTheDocument();
      expect(
        screen.getByText(locale === "en" ? /Stripe uses test mode/ : /Stripe تجريبي/),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          locale === "en"
            ? /manual transfers are real payments/i
            : /التحويل اليدوي المتاح دفع فعلي/,
        ),
      ).toBeInTheDocument();
      const formatter = new Intl.NumberFormat(
        locale === "en" ? "en-US" : locale === "ar-Gulf" ? "ar-SA" : "ar-EG",
        {
          style: "currency",
          currency: "USD",
        },
      );
      expect(screen.getByText(formatter.format(7.99).replace(/\s/g, " "))).toBeInTheDocument();
      expect(
        screen.getByText(
          new RegExp(
            formatter
              .format(7.19)
              .replace(/\s/g, " ")
              .replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          ),
        ),
      ).toBeInTheDocument();
      expect(screen.getAllByRole("button")).toHaveLength(4);
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
    },
  );
});

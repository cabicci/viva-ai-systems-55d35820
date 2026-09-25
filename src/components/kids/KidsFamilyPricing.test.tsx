import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { KidsFamilyPricing } from "./KidsFamilyPricing";

const state = vi.hoisted(() => ({ locale: "en" }));
vi.mock("@/lib/locale/locale-context", () => ({ useLocale: () => state }));

describe("Kids family offer", () => {
  it.each(["en", "ar-EG", "ar-MSA", "ar-Gulf"])(
    "shows independent family prices without a purchase action in %s",
    (locale) => {
      state.locale = locale;
      render(<KidsFamilyPricing />);
      expect(
        screen.getByText(locale === "en" ? /up to 3 children/ : /حتى 3 أطفال/),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          locale === "en" ? /not available for purchase yet/ : /شراء الاشتراك غير متاح/,
        ),
      ).toBeInTheDocument();
      const formatter = new Intl.NumberFormat(locale === "en" ? "en-US" : "ar-EG", {
        style: "currency",
        currency: "USD",
      });
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
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
    },
  );
});

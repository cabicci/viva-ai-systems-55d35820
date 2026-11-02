import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { LocaleProvider } from "@/lib/locale/locale-context";
import { SUPPORTED_LOCALES } from "@/lib/locale/types";
import { PlanAllowance } from "./PlanAllowance";

afterEach(cleanup);
describe("localized subscription benefit bullets", () => {
  for (const family of [false, true]) {
    it.each(SUPPORTED_LOCALES)(
      `${family ? "Kids" : "Academic and Technical"} states quota and validity as bullets in %s`,
      (locale) => {
        render(
          <LocaleProvider initialLocale={locale}>
            <PlanAllowance family={family} />
          </LocaleProvider>,
        );
        const list = within(screen.getByRole("list"));
        expect(list.getAllByRole("listitem")).toHaveLength(4);
        expect(list.getByText(family ? /100|١٠٠/ : /300|٣٠٠/)).toBeInTheDocument();
        expect(
          list.getByText(locale === "en" ? /active subscription/ : /اشتراك.*ساري|سريان الاشتراك/),
        ).toBeInTheDocument();
        expect(
          list.getByText(locale === "en" ? /do not roll over/ : /مش بيترحّل|لا يُرحّل|ما يترحّل/),
        ).toBeInTheDocument();
        expect(
          list.getByText(locale === "en" ? /next renewal/ : /التجديد الجاي|التجديد القادم/),
        ).toBeInTheDocument();
      },
    );
  }
});

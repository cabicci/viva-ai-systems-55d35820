import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createElement } from "react";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PlanPrices } from "@/components/site/PlanPrices";
import { APPROVED_PRICES_MINOR } from "@/lib/billing/catalogue/prices";
import { LocaleProvider } from "@/lib/locale/locale-context";

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("public commercial UI contract", () => {
  it("renders every approved catalogue plan from the canonical price source", () => {
    const pricing = source("src/routes/pricing.tsx");

    expect(pricing).toContain("pricing.plan.free.name");
    expect(pricing).toContain("pricing.plan.pro.name");
    expect(pricing).toContain("pricing.plan.proPlus.name");
    expect(pricing).toContain('<PlanPrices plan="pro" />');
    expect(pricing).toContain('<PlanPrices plan="pro_plus" />');
    expect(pricing).toContain("pricing.compare.colProPlus");

    expect(APPROVED_PRICES_MINOR.EG.pro.month).toBe(16_900);
    expect(APPROVED_PRICES_MINOR.EG.pro_plus.month).toBe(30_900);

    const displays = {
      pro: ["169 EGP", "1690 EGP", "6.99 USD", "69.90 USD"],
      pro_plus: ["309 EGP", "3090 EGP", "12.99 USD", "129.90 USD"],
    } as const;
    for (const plan of ["pro", "pro_plus"] as const) {
      const view = render(
        createElement(LocaleProvider, {
          initialLocale: "en",
          children: createElement(PlanPrices, { plan }),
        }),
      );
      for (const price of displays[plan]) expect(view.container).toHaveTextContent(price);
      view.unmount();
    }
  });

  it("provides a real mobile navigation trigger instead of hiding navigation", () => {
    const navbar = source("src/components/site/Navbar.tsx");

    const mobileTrigger = navbar.match(/<SheetTrigger asChild>([\s\S]*?)<\/SheetTrigger>/)?.[1];
    expect(mobileTrigger).toContain("min-[1180px]:hidden");
    expect(mobileTrigger).toContain('aria-label={t("nav.menu")}');
    expect(navbar).toMatch(
      /<nav\s+aria-label=\{t\("nav\.menu"\)\}\s+className="hidden [^"]*min-\[1180px\]:flex/,
    );
    expect(navbar).not.toContain('className="hidden md:flex items-center gap-8');
  });
});

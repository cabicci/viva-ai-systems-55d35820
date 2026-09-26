import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { APPROVED_PRICES_MINOR } from "@/lib/billing/catalogue/prices";

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("public commercial UI contract", () => {
  it("renders every approved catalogue plan from the canonical price source", () => {
    const pricing = source("src/routes/pricing.tsx");

    expect(pricing).toContain("APPROVED_PRICES_MINOR");
    expect(pricing).toContain("pricing.plan.free.name");
    expect(pricing).toContain("pricing.plan.pro.name");
    expect(pricing).toContain("pricing.plan.proPlus.name");
    expect(pricing).toContain('<PlanPrices plan="pro" />');
    expect(pricing).toContain('<PlanPrices plan="pro_plus" />');
    expect(pricing).toContain("pricing.compare.colProPlus");

    expect(APPROVED_PRICES_MINOR.EG.pro.month).toBe(16_900);
    expect(APPROVED_PRICES_MINOR.EG.pro_plus.month).toBe(30_900);
  });

  it("provides a real mobile navigation trigger instead of hiding navigation", () => {
    const navbar = source("src/components/site/Navbar.tsx");

    expect(navbar).toContain("SheetTrigger");
    expect(navbar).toContain('className="xl:hidden rounded-full"');
    expect(navbar).toContain('aria-label={t("nav.menu")}');
    expect(navbar).not.toContain('className="hidden md:flex items-center gap-8');
  });
});

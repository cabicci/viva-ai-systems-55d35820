import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { DASHBOARD_UI_KEYS } from "@/lib/locale/dashboard-ui-keys";
import { getUiString } from "@/lib/locale/ui-strings";
import { SUPPORTED_LOCALES } from "@/lib/locale/types";

const WIDGET_KEY_PREFIXES = [
  "dashboard.checklist.",
  "dashboard.wow.",
  "dashboard.reviews.",
] as const;

const DASHBOARD_WIDGET_KEYS = DASHBOARD_UI_KEYS.filter((key) =>
  WIDGET_KEY_PREFIXES.some((prefix) => key.startsWith(prefix)),
);

const WIDGET_SOURCES = [
  "src/components/dashboard/WelcomeChecklist.tsx",
  "src/components/dashboard/StartWowBanner.tsx",
  "src/components/dashboard/ReviewsDueCard.tsx",
].map((path) => readFileSync(resolve(process.cwd(), path), "utf8"));

describe("locale dashboard widgets (Phase 12.4B)", () => {
  it("serves dashboard widget strings for all four locales", () => {
    for (const locale of SUPPORTED_LOCALES) {
      for (const key of DASHBOARD_WIDGET_KEYS) {
        const value = getUiString(locale, key);
        expect(value.length, `${locale} ${key}`).toBeGreaterThan(0);
        expect(value, `${locale} ${key}`).not.toBe(key);
      }
    }
  });

  it("renders English dashboard widget copy for locale=en", () => {
    expect(getUiString("en", "dashboard.checklist.title")).toBe("Your first week");
    expect(getUiString("en", "dashboard.wow.cta")).toBe("Start the experience");
    expect(getUiString("en", "dashboard.reviews.title")).toBe("Reviews due today");
    expect(getUiString("en", "dashboard.reviews.itemToday")).toBe(
      "Today · review #{n}",
    );
  });

  it("wires dashboard widgets through useUiString", () => {
    for (const source of WIDGET_SOURCES) {
      expect(source).toContain("useUiString");
    }
  });
});

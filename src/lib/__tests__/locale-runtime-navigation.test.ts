import { describe, expect, it } from "vitest";
import { buildLocaleNavigationSearch } from "@/lib/locale/locale-search";
import { DASHBOARD_UI_KEYS } from "@/lib/locale/dashboard-ui-keys";
import { getUiString } from "@/lib/locale/ui-strings";
import { SUPPORTED_LOCALES } from "@/lib/locale/types";

describe("locale runtime navigation (4 options)", () => {
  it("buildLocaleNavigationSearch adds locale for en, ar-MSA, and ar-Gulf", () => {
    expect(buildLocaleNavigationSearch({ from: "dashboard" }, "en")).toEqual({
      from: "dashboard",
      locale: "en",
    });
    expect(buildLocaleNavigationSearch({ from: "curriculum" }, "ar-MSA")).toEqual({
      from: "curriculum",
      locale: "ar-MSA",
    });
    expect(buildLocaleNavigationSearch({}, "ar-Gulf")).toEqual({ locale: "ar-Gulf" });
  });

  it("omits locale param for ar-EG default", () => {
    expect(buildLocaleNavigationSearch({ from: "dashboard" }, "ar-EG")).toEqual({
      from: "dashboard",
    });
  });

  it("never emits previewLocale=false", () => {
    const built = buildLocaleNavigationSearch(
      { locale: "en", previewLocale: false },
      "en",
    );
    expect(built.previewLocale).toBeUndefined();
    expect(built.locale).toBe("en");
  });

  it("serves dashboard shell strings for all four locales", () => {
    for (const locale of SUPPORTED_LOCALES) {
      for (const key of DASHBOARD_UI_KEYS) {
        const value = getUiString(locale, key);
        expect(value.length, `${locale} ${key}`).toBeGreaterThan(0);
        expect(value, `${locale} ${key}`).not.toBe(key);
      }
    }
  });
});

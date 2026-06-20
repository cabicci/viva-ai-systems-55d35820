import { describe, it, expect } from "vitest";
import { resolveLocale, isSupportedLocale } from "@/lib/locale/resolve-locale";
import { DEFAULT_LOCALE } from "@/lib/locale/types";

describe("resolveLocale", () => {
  it("returns DEFAULT_LOCALE for missing, empty, or invalid input", () => {
    expect(resolveLocale()).toBe(DEFAULT_LOCALE);
    expect(resolveLocale(null)).toBe(DEFAULT_LOCALE);
    expect(resolveLocale("")).toBe(DEFAULT_LOCALE);
    expect(resolveLocale("   ")).toBe(DEFAULT_LOCALE);
    expect(resolveLocale("fr-FR")).toBe(DEFAULT_LOCALE);
  });

  it("returns supported locales unchanged", () => {
    expect(resolveLocale("ar-EG")).toBe("ar-EG");
    expect(resolveLocale("ar-MSA")).toBe("ar-MSA");
    expect(resolveLocale("ar-Gulf")).toBe("ar-Gulf");
    expect(resolveLocale("en")).toBe("en");
  });

  it("isSupportedLocale narrows correctly", () => {
    expect(isSupportedLocale("ar-EG")).toBe(true);
    expect(isSupportedLocale("en")).toBe(true);
    expect(isSupportedLocale("ar")).toBe(false);
    expect(isSupportedLocale(undefined)).toBe(false);
  });
});

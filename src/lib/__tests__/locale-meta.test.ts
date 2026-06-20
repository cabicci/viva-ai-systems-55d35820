import { describe, it, expect } from "vitest";
import {
  DEFAULT_LOCALE,
  LOCALE_META,
  SUPPORTED_LOCALES,
} from "@/lib/locale/types";

describe("LOCALE_META", () => {
  it("includes user-facing display names for all supported locales", () => {
    expect(LOCALE_META["ar-EG"].displayName).toBe("العامية المصرية");
    expect(LOCALE_META["ar-MSA"].displayName).toBe("العربية الفصحى");
    expect(LOCALE_META["ar-Gulf"].displayName).toBe("خليجي");
    expect(LOCALE_META.en.displayName).toBe("English");
  });

  it("keeps internal locale codes unchanged", () => {
    expect(SUPPORTED_LOCALES).toEqual(["ar-EG", "ar-MSA", "ar-Gulf", "en"]);
    expect(DEFAULT_LOCALE).toBe("ar-EG");
  });
});

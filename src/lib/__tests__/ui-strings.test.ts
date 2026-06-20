import { describe, it, expect } from "vitest";
import { getUiString } from "@/lib/locale/ui-strings";

describe("getUiString", () => {
  it("returns ar-EG production shell labels", () => {
    expect(getUiString("ar-EG", "sidebar.dashboard")).toBe("اللوحة");
    expect(getUiString("ar-EG", "nav.signup")).toBe("ابدأ مجاناً");
  });

  it("returns locale-specific strings when present", () => {
    expect(getUiString("en", "sidebar.dashboard")).toBe("Dashboard");
    expect(getUiString("ar-MSA", "common.notFound")).toBe("الصفحة غير موجودة");
  });

  it("falls back to ar-EG when a locale bundle omits a key", () => {
    expect(getUiString("ar-Gulf", "sidebar.dashboard")).toBe("اللوحة");
    expect(getUiString("en", "sidebar.dashboard")).toBe("Dashboard");
  });

  it("returns the key when missing from all bundles", () => {
    expect(getUiString("en", "missing.key" as "nav.brand")).toBe("missing.key");
  });
});

import { describe, it, expect } from "vitest";
import arEGUi from "@/locales/ar-EG/ui.json";
import arMSAUi from "@/locales/ar-MSA/ui.json";
import arGulfUi from "@/locales/ar-Gulf/ui.json";
import enUi from "@/locales/en/ui.json";
import { getUiString } from "@/lib/locale/ui-strings";
import type { UiStringKey } from "@/lib/locale/ui-strings";
import { SUPPORTED_LOCALES } from "@/lib/locale/types";

const AR_EG_KEYS = Object.keys(arEGUi) as UiStringKey[];

describe("shell UI strings (ar-EG production parity)", () => {
  it("matches ar-EG ui.json for every key", () => {
    for (const key of AR_EG_KEYS) {
      expect(getUiString("ar-EG", key)).toBe(arEGUi[key as keyof typeof arEGUi]);
    }
  });

  it("all locale bundles share the same key set as ar-EG", () => {
    const msaKeys = Object.keys(arMSAUi).sort();
    const gulfKeys = Object.keys(arGulfUi).sort();
    const enKeys = Object.keys(enUi).sort();
    const egKeys = [...AR_EG_KEYS].sort();

    expect(msaKeys).toEqual(egKeys);
    expect(gulfKeys).toEqual(egKeys);
    expect(enKeys).toEqual(egKeys);
  });

  it("returns locale-specific strings when present", () => {
    expect(getUiString("en", "sidebar.dashboard")).toBe("Dashboard");
    expect(getUiString("ar-MSA", "nav.login")).toBe("تسجيل الدخول");
    expect(getUiString("ar-Gulf", "nav.login")).toBe("دخول");
    expect(getUiString("en", "nav.pricing")).toBe("Pricing");
  });

  it("falls back to ar-EG for missing locale keys", () => {
    expect(getUiString("ar-Gulf", "sidebar.roadmap")).toBe("Roadmap");
  });

  it("does not expose internal locale codes as label values", () => {
    for (const key of AR_EG_KEYS) {
      const value = getUiString("ar-EG", key);
      if (!value) continue;
      expect(value).not.toMatch(/^ar-(EG|MSA|Gulf)$/);
      expect(value).not.toBe("en");
    }
  });

  it("includes nav.pricing for all locales", () => {
    for (const locale of SUPPORTED_LOCALES) {
      const value = getUiString(locale, "nav.pricing");
      expect(value.length).toBeGreaterThan(0);
      expect(value).not.toBe("nav.pricing");
    }
  });
});

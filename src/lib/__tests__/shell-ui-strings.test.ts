import { describe, it, expect } from "vitest";
import { getUiString } from "@/lib/locale/ui-strings";
import type { UiStringKey } from "@/lib/locale/ui-strings";

/** Production ar-EG shell labels wired in Navbar + Sidebar (Phase 1E). */
const PRODUCTION_AR_EG_SHELL: Record<UiStringKey, string> = {
  "nav.brand": "مسارات",
  "nav.paths": "المسارات",
  "nav.journey": "الرحلة",
  "nav.philosophy": "الفلسفة",
  "nav.curriculum": "المنهج",
  "nav.myDashboard": "لوحتي",
  "nav.login": "دخول",
  "nav.signup": "ابدأ مجاناً",
  "sidebar.dashboard": "اللوحة",
  "sidebar.assistant": "مساعد المنصة",
  "sidebar.analytics": "تحليلاتي",
  "sidebar.account": "حسابي",
  "sidebar.admin": "لوحة الإدارة",
  "sidebar.imageGallery": "معرض الصور",
  "sidebar.roadmap": "Roadmap",
  "sidebar.assistantRuntime": "Assistant Runtime",
  "sidebar.systemState": "System State",
  "sidebar.buildLogs": "Build Logs",
  "sidebar.systemTools": "أدوات النظام",
  "sidebar.welcome": "مرحبًا",
  "sidebar.guest": "ضيف",
  "sidebar.signOut": "تسجيل خروج",
  "sidebar.openMenu": "فتح القائمة",
  "sidebar.menuTitle": "القائمة",
  "footer.privacy": "سياسة الخصوصية",
  "footer.terms": "الشروط والأحكام",
  "a11y.skipToContent": "تخطّى للمحتوى الأساسي",
  "common.backToDashboard": "العودة للوحة",
  "common.notFound": "الصفحة مش موجودة",
  "cta.myDashboard": "افتح لوحتي",
  "cta.createAccount": "إنشاء حساب",
  "cta.signIn": "تسجيل الدخول",
};

describe("shell UI strings (ar-EG production parity)", () => {
  it("matches current Navbar and Sidebar labels for ar-EG", () => {
    for (const [key, expected] of Object.entries(PRODUCTION_AR_EG_SHELL)) {
      expect(getUiString("ar-EG", key as UiStringKey)).toBe(expected);
    }
  });

  it("falls back to ar-EG for missing locale keys", () => {
    expect(getUiString("en", "sidebar.dashboard")).toBe("Dashboard");
    expect(getUiString("ar-Gulf", "sidebar.roadmap")).toBe("Roadmap");
  });

  it("does not expose internal locale codes as label values", () => {
    for (const key of Object.keys(PRODUCTION_AR_EG_SHELL) as UiStringKey[]) {
      const value = getUiString("ar-EG", key);
      expect(value).not.toMatch(/^ar-(EG|MSA|Gulf)$/);
      expect(value).not.toBe("en");
    }
  });
});

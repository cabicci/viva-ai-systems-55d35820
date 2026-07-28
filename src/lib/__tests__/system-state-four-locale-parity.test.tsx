import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { LocaleProvider } from "@/lib/locale/locale-context";
import { getUiString } from "@/lib/locale/ui-strings";
import { SYSTEM_STATE_UI_KEYS } from "@/lib/locale/system-state-ui-keys";
import { LOCALE_META, SUPPORTED_LOCALES, type SupportedLocale } from "@/lib/locale/types";
import { resolvePublicLocale } from "@/lib/locale/resolve-public-locale";
import { ROUTES, GAPS } from "@/components/system-state/data";

const REPO_ROOT = path.resolve(import.meta.dirname, "../../..");
const ARABIC = /[\u0600-\u06FF]/;
const EGYPTIAN_MARKERS = /(أيوه|دلوقتي|مفيش|هيتفعّل|لسه|هنعلن|بتاخدك)/;

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, ...props }: { children: React.ReactNode; to?: string }) => (
    <a href={typeof to === "string" ? to : "#"} {...props}>
      {children}
    </a>
  ),
  createFileRoute: () => (opts: unknown) => opts,
}));

vi.mock("@/components/dashboard/Sidebar", () => ({
  Sidebar: () => <aside data-testid="sidebar-stub" />,
}));

vi.mock("@/lib/learner-context", () => ({
  useLearnerContext: () => ({
    currentUser: {
      isAuthenticated: true,
      email: "admin@example.com",
      id: "admin-1",
    },
    currentRoute: "/system-state",
    currentPath: null,
    currentModule: null,
    currentLesson: null,
    currentLessonStatus: null,
    completedLessonsCount: 0,
    totalLessonsCount: 100,
    nextLesson: null,
    lastCompletedLesson: null,
    currentMission: null,
    resolvedAt: "2026-07-28T00:00:00.000Z",
    isReady: true,
  }),
}));

vi.mock("@/lib/mission-runtime", () => ({
  useMissionRuntime: () => ({
    total: 0,
    liveMissions: [],
    isPersisted: false,
    currentMission: null,
    missions: [],
  }),
}));

vi.mock("@/lib/platform-retrieval", () => ({
  RETRIEVAL_CORPUS_SIZE: 12,
  usePlatformRetrieval: () => [],
}));

async function renderSystemState(locale: SupportedLocale) {
  const { SystemStatePage } = await import("@/routes/system-state");
  return render(
    <LocaleProvider effectiveLocale={locale}>
      <SystemStatePage />
    </LocaleProvider>,
  );
}

describe("/system-state four-locale parity", () => {
  it("resolves requested locale exactly for all four locales", () => {
    for (const locale of SUPPORTED_LOCALES) {
      const resolved = resolvePublicLocale({ urlLocale: locale }).locale;
      expect(resolved).toBe(locale);
    }
  });

  it("maps document direction from resolved locale", () => {
    expect(LOCALE_META.en.dir).toBe("ltr");
    expect(LOCALE_META["ar-EG"].dir).toBe("rtl");
    expect(LOCALE_META["ar-MSA"].dir).toBe("rtl");
    expect(LOCALE_META["ar-Gulf"].dir).toBe("rtl");
  });

  it("serves every systemState UI key for all four locales without key fallback", () => {
    for (const locale of SUPPORTED_LOCALES) {
      for (const key of SYSTEM_STATE_UI_KEYS) {
        const value = getUiString(locale, key);
        expect(value.length, `${locale} ${key}`).toBeGreaterThan(0);
        expect(value, `${locale} ${key}`).not.toBe(key);
      }
    }
  });

  it("keeps en systemState chrome free of Arabic letters", () => {
    for (const key of SYSTEM_STATE_UI_KEYS) {
      expect(getUiString("en", key), key).not.toMatch(ARABIC);
    }
  });

  it("keeps ar-MSA and ar-Gulf free of Egyptian leakage markers", () => {
    for (const locale of ["ar-MSA", "ar-Gulf"] as const) {
      for (const key of SYSTEM_STATE_UI_KEYS) {
        expect(getUiString(locale, key), `${locale} ${key}`).not.toMatch(EGYPTIAN_MARKERS);
      }
    }
  });

  it("keeps Egyptian markers available in ar-EG where dialect copy uses them", () => {
    const blob = SYSTEM_STATE_UI_KEYS.map((key) => getUiString("ar-EG", key)).join("\n");
    expect(blob).toMatch(/(مفيش|لسه|بيتحمّل)/);
  });

  it("avoids identical undifferentiated chrome across Arabic dialects for key strings", () => {
    const dialectSensitive = [
      "systemState.retrieval.empty",
      "systemState.missionRuntime.noteBody",
      "systemState.data.lessons.body",
      "systemState.progression.saved.body",
      "systemState.stat.routes",
    ] as const;
    for (const key of dialectSensitive) {
      const eg = getUiString("ar-EG", key);
      const msa = getUiString("ar-MSA", key);
      expect(eg, key).not.toBe(msa);
    }
  });

  it("preserves authenticated-admin route guard wiring", () => {
    const src = readFileSync(path.join(REPO_ROOT, "src/routes/system-state.tsx"), "utf8");
    expect(src).toContain("requireAdminBeforeLoad");
    expect(src).toContain("AdminGate");
    expect(src).toContain("beforeLoad: requireAdminBeforeLoad");
  });

  it("wires route and panels through useUiString / getUiString without hardcoded dir=rtl", () => {
    const files = [
      "src/routes/system-state.tsx",
      "src/components/system-state/RuntimeContextPanel.tsx",
      "src/components/system-state/MissionRuntimePanel.tsx",
      "src/components/system-state/RetrievalPanel.tsx",
      "src/components/system-state/primitives.tsx",
    ];
    for (const rel of files) {
      const src = readFileSync(path.join(REPO_ROOT, rel), "utf8");
      expect(src, rel).not.toContain('dir="rtl"');
      expect(src, rel).toMatch(/useUiString|getUiString/);
    }
    const route = readFileSync(path.join(REPO_ROOT, "src/routes/system-state.tsx"), "utf8");
    expect(route).toContain("dir={dir}");
    expect(route).toContain("resolveRouteHeadLocale");
  });

  it("preserves /system-state data table shape (routes + gaps)", () => {
    expect(ROUTES).toHaveLength(10);
    expect(GAPS).toHaveLength(6);
    expect(ROUTES.some((r) => r.path === "/system-state")).toBe(true);
    expect(ROUTES.every((r) => r.titleKey && r.purposeKey && r.status)).toBe(true);
    expect(GAPS.every((g) => g.titleKey && g.bodyKey)).toBe(true);
  });

  for (const locale of SUPPORTED_LOCALES) {
    it(`renders visible chrome for ${locale} with correct direction and copy`, async () => {
      const { container } = await renderSystemState(locale);
      const root = container.firstElementChild as HTMLElement;
      expect(root.getAttribute("dir")).toBe(LOCALE_META[locale].dir);

      expect(
        screen.getByRole("heading", {
          level: 1,
          name: getUiString(locale, "systemState.title"),
        }),
      ).toBeTruthy();
      expect(screen.getByText(getUiString(locale, "systemState.intro"))).toBeTruthy();
      expect(screen.getByText(getUiString(locale, "systemState.exportPdf"))).toBeTruthy();
      expect(screen.getByText(getUiString(locale, "common.backToDashboard"))).toBeTruthy();
      expect(screen.getByText(getUiString(locale, "systemState.route.landing.title"))).toBeTruthy();
      expect(
        screen.getByText(getUiString(locale, "systemState.gap.sequentialUnlocks.title")),
      ).toBeTruthy();
      expect(screen.getAllByText("/system-state").length).toBeGreaterThan(0);
      expect(screen.getByText("admin@example.com")).toBeTruthy();

      if (locale === "en") {
        expect(root.textContent).not.toMatch(ARABIC);
      }

      if (locale === "ar-MSA" || locale === "ar-Gulf") {
        expect(root.textContent).not.toMatch(EGYPTIAN_MARKERS);
      }

      if (locale === "ar-EG") {
        expect(root.textContent).toMatch(ARABIC);
        expect(screen.getByText(getUiString("ar-EG", "systemState.retrieval.empty"))).toBeTruthy();
      }
    });
  }
});

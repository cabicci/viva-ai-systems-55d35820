import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AssistantPanel } from "@/components/assistant/AssistantPanel";
import {
  buildAssistantRuntimePayload,
  buildLocalizedAssistantContextOverride,
  resolveAssistantLearnerContext,
} from "@/lib/assistant/resolve-assistant-learner-context";
import { adaptPackageMissionsFromSections, packageMissionId } from "@/lib/locale-lessons/adapt-package-to-live-mission";
import { extractMissionFromLocalizedPackage } from "@/lib/mission-gate";
import { LocaleProvider } from "@/lib/locale/locale-context";
import { LOCALE_META } from "@/lib/locale/types";
import type { LearnerContext } from "@/lib/learner-context";
import type { LocalizedLessonPackage } from "@/lib/locale-lessons/types";
import type { SupportedLocale } from "@/lib/locale/types";

const REPO_ROOT = path.resolve(import.meta.dirname, "../../..");
const LESSON_ID = "intro-m1-l2-first-prompt";
const PACKAGE_LOCALES = ["en", "ar-MSA", "ar-Gulf"] as const;
const ALL_LOCALES = ["ar-EG", "en", "ar-MSA", "ar-Gulf"] as const;

vi.mock("@/lib/learner-context", () => ({
  useLearnerContext: () => baseCtxProvider(),
}));

vi.mock("@/lib/assistant-session-store", () => ({
  useAssistantSession: () => ({
    query: "",
    loading: false,
    error: null,
    response: null,
    matches: [],
  }),
  setAssistantSession: vi.fn(),
}));

function baseCtxProvider(): Pick<
  LearnerContext,
  | "currentPath"
  | "currentModule"
  | "currentLesson"
  | "currentMission"
  | "completedLessonsCount"
  | "totalLessonsCount"
  | "nextLesson"
  | "isReady"
> {
  return {
    currentPath: { id: "intro", title: "Egyptian path" } as LearnerContext["currentPath"],
    currentModule: { id: "m1", title: "Egyptian module" } as LearnerContext["currentModule"],
    currentLesson: {
      id: LESSON_ID,
      title: "Egyptian lesson title",
      mission: { intro: "EG intro", prompt: "EG prompt" },
    } as LearnerContext["currentLesson"],
    currentMission: { intro: "EG intro", prompt: "EG prompt" } as LearnerContext["currentMission"],
    completedLessonsCount: 2,
    totalLessonsCount: 7,
    nextLesson: { id: "next", title: "Egyptian next" } as LearnerContext["nextLesson"],
    isReady: true,
  };
}

function readPackage(locale: (typeof PACKAGE_LOCALES)[number]): LocalizedLessonPackage {
  const filePath = path.join(
    REPO_ROOT,
    "src/lib/locale-lessons",
    locale,
    "lessons",
    `${LESSON_ID}.json`,
  );
  return JSON.parse(readFileSync(filePath, "utf8")) as LocalizedLessonPackage;
}

function renderAssistant(
  locale: SupportedLocale,
  contextOverride?: ReturnType<typeof buildLocalizedAssistantContextOverride> | null,
) {
  return render(
    <LocaleProvider effectiveLocale={locale}>
      <AssistantPanel compact contextOverride={contextOverride ?? null} />
    </LocaleProvider>,
  );
}

describe("resolveAssistantLearnerContext", () => {
  for (const locale of PACKAGE_LOCALES) {
    it(`uses localized package context for ${locale}`, () => {
      const pkg = readPackage(locale);
      const mission = extractMissionFromLocalizedPackage(pkg)!;
      const override = buildLocalizedAssistantContextOverride({
        pathId: "intro",
        pathTitle: "Introduction",
        moduleId: "intro-m1",
        moduleTitle: "Module One",
        lessonId: LESSON_ID,
        lessonTitle: pkg.title,
        nextLessonTitle: "Next lesson title",
        mission: { intro: mission.intro, prompt: mission.prompt },
      });

      const resolved = resolveAssistantLearnerContext(locale, baseCtxProvider(), override);
      expect(resolved.locale).toBe(locale);
      expect(resolved.currentLessonTitle).toBe(pkg.title);
      expect(resolved.currentPathTitle).toBe("Introduction");
      expect(resolved.currentModuleTitle).toBe("Module One");
      expect(resolved.currentMission?.intro).toBe(mission.intro);
      expect(resolved.currentMission?.prompt).toBe(mission.prompt);
      expect(resolved.currentPathTitle).not.toBe("Egyptian path");
      expect(resolved.currentLessonTitle).not.toBe("Egyptian lesson title");
    });
  }

  it("preserves legacy Egyptian context when override is absent", () => {
    const resolved = resolveAssistantLearnerContext("ar-EG", baseCtxProvider(), null);
    expect(resolved.locale).toBeNull();
    expect(resolved.currentPathTitle).toBe("Egyptian path");
    expect(resolved.currentLessonTitle).toBe("Egyptian lesson title");
    expect(resolved.currentMission?.intro).toBe("EG intro");
  });

  it("builds runtime payload with active package locale and localized mission", () => {
    const pkg = readPackage("en");
    const mission = extractMissionFromLocalizedPackage(pkg)!;
    const override = buildLocalizedAssistantContextOverride({
      pathId: "intro",
      pathTitle: "Introduction",
      moduleId: "intro-m1",
      moduleTitle: "Module One",
      lessonId: LESSON_ID,
      lessonTitle: pkg.title,
      nextLessonTitle: null,
      mission: { intro: mission.intro, prompt: mission.prompt },
    });
    const resolved = resolveAssistantLearnerContext("en", baseCtxProvider(), override);
    const payload = buildAssistantRuntimePayload("hello", resolved, []);

    expect(payload.learnerContext.locale).toBe("en");
    expect(payload.learnerContext.currentLessonTitle).toBe(pkg.title);
    expect(payload.learnerContext.currentMission?.intro).toBe(mission.intro);
    expect(payload.learnerContext.currentMission?.prompt).toBe(mission.prompt);
  });
});

describe("AssistantPanel locale UI", () => {
  for (const locale of ALL_LOCALES) {
    it(`renders localized chrome for ${locale}`, () => {
      const { container } = renderAssistant(locale);
      expect(container.firstElementChild?.getAttribute("dir")).toBe(
        LOCALE_META[locale].dir,
      );
    });
  }

  it("does not show Egyptian hardcoded compact labels in English", () => {
    renderAssistant("en");
    expect(screen.getByPlaceholderText(/Ask the platform assistant/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: /^Send$/i })).toBeTruthy();
    expect(screen.queryByText("السياق الحالي:")).toBeNull();
    expect(screen.queryByText("اسأل مساعد المنصة...")).toBeNull();
  });

  it("preserves ar-EG compact labels byte-for-byte without override", () => {
    renderAssistant("ar-EG");
    expect(screen.getByPlaceholderText("اسأل مساعد المنصة...")).toBeTruthy();
    expect(screen.getByText(/السياق الحالي:/)).toBeTruthy();
    expect(screen.getByText(/Egyptian module \/ Egyptian lesson title/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "إرسال" })).toBeTruthy();
  });

  it("shows localized package lesson title in compact context for en", () => {
    const pkg = readPackage("en");
    const mission = extractMissionFromLocalizedPackage(pkg)!;
    const override = buildLocalizedAssistantContextOverride({
      pathId: "intro",
      pathTitle: "Introduction",
      moduleId: "intro-m1",
      moduleTitle: "Module One",
      lessonId: LESSON_ID,
      lessonTitle: pkg.title,
      nextLessonTitle: null,
      mission: { intro: mission.intro, prompt: mission.prompt },
    });
    renderAssistant("en", override);
    expect(screen.getByText(new RegExp(pkg.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))).toBeTruthy();
    expect(screen.queryByText("Egyptian lesson title")).toBeNull();
  });
});

describe("localized mission identity parity", () => {
  for (const locale of PACKAGE_LOCALES) {
    it(`${locale} package mission id matches gate and rubric slot`, () => {
      const pkg = readPackage(locale);
      const fromSections = adaptPackageMissionsFromSections(pkg.lessonId, pkg.sections);
      const fromGate = extractMissionFromLocalizedPackage(pkg);
      const expectedId = packageMissionId(LESSON_ID);

      expect(fromSections[0]?.missionId).toBe(expectedId);
      expect(fromGate?.missionId).toBe(expectedId);
    });
  }
});

describe("learn route assistant wiring", () => {
  it("passes localized contextOverride into AssistantPanel", () => {
    const source = readFileSync(
      path.join(REPO_ROOT, "src/routes/learn.$pathId.$lessonId.tsx"),
      "utf8",
    );
    expect(source).toContain("assistantContextOverride");
    expect(source).toContain("contextOverride={assistantContextOverride}");
    expect(source).toContain("buildLocalizedAssistantContextOverride");
  });
});

describe("AssistantPanel source hygiene", () => {
  it("does not hardcode dir=rtl on root container", () => {
    const source = readFileSync(
      path.join(REPO_ROOT, "src/components/assistant/AssistantPanel.tsx"),
      "utf8",
    );
    expect(source).not.toMatch(/dir="rtl"/);
    expect(source).toContain("dir={dir}");
    expect(source).toContain("getUiString");
    expect(source).toContain("contextOverride");
  });
});

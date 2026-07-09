import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { LocalePackagePreviewRenderer } from "@/components/locale/LocalePackagePreviewRenderer";
import { LocaleProvider } from "@/lib/locale/locale-context";
import type { LocalizedLessonPackage } from "@/lib/locale-lessons/types";

const evaluateMissionWithAISpy = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      insert: vi.fn().mockResolvedValue({ error: null }),
    }),
  },
}));

vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({ user: null, loading: false }),
}));

vi.mock("@/components/intro/lessons", () => ({
  loadIntroLessonContent: vi.fn(),
  hasIntroLessonContent: vi.fn(() => false),
}));

vi.mock("@/components/intro/MissionRubricSubmit", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/intro/MissionRubricSubmit")>();
  return {
    ...actual,
    evaluateMissionWithAI: (...args: unknown[]) => evaluateMissionWithAISpy(...args),
  };
});

const REPO_ROOT = path.resolve(import.meta.dirname, "../../..");

function readPackage(
  locale: "en" | "ar-MSA",
  lessonId: string,
): LocalizedLessonPackage {
  const filePath = path.join(
    REPO_ROOT,
    "src/lib/locale-lessons",
    locale,
    "lessons",
    `${lessonId}.json`,
  );
  return JSON.parse(readFileSync(filePath, "utf8")) as LocalizedLessonPackage;
}

function renderLocalizedPackage(locale: "en" | "ar-MSA", lessonId: string) {
  const pkg = readPackage(locale, lessonId);
  return render(
    <LocaleProvider effectiveLocale={locale}>
      <LocalePackagePreviewRenderer pkg={pkg} />
    </LocaleProvider>,
  );
}

describe("LocalePackagePreviewRenderer live mission", () => {
  it("renders live mission structure instead of read-only preview", () => {
    const { container } = renderLocalizedPackage(
      "en",
      "automator-m3-testing-automation",
    );
    expect(container.querySelector('[data-locale-mission="live"]')).not.toBeNull();
    expect(container.querySelector('[data-locale-mission="readonly"]')).toBeNull();
  });

  it("shows intro, expandable prompt steps, and rubric without submit UI", async () => {
    const pkg = readPackage("en", "automator-m3-testing-automation");
    const mission = pkg.sections.find((section) => section.mission)?.mission!;
    renderLocalizedPackage("en", "automator-m3-testing-automation");

    expect(screen.getByText(mission.intro!)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /submit/i })).toBeNull();

    fireEvent.click(
      await screen.findByRole("button", { name: /Show mission steps/i }),
    );
    const promptPanel = document.querySelector(
      ".rounded-xl.border.border-primary\\/15.bg-background\\/40",
    );
    expect(promptPanel?.textContent).toContain(mission.delivery[0]!.slice(0, 24));
    expect(screen.getByText("Unit + Full-flow")).toBeTruthy();
    expect(screen.getByText("Edge + Review")).toBeTruthy();
  });

  it("does not call real AI evaluation", async () => {
    evaluateMissionWithAISpy.mockClear();
    renderLocalizedPackage("en", "automator-m5-l1-llm-in-flow");
    fireEvent.click(
      await screen.findByRole("button", { name: /Show mission steps/i }),
    );
    expect(evaluateMissionWithAISpy).not.toHaveBeenCalled();
  });

  it("does not load ar-EG mission content", async () => {
    const lessons = await import("@/components/intro/lessons");
    renderLocalizedPackage("en", "automator-m3-testing-automation");
    expect(lessons.loadIntroLessonContent).not.toHaveBeenCalled();
  });
});

describe("IntroMission ar-EG regression (unchanged shared component contract)", () => {
  it("still wires MissionRubricSection only when lessonId and rubric are provided", async () => {
    const missionModule = await import("@/components/intro/IntroMission");
    const source = missionModule.IntroMissionPrompt.toString();
    expect(source).toContain("MissionRubricSection");
    expect(source).toContain("lessonId");
  });
});

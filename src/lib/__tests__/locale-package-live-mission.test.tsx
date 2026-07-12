import { readFileSync } from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderLocalizedLesson } from "@/lib/__tests__/locale-test-utils";
import type { LocalizedLessonPackage } from "@/lib/locale-lessons/types";

vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({ user: { id: "user-1" }, loading: false }),
}));

const REPO_ROOT = path.resolve(import.meta.dirname, "../../..");
const VALID_LESSON_ID = "intro-m1-l2-first-prompt";

function readPackage(
  locale: "en",
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

async function renderLocalizedPackage(locale: "en", lessonId: string) {
  const pkg = readPackage(locale, lessonId);
  return renderLocalizedLesson(pkg);
}

describe("LocalePackageLessonRenderer live mission", () => {
  it("renders canonical mission UI without preview/mock markers", async () => {
    const { container } = await renderLocalizedPackage("en", VALID_LESSON_ID);

    await waitFor(() => {
      expect(screen.getByRole("textbox")).toBeTruthy();
    });

    expect(container.querySelector('[data-locale-mission="live"]')).toBeNull();
    expect(
      container.querySelector('[data-locale-mission-evaluation="mock-disabled"]'),
    ).toBeNull();
    expect(container.querySelector('[data-locale-mission="readonly"]')).toBeNull();
    expect(container.querySelector('[data-locale-mission-submit="mock"]')).toBeNull();
    expect(
      container.querySelector('[data-locale-mission-rubric="readonly"]'),
    ).toBeNull();
  });

  it("shows localized intro, prompt, rubric, textarea, and submit", async () => {
    const pkg = readPackage("en", VALID_LESSON_ID);
    const missionSection = pkg.sections.find((section) => section.mission);
    expect(missionSection).toBeTruthy();

    const intro = missionSection!.mission!.intro as string;
    expect(intro.length).toBeGreaterThan(0);
    await renderLocalizedPackage("en", VALID_LESSON_ID);

    await waitFor(() => {
      expect(screen.getByText(intro)).toBeTruthy();
    });
    expect(screen.getByRole("textbox")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /Submit and get feedback/i }),
    ).toBeTruthy();
    expect(screen.getAllByText("Clear Request").length).toBeGreaterThan(0);
  });

  it("does not expose mock mission feedback markers", async () => {
    await renderLocalizedPackage("en", VALID_LESSON_ID);

    await waitFor(() => {
      expect(screen.getByRole("textbox")).toBeTruthy();
    });

    expect(
      document.querySelector('[data-locale-mission-feedback="mock"]'),
    ).toBeNull();
    expect(
      screen.getByRole("button", { name: /Submit and get feedback/i }),
    ).toBeTruthy();
  });
});

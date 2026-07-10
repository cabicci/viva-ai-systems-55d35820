import { readFileSync } from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { LocalePackagePreviewRenderer } from "@/components/locale/LocalePackagePreviewRenderer";
import { deterministicMockMissionFeedback } from "@/components/locale/LocaleMockMissionSubmit";
import { LocaleProvider } from "@/lib/locale/locale-context";
import type { LocalizedLessonPackage } from "@/lib/locale-lessons/types";

const evaluateMissionWithAISpy = vi.fn();
const supabaseInsertSpy = vi.fn().mockResolvedValue({ error: null });

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      insert: supabaseInsertSpy,
    }),
  },
}));

vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({ user: { id: "user-1" }, loading: false }),
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

function renderLocalizedPackage(locale: "en", lessonId: string) {
  const pkg = readPackage(locale, lessonId);
  return render(
    <LocaleProvider effectiveLocale={locale}>
      <LocalePackagePreviewRenderer pkg={pkg} />
    </LocaleProvider>,
  );
}

describe("LocalePackagePreviewRenderer live mission", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    evaluateMissionWithAISpy.mockClear();
    supabaseInsertSpy.mockClear();
    fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(() =>
      Promise.reject(new Error("fetch should not be called")),
    );
  });

  it("renders live mission with mock-disabled evaluation markers", () => {
    const { container } = renderLocalizedPackage("en", VALID_LESSON_ID);

    expect(container.querySelector('[data-locale-mission="live"]')).not.toBeNull();
    expect(
      container.querySelector('[data-locale-mission-evaluation="mock-disabled"]'),
    ).not.toBeNull();
    expect(container.querySelector('[data-locale-mission="readonly"]')).toBeNull();
    expect(container.querySelector('[data-locale-mission-submit="mock"]')).not.toBeNull();
  });

  it("shows intro, prompt, rubric, textarea, and submit for valid missions", () => {
    const pkg = readPackage("en", VALID_LESSON_ID);
    const missionSection = pkg.sections.find((section) => section.mission);
    expect(missionSection).toBeTruthy();

    const intro = missionSection!.mission!.intro as string;
    expect(intro.length).toBeGreaterThan(0);
    renderLocalizedPackage("en", VALID_LESSON_ID);

    expect(screen.getByText(intro)).toBeTruthy();
    expect(screen.getByLabelText(/Your answer/i)).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /Submit and get feedback/i }),
    ).toBeTruthy();
    expect(
      document.querySelector('[data-locale-mission-rubric="readonly"]'),
    ).not.toBeNull();
    expect(screen.getAllByText("Clear Request").length).toBeGreaterThan(0);
  });

  it("shows deterministic mocked feedback after submit and never passes", async () => {
    const answer = "This is my mission answer with enough detail for feedback.";
    const expected = deterministicMockMissionFeedback(
      `${VALID_LESSON_ID}::mission`,
      answer,
    );

    renderLocalizedPackage("en", VALID_LESSON_ID);

    fireEvent.change(screen.getByLabelText(/Your answer/i), {
      target: { value: answer },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /Submit and get feedback/i }),
    );

    await waitFor(() => {
      expect(
        document.querySelector('[data-locale-mission-feedback="mock"]'),
      ).not.toBeNull();
    });

    const label =
      expected.kind === "weak"
        ? /Needs a small clarification/i
        : /Try adding this point/i;
    expect(screen.getByText(label)).toBeTruthy();
    const feedback = document.querySelector('[data-locale-mission-feedback="mock"]');
    expect(feedback?.textContent).not.toMatch(/Nice — you clearly understood/i);
    expect(feedback?.textContent).not.toMatch(/^Clear$/);
    expect(
      screen.getByRole("button", { name: /Improve my answer/i }),
    ).toBeTruthy();
  });

  it("supports retry reset clearing answer and feedback", async () => {
    renderLocalizedPackage("en", VALID_LESSON_ID);

    const textarea = screen.getByLabelText(/Your answer/i) as HTMLTextAreaElement;
    fireEvent.change(textarea, {
      target: { value: "Retry flow answer with sufficient length here." },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /Submit and get feedback/i }),
    );

    await waitFor(() => {
      expect(
        document.querySelector('[data-locale-mission-feedback="mock"]'),
      ).not.toBeNull();
    });

    fireEvent.click(screen.getByRole("button", { name: /Improve my answer/i }));

    expect(
      document.querySelector('[data-locale-mission-feedback="mock"]'),
    ).toBeNull();
    expect((screen.getByLabelText(/Your answer/i) as HTMLTextAreaElement).value).toBe(
      "",
    );
    expect(
      screen.getByRole("button", { name: /Submit and get feedback/i }),
    ).toBeTruthy();
  });

  it("does not call evaluateMissionWithAI, network, or persistence", async () => {
    renderLocalizedPackage("en", VALID_LESSON_ID);

    fireEvent.change(screen.getByLabelText(/Your answer/i), {
      target: { value: "No external calls in this localized mock flow." },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /Submit and get feedback/i }),
    );

    await waitFor(() => {
      expect(
        document.querySelector('[data-locale-mission-feedback="mock"]'),
      ).not.toBeNull();
    });

    expect(evaluateMissionWithAISpy).not.toHaveBeenCalled();
    expect(supabaseInsertSpy).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("falls back to readonly mission UI for invalid package missions", () => {
    const pkg = readPackage("en", VALID_LESSON_ID);
    const invalidPkg = structuredClone(pkg);
    const missionSection = invalidPkg.sections.find((section) => section.mission);
    expect(missionSection?.mission).toBeTruthy();
    missionSection!.mission!.intro = "";

    const { container } = render(
      <LocaleProvider effectiveLocale="en">
        <LocalePackagePreviewRenderer pkg={invalidPkg} />
      </LocaleProvider>,
    );

    expect(container.querySelector('[data-locale-mission="readonly"]')).not.toBeNull();
    expect(container.querySelector('[data-locale-mission="live"]')).toBeNull();
    expect(container.querySelector('[data-locale-mission-submit="mock"]')).toBeNull();
    expect(screen.queryByLabelText(/Your answer/i)).toBeNull();
  });

  it("does not load ar-EG mission content", async () => {
    const lessons = await import("@/components/intro/lessons");
    renderLocalizedPackage("en", VALID_LESSON_ID);
    expect(lessons.loadIntroLessonContent).not.toHaveBeenCalled();
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  loadIntroLessonContent,
} from "@/components/intro/lessons/lesson-registry";
import { adaptPackageQuizzesFromSections } from "@/lib/locale-lessons/adapt-package-to-live-quiz";
import { loadLocalePackageLesson } from "@/lib/locale-lessons/load-locale-package-lesson";
import {
  resolveCanonicalQuizQuestionFromCandidates,
  type QuizAttemptLocale,
} from "@/lib/quiz-attempt-source.server";

const mocks = vi.hoisted(() => ({
  inserts: [] as Array<Record<string, unknown>>,
  insertError: null as null | { message: string },
  from: vi.fn(),
  middleware: [] as unknown[],
  authBoundary: { name: "requireSupabaseAuth" },
}));

vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => {
    let validate = (input: unknown) => input;
    const chain: any = {};
    chain.middleware = (value: unknown) => {
      mocks.middleware.push(value);
      return chain;
    };
    chain.inputValidator = (next: (input: unknown) => unknown) => {
      validate = next;
      return chain;
    };
    chain.handler =
      (
        handler: (args: {
          data: unknown;
          context: { userId: string };
        }) => unknown,
      ) =>
      async (args: {
        data: unknown;
        context?: { userId?: string };
      }) => {
        if (!args.context?.userId) throw new Error("mock auth rejected");
        return handler({
          data: validate(args.data),
          context: { userId: args.context.userId },
        });
      };
    return chain;
  },
}));

vi.mock("@/integrations/supabase/auth-middleware", () => ({
  requireSupabaseAuth: mocks.authBoundary,
}));

function buildQuery() {
  const query: any = {};
  query.insert = vi.fn((payload: Record<string, unknown>) => {
    mocks.inserts.push(payload);
    return query;
  });
  query.select = vi.fn(() => query);
  query.single = vi.fn(async () =>
    mocks.insertError
      ? { data: null, error: mocks.insertError }
      : {
          data: { id: "11111111-1111-4111-8111-111111111111" },
          error: null,
        },
  );
  return query;
}

vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: {
    from: mocks.from,
  },
}));

import { submitQuizAttempt } from "@/lib/quiz-attempt.functions";

const LESSON_ID = "intro-m1-l1-what-is-ai";

function requestLessonId(locale: QuizAttemptLocale): string {
  return locale === "ar-EG" ? `${LESSON_ID}-apply` : LESSON_ID;
}

async function loadRealQuestion(locale: QuizAttemptLocale) {
  if (locale === "ar-EG") {
    const content = await loadIntroLessonContent(LESSON_ID);
    const questions =
      content?.flatMap((section) =>
        section.block.kind === "quiz" ? section.block.items : [],
      ) ?? [];
    expect(questions.length).toBeGreaterThan(0);
    return questions[0]!;
  }

  const pkg = await loadLocalePackageLesson(locale, LESSON_ID);
  expect(pkg).not.toBeNull();
  const questions = adaptPackageQuizzesFromSections(
    LESSON_ID,
    pkg!.sections,
  );
  expect(questions.length).toBeGreaterThan(0);
  return questions[0]!;
}

const callSubmit = submitQuizAttempt as unknown as (args: {
  data: Record<string, unknown>;
  context?: { userId?: string };
}) => Promise<{
  attemptId: string;
  isCorrect: boolean;
  bloomLevel: string;
}>;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.inserts.length = 0;
  mocks.insertError = null;
  mocks.from.mockImplementation(() => buildQuery());
});

describe("submitQuizAttempt authority boundary", () => {
  it.each(["ar-EG", "ar-MSA", "ar-Gulf", "en"] as const)(
    "resolves the real %s question and persists derived truth",
    async (locale) => {
      const question = await loadRealQuestion(locale);
      const result = await callSubmit({
        context: { userId: "user-1" },
        data: {
          locale,
          lessonId: requestLessonId(locale),
          questionId: question.id,
          selectedIndex: question.correctIndex,
        },
      });

      expect(result).toEqual({
        attemptId: "11111111-1111-4111-8111-111111111111",
        isCorrect: true,
        bloomLevel: question.bloom,
      });
      expect(mocks.from).toHaveBeenCalledWith("lesson_quiz_attempts");
      expect(mocks.inserts).toEqual([
        {
          user_id: "user-1",
          lesson_id: requestLessonId(locale),
          question_id: question.id,
          selected_index: question.correctIndex,
          is_correct: true,
          bloom_level: question.bloom,
        },
      ]);
    },
  );
  it("derives an incorrect result from the canonical answer", async () => {
    const question = await loadRealQuestion("ar-EG");
    const selectedIndex = question.correctIndex === 0 ? 1 : 0;
    const result = await callSubmit({
      context: { userId: "user-1" },
      data: {
        locale: "ar-EG",
        lessonId: requestLessonId("ar-EG"),
        questionId: question.id,
        selectedIndex,
      },
    });

    expect(result.isCorrect).toBe(false);
    expect(mocks.inserts[0]).toMatchObject({
      selected_index: selectedIndex,
      is_correct: false,
      bloom_level: question.bloom,
    });
  });

  it("resolves the real non-apply ar-EG QuizBlock owner", async () => {
    const sourceLessonId = "builder-m5-l5-mini-win";
    const runtimeLessonId = "builder-m5-l5-mini-win-check";
    const content = await loadIntroLessonContent(sourceLessonId);
    const quiz = content
      ?.map((section) => section.block)
      .find(
        (block) =>
          block.kind === "quiz" && block.lessonId === runtimeLessonId,
      );
    expect(quiz?.kind).toBe("quiz");
    if (!quiz || quiz.kind !== "quiz") throw new Error("missing real quiz");
    const question = quiz.items[0]!;

    const result = await callSubmit({
      context: { userId: "user-1" },
      data: {
        locale: "ar-EG",
        lessonId: runtimeLessonId,
        questionId: question.id,
        selectedIndex: question.correctIndex,
      },
    });
    expect(result.isCorrect).toBe(true);
    expect(mocks.inserts[0]).toMatchObject({
      lesson_id: runtimeLessonId,
      question_id: question.id,
      is_correct: true,
    });
  });

  it("fails closed for ambiguous or malformed canonical questions", () => {
    const valid = {
      id: "q1",
      bloom: "understand",
      options: ["Wrong", "Right"],
      correctIndex: 1,
    };
    expect(() =>
      resolveCanonicalQuizQuestionFromCandidates(
        LESSON_ID,
        [valid, { ...valid }],
        "q1",
      ),
    ).toThrow("ambiguous question id");

    for (const malformed of [
      { ...valid, options: ["", "Right"] },
      { ...valid, correctIndex: 2 },
      { ...valid, bloom: "tampered" },
    ]) {
      expect(() =>
        resolveCanonicalQuizQuestionFromCandidates(
          LESSON_ID,
          [malformed],
          "q1",
        ),
      ).toThrow();
    }
  });

  it("strictly rejects forged result and identity fields", async () => {
    const question = await loadRealQuestion("en");
    await expect(
      callSubmit({
        context: { userId: "user-1" },
        data: {
          locale: "en",
          lessonId: LESSON_ID,
          questionId: question.id,
          selectedIndex: question.correctIndex,
          user_id: "attacker",
          is_correct: true,
          bloom_level: "apply",
        },
      }),
    ).rejects.toThrow();
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("rejects invalid indices and unknown questions before writing", async () => {
    const question = await loadRealQuestion("ar-MSA");
    await expect(
      callSubmit({
        context: { userId: "user-1" },
        data: {
          locale: "ar-MSA",
          lessonId: LESSON_ID,
          questionId: question.id,
          selectedIndex: question.options.length,
        },
      }),
    ).rejects.toThrow("selected index is out of range");

    await expect(
      callSubmit({
        context: { userId: "user-1" },
        data: {
          locale: "ar-EG",
          lessonId: requestLessonId("ar-EG"),
          questionId: "tampered-question",
          selectedIndex: 0,
        },
      }),
    ).rejects.toThrow("does not contain the requested question");
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("fails closed when persistence fails", async () => {
    const question = await loadRealQuestion("ar-Gulf");
    mocks.insertError = { message: "db unavailable" };
    await expect(
      callSubmit({
        context: { userId: "user-1" },
        data: {
          locale: "ar-Gulf",
          lessonId: LESSON_ID,
          questionId: question.id,
          selectedIndex: question.correctIndex,
        },
      }),
    ).rejects.toThrow("unable to persist attempt");
  });

  it("retains the authenticated middleware boundary", async () => {
    expect(mocks.middleware).toContainEqual([mocks.authBoundary]);
    const question = await loadRealQuestion("ar-EG");
    await expect(
      callSubmit({
        data: {
          locale: "ar-EG",
          lessonId: requestLessonId("ar-EG"),
          questionId: question.id,
          selectedIndex: question.correctIndex,
        },
      }),
    ).rejects.toThrow("mock auth rejected");
    expect(mocks.from).not.toHaveBeenCalled();
  });
});

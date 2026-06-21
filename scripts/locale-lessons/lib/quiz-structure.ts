import type {
  AdaptationTargetLocale,
  LocalizedLessonPackage,
  LocalizedLessonSection,
} from "../../../src/lib/locale-lessons/types.ts";

function normalizeSourceQuizOptionText(text: string): string {
  return text
    .replace(
      /^(\*{1,2})?(الإجابة الصحيحة|Correct answer|Correct Answer)[^:*]*(\([^)]*\))?\*{0,2}\s*:?\s*/i,
      "",
    )
    .replace(/\(correctIndex\s*:\s*\d+\)/gi, "")
    .replace(/^\*\*|\*\*$/g, "")
    .trim();
}

export interface QuizStructureFallback {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export type LocaleQuizFallbacks = Record<
  AdaptationTargetLocale,
  QuizStructureFallback
>;

/**
 * Complete canonical quiz structures for corrupted ar-MSA lessons.
 * Used during localization finalization only — never edit ar-MSA source packages.
 */
export const CORRUPTED_SOURCE_QUIZ_FALLBACKS: Record<string, LocaleQuizFallbacks> =
  {
    "intro-m1-l1-what-is-ai": {
      en: {
        question: "What is the best way to start understanding AI today?",
        correctIndex: 1,
        options: [
          "Read as many articles about AI as you can before trying anything.",
          "Open ChatGPT or Gemini and ask it something simple from your day.",
          "Wait until you have taken a full course on how AI works technically.",
          "Ask a friend who already uses AI to explain everything to you first.",
        ],
        explanation:
          "One small real attempt teaches you more than a long read. This is exactly what you will do in the mission.",
      },
      "ar-Gulf": {
        question: "وش أفضل طريقة تبدأ فيها تفهم الـ AI اليوم؟",
        correctIndex: 1,
        options: [
          "تقرأ مقالات طويلة عن تاريخ الذكاء الاصطناعي وكيف يشتغل من الداخل.",
          "تفتح ChatGPT أو Gemini وتطلب منه شيء بسيط من يومك.",
          "تنتظر لين تخلص الدورة كلها قبل ما تجرب أي أداة.",
          "تسأل شخص خبير يشرح لك كل التفاصيل التقنية أولًا.",
        ],
        explanation:
          "تجربة وحدة صغيرة تعلّمك أكثر من قراءة طويلة. هذا بالضبط اللي راح تسويه في المهمة.",
      },
    },
    "business-m1-l2-reactive-vs-proactive": {
      en: {
        question:
          "Karim opened WhatsApp first thing in the morning because of a major supplier problem and spent 3 hours on it. How would you classify this?",
        correctIndex: 1,
        options: [
          "Proactive — he chose to prioritize the supplier issue himself.",
          "Reactive — the situation decided his day before he could choose his own priorities.",
          "Neither — it depends on how serious the problem was.",
          "Proactive — because he solved the problem successfully.",
        ],
        explanation:
          "The size of the problem is not the measure. The measure is: who decided what you worked on first? If the outside world pulled you in before you set your own priorities, that is Reactive. Reducing repetitive Reactive work starts with recognizing when the world is taking your day.",
      },
      "ar-Gulf": {
        question:
          "خالد فتح واتساب أول الصبح بسبب مشكلة مورّد كبيرة وقضى ٣ ساعات يتابعها. وش هذا؟",
        correctIndex: 1,
        options: [
          "Proactive — لأنه اتخذ قرارًا بنفسه وخصّص وقتًا للمشكلة",
          "Reactive — الموقف حدّد يومه قبل ما يختار أولوياته",
          "لا هذا ولا ذاك — لأن المشكلة كانت كبيرة وتستحق الوقت",
          "Proactive — لأن التعامل مع الموردين جزء من التخطيط",
        ],
        explanation:
          "حجم المشكلة مو هو المعيار. المعيار: مين اللي قرّر وش تسوّيه أول؟ لو الموقف هو اللي حدّد يومك قبل ما تختار أولوياتك، هذا Reactive. تقليل المتكرر يبدأ بمعرفة متى «العالم» يأخذ يومك.",
      },
    },
    "analyst-m1-l1-from-automation-to-insight": {
      en: {
        question:
          "You noticed many customers add products to the cart but do not buy. What is the best first data question?",
        correctIndex: 2,
        options: [
          "How many total site visitors did we have this month?",
          "Should we increase our marketing budget next quarter?",
          "Where exactly do customers leave the purchase process (funnel drop-off)?",
        ],
        explanation:
          "A specific question that locates the problem leads to a decision about the purchase path. General totals alone are not enough.",
      },
      "ar-Gulf": {
        question:
          "لاحظت إن كثير من الزبائن يضيفون منتجات للسلة وما يشترون. وش أفضل سؤال بيانات تبدأ فيه؟",
        correctIndex: 2,
        options: [
          "كم عدد زوار الموقع هذا الشهر؟",
          "هل نزيد ميزانية الإعلانات الربع الجاي؟",
          "وين بالضبط يترك الزبائن عملية الشراء (funnel drop-off)؟",
        ],
        explanation:
          "سؤال محدد يفهم «وين المشكلة» — يوصلك لقرار بخصوص مسار الشراء. الأرقام العامة ما تكفي.",
      },
    },
    "analyst-m4-automated-dashboard": {
      en: {
        question:
          "You have four numbers on the dashboard — what is the best first step for automation?",
        correctIndex: 0,
        options: [
          "Automate the metric you read weekly after collecting it manually for two weeks.",
          "Automate all four numbers at once before trying manually.",
          "Build ten extra charts in Looker Studio.",
        ],
        explanation:
          "Start with the one metric you already read weekly and act on — after two manual weeks that prove it matters.",
      },
      "ar-Gulf": {
        question: "عندك ٤ أرقام في الـ Dashboard — وش أفضل خطوة أولى للأتمتة؟",
        correctIndex: 0,
        options: [
          "تؤتمت الرقم اللي تقراه كل أسبوع وتاخذ عليه قرار — بعد ما جمعته يدوي أسبوعين.",
          "تؤتمت الـ ٤ أرقام مرة واحدة قبل ما تجرب يدوي.",
          "تبني ١٠ رسوم إضافية في Looker Studio.",
        ],
        explanation:
          "ابدأ برقم واحد تقراه كل أسبوع وتتخذ قرارًا عنه — بعد ما جمعته يدويًا أسبوعين وتثبت أنه مهم.",
      },
    },
  };

export interface CorruptedSourceQuizOverride {
  optionCount: number;
  correctIndex: number;
}

/** Metadata derived from canonical fallback quizzes (EN shape). */
export const CORRUPTED_SOURCE_QUIZ_OVERRIDES: Record<
  string,
  CorruptedSourceQuizOverride
> = Object.fromEntries(
  Object.entries(CORRUPTED_SOURCE_QUIZ_FALLBACKS).map(([lessonId, locales]) => {
    const fallback = locales.en;
    return [
      lessonId,
      {
        optionCount: fallback.options.length,
        correctIndex: fallback.correctIndex,
      },
    ];
  }),
);

export function getCorruptedQuizFallback(
  lessonId: string,
  targetLocale: AdaptationTargetLocale,
): QuizStructureFallback | null {
  return CORRUPTED_SOURCE_QUIZ_FALLBACKS[lessonId]?.[targetLocale] ?? null;
}

export function applyDeterministicQuizFallback(input: {
  lessonId: string;
  targetLocale: AdaptationTargetLocale;
  usesOverride: boolean;
  lockedOptions: string[];
  question: string;
  explanation: string;
  sourceOptionTextsByIndex: string[];
  indexAlignedAdaptedOptions: boolean;
}): { options: string[]; question: string; explanation: string } {
  const fallback = input.usesOverride
    ? getCorruptedQuizFallback(input.lessonId, input.targetLocale)
    : null;

  const lockedHasAllOptions =
    input.indexAlignedAdaptedOptions &&
    input.lockedOptions.length > 0 &&
    input.lockedOptions.every((option) => option.trim().length > 0);

  let options = input.lockedOptions;
  let question = input.question;
  let explanation = input.explanation;

  if (fallback && !lockedHasAllOptions) {
    options = [...fallback.options];
    if (!question.trim()) question = fallback.question;
    if (!explanation.trim()) explanation = fallback.explanation;
  } else if (fallback) {
    options = input.lockedOptions.map(
      (option, index) =>
        option.trim() || fallback.options[index]?.trim() || "",
    );
    if (!question.trim()) question = fallback.question;
    if (!explanation.trim()) explanation = fallback.explanation;
  }

  if (options.some((option) => !option.trim())) {
    throw new Error(
      `${input.lessonId} quiz section: cannot finalize with empty quiz options`,
    );
  }

  if (fallback && options.length !== fallback.options.length) {
    throw new Error(
      `${input.lessonId} quiz section: override fallback option count mismatch`,
    );
  }

  return { options, question, explanation };
}

export interface ResolvedQuizStructure {
  optionCount: number;
  correctIndex: number;
  sourceSchemaValid: boolean;
  usesOverride: boolean;
  /** Normalized source option text per index (may be shorter than optionCount). */
  sourceOptionTextsByIndex: string[];
}

export type ResolveQuizStructureResult =
  | { ok: true; structure: ResolvedQuizStructure }
  | { ok: false; lessonId: string; issues: string[] };

function isExplanationBullet(text: string): boolean {
  return /^(\*\*)?(التفسير|Explanation)\b/i.test(text.trim());
}

export function countQuizOptionBullets(bullets: string[]): number {
  return bullets.filter((bullet) => {
    const trimmed = bullet.trim();
    return trimmed.length > 0 && !isExplanationBullet(trimmed);
  }).length;
}

export function extractQuizOptionBullets(bullets: string[]): string[] {
  return bullets
    .filter((bullet) => {
      const trimmed = bullet.trim();
      return trimmed.length > 0 && !isExplanationBullet(trimmed);
    })
    .map((bullet) => normalizeSourceQuizOptionText(bullet));
}

function minimumOptionCountForCorrectIndex(correctIndex: number): number {
  let minimum = 2;
  if (correctIndex >= 0) {
    minimum = Math.max(minimum, correctIndex + 1);
  }
  if (correctIndex >= 2) {
    minimum = Math.max(minimum, 3);
  }
  return minimum;
}

export function isSourceQuizSchemaValid(
  section: LocalizedLessonSection | undefined,
  lessonId: string,
): boolean {
  if (CORRUPTED_SOURCE_QUIZ_OVERRIDES[lessonId]) return false;

  const quiz = section?.quiz;
  if (!quiz) return false;

  const correctIndex = quiz.correctIndex;
  const options = quiz.options ?? [];
  if (correctIndex === undefined || correctIndex < 0) return false;
  if (options.length <= correctIndex) return false;
  if (options.some((option) => !option?.trim())) return false;
  if (options.length < minimumOptionCountForCorrectIndex(correctIndex)) return false;

  const optionBullets = countQuizOptionBullets(section?.bullets ?? []);
  if (optionBullets > 0 && options.length < optionBullets) return false;

  return true;
}

function buildSourceOptionTextsByIndex(
  section: LocalizedLessonSection | undefined,
  optionCount: number,
): string[] {
  const fromBullets = extractQuizOptionBullets(section?.bullets ?? []);
  const fromQuiz = (section?.quiz?.options ?? []).map((option) =>
    normalizeSourceQuizOptionText(option),
  );

  const texts: string[] = [];
  for (let index = 0; index < optionCount; index++) {
    const candidate = fromBullets[index]?.trim() || fromQuiz[index]?.trim() || "";
    texts.push(candidate);
  }
  return texts;
}

export function resolveSourceQuizStructure(
  sourceSection: LocalizedLessonSection | undefined,
  lessonId: string,
): ResolveQuizStructureResult {
  const quiz = sourceSection?.quiz;
  const issues: string[] = [];

  if (!quiz) {
    return { ok: false, lessonId, issues: ["missing structured quiz object"] };
  }

  const correctIndex = quiz.correctIndex;
  if (correctIndex === undefined || correctIndex < 0) {
    issues.push("missing or invalid correctIndex");
  }

  const override = CORRUPTED_SOURCE_QUIZ_OVERRIDES[lessonId];
  if (override) {
    if (correctIndex !== undefined && correctIndex !== override.correctIndex) {
      issues.push(
        `override correctIndex ${override.correctIndex} differs from source correctIndex ${String(correctIndex)}`,
      );
    }

    return {
      ok: true,
      structure: {
        optionCount: override.optionCount,
        correctIndex: override.correctIndex,
        sourceSchemaValid: false,
        usesOverride: true,
        sourceOptionTextsByIndex: buildSourceOptionTextsByIndex(
          sourceSection,
          override.optionCount,
        ),
      },
    };
  }

  if (isSourceQuizSchemaValid(sourceSection, lessonId)) {
    const options = quiz.options ?? [];
    return {
      ok: true,
      structure: {
        optionCount: options.length,
        correctIndex: correctIndex ?? 0,
        sourceSchemaValid: true,
        usesOverride: false,
        sourceOptionTextsByIndex: options.map((option) =>
          normalizeSourceQuizOptionText(option),
        ),
      },
    };
  }

  const optionBullets = countQuizOptionBullets(sourceSection?.bullets ?? []);
  const options = quiz.options ?? [];
  const derivedCount = Math.max(
    optionBullets,
    options.length,
    correctIndex !== undefined && correctIndex >= 0 ? correctIndex + 1 : 0,
  );

  if (correctIndex === undefined || correctIndex < 0) {
    return {
      ok: false,
      lessonId,
      issues: issues.length > 0 ? issues : ["missing or invalid correctIndex"],
    };
  }

  if (derivedCount < minimumOptionCountForCorrectIndex(correctIndex)) {
    issues.push(
      `cannot derive ${minimumOptionCountForCorrectIndex(correctIndex)} options for correctIndex ${correctIndex} (derived ${derivedCount})`,
    );
    return { ok: false, lessonId, issues };
  }

  if (derivedCount < 2) {
    issues.push("cannot derive at least 2 quiz options from source");
    return { ok: false, lessonId, issues };
  }

  return {
    ok: true,
    structure: {
      optionCount: derivedCount,
      correctIndex,
      sourceSchemaValid: false,
      usesOverride: false,
      sourceOptionTextsByIndex: buildSourceOptionTextsByIndex(
        sourceSection,
        derivedCount,
      ),
    },
  };
}

export function identifyCorruptedSourceQuizIssues(
  source: LocalizedLessonPackage,
): string[] {
  const issues: string[] = [];

  for (const section of source.sections) {
    if (section.role !== "Quiz") continue;

    const resolved = resolveSourceQuizStructure(section, source.lessonId);
    if (resolved.ok) {
      if (!resolved.structure.sourceSchemaValid) {
        const label = `${source.lessonId} quiz section`;
        if (resolved.structure.usesOverride) {
          issues.push(
            `${label}: corrupted source quiz schema — using explicit override (${resolved.structure.optionCount} options, correctIndex ${resolved.structure.correctIndex})`,
          );
        } else {
          issues.push(
            `${label}: corrupted source quiz schema — derived ${resolved.structure.optionCount} options from bullets`,
          );
        }
      }
      continue;
    }

    issues.push(
      `${source.lessonId} quiz section: ${resolved.issues.join("; ")} — no override defined`,
    );
  }

  return issues;
}

export interface LockedQuizOptionsResult {
  options: string[];
  correctIndex: number;
  structureRestored: boolean;
  missingLocalizedSlots: number[];
}

/**
 * Lock adapted quiz text to source structure by index.
 * AI may only localize quiz.options[i] in place; order, count, and correctIndex are fixed.
 */
export function lockQuizOptionsToSourceStructure(
  structure: ResolvedQuizStructure,
  adaptedOptions: string[],
  adaptedOptionBullets: string[],
): LockedQuizOptionsResult {
  const locked: string[] = [];
  const missingLocalizedSlots: number[] = [];
  let structureRestored = false;

  if (adaptedOptions.length !== structure.optionCount) {
    structureRestored = true;
  }

  const indexAlignedAdaptedOptions =
    adaptedOptions.length === structure.optionCount;

  for (let index = 0; index < structure.optionCount; index++) {
    const localized = indexAlignedAdaptedOptions
      ? adaptedOptions[index]?.trim() || adaptedOptionBullets[index]?.trim() || ""
      : adaptedOptionBullets[index]?.trim() ||
        adaptedOptions[index]?.trim() ||
        "";

    locked.push(localized);
    if (!localized) {
      missingLocalizedSlots.push(index);
    }
  }

  return {
    options: locked,
    correctIndex: structure.correctIndex,
    structureRestored,
    missingLocalizedSlots,
  };
}

export function detectQuizStructureDriftWarnings(
  lessonId: string,
  structure: ResolvedQuizStructure,
  adaptedOptions: string[],
  adaptedCorrectIndex: number | undefined,
): string[] {
  const warnings: string[] = [];
  const label = `${lessonId} quiz section`;

  if (adaptedOptions.length !== structure.optionCount) {
    warnings.push(
      `${label}: quiz option count must remain ${structure.optionCount}, found ${adaptedOptions.length}`,
    );
  }

  if (
    adaptedCorrectIndex !== undefined &&
    adaptedCorrectIndex !== structure.correctIndex
  ) {
    warnings.push(
      `${label}: correctIndex must remain ${structure.correctIndex}, found ${adaptedCorrectIndex}`,
    );
  }

  return warnings;
}

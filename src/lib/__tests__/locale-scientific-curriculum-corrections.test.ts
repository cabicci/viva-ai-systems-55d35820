import { execSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { adaptPackageQuizzesFromSections } from "@/lib/locale-lessons/adapt-package-to-live-quiz";
import type {
  LessonPackageLocale,
  LocalizedLessonMission,
  LocalizedLessonPackage,
} from "@/lib/locale-lessons/types";
import {
  AG4_ISSUE_ID_PATTERN,
  assertManifestInvariants,
  type ScientificCorrectionRecord,
} from "@/lib/locale-lessons/scientific-curriculum-corrections-manifest";
import { deepEqual } from "../../../scripts/locale-lessons/lib/phase13b-semantic-diff.ts";
import { validateRecoveredRuntimeEquivalence } from "../../../scripts/locale-lessons/lib/promote-phase13b-recovered-packages-core.ts";
import {
  auditAllRecoveredPackages,
  validateAllRecoveredPackages,
} from "../../../scripts/locale-lessons/repair-phase13b-recovered-packages.ts";
import { REQUIRED_LESSON_COUNT } from "@/lib/locale-lessons/types";
import {
  getCorruptedQuizFallback,
  resolveSourceQuizStructure,
  detectQuizStructureDriftWarnings,
} from "../../../scripts/locale-lessons/lib/quiz-structure.ts";
import { validateFinalLessonFile } from "../../../scripts/locale-lessons/lib/validate-final-lesson-package.ts";
import { runIsolatedPromotionIdempotence } from "./helpers/isolated-promotion-idempotence.ts";

const REPO_ROOT = path.resolve(import.meta.dirname, "../../..");
const FIXTURES = path.join(REPO_ROOT, "src/lib/__tests__/fixtures");
const BASE_SHA = "1a02f55c19d555c5f1e23642753828e6491fd4c3";

const MANIFEST = JSON.parse(
  readFileSync(path.join(FIXTURES, "scientific-curriculum-corrections-manifest.json"), "utf8"),
) as ScientificCorrectionRecord[];

const BEFORE_STATE = JSON.parse(
  readFileSync(path.join(FIXTURES, "scientific-curriculum-corrections-before-state.json"), "utf8"),
) as Record<string, LocalizedLessonPackage>;

const APPROVED_RECOVERED = new Set(MANIFEST.map((r) => r.recoveredPackagePath));
const APPROVED_RUNTIME = new Set(MANIFEST.map((r) => r.runtimePackagePath));

const B021_ACCEPTED_LOCALIZATION_COMMIT = "9dfd7ac9366f5cb6c8c9e5e279b38124d932f5d4";
const B021_ACCEPTED_AR_MSA_FIELDS = [
  {
    lessonId: "analyst-m6-l1-question-mistakes",
    recoveredPath:
      "src/lib/locale-lessons/ar-MSA/reports/phase13b-recovered-packages/ar-MSA/analyst-m6-l1-question-mistakes.json",
    runtimePath: "src/lib/locale-lessons/ar-MSA/lessons/analyst-m6-l1-question-mistakes.json",
    runtimeBlob: "839b90f2569d900adf15215f007005b5d4aaaef7",
    sectionIndex: 2,
    field: "bullet",
    itemIndex: 2,
    accepted: "No-Data — لا توجد بيانات أصلًا.",
    stale: "No-Data — مفيش بيانات أصلًا.",
  },
  {
    lessonId: "creator-m1-l1-why-content",
    recoveredPath:
      "src/lib/locale-lessons/ar-MSA/reports/phase13b-recovered-packages/ar-MSA/creator-m1-l1-why-content.json",
    runtimePath: "src/lib/locale-lessons/ar-MSA/lessons/creator-m1-l1-why-content.json",
    runtimeBlob: "0a721e09e8cdf4dcf2b30757dd055bdbb84b3387",
    sectionIndex: 6,
    field: "subtitle",
    accepted: "اكتب وعد المحتوى الخاص بك",
    stale: "اكتب وعد المحتوى بتاعك",
  },
] as const;
const B021_ADDITIONAL_RECOVERED = new Set([B021_ACCEPTED_AR_MSA_FIELDS[1].recoveredPath]);
const B021_ADDITIONAL_RUNTIME = new Set([B021_ACCEPTED_AR_MSA_FIELDS[1].runtimePath]);
const B021_FOLLOWUP_BASE_SHA = "dc49ae558e715283e7fd5b489894d80749edc806";
const B021_QUIZ_REPAIRS = [
  {
    locale: "ar-Gulf",
    lessonId: "business-m1-l2-reactive-vs-proactive",
    sectionIndex: 5,
    baselineBlob: "c443d11242adc1fc360182e1b60cf09b9da7d5bb",
  },
  {
    locale: "ar-Gulf",
    lessonId: "intro-m1-l1-what-is-ai",
    sectionIndex: 6,
    baselineBlob: "3add9e5ff4a2fc2031088667f1a5b1bcc12c6fc4",
  },
  {
    locale: "en",
    lessonId: "intro-m1-l1-what-is-ai",
    sectionIndex: 6,
    baselineBlob: "e8a1106e71afb69a4579d03fa07a210ca0ac0b9c",
  },
] as const;
const B021_BOLD_REPAIRS = [
  { locale: "en", lessonId: "analyst-m2-l2-right-question-rule", field: "intro" },
  { locale: "en", lessonId: "builder-m10-l2-first-users", field: "criteria" },
  { locale: "en", lessonId: "builder-m6-l2-wireframe", field: "intro" },
] as const;
function followupRuntimePath(repair: { locale: string; lessonId: string }): string {
  return "src/lib/locale-lessons/" + repair.locale + "/lessons/" + repair.lessonId + ".json";
}
const B021_FOLLOWUP_RUNTIME = new Set(
  [...B021_QUIZ_REPAIRS, ...B021_BOLD_REPAIRS].map(followupRuntimePath),
);
const B021_FOLLOWUP_RECOVERED = new Set([...B021_FOLLOWUP_RUNTIME].map(runtimeToRecovered));
const B021_FOLLOWUP_BASE_CACHE = new Map(
  [...B021_FOLLOWUP_RUNTIME].map((relativePath) => [
    relativePath,
    JSON.parse(
      execSync("git show " + B021_FOLLOWUP_BASE_SHA + ":" + relativePath, {
        cwd: REPO_ROOT,
        encoding: "utf8",
      }),
    ) as LocalizedLessonPackage,
  ]),
);
function readFollowupBase(relativePath: string): LocalizedLessonPackage {
  const base = B021_FOLLOWUP_BASE_CACHE.get(relativePath);
  if (!base) throw new Error("Unlisted B021 follow-up: " + relativePath);
  return structuredClone(base);
}
function expectedQuizMarkdown(
  quiz: NonNullable<LocalizedLessonPackage["sections"][number]["quiz"]>,
  locale: string,
): string {
  return (
    "**" +
    (locale === "en" ? "Question" : "السؤال") +
    ":** " +
    quiz.question +
    "\n\n" +
    quiz.options.map((option) => "- " + option).join("\n") +
    "\n\n**" +
    (locale === "en" ? "Explanation" : "التفسير") +
    ":** " +
    quiz.explanation
  );
}
function expectedFollowupQuiz(repair: (typeof B021_QUIZ_REPAIRS)[number]) {
  const base = readFollowupBase(followupRuntimePath(repair));
  const fallback = getCorruptedQuizFallback(repair.lessonId, repair.locale);
  if (!fallback || !base.sections[repair.sectionIndex]?.quiz)
    throw new Error("Missing exact quiz repair contract");
  return {
    ...base.sections[repair.sectionIndex].quiz!,
    options: [...fallback.options],
    correctIndex: fallback.correctIndex,
  };
}
function normalizeExactB021FollowupFields(pkg: LocalizedLessonPackage, relativePath: string): void {
  const quizRepair = B021_QUIZ_REPAIRS.find(
    (repair) => runtimeToRecovered(followupRuntimePath(repair)) === relativePath,
  );
  if (quizRepair) {
    const section = pkg.sections[quizRepair.sectionIndex];
    const expected = expectedFollowupQuiz(quizRepair);
    if (
      deepEqual(section?.quiz, expected) &&
      section.contentMarkdown === expectedQuizMarkdown(expected, quizRepair.locale)
    ) {
      const base = readBasePackage(relativePath).sections[quizRepair.sectionIndex];
      section.quiz = structuredClone(base.quiz);
      section.contentMarkdown = base.contentMarkdown;
    }
    return;
  }
  const boldRepair = B021_BOLD_REPAIRS.find(
    (repair) => runtimeToRecovered(followupRuntimePath(repair)) === relativePath,
  );
  if (boldRepair && deepEqual(pkg, readFollowupBase(followupRuntimePath(boldRepair)))) {
    const baseMission = readBasePackage(relativePath).sections[7].mission!;
    const mission = pkg.sections[7].mission!;
    if (boldRepair.field === "intro") mission.intro = baseMission.intro;
    else mission.rubric[1].criteria = baseMission.rubric[1].criteria;
  }
}

const EXPECTED_RECOVERED = new Set([
  ...APPROVED_RECOVERED,
  ...B021_ADDITIONAL_RECOVERED,
  ...B021_FOLLOWUP_RECOVERED,
]);
const EXPECTED_RUNTIME = new Set([
  ...APPROVED_RUNTIME,
  ...B021_ADDITIONAL_RUNTIME,
  ...B021_FOLLOWUP_RUNTIME,
]);

function buildBasePackageCache(): Map<string, LocalizedLessonPackage> {
  const cache = new Map<string, LocalizedLessonPackage>();
  for (const relativePath of [...EXPECTED_RECOVERED].sort()) {
    const raw = execSync(`git show ${BASE_SHA}:${relativePath}`, {
      cwd: REPO_ROOT,
      encoding: "utf8",
    });
    cache.set(relativePath, structuredClone(JSON.parse(raw) as LocalizedLessonPackage));
  }
  return cache;
}

const BASE_PACKAGE_CACHE = buildBasePackageCache();

const PRODUCTION_RESIDUE_PATTERNS = [
  /remains unchanged/i,
  /Egyptian production/i,
  /visual original in production/i,
  /visual source from the Egyptian production/i,
  /visual source in production/i,
  /original visual from the Egyptian production/i,
  /visual original from the Egyptian production/i,
  /visual original in Egyptian production/i,
];

const EGYPTIAN_FALLBACK_PATTERNS = [
  "الإجابة الصحيحة محفوظة من الإنتاج المصري",
  "راجع النص أعلاه للسياق الكامل",
];

const GENERIC_QUIZ_PATTERNS = [
  "ما الخيار الأنسب وفقًا لما ورد في القسم أعلاه؟",
  "What is the best option according to what was stated above?",
  "Which option best matches what was stated above?",
];

const PLACEHOLDER_DISTRACTOR_PATTERNS = [
  "Option A placeholder",
  "Option B placeholder",
  "Option C placeholder",
  "Distractor placeholder",
];

const B019_DASHBOARD_LESSON_ID = "analyst-m4-automated-dashboard";
const B019_DASHBOARD_MISSION_BY_LOCALE: Record<LessonPackageLocale, LocalizedLessonMission> = {
  "ar-MSA": {
    intro:
      "صمّم أتمتة لرقم واحد. لا يلزم بناء النظام كاملًا؛ اختر الرقم، وحدّد مصدره، وتكرار تحديثه، ومكان تخزينه، وما الذي يلخّصه الذكاء الاصطناعي بعد وصوله. تكفي ١٠–٢٠ دقيقة.",
    delivery: [
      "في تسليمك، اكتب:\n\n١) الرقم الواحد ولماذا اخترته.\n٢) مصدر الرقم (نموذج، نظام نقاط بيع، جدول بيانات، أو API).\n٣) تكرار التحديث (يومي، أسبوعي، أو لحظي).\n٤) مكان التخزين (Google Sheets، Notion، أو غيرهما).\n٥) ما الذي سيلخّصه الذكاء الاصطناعي بعد وصول الرقم (سؤال أو طلب واحد).",
    ],
    rubric: [
      {
        dimension: "رقم + مصدر",
        weight: 50,
        criteria: "رقم واحد واضح + مصدر محدد.",
      },
      {
        dimension: "تخزين + AI",
        weight: 50,
        criteria: "تكرار تحديث + تخزين + سؤال أو تلخيص عملي للذكاء الاصطناعي.",
      },
    ],
    yamlIntent: "Design automation for one metric: source, frequency, storage, AI summary",
    yamlType: "practice",
  },
  "ar-Gulf": {
    intro:
      "صمّم أتمتة لرقم واحد. مو لازم تبني النظام كامل؛ اختر الرقم، وحدّد مصدره، وتكرار تحديثه، ومكان تخزينه، ووش يلخّص الذكاء الاصطناعي بعد ما يوصل. تكفي ١٠–٢٠ دقيقة.",
    delivery: [
      "في تسليمك، اكتب:\n\n١) الرقم الواحد وليش اخترته.\n٢) مصدر الرقم (نموذج، كاشير، Sheet، أو API).\n٣) تكرار التحديث (يومي، أسبوعي، أو لحظي).\n٤) مكان التخزين (Google Sheets، Notion، أو غيرها).\n٥) وش يلخّص الذكاء الاصطناعي بعد ما يوصل الرقم (سؤال أو طلب واحد).",
    ],
    rubric: [
      {
        dimension: "رقم + مصدر",
        weight: 50,
        criteria: "رقم واحد واضح + مصدر محدد.",
      },
      {
        dimension: "تخزين + AI",
        weight: 50,
        criteria: "تكرار تحديث + تخزين + سؤال أو تلخيص عملي للذكاء الاصطناعي.",
      },
    ],
    yamlIntent: "Design automation for one metric: source, frequency, storage, AI summary",
    yamlType: "practice",
  },
  en: {
    intro:
      "Design the automation for one metric. You do not need to build the full system. Choose the metric and define its source, update frequency, storage, and what AI should summarize after the number arrives. Allow 10–20 minutes.",
    delivery: [
      "In your submission, write:\n\n1) The one metric and why you chose it.\n2) The metric source (form, point-of-sale system, spreadsheet, or API).\n3) The update frequency (daily, weekly, or real time).\n4) The storage location (Google Sheets, Notion, or another tool).\n5) What AI should summarize after the metric arrives (one question or prompt).",
    ],
    rubric: [
      {
        dimension: "Metric + Source",
        weight: 50,
        criteria: "One clear metric + a specific source.",
      },
      {
        dimension: "Storage + AI",
        weight: 50,
        criteria: "Update frequency + storage + a practical AI question or summary.",
      },
    ],
    yamlIntent: "Design automation for one metric: source, frequency, storage, AI summary",
    yamlType: "practice",
  },
};
const B019_DASHBOARD_PRE_MISSION_MARKDOWN_BY_LOCALE: Record<LessonPackageLocale, string> = {
  "ar-MSA": "| رقم + مصدر | 50% |\n| تخزين + AI | 50% |",
  "ar-Gulf": "| رقم + مصدر | 50% |\n| تخزين + AI | 50% |",
  en: "| Number + Source | 50% |\n| Storage + AI | 50% |",
};
const B019_DASHBOARD_MISSION_MARKDOWN_BY_LOCALE: Record<LessonPackageLocale, string> = {
  "ar-MSA":
    "صمّم أتمتة لرقم واحد. لا يلزم بناء النظام كاملًا؛ اختر الرقم، وحدّد مصدره، وتكرار تحديثه، ومكان تخزينه، وما الذي يلخّصه الذكاء الاصطناعي بعد وصوله. تكفي ١٠–٢٠ دقيقة.\n\n**التسليم:**\n\nفي تسليمك، اكتب:\n\n١) الرقم الواحد ولماذا اخترته.\n٢) مصدر الرقم (نموذج، نظام نقاط بيع، جدول بيانات، أو API).\n٣) تكرار التحديث (يومي، أسبوعي، أو لحظي).\n٤) مكان التخزين (Google Sheets، Notion، أو غيرهما).\n٥) ما الذي سيلخّصه الذكاء الاصطناعي بعد وصول الرقم (سؤال أو طلب واحد).\n\n| رقم + مصدر | 50% |\n| تخزين + AI | 50% |",
  "ar-Gulf":
    "صمّم أتمتة لرقم واحد. مو لازم تبني النظام كامل؛ اختر الرقم، وحدّد مصدره، وتكرار تحديثه، ومكان تخزينه، ووش يلخّص الذكاء الاصطناعي بعد ما يوصل. تكفي ١٠–٢٠ دقيقة.\n\n**التسليم:**\n\nفي تسليمك، اكتب:\n\n١) الرقم الواحد وليش اخترته.\n٢) مصدر الرقم (نموذج، كاشير، Sheet، أو API).\n٣) تكرار التحديث (يومي، أسبوعي، أو لحظي).\n٤) مكان التخزين (Google Sheets، Notion، أو غيرها).\n٥) وش يلخّص الذكاء الاصطناعي بعد ما يوصل الرقم (سؤال أو طلب واحد).\n\n| رقم + مصدر | 50% |\n| تخزين + AI | 50% |",
  en: "Design the automation for one metric. You do not need to build the full system. Choose the metric and define its source, update frequency, storage, and what AI should summarize after the number arrives. Allow 10–20 minutes.\n\nIn your submission, write:\n\n1) The one metric and why you chose it.\n2) The metric source (form, point-of-sale system, spreadsheet, or API).\n3) The update frequency (daily, weekly, or real time).\n4) The storage location (Google Sheets, Notion, or another tool).\n5) What AI should summarize after the metric arrives (one question or prompt).\n\n| Number + Source | 50% |\n| Storage + AI | 50% |",
};

function readPackage(relativePath: string): LocalizedLessonPackage {
  return JSON.parse(
    readFileSync(path.join(REPO_ROOT, relativePath), "utf8"),
  ) as LocalizedLessonPackage;
}

function normalizeExactB021AcceptedFields(pkg: LocalizedLessonPackage, relativePath: string): void {
  const questionMistakes = B021_ACCEPTED_AR_MSA_FIELDS[0];
  if (relativePath === questionMistakes.recoveredPath) {
    const bullets = pkg.sections[questionMistakes.sectionIndex]?.bullets;
    if (bullets?.[questionMistakes.itemIndex] === questionMistakes.accepted) {
      bullets[questionMistakes.itemIndex] = questionMistakes.stale;
    }
    return;
  }

  const whyContent = B021_ACCEPTED_AR_MSA_FIELDS[1];
  if (relativePath === whyContent.recoveredPath) {
    const section = pkg.sections[whyContent.sectionIndex];
    if (section?.subtitle === whyContent.accepted) {
      section.subtitle = whyContent.stale;
    }
  }
}

function readBasePackage(relativePath: string): LocalizedLessonPackage {
  const cached = BASE_PACKAGE_CACHE.get(relativePath);
  if (!cached) {
    throw new Error(`Base package not cached for parity check: ${relativePath}`);
  }
  return structuredClone(cached);
}

function normalizeExactB019DashboardMission(
  pkg: LocalizedLessonPackage,
  record: ScientificCorrectionRecord,
): void {
  if (record.lessonId !== B019_DASHBOARD_LESSON_ID) return;
  const locale = record.locale as LessonPackageLocale;
  const missionSection = pkg.sections[4];
  if (
    missionSection?.role === "Mission" &&
    deepEqual(missionSection.mission, B019_DASHBOARD_MISSION_BY_LOCALE[locale]) &&
    missionSection.contentMarkdown === B019_DASHBOARD_MISSION_MARKDOWN_BY_LOCALE[locale]
  ) {
    delete missionSection.mission;
    missionSection.contentMarkdown = B019_DASHBOARD_PRE_MISSION_MARKDOWN_BY_LOCALE[locale];
  }
}

function stripApprovedFields(
  pkg: LocalizedLessonPackage,
  records: ScientificCorrectionRecord[],
  relativePath: string,
): LocalizedLessonPackage {
  const clone = structuredClone(pkg);
  normalizeExactB021AcceptedFields(clone, relativePath);
  normalizeExactB021FollowupFields(clone, relativePath);
  for (const record of records) {
    normalizeExactB019DashboardMission(clone, record);
    const section = clone.sections[record.sectionIndex] as unknown as Record<string, unknown>;
    if (record.approvedReplacementQuiz) {
      delete section.quiz;
    }
    delete section.contentMarkdown;
  }
  return clone;
}

function quizMarkdownMatchesQuizObject(
  contentMarkdown: string,
  quiz: NonNullable<ScientificCorrectionRecord["approvedReplacementQuiz"]>,
): boolean {
  return (
    contentMarkdown.includes(quiz.question) &&
    quiz.options.every((option) => contentMarkdown.includes(option)) &&
    contentMarkdown.includes(quiz.explanation)
  );
}

function runtimeToRecovered(runtimePath: string): string {
  const match = runtimePath.match(/^src\/lib\/locale-lessons\/(ar-MSA|ar-Gulf|en)\/lessons\/(.+)$/);
  if (!match) throw new Error(`Bad runtime path: ${runtimePath}`);
  return `src/lib/locale-lessons/ar-MSA/reports/phase13b-recovered-packages/${match[1]}/${match[2]}`;
}

function recoveredToRuntime(recoveredPath: string): string {
  const match = recoveredPath.match(
    /^src\/lib\/locale-lessons\/ar-MSA\/reports\/phase13b-recovered-packages\/(ar-MSA|ar-Gulf|en)\/(.+)$/,
  );
  if (!match) throw new Error(`Bad recovered path: ${recoveredPath}`);
  return `src/lib/locale-lessons/${match[1]}/lessons/${match[2]}`;
}

describe("scientific curriculum corrections (Agent 4 reconciled final)", () => {
  it.each(B021_QUIZ_REPAIRS)(
    "repairs only the exact $locale/$lessonId quiz fields using the existing override",
    async (repair) => {
      const runtimePath = followupRuntimePath(repair);
      expect(
        execSync("git rev-parse " + B021_FOLLOWUP_BASE_SHA + ":" + runtimePath, {
          cwd: REPO_ROOT,
          encoding: "utf8",
        }).trim(),
      ).toBe(repair.baselineBlob);
      const baseline = readFollowupBase(runtimePath);
      const runtime = readPackage(runtimePath);
      const recoveredPath = runtimeToRecovered(runtimePath);
      const recovered = readPackage(recoveredPath);
      const expected = expectedFollowupQuiz(repair);
      const section = runtime.sections[repair.sectionIndex];
      expect(section.quiz).toEqual(expected);
      expect(new Set(expected.options).size).toBe(4);
      expect(expected.correctIndex).toBe(1);
      expect(section.contentMarkdown).toBe(expectedQuizMarkdown(expected, repair.locale));
      expect(section.contentMarkdown).not.toMatch(/correctIndex|مفتاح الاختبار/);
      expect(recovered).toEqual(runtime);
      const source = readPackage(
        "src/lib/locale-lessons/ar-MSA/lessons/" + repair.lessonId + ".json",
      );
      const resolved = resolveSourceQuizStructure(
        source.sections.find((s) => s.role === "Quiz"),
        repair.lessonId,
      );
      if (!resolved.ok) throw new Error("Missing existing source override");
      expect(resolved.structure.usesOverride).toBe(true);
      expect(
        detectQuizStructureDriftWarnings(
          repair.lessonId,
          resolved.structure,
          section.quiz!.options,
          section.quiz!.correctIndex,
        ),
      ).toEqual([]);
      const liveQuiz = adaptPackageQuizzesFromSections(runtime.lessonId, runtime.sections)[0];
      expect(liveQuiz.correctIndex).toBe(1);
      expect(liveQuiz.options).toEqual(expected.options);
      const restored = structuredClone(runtime);
      restored.sections[repair.sectionIndex].quiz = baseline.sections[repair.sectionIndex].quiz;
      restored.sections[repair.sectionIndex].contentMarkdown =
        baseline.sections[repair.sectionIndex].contentMarkdown;
      expect(restored).toEqual(baseline);
      expect((await validateFinalLessonFile(path.join(REPO_ROOT, runtimePath))).ok).toBe(true);
      expect((await validateFinalLessonFile(path.join(REPO_ROOT, recoveredPath))).ok).toBe(true);
    },
  );

  it.each(B021_BOLD_REPAIRS)(
    "preserves accepted dc49 $lessonId bold repair and synchronizes its mirror",
    async (repair) => {
      const runtimePath = followupRuntimePath(repair);
      const accepted = readFollowupBase(runtimePath);
      const old = JSON.parse(
        execSync("git show " + "b471bbdfe54c5a3ad06c61d02745026a9395f338:" + runtimePath, {
          cwd: REPO_ROOT,
          encoding: "utf8",
        }),
      ) as LocalizedLessonPackage;
      const beforeMission = old.sections[7].mission!;
      const afterMission = accepted.sections[7].mission!;
      if (repair.field === "intro") {
        expect(afterMission.intro).toBe(beforeMission.intro + "**");
        beforeMission.intro = afterMission.intro;
      } else {
        expect(afterMission.rubric[1].criteria).toBe(beforeMission.rubric[1].criteria + "**");
        beforeMission.rubric[1].criteria = afterMission.rubric[1].criteria;
      }
      expect(old).toEqual(accepted);
      const recoveredPath = runtimeToRecovered(runtimePath);
      expect(readPackage(runtimePath)).toEqual(accepted);
      expect(readPackage(recoveredPath)).toEqual(accepted);
      expect((await validateFinalLessonFile(path.join(REPO_ROOT, recoveredPath))).ok).toBe(true);
    },
  );

  it("validates exact B021 accepted localization fields and provenance before normalization", () => {
    expect(() =>
      execSync("git merge-base --is-ancestor " + B021_ACCEPTED_LOCALIZATION_COMMIT + " HEAD", {
        cwd: REPO_ROOT,
        encoding: "utf8",
      }),
    ).not.toThrow();

    for (const repair of B021_ACCEPTED_AR_MSA_FIELDS) {
      expect(
        execSync("git rev-parse HEAD:" + repair.runtimePath, {
          cwd: REPO_ROOT,
          encoding: "utf8",
        }).trim(),
      ).toBe(repair.runtimeBlob);

      const runtime = readPackage(repair.runtimePath);
      const recovered = readPackage(repair.recoveredPath);
      if (repair.field === "bullet") {
        expect(runtime.sections[repair.sectionIndex]?.bullets[repair.itemIndex]).toBe(
          repair.accepted,
        );
        expect(recovered.sections[repair.sectionIndex]?.bullets[repair.itemIndex]).toBe(
          repair.accepted,
        );
      } else {
        expect(runtime.sections[repair.sectionIndex]?.subtitle).toBe(repair.accepted);
        expect(recovered.sections[repair.sectionIndex]?.subtitle).toBe(repair.accepted);
      }
      expect(recovered).toEqual(runtime);
    }
  });

  it("validates the exact B019 dashboard mission allowance before normalization", () => {
    const records = MANIFEST.filter((record) => record.lessonId === B019_DASHBOARD_LESSON_ID);
    expect(records).toHaveLength(3);
    expect(new Set(records.map((record) => record.locale))).toEqual(
      new Set<LessonPackageLocale>(["ar-MSA", "ar-Gulf", "en"]),
    );

    for (const record of records) {
      const expected = B019_DASHBOARD_MISSION_BY_LOCALE[record.locale as LessonPackageLocale];
      const recovered = readPackage(record.recoveredPackagePath);
      const runtime = readPackage(record.runtimePackagePath);
      expect(recovered.sections[4]?.role).toBe("Mission");
      expect(recovered.sections[4]?.mission).toEqual(expected);
      expect(recovered.sections[4]?.contentMarkdown).toBe(
        B019_DASHBOARD_MISSION_MARKDOWN_BY_LOCALE[record.locale as LessonPackageLocale],
      );
      expect(runtime.sections[4]).toEqual(recovered.sections[4]);
    }
  });

  it("manifest contains exactly 40 records and 39 unique packages", () => {
    assertManifestInvariants(MANIFEST);
    expect(MANIFEST).toHaveLength(40);
    expect(new Set(MANIFEST.map((r) => `${r.locale}/${r.lessonId}`)).size).toBe(39);
    for (const record of MANIFEST) {
      expect(AG4_ISSUE_ID_PATTERN.test(record.issueId)).toBe(true);
      expect(record.RAGReindexRequired).toBe(true);
      expect(record.VideoRegenerationRequired).toBe(false);
    }
  });

  it("applies exact approved values to recovered and runtime packages", () => {
    for (const record of MANIFEST) {
      const recovered = readPackage(record.recoveredPackagePath);
      const runtime = readPackage(record.runtimePackagePath);
      const recoveredSection = recovered.sections[record.sectionIndex];
      const runtimeSection = runtime.sections[record.sectionIndex];

      expect(recoveredSection.contentMarkdown).toBe(record.approvedReplacementContentMarkdown);
      expect(runtimeSection.contentMarkdown).toBe(record.approvedReplacementContentMarkdown);

      if (record.approvedReplacementQuiz) {
        expect(recoveredSection.quiz).toEqual(record.approvedReplacementQuiz);
        expect(runtimeSection.quiz).toEqual(record.approvedReplacementQuiz);
        expect(
          quizMarkdownMatchesQuizObject(
            recoveredSection.contentMarkdown ?? "",
            record.approvedReplacementQuiz,
          ),
        ).toBe(true);
      }
    }
  });

  it("keeps every bullets field at exact base SHA values on approved packages", () => {
    for (const [packagePath, beforePkg] of Object.entries(BEFORE_STATE)) {
      const current = readPackage(packagePath);
      normalizeExactB021AcceptedFields(current, packagePath);
      for (let index = 0; index < beforePkg.sections.length; index++) {
        expect(current.sections[index]?.bullets ?? []).toEqual(
          beforePkg.sections[index]?.bullets ?? [],
        );
      }
    }
  });

  it("retains 39 historical runtime packages plus the exact accepted B021 additions", () => {
    const changedRuntime = execSync(
      `git diff --name-only ${BASE_SHA} -- src/lib/locale-lessons/ar-MSA/lessons src/lib/locale-lessons/ar-Gulf/lessons src/lib/locale-lessons/en/lessons`,
      { cwd: REPO_ROOT, encoding: "utf8" },
    )
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => line.replace(/\\/g, "/"))
      .sort();

    expect(APPROVED_RUNTIME.size).toBe(39);
    expect(B021_ADDITIONAL_RUNTIME.size).toBe(1);
    expect(B021_FOLLOWUP_RUNTIME.size).toBe(6);
    expect(changedRuntime).toHaveLength(EXPECTED_RUNTIME.size);
    expect(new Set(changedRuntime)).toEqual(EXPECTED_RUNTIME);
  }, 30_000);

  it("keeps recovered/runtime equivalence for all affected packages", () => {
    const packagePaths = [...new Set(MANIFEST.map((r) => r.recoveredPackagePath))];
    for (const packagePath of packagePaths) {
      const recovered = readPackage(packagePath);
      const sample = MANIFEST.find((r) => r.recoveredPackagePath === packagePath)!;
      const runtimePkg = readPackage(sample.runtimePackagePath);
      expect(deepEqual(recovered, runtimePkg)).toBe(true);
    }
  });

  it("preserves every unlisted field against base SHA on approved packages", () => {
    const recordsByPackage = new Map<string, ScientificCorrectionRecord[]>();
    for (const record of MANIFEST) {
      const list = recordsByPackage.get(record.recoveredPackagePath) ?? [];
      list.push(record);
      recordsByPackage.set(record.recoveredPackagePath, list);
    }

    for (const [packagePath, records] of recordsByPackage) {
      const base = readBasePackage(packagePath);
      const current = readPackage(packagePath);
      expect(stripApprovedFields(current, records, packagePath)).toEqual(
        stripApprovedFields(base, records, packagePath),
      );
    }
  });

  it("retains 39 historical recovered packages plus the exact accepted B021 additions", () => {
    const changedRecovered = execSync(
      `git diff --name-only ${BASE_SHA} -- src/lib/locale-lessons/ar-MSA/reports/phase13b-recovered-packages`,
      { cwd: REPO_ROOT, encoding: "utf8" },
    )
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => line.replace(/\\/g, "/"))
      .sort();

    expect(APPROVED_RECOVERED.size).toBe(39);
    expect(B021_ADDITIONAL_RECOVERED.size).toBe(1);
    expect(B021_FOLLOWUP_RECOVERED.size).toBe(6);
    expect(changedRecovered).toHaveLength(EXPECTED_RECOVERED.size);
    expect(new Set(changedRecovered)).toEqual(EXPECTED_RECOVERED);

    for (const recoveredPath of changedRecovered) {
      const runtimePath = recoveredToRuntime(recoveredPath);
      expect(EXPECTED_RUNTIME.has(runtimePath)).toBe(true);
      const records = MANIFEST.filter((r) => r.recoveredPackagePath === recoveredPath);
      const base = readBasePackage(recoveredPath);
      const current = readPackage(recoveredPath);
      expect(stripApprovedFields(current, records, recoveredPath)).toEqual(
        stripApprovedFields(base, records, recoveredPath),
      );
      expect(readPackage(runtimePath)).toEqual(current);
    }
  });

  it("validates all 22 corrected quizzes structurally and semantically", () => {
    const quizRecords = MANIFEST.filter((r) => r.approvedReplacementQuiz);
    expect(quizRecords).toHaveLength(22);

    for (const record of quizRecords) {
      const quiz = record.approvedReplacementQuiz!;
      expect(new Set(quiz.options).size).toBe(3);
      expect(quiz.correctIndex).toBeGreaterThanOrEqual(0);
      expect(quiz.correctIndex).toBeLessThan(3);
      expect(GENERIC_QUIZ_PATTERNS.some((p) => quiz.question.includes(p))).toBe(false);
      expect(PLACEHOLDER_DISTRACTOR_PATTERNS.some((p) => quiz.options.join(" ").includes(p))).toBe(
        false,
      );
      if (record.locale === "ar-MSA") {
        expect(EGYPTIAN_FALLBACK_PATTERNS.some((p) => quiz.explanation.includes(p))).toBe(false);
      }
    }
  });

  it("removes production residue from all 18 corrected English visuals", () => {
    const visualRecords = MANIFEST.filter((r) => !r.approvedReplacementQuiz);
    expect(visualRecords).toHaveLength(18);

    for (const record of visualRecords) {
      const pkg = readPackage(record.runtimePackagePath);
      const markdown = pkg.sections[record.sectionIndex].contentMarkdown ?? "";
      expect(markdown).toBe(record.approvedReplacementContentMarkdown);
      for (const pattern of PRODUCTION_RESIDUE_PATTERNS) {
        expect(pattern.test(markdown)).toBe(false);
      }
    }
  });

  it("accepts all 300 package quiz adapters structurally", () => {
    const locales = ["ar-MSA", "ar-Gulf", "en"] as const;
    for (const locale of locales) {
      const dir = path.join(REPO_ROOT, "src/lib/locale-lessons", locale, "lessons");
      const entries = readdirSync(dir).filter((file) => file.endsWith(".json"));
      for (const file of entries) {
        const pkg = readPackage(`src/lib/locale-lessons/${locale}/lessons/${file}`);
        expect(() => adaptPackageQuizzesFromSections(pkg.lessonId, pkg.sections)).not.toThrow();
      }
    }
  });

  it("passes recovered/runtime equivalence for full corpus (300/300)", async () => {
    const equivalence = await validateRecoveredRuntimeEquivalence();
    expect(equivalence.ok).toBe(true);
    expect(equivalence.packagesChecked).toBe(300);
    expect(equivalence.mismatches).toEqual([]);
  }, 120_000);

  it("requires promotion idempotence (second run writes 0 files)", async () => {
    const isolated = await runIsolatedPromotionIdempotence();

    expect(isolated.firstPromotion.packagesPromoted).toBe(REQUIRED_LESSON_COUNT * 3);
    expect(isolated.firstPromotion.filesWritten).toBe(REQUIRED_LESSON_COUNT * 3);
    expect(isolated.equivalence.ok).toBe(true);
    expect(isolated.equivalence.packagesChecked).toBe(REQUIRED_LESSON_COUNT * 3);
    expect(isolated.equivalence.mismatches).toEqual([]);
    expect(isolated.secondPromotion.filesWritten).toBe(0);
  }, 120_000);

  it("passes Phase 13B audit and validation gates", async () => {
    const validation = await validateAllRecoveredPackages();
    expect(validation.ok).toBe(true);
    expect(validation.mergeBlocked).toBe(false);
    expect(validation.validationErrors).toEqual([]);
    expect(validation.blockedMissingGulfQuiz).toEqual([]);

    const audit = await auditAllRecoveredPackages();
    const errors = audit.issues.filter((issue) => issue.severity === "error");
    expect(errors).toEqual([]);
  }, 120_000);
});

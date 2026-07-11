import { execSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  adaptPackageQuizzesFromSections,
} from "@/lib/locale-lessons/adapt-package-to-live-quiz";
import type { LocalizedLessonPackage } from "@/lib/locale-lessons/types";
import {
  AG4_ISSUE_ID_PATTERN,
  assertManifestInvariants,
  type ScientificCorrectionRecord,
} from "@/lib/locale-lessons/scientific-curriculum-corrections-manifest";
import { deepEqual } from "../../../scripts/locale-lessons/lib/phase13b-semantic-diff.ts";
import {
  promoteRecoveredToRuntime,
  validateRecoveredRuntimeEquivalence,
} from "../../../scripts/locale-lessons/lib/promote-phase13b-recovered-packages-core.ts";
import {
  auditAllRecoveredPackages,
  validateAllRecoveredPackages,
} from "../../../scripts/locale-lessons/repair-phase13b-recovered-packages.ts";
import { REQUIRED_LESSON_COUNT } from "@/lib/locale-lessons/types";

const REPO_ROOT = path.resolve(import.meta.dirname, "../../..");
const FIXTURES = path.join(REPO_ROOT, "src/lib/__tests__/fixtures");
const BASE_SHA = "1a02f55c19d555c5f1e23642753828e6491fd4c3";

const MANIFEST = JSON.parse(
  readFileSync(
    path.join(FIXTURES, "scientific-curriculum-corrections-manifest.json"),
    "utf8",
  ),
) as ScientificCorrectionRecord[];

const BEFORE_STATE = JSON.parse(
  readFileSync(
    path.join(FIXTURES, "scientific-curriculum-corrections-before-state.json"),
    "utf8",
  ),
) as Record<string, LocalizedLessonPackage>;

const APPROVED_RECOVERED = new Set(MANIFEST.map((r) => r.recoveredPackagePath));
const APPROVED_RUNTIME = new Set(MANIFEST.map((r) => r.runtimePackagePath));

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

function readPackage(relativePath: string): LocalizedLessonPackage {
  return JSON.parse(
    readFileSync(path.join(REPO_ROOT, relativePath), "utf8"),
  ) as LocalizedLessonPackage;
}

function readBasePackage(relativePath: string): LocalizedLessonPackage {
  const raw = execSync(`git show ${BASE_SHA}:${relativePath}`, {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
  return JSON.parse(raw) as LocalizedLessonPackage;
}

function stripApprovedFields(
  pkg: LocalizedLessonPackage,
  records: ScientificCorrectionRecord[],
): LocalizedLessonPackage {
  const clone = structuredClone(pkg);
  for (const record of records) {
    const section = clone.sections[record.sectionIndex] as unknown as Record<
      string,
      unknown
    >;
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
  const match = runtimePath.match(
    /^src\/lib\/locale-lessons\/(ar-MSA|ar-Gulf|en)\/lessons\/(.+)$/,
  );
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
      for (let index = 0; index < beforePkg.sections.length; index++) {
        expect(current.sections[index]?.bullets ?? []).toEqual(
          beforePkg.sections[index]?.bullets ?? [],
        );
      }
    }
  });

  it(
    "leaves every non-approved runtime package identical to base SHA",
    () => {
      const changedRuntime = execSync(
        `git diff --name-only ${BASE_SHA} HEAD -- src/lib/locale-lessons/ar-MSA/lessons src/lib/locale-lessons/ar-Gulf/lessons src/lib/locale-lessons/en/lessons`,
        { cwd: REPO_ROOT, encoding: "utf8" },
      )
        .trim()
        .split("\n")
        .filter(Boolean)
        .map((line) => line.replace(/\\/g, "/"))
        .sort();

      expect(changedRuntime).toHaveLength(APPROVED_RUNTIME.size);
      expect(new Set(changedRuntime)).toEqual(APPROVED_RUNTIME);
    },
    30_000,
  );

  it("keeps recovered/runtime equivalence for all affected packages", () => {
    const packagePaths = [...new Set(MANIFEST.map((r) => r.recoveredPackagePath))];
    for (const packagePath of packagePaths) {
      const recovered = readPackage(packagePath);
      const sample = MANIFEST.find((r) => r.recoveredPackagePath === packagePath)!;
      const runtimePkg = readPackage(sample.runtimePackagePath);
      expect(deepEqual(recovered, runtimePkg)).toBe(true);
    }
  });

  it(
    "preserves every unlisted field against base SHA on approved packages",
    () => {
      const recordsByPackage = new Map<string, ScientificCorrectionRecord[]>();
      for (const record of MANIFEST) {
        const list = recordsByPackage.get(record.recoveredPackagePath) ?? [];
        list.push(record);
        recordsByPackage.set(record.recoveredPackagePath, list);
      }

      for (const [packagePath, records] of recordsByPackage) {
        const base = readBasePackage(packagePath);
        const current = readPackage(packagePath);
        expect(stripApprovedFields(current, records)).toEqual(
          stripApprovedFields(base, records),
        );
      }
    },
    60_000,
  );

  it(
    "changes only the 39 approved packages versus base SHA",
    () => {
      const changedRecovered = execSync(
        `git diff --name-only ${BASE_SHA} HEAD -- src/lib/locale-lessons/ar-MSA/reports/phase13b-recovered-packages`,
        { cwd: REPO_ROOT, encoding: "utf8" },
      )
        .trim()
        .split("\n")
        .filter(Boolean)
        .map((line) => line.replace(/\\/g, "/"))
        .sort();

      expect(changedRecovered).toHaveLength(APPROVED_RECOVERED.size);
      expect(new Set(changedRecovered)).toEqual(APPROVED_RECOVERED);

      for (const recoveredPath of changedRecovered) {
        const runtimePath = recoveredToRuntime(recoveredPath);
        expect(APPROVED_RUNTIME.has(runtimePath)).toBe(true);
        const records = MANIFEST.filter((r) => r.recoveredPackagePath === recoveredPath);
        const base = readBasePackage(recoveredPath);
        const current = readPackage(recoveredPath);
        expect(stripApprovedFields(current, records)).toEqual(stripApprovedFields(base, records));
        expect(readPackage(runtimePath)).toEqual(current);
      }
    },
    60_000,
  );

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
        expect(
          EGYPTIAN_FALLBACK_PATTERNS.some((p) => quiz.explanation.includes(p)),
        ).toBe(false);
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
    const second = await promoteRecoveredToRuntime();
    expect(second.filesWritten).toBe(0);
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

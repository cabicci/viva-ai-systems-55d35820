import { describe, expect, it } from "vitest";
import { execSync } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import type {
  AdaptedLessonPackage,
  LocalizedLessonPackage,
  LocalizedLessonSection,
} from "../locale-lessons/types";
import {
  auditRecoveredPackage,
  deriveMissionDelivery,
  hasMalformedMarkdownPeriodArtifact,
  reconstructMissingQuizSection,
  repairRecoveredPackage,
  repairTableFromMarkdown,
  stripMalformedMarkdownPeriodArtifacts,
} from "../../../scripts/locale-lessons/lib/phase13b-merge-readiness";
import { deepEqual as semanticDeepEqual } from "../../../scripts/locale-lessons/lib/phase13b-semantic-diff";
import {
  auditAllRecoveredPackages,
  repairAllRecoveredPackages,
  validateAllRecoveredPackages,
} from "../../../scripts/locale-lessons/repair-phase13b-recovered-packages";

const REPO_ROOT = path.resolve(import.meta.dirname, "../../..");
const RECOVERED_EN = path.join(
  REPO_ROOT,
  "src/lib/locale-lessons/ar-MSA/reports/phase13b-recovered-packages/en",
);
const MSA_LESSONS = path.join(REPO_ROOT, "src/lib/locale-lessons/ar-MSA/lessons");

async function loadJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
}

function glossaryTableSection(): LocalizedLessonSection {
  return {
    role: "Glossary",
    heading: "Glossary",
    contentMarkdown:
      "| Term | Meaning | Example |\n|---------|--------|------|\n| **Table** | **Rows and columns** | **Columns: name \\| email \\| last visit** |",
    bullets: [],
    tables: [
      {
        headers: ["Term", "Meaning", "Example"],
        rows: [
          [
            "**Table**",
            "**Rows and columns**",
            "**Columns: name \\",
            "email \\",
            "last visit**",
          ],
        ],
      },
    ],
  };
}

describe("phase13b merge-readiness table repair", () => {
  it("repairs escaped-pipe row split to match header count", () => {
    const section = glossaryTableSection();
    const repaired = repairTableFromMarkdown(
      section.tables[0],
      section.contentMarkdown,
      0,
    );
    expect(repaired.rows).toHaveLength(1);
    expect(repaired.rows[0]).toHaveLength(3);
    expect(repaired.rows[0][2]).toContain("email");
    expect(repaired.rows[0][2]).toContain("last visit");
  });
});

describe("phase13b merge-readiness quiz artifacts", () => {
  it("detects and strips **.** markdown artifacts", () => {
    expect(hasMalformedMarkdownPeriodArtifact("running**.**")).toBe(true);
    expect(stripMalformedMarkdownPeriodArtifacts("running**.**")).toBe("running.");
  });
});

describe("phase13b merge-readiness mission delivery", () => {
  it("derives delivery lines from numbered markdown block", () => {
    const section: LocalizedLessonSection = {
      role: "Mission",
      heading: "Mission",
      contentMarkdown:
        "**Introduction:** Draw 3 screens.\n\n**Submission:**\n\n1. Screen one template\n2. Screen two template\n\n**Evaluation Criteria:**\n\n| Dim | Weight | Criteria |",
      bullets: [],
      tables: [],
      mission: {
        intro: "Draw 3 screens.",
        delivery: [],
        rubric: [],
        yamlIntent: "wireframe",
        yamlType: "practice",
      },
    };
    const sourceSection: LocalizedLessonSection = {
      ...section,
      mission: { ...section.mission!, delivery: [] },
    };
    expect(deriveMissionDelivery(section, sourceSection)).toEqual([
      "Screen one template",
      "Screen two template",
    ]);
  });
});

describe("phase13b known defect packages", () => {
  it("passes audit for en/builder-m5-l4-database-intro after repair", async () => {
    const lessonId = "builder-m5-l4-database-intro";
    const source = await loadJson<LocalizedLessonPackage>(
      path.join(MSA_LESSONS, `${lessonId}.json`),
    );
    const pkg = await loadJson<AdaptedLessonPackage>(
      path.join(RECOVERED_EN, `${lessonId}.json`),
    );

    const repaired = repairRecoveredPackage(source, pkg);
    const glossary = repaired.sections.find((s) => s.role === "Glossary");
    const table = glossary?.tables[0];
    expect(table?.rows.every((row) => row.length === table.headers.length)).toBe(true);

    const quiz = repaired.sections.find((s) => s.role === "Quiz")?.quiz;
    expect(quiz?.options[2]).not.toMatch(/correct answer/i);
    expect(quiz?.options.some((o) => o.includes("**.**"))).toBe(false);

    const after = auditRecoveredPackage(source, repaired);
    const errors = after.filter((i) => i.severity === "error");
    expect(errors.filter((e) => e.lessonId === lessonId)).toEqual([]);
  });

  it("repairs en/builder-m6-l2-wireframe mission delivery from bullets", async () => {
    const lessonId = "builder-m6-l2-wireframe";
    const source = await loadJson<LocalizedLessonPackage>(
      path.join(MSA_LESSONS, `${lessonId}.json`),
    );
    const pkg = await loadJson<AdaptedLessonPackage>(
      path.join(RECOVERED_EN, `${lessonId}.json`),
    );

    const repaired = repairRecoveredPackage(source, pkg);
    const mission = repaired.sections.find((s) => s.role === "Mission")?.mission;
    expect(mission?.delivery.length).toBeGreaterThan(0);
    expect(mission?.delivery[0]).toMatch(/\[Section\]/i);

    const after = auditRecoveredPackage(source, repaired);
    expect(
      after.filter(
        (e) => e.severity === "error" && e.kind === "mission_delivery",
      ),
    ).toEqual([]);
  });
});

describe("phase13b repair idempotence and scope", () => {
  it("second repair run writes zero files", async () => {
    const first = await repairAllRecoveredPackages();
    const second = await repairAllRecoveredPackages();
    expect(second.filesWritten).toBe(0);
    expect(second.auditAfter).toBe(0);
    expect(first.auditAfter).toBe(0);
  }, 120_000);

  it("repair is idempotent for known defect packages", async () => {
    const lessonId = "builder-m5-l4-database-intro";
    const source = await loadJson<LocalizedLessonPackage>(
      path.join(MSA_LESSONS, `${lessonId}.json`),
    );
    const pkg = await loadJson<AdaptedLessonPackage>(
      path.join(RECOVERED_EN, `${lessonId}.json`),
    );
    const once = repairRecoveredPackage(source, pkg);
    const twice = repairRecoveredPackage(source, once);
    expect(semanticDeepEqual(once, twice)).toBe(true);
  });

  it("preserves correctIndex for en analyst-m1-l1 after repair", async () => {
    const lessonId = "analyst-m1-l1-from-automation-to-insight";
    const mainPkg = JSON.parse(
      await fs.readFile(
        path.join(RECOVERED_EN.replace("/en", "/en"), `${lessonId}.json`),
        "utf8",
      ),
    ) as AdaptedLessonPackage;
    const source = await loadJson<LocalizedLessonPackage>(
      path.join(MSA_LESSONS, `${lessonId}.json`),
    );
    const beforeIndex = mainPkg.sections.find((s) => s.role === "Quiz")?.quiz
      ?.correctIndex;
    const repaired = repairRecoveredPackage(source, mainPkg);
    const afterIndex = repaired.sections.find((s) => s.role === "Quiz")?.quiz
      ?.correctIndex;
    expect(afterIndex).toBe(beforeIndex);
  });

  it("reconstructs collapsed ar-Gulf quiz from ar-MSA recovered, not runtime", async () => {
    const lessonId = "analyst-m6-l2-interpretation-mistakes";
    const source = await loadJson<LocalizedLessonPackage>(
      path.join(MSA_LESSONS, `${lessonId}.json`),
    );
    const mainGulf = JSON.parse(
      execSync(
        `git show origin/main:src/lib/locale-lessons/ar-MSA/reports/phase13b-recovered-packages/ar-Gulf/${lessonId}.json`,
        { cwd: REPO_ROOT, encoding: "utf8" },
      ),
    ) as AdaptedLessonPackage;
    const msaRecovered = await loadJson<AdaptedLessonPackage>(
      path.join(
        REPO_ROOT,
        "src/lib/locale-lessons/ar-MSA/reports/phase13b-recovered-packages/ar-MSA",
        `${lessonId}.json`,
      ),
    );
    const msaQuiz = msaRecovered.sections.find((s) => s.role === "Quiz");
    expect(mainGulf.sections.some((s) => s.role === "Quiz")).toBe(false);

    const inserted = reconstructMissingQuizSection(source, mainGulf, {
      msaRecoveredQuizSection: msaQuiz,
    });
    const quiz = inserted.sections.find((s) => s.role === "Quiz");
    expect(quiz?.quiz?.options).toEqual(msaQuiz?.quiz?.options);
    expect(inserted.sections.find((s) => s.role === "Mission")?.heading).toContain(
      "المهمة",
    );
  });
});

describe("phase13b full recovered corpus QA", () => {
  it("validates all 300 recovered packages after repair", async () => {
    const validation = await validateAllRecoveredPackages();
    expect(validation.arMsa).toBe(100);
    expect(validation.arGulf).toBe(100);
    expect(validation.en).toBe(100);
    expect(validation.total).toBe(300);
    expect(validation.jsonParseErrors).toBe(0);
    expect(validation.tableShapeErrors).toBe(0);
    expect(validation.missionParityErrors).toBe(0);
    expect(validation.quizStructuralErrors).toBe(0);
    expect(validation.quizPrefixFormatErrors).toBe(0);
    expect(validation.sectionParityErrors).toBe(0);
    expect(validation.validationErrors).toEqual([]);
    expect(validation.missingIds).toEqual([]);
    expect(validation.retryCells).toEqual([]);
    expect(validation.complete).toBe(true);
    expect(validation.ok).toBe(true);
  }, 120_000);

  it("audit finds zero errors across 300 packages", async () => {
    const audit = await auditAllRecoveredPackages();
    expect(audit.packagesScanned).toBe(300);
    const errors = audit.issues.filter((i) => i.severity === "error");
    expect(errors).toEqual([]);
  }, 120_000);
});

import { describe, expect, it } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { collectFragmentPilotArtifacts } from "../../../scripts/locale-lessons/collect-fragment-pilot-artifacts";
import { loadMsaLessonPackage } from "../../../scripts/locale-lessons/lib/source-package";

const LESSON_ID = "intro-m1-l1-what-is-ai";

async function writeRunFixture(
  rootDir: string,
  runId: string,
  locale: "en" | "ar-Gulf",
  pkg: unknown,
): Promise<string> {
  const dir = path.join(rootDir, runId, locale, "lessons");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(
    path.join(dir, `${LESSON_ID}.json`),
    JSON.stringify(pkg, null, 2),
    "utf8",
  );
  return path.join(rootDir, runId);
}

describe("collectFragmentPilotArtifacts — multi-run merge + sanitize + final validate", () => {
  it("merges artifacts from two runs, sanitizes, and writes a clean combined bundle", async () => {
    // Build a contaminated adapted package from the real MSA source so
    // structural parity passes but production leaks must be stripped.
    const msa = await loadMsaLessonPackage(LESSON_ID);

    function contaminate(locale: "en" | "ar-Gulf"): unknown {
      const lang = locale === "en" ? "en" : "ar-Gulf";
      const adapted = JSON.parse(JSON.stringify(msa)) as typeof msa;
      adapted.locale = lang as typeof adapted.locale;
      // Give the package a stable adapter-style title so structural parity passes.
      adapted.title = locale === "en" ? "What Is AI" : "ما هو الذكاء الاصطناعي";
      adapted.titleEn = "What Is AI";
      // Inject leaks while preserving MSA structural shape (option/bullet counts).
      const quiz = adapted.sections.find((s) => s.role === "Quiz");
      if (quiz?.quiz) {
        quiz.quiz.options = quiz.quiz.options.map(
          (_, i) => `Option ${i + 1}: opt-${i}`,
        );
        quiz.bullets = quiz.bullets.map(
          (_, i) => `**Correct answer (Option ${i + 1}):** bullet-${i}`,
        );
        quiz.contentMarkdown = "- Option 1: leak";
      }
      // Inject unbalanced markdown in a table cell of any section that has one.
      const sectionWithTable = adapted.sections.find((s) => s.tables.length > 0);
      if (sectionWithTable && sectionWithTable.tables[0].rows.length > 0) {
        sectionWithTable.tables[0].rows[0][0] = "**unbalanced";
      }
      return adapted;
    }

    const root = await fs.mkdtemp(path.join(os.tmpdir(), "collect-it-"));
    const oldRun = await writeRunFixture(root, "run-old", "ar-Gulf", contaminate("ar-Gulf"));
    const newRun = await writeRunFixture(root, "run-new", "en", contaminate("en"));
    // Duplicate in oldRun for en — newer should win.
    await writeRunFixture(root, "run-old", "en", contaminate("en"));

    const outDir = path.join(root, "out");

    const summary = await collectFragmentPilotArtifacts({
      target: "all",
      count: 1,
      lessonIdsOverride: [LESSON_ID],
      artifactSources: [
        { runId: "run-old", dir: oldRun },
        { runId: "run-new", dir: newRun },
      ],
      outputDir: outDir,
    });

    expect(summary.ok).toBe(true);
    expect(summary.passed).toHaveLength(2);
    expect(summary.failed).toHaveLength(0);
    expect(summary.missing).toHaveLength(0);

    // Re-read written files and verify no banned patterns.
    for (const locale of ["ar-Gulf", "en"]) {
      const filePath = path.join(outDir, locale, "lessons", `${LESSON_ID}.json`);
      const txt = await fs.readFile(filePath, "utf8");
      expect(txt).not.toContain("Video block (production reference only)");
      expect(txt).not.toContain("Bunny");
      expect(txt).not.toContain("Option 1:");
      expect(txt).not.toContain("Correct answer (Option");
    }

    // Combined manifest exists with source run ID per lesson.
    const combined = JSON.parse(
      await fs.readFile(path.join(outDir, "combined-manifest.json"), "utf8"),
    );
    expect(combined.summary).toEqual({ passed: 2, failed: 0, missing: 0 });
    const enRow = combined.lessons.find(
      (r: { locale: string }) => r.locale === "en",
    );
    // newer run should win on duplicates.
    expect(enRow.source_run_id).toBe("run-new");
    expect(enRow.status).toBe("ok");
  });
});

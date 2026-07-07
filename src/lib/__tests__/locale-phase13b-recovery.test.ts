import { describe, expect, it } from "vitest";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  buildPhase13BArtifactIndex,
  phase13BCellKey,
} from "../../../scripts/locale-lessons/lib/phase13b-artifact-index";
import { isPhase13BGeneratedPackagePath } from "../../../scripts/locale-lessons/lib/phase13b-generated-packages";
import { collectPhase13BRecoveredReport } from "../../../scripts/locale-lessons/collect-phase13b-recovered-report";

async function mktmp(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "ph13b-recover-"));
}

describe("Phase 13B path recognizer accepts GitHub-stripped and recovered layouts", () => {
  it("recognizes the four generated/recovered layouts we ship", () => {
    // canonical staging (as produced by phase13BGeneratedPackagePath)
    expect(
      isPhase13BGeneratedPackagePath(
        "src/lib/locale-lessons/ar-MSA/reports/phase13b-generated-packages/en/x.json",
      ),
    ).toBe(true);
    // GitHub artifact upload — keeps `reports/` tail after path: prefix
    expect(
      isPhase13BGeneratedPackagePath(
        "reports/phase13b-generated-packages/en/x.json",
      ),
    ).toBe(true);
    // GitHub artifact upload — stripped to just the generated folder
    expect(
      isPhase13BGeneratedPackagePath("phase13b-generated-packages/en/x.json"),
    ).toBe(true);
    // Committed recovery staging (workspace path)
    expect(
      isPhase13BGeneratedPackagePath(
        "src/lib/locale-lessons/ar-MSA/reports/phase13b-recovered-packages/en/x.json",
      ),
    ).toBe(true);
    // Recovery layout — stripped
    expect(
      isPhase13BGeneratedPackagePath("phase13b-recovered-packages/en/x.json"),
    ).toBe(true);
    // Negative — shipped lessons folder must never match
    expect(
      isPhase13BGeneratedPackagePath("src/lib/locale-lessons/en/lessons/x.json"),
    ).toBe(false);
  });
});

describe("Phase 13B artifact index handles stripped shard layout", () => {
  it("indexes generated packages under stripped GitHub artifact paths", async () => {
    const root = await mktmp();
    // Simulate `locale-phase13b-shard-en-00.zip` extracted with the
    // reports/ prefix stripped (this is what actually happens in run 28833055749).
    const shard = path.join(root, "locale-phase13b-shard-en-00");
    const pkgDir = path.join(shard, "phase13b-generated-packages", "en");
    const jobsDir = path.join(shard, "phase13b-full-jobs", "en");
    await fs.mkdir(pkgDir, { recursive: true });
    await fs.mkdir(jobsDir, { recursive: true });
    await fs.writeFile(
      path.join(pkgDir, "intro-m1-l1-what-is-ai.json"),
      JSON.stringify({ locale: "en", lessonId: "intro-m1-l1-what-is-ai" }),
      "utf8",
    );
    await fs.writeFile(
      path.join(jobsDir, "intro-m1-l1-what-is-ai.result.json"),
      JSON.stringify({
        locale: "en",
        lessonId: "intro-m1-l1-what-is-ai",
        ok: true,
        pipeline: "fragment-adapt",
        requiresPaidApi: true,
        fieldCount: 12,
        errors: [],
        generatedAt: "2026-07-07T00:00:00.000Z",
        mode: "openai-fragment",
        skippedPaidApi: false,
      }),
      "utf8",
    );

    const index = await buildPhase13BArtifactIndex(root);
    const key = phase13BCellKey("en", "intro-m1-l1-what-is-ai");
    expect(index.lessonArtifacts.has(key)).toBe(true);
    expect(index.jobResults.has(key)).toBe(true);
  });
});

describe("collectPhase13BRecoveredReport", () => {
  it("counts recovered packages per locale and produces retry_cells for missing en", async () => {
    const root = await mktmp();
    const expected = ["a", "b", "c", "d"];
    // ar-MSA: full, ar-Gulf: full, en: missing 2
    const layout: Record<string, string[]> = {
      "ar-MSA": ["a", "b", "c", "d"],
      "ar-Gulf": ["a", "b", "c", "d"],
      en: ["a", "b"],
    };
    for (const [loc, ids] of Object.entries(layout)) {
      const dir = path.join(root, loc);
      await fs.mkdir(dir, { recursive: true });
      for (const id of ids) {
        await fs.writeFile(
          path.join(dir, `${id}.json`),
          JSON.stringify({ locale: loc, lessonId: id }),
          "utf8",
        );
      }
    }

    const report = await collectPhase13BRecoveredReport({
      root,
      expectedLessonIds: expected,
    });

    expect(report.totalRecovered).toBe(10);
    expect(report.perLocale["ar-MSA"].recovered).toBe(4);
    expect(report.perLocale["ar-Gulf"].recovered).toBe(4);
    expect(report.perLocale.en.recovered).toBe(2);
    expect(report.perLocale.en.missingIds).toEqual(["c", "d"]);
    expect(report.failedGeneratedPackages).toEqual([]);
    expect(report.retryCells).toEqual([
      { locale: "en", lessonId: "c" },
      { locale: "en", lessonId: "d" },
    ]);
  });
});

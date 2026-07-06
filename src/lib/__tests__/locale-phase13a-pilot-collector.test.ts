import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { buildPhase13PilotCollectReport } from "../../../scripts/locale-lessons/collect-phase13-pilot-report.ts";
import { buildPhase13ArtifactIndex } from "../../../scripts/locale-lessons/lib/phase13-artifact-index.ts";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

async function makeTempArtifactsRoot(): Promise<string> {
  const dir = await mkdtemp(path.join(os.tmpdir(), "phase13-artifacts-"));
  tempDirs.push(dir);
  return dir;
}

async function writeArtifactTree(
  root: string,
  locale: "en" | "ar-Gulf",
  lessonId: string,
  opts: { ok: boolean; includeLesson?: boolean },
): Promise<void> {
  const jobsDir = path.join(
    root,
    "src",
    "lib",
    "locale-lessons",
    locale,
    "reports",
    "fragment-pilot-jobs",
  );
  const lessonsDir = path.join(
    root,
    "src",
    "lib",
    "locale-lessons",
    locale,
    "lessons",
  );
  await mkdir(jobsDir, { recursive: true });
  await writeFile(
    path.join(jobsDir, `${lessonId}.result.json`),
    `${JSON.stringify({
      locale,
      lessonId,
      ok: opts.ok,
      fieldCount: 12,
      errors: opts.ok ? [] : ["mock failure"],
      generatedAt: "2026-07-06T00:00:00.000Z",
    })}\n`,
    "utf8",
  );
  if (opts.includeLesson !== false) {
    await mkdir(lessonsDir, { recursive: true });
    await writeFile(
      path.join(lessonsDir, `${lessonId}.json`),
      `${JSON.stringify({ lessonId, locale, title: "Pilot" })}\n`,
      "utf8",
    );
  }
}

describe("Phase 13A artifact collector", () => {
  it("indexes nested GitHub download layouts recursively", async () => {
    const root = await makeTempArtifactsRoot();
    const nested = path.join(
      root,
      "locale-phase13a-pilot-en-intro-m1-l1-what-is-ai",
      "src",
      "lib",
      "locale-lessons",
      "en",
      "reports",
      "fragment-pilot-jobs",
    );
    await mkdir(nested, { recursive: true });
    await writeFile(
      path.join(nested, "intro-m1-l1-what-is-ai.result.json"),
      `${JSON.stringify({
        locale: "en",
        lessonId: "intro-m1-l1-what-is-ai",
        ok: true,
        fieldCount: 5,
        errors: [],
        generatedAt: "2026-07-06T00:00:00.000Z",
      })}\n`,
      "utf8",
    );

    const index = await buildPhase13ArtifactIndex(root);
    expect(index.jobResults.size).toBe(1);
    const hit = index.jobResults.get("en/intro-m1-l1-what-is-ai");
    expect(hit?.result.ok).toBe(true);
    expect(hit?.relativePath).toContain("intro-m1-l1-what-is-ai.result.json");
  });

  it("counts paid pilot cells as generated when job results live only in artifacts", async () => {
    const root = await makeTempArtifactsRoot();
    const lessonId = "intro-m1-l1-what-is-ai";
    await writeArtifactTree(root, "en", lessonId, { ok: true });

    const report = await buildPhase13PilotCollectReport({
      sourceScope: "ar-MSA",
      target: "en",
      count: 1,
      dryRun: false,
      artifactsDir: root,
      lessonIdsOverride: [lessonId],
      matrix: [
        {
          locale: "en",
          lesson_id: lessonId,
          source_scope: "ar-MSA",
        },
      ],
    });

    expect(report.skipped).toEqual([]);
    expect(report.failed).toEqual([]);
    expect(report.generated).toEqual([`en/${lessonId}`]);
    expect(report.cells[0]?.status).toBe("generated");
    expect(report.cells[0]?.jobResultSourcePath).toContain(
      "intro-m1-l1-what-is-ai.result.json",
    );
    expect(report.cells[0]?.artifactRelativePath).toContain(
      `locale-lessons/en/lessons/${lessonId}.json`,
    );
  });

  it("reports failed cells when result JSON has ok:false", async () => {
    const root = await makeTempArtifactsRoot();
    const lessonId = "builder-m6-l1-idea-to-page";
    await writeArtifactTree(root, "ar-Gulf", lessonId, { ok: false });

    const report = await buildPhase13PilotCollectReport({
      sourceScope: "ar-MSA",
      target: "ar-Gulf",
      count: 1,
      dryRun: false,
      artifactsDir: root,
      lessonIdsOverride: [lessonId],
      matrix: [
        {
          locale: "ar-Gulf",
          lesson_id: lessonId,
          source_scope: "ar-MSA",
        },
      ],
    });

    expect(report.generated).toEqual([]);
    expect(report.skipped).toEqual([]);
    expect(report.failed).toEqual([`ar-Gulf/${lessonId}`]);
    expect(report.cells[0]?.status).toBe("failed");
  });
});

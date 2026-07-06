import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  buildPhase13PilotCollectReport,
  phase13CollectReportExitCode,
} from "../../../scripts/locale-lessons/collect-phase13-pilot-report.ts";
import {
  buildPhase13ArtifactIndex,
  parsePhase13ArtifactDirName,
} from "../../../scripts/locale-lessons/lib/phase13-artifact-index.ts";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

async function makeTempArtifactsRoot(): Promise<string> {
  const dir = await mkdtemp(path.join(os.tmpdir(), "phase13-artifacts-"));
  tempDirs.push(dir);
  return dir;
}

const SHARED_LESSON_ID = "builder-m6-l1-idea-to-page";

async function writeNamedArtifactCell(
  root: string,
  locale: "en" | "ar-Gulf",
  lessonId: string,
  opts: { ok: boolean; includeLesson?: boolean; legacyResultPath?: boolean },
): Promise<void> {
  const artifactName = `locale-phase13a-pilot-${locale}-${lessonId}`;
  const base = path.join(root, artifactName, "src", "lib", "locale-lessons", locale);
  const jobsDir = opts.legacyResultPath
    ? path.join(base, "reports", "fragment-pilot-jobs")
    : path.join(base, "reports", "fragment-pilot-jobs", locale);
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
    const lessonsDir = path.join(base, "lessons");
    await mkdir(lessonsDir, { recursive: true });
    await writeFile(
      path.join(lessonsDir, `${lessonId}.json`),
      `${JSON.stringify({ lessonId, locale, title: "Pilot" })}\n`,
      "utf8",
    );
  }
}

describe("Phase 13A artifact collector", () => {
  it("parses locale-phase13a-pilot artifact directory names", () => {
    expect(parsePhase13ArtifactDirName("locale-phase13a-pilot-en-intro-m1-l1-what-is-ai")).toEqual({
      locale: "en",
      lessonId: "intro-m1-l1-what-is-ai",
    });
    expect(
      parsePhase13ArtifactDirName(
        "locale-phase13a-pilot-ar-Gulf-builder-m6-l1-idea-to-page-failed",
      ),
    ).toEqual({
      locale: "ar-Gulf",
      lessonId: "builder-m6-l1-idea-to-page",
    });
  });

  it("indexes the same lessonId for en and ar-Gulf without collision", async () => {
    const root = await makeTempArtifactsRoot();
    await writeNamedArtifactCell(root, "en", SHARED_LESSON_ID, { ok: true });
    await writeNamedArtifactCell(root, "ar-Gulf", SHARED_LESSON_ID, { ok: true });

    const index = await buildPhase13ArtifactIndex(root);
    expect(index.jobResults.size).toBe(2);
    expect(index.jobResults.get(`en/${SHARED_LESSON_ID}`)?.result.ok).toBe(true);
    expect(index.jobResults.get(`ar-Gulf/${SHARED_LESSON_ID}`)?.result.ok).toBe(true);
    expect(index.jobResults.get(`en/${SHARED_LESSON_ID}`)?.artifactSource).toBe(
      `locale-phase13a-pilot-en-${SHARED_LESSON_ID}`,
    );
  });

  it("derives locale + lessonId from artifact name when result JSON omits metadata", async () => {
    const root = await makeTempArtifactsRoot();
    const lessonId = "intro-m1-l1-what-is-ai";
    const artifactName = `locale-phase13a-pilot-en-${lessonId}`;
    const jobsDir = path.join(
      root,
      artifactName,
      "src",
      "lib",
      "locale-lessons",
      "en",
      "reports",
      "fragment-pilot-jobs",
      "en",
    );
    await mkdir(jobsDir, { recursive: true });
    await writeFile(
      path.join(jobsDir, `${lessonId}.result.json`),
      `${JSON.stringify({ ok: true, fieldCount: 3, errors: [], generatedAt: "2026-07-06T00:00:00.000Z" })}\n`,
      "utf8",
    );

    const index = await buildPhase13ArtifactIndex(root);
    const hit = index.jobResults.get(`en/${lessonId}`);
    expect(hit?.result.ok).toBe(true);
    expect(hit?.artifactSource).toBe(artifactName);
  });

  it("indexes nested GitHub download layouts recursively", async () => {
    const root = await makeTempArtifactsRoot();
    const lessonId = "intro-m1-l1-what-is-ai";
    await writeNamedArtifactCell(root, "en", lessonId, { ok: true });

    const index = await buildPhase13ArtifactIndex(root);
    expect(index.jobResults.size).toBe(1);
    const hit = index.jobResults.get(`en/${lessonId}`);
    expect(hit?.result.ok).toBe(true);
    expect(hit?.relativePath).toContain(`${lessonId}.result.json`);
  });

  it("counts paid pilot cells as generated when job results live only in artifacts", async () => {
    const root = await makeTempArtifactsRoot();
    const lessonId = "intro-m1-l1-what-is-ai";
    await writeNamedArtifactCell(root, "en", lessonId, { ok: true });

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
    expect(report.retryLessonIds).toEqual([]);
    expect(report.cells[0]?.status).toBe("generated");
    expect(report.cells[0]?.artifactSource).toContain("locale-phase13a-pilot-en-");
  });

  it("reports failed cells and keeps generated cells when one cell fails", async () => {
    const root = await makeTempArtifactsRoot();
    const okLesson = "intro-m1-l1-what-is-ai";
    await writeNamedArtifactCell(root, "en", okLesson, { ok: true });
    await writeNamedArtifactCell(root, "en", SHARED_LESSON_ID, { ok: false });

    const report = await buildPhase13PilotCollectReport({
      sourceScope: "ar-MSA",
      target: "en",
      count: 2,
      dryRun: false,
      artifactsDir: root,
      lessonIdsOverride: [okLesson, SHARED_LESSON_ID],
      matrix: [
        { locale: "en", lesson_id: okLesson, source_scope: "ar-MSA" },
        { locale: "en", lesson_id: SHARED_LESSON_ID, source_scope: "ar-MSA" },
      ],
    });

    expect(report.generated).toEqual([`en/${okLesson}`]);
    expect(report.failed).toEqual([`en/${SHARED_LESSON_ID}`]);
    expect(report.skipped).toEqual([]);
    expect(report.retryLessonIds).toEqual([`en/${SHARED_LESSON_ID}`]);
    expect(report.retryCells).toEqual([
      { locale: "en", lessonId: SHARED_LESSON_ID },
    ]);
    expect(report.failedCellDetails).toHaveLength(1);
    expect(report.failedCellDetails[0]?.status).toBe("failed");
    expect(phase13CollectReportExitCode(report)).toBe(0);
  });

  it("lists skipped cells in retry fields only", async () => {
    const root = await makeTempArtifactsRoot();
    const present = "intro-m1-l1-what-is-ai";
    const missing = "builder-m6-l1-idea-to-page";
    await writeNamedArtifactCell(root, "en", present, { ok: true });

    const report = await buildPhase13PilotCollectReport({
      sourceScope: "ar-MSA",
      target: "en",
      count: 2,
      dryRun: false,
      artifactsDir: root,
      lessonIdsOverride: [present, missing],
      matrix: [
        { locale: "en", lesson_id: present, source_scope: "ar-MSA" },
        { locale: "en", lesson_id: missing, source_scope: "ar-MSA" },
      ],
    });

    expect(report.generated).toEqual([`en/${present}`]);
    expect(report.skipped).toEqual([`en/${missing}`]);
    expect(report.retryLessonIds).toEqual([`en/${missing}`]);
    expect(report.retryCells).toEqual([{ locale: "en", lessonId: missing }]);
    expect(report.failedCellDetails[0]?.status).toBe("skipped");
    expect(phase13CollectReportExitCode(report)).toBe(0);
  });

  it("reads legacy flat result paths for backward compatibility", async () => {
    const root = await makeTempArtifactsRoot();
    await writeNamedArtifactCell(root, "ar-Gulf", SHARED_LESSON_ID, {
      ok: false,
      legacyResultPath: true,
    });

    const report = await buildPhase13PilotCollectReport({
      sourceScope: "ar-MSA",
      target: "ar-Gulf",
      count: 1,
      dryRun: false,
      artifactsDir: root,
      lessonIdsOverride: [SHARED_LESSON_ID],
      matrix: [
        {
          locale: "ar-Gulf",
          lesson_id: SHARED_LESSON_ID,
          source_scope: "ar-MSA",
        },
      ],
    });

    expect(report.failed).toEqual([`ar-Gulf/${SHARED_LESSON_ID}`]);
    expect(report.cells[0]?.status).toBe("failed");
  });
});

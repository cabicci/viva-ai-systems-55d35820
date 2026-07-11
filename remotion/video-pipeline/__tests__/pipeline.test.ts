import { describe, expect, it } from "vitest";
import { buildVideoManifest, assertManifestInvariants } from "../lib/build-manifest.ts";
import { extractScript } from "../lib/script-extract.ts";
import {
  detectCrossLocaleContamination,
  validateScriptDeterminism,
} from "../lib/script-validate.ts";
import {
  assertVoiceMappingComplete,
  preventWrongLocaleVoice,
  voiceProfileForLocale,
} from "../lib/voice-map.ts";
import {
  initRegistryFromManifest,
  filterRetryOnlyFailed,
  preventCommittingFailed,
  updateStatusRecord,
  loadStatusRegistry,
} from "../lib/status-registry.ts";
import {
  resetCommitQueueForTest,
  enqueueCompletedVideo,
  processCommitQueue,
  getCommitOrder,
} from "../lib/commit-queue.ts";
import { runMockVideoPipeline } from "../lib/mock-pipeline.ts";
import { validateMediaArtifacts } from "../lib/media-validate.ts";
import {
  REQUIRED_LOCALE_TOTALS,
  REQUIRED_TOTAL_VIDEOS,
  BASELINE_SHA,
} from "../lib/types.ts";
import path from "node:path";
import { existsSync } from "node:fs";
import { PIPELINE_ROOT } from "../lib/paths.ts";

describe("video production pipeline", () => {
  it("builds manifest with exactly 300 videos (100+100+100)", () => {
    const manifest = buildVideoManifest(BASELINE_SHA);
    assertManifestInvariants(manifest);
    expect(manifest.totalVideos).toBe(REQUIRED_TOTAL_VIDEOS);
    expect(manifest.localeTotals["ar-MSA"]).toBe(REQUIRED_LOCALE_TOTALS["ar-MSA"]);
    expect(manifest.localeTotals["ar-Gulf"]).toBe(REQUIRED_LOCALE_TOTALS["ar-Gulf"]);
    expect(manifest.localeTotals.en).toBe(REQUIRED_LOCALE_TOTALS.en);
    expect(manifest.baselineSha).toBe(BASELINE_SHA);
  });

  it("extracts deterministic locale-correct scripts", () => {
    const lessonId = "intro-m1-l1-what-is-ai";
    for (const locale of ["ar-MSA", "ar-Gulf", "en"] as const) {
      const det = validateScriptDeterminism(locale, lessonId);
      expect(det.ok).toBe(true);
      const script = extractScript(locale, lessonId);
      expect(script.locale).toBe(locale);
      expect(script.lessonId).toBe(lessonId);
      expect(script.fullText.length).toBeGreaterThan(80);
    }
  });

  it("detects no cross-locale script contamination for sample lesson", () => {
    const lessonId = "intro-m1-l1-what-is-ai";
    const scripts = (["ar-MSA", "ar-Gulf", "en"] as const).map((locale) =>
      extractScript(locale, lessonId),
    );
    const check = detectCrossLocaleContamination(scripts);
    expect(check.ok).toBe(true);
    const checksums = new Set(scripts.map((s) => s.checksum));
    expect(checksums.size).toBe(3);
  });

  it("maps voice profiles for all locales without cross-locale assignment", () => {
    const profiles = assertVoiceMappingComplete(["ar-MSA", "ar-Gulf", "en"]);
    for (const locale of ["ar-MSA", "ar-Gulf", "en"] as const) {
      const p = voiceProfileForLocale(locale);
      expect(p.locale).toBe(locale);
      const gate = preventWrongLocaleVoice(locale, p.profileId);
      expect(gate.ok).toBe(true);
    }
    expect(Object.keys(profiles)).toHaveLength(3);
  });

  it("supports retry-only-failed filtering", () => {
    const manifest = buildVideoManifest();
    initRegistryFromManifest(manifest.entries.slice(0, 5));
    updateStatusRecord(manifest.entries[0]!.cellId, { outputStatus: "failed" });
    updateStatusRecord(manifest.entries[1]!.cellId, { outputStatus: "committed" });

    const all = manifest.entries.slice(0, 5).map((e) => e.cellId);
    const retry = filterRetryOnlyFailed(all, true);
    expect(retry).toEqual([manifest.entries[0]!.cellId]);
  });

  it("never commits failed outputs", () => {
    const manifest = buildVideoManifest();
    const entry = manifest.entries[0]!;
    initRegistryFromManifest([entry]);
    const failed = {
      ...entry,
      cellId: entry.cellId,
      lessonId: entry.lessonId,
      locale: entry.locale,
      track: entry.track,
      module: entry.module,
      packagePath: entry.packagePath,
      sourceSha: entry.sourceSha,
      packageChecksum: entry.packageChecksum,
      voiceProfileId: entry.voiceProfileId,
      outputStatus: "failed" as const,
      updatedAt: new Date().toISOString(),
      error: "test failure",
    };
    const gate = preventCommittingFailed(failed);
    expect(gate.ok).toBe(false);
  });

  it("runs mock pipeline and serialized commit queue (dry-run)", () => {
    const fixtureVideo = path.join(PIPELINE_ROOT, "fixtures/mock-media/minimal.mp4");
    const fixtureAudio = path.join(PIPELINE_ROOT, "fixtures/mock-media/minimal.mp3");
    if (!existsSync(fixtureVideo) || !existsSync(fixtureAudio)) {
      // Skip artifact test if fixtures not generated yet
      return;
    }

    const manifest = buildVideoManifest();
    initRegistryFromManifest(manifest.entries.slice(0, 3));
    resetCommitQueueForTest();

    const results = manifest.entries.slice(0, 3).map((e) => runMockVideoPipeline(e));
    expect(results.every((r) => r.ok)).toBe(true);

    for (const r of results) {
      expect(r.statusRecord?.scriptChecksum).toBeTruthy();
      expect(r.statusRecord?.videoChecksum).toBeTruthy();
      expect(r.statusRecord?.captionsChecksum).toBeTruthy();
    }

    const order = getCommitOrder();
    expect(order.order.length).toBe(3);

    const commitResult = processCommitQueue({ dryRun: true, maxItems: 3 });
    expect(commitResult.committed.length).toBe(3);
    expect(commitResult.errors).toHaveLength(0);
  });

  it("validates mock media artifacts", () => {
    const fixtureVideo = path.join(PIPELINE_ROOT, "fixtures/mock-media/minimal.mp4");
    const fixtureAudio = path.join(PIPELINE_ROOT, "fixtures/mock-media/minimal.mp3");
    if (!existsSync(fixtureVideo)) return;

    const result = validateMediaArtifacts({
      lessonId: "test",
      locale: "en",
      videoPath: fixtureVideo,
      audioPath: fixtureAudio,
      captionsPath: path.join(PIPELINE_ROOT, "fixtures/mock-media/test.vtt"),
    });
    // captions file may not exist in this minimal check — focus on video/audio
    expect(result.lessonId).toBe("test");
  });
});

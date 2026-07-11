import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { extractScript } from "./script-extract.ts";
import { validateMediaArtifacts, artifactChecksums } from "./media-validate.ts";
import { validateScript } from "./script-validate.ts";
import { preventWrongLocaleVoice, voiceProfileForLocale } from "./voice-map.ts";
import { outputDirFor, PIPELINE_ROOT } from "./paths.ts";
import type { VideoManifestEntry, VideoStatusRecord } from "./types.ts";
import { updateStatusRecord, entryToStatusRecord } from "./status-registry.ts";
import { enqueueCompletedVideo } from "./commit-queue.ts";

const FIXTURE_VIDEO = path.join(PIPELINE_ROOT, "fixtures/mock-media/minimal.mp4");
const FIXTURE_AUDIO = path.join(PIPELINE_ROOT, "fixtures/mock-media/minimal.mp3");

function buildCaptions(locale: string, lessonId: string, scriptText: string): string {
  const snippet = scriptText.slice(0, 120).replace(/\n/g, " ");
  return `WEBVTT

00:00:00.000 --> 00:00:05.000
[${locale}] ${lessonId}: ${snippet}...
`;
}

export interface MockPipelineResult {
  ok: boolean;
  cellId: string;
  errors: string[];
  statusRecord?: VideoStatusRecord;
}

export function runMockVideoPipeline(
  entry: VideoManifestEntry,
  options: { simulateFailure?: boolean } = {},
): MockPipelineResult {
  const errors: string[] = [];
  const outDir = outputDirFor(entry.locale, entry.lessonId);
  mkdirSync(outDir, { recursive: true });

  const voiceCheck = preventWrongLocaleVoice(entry.locale, entry.voiceProfileId);
  if (!voiceCheck.ok) errors.push(voiceCheck.error!);

  const scriptValidation = validateScript(entry.locale, entry.lessonId);
  if (!scriptValidation.ok) errors.push(...scriptValidation.errors);

  if (options.simulateFailure) {
    updateStatusRecord(entry.cellId, {
      ...entryToStatusRecord(entry, "failed"),
      error: "Simulated failure",
    });
    return { ok: false, cellId: entry.cellId, errors: ["Simulated failure"] };
  }

  const script = extractScript(entry.locale, entry.lessonId);
  const profile = voiceProfileForLocale(entry.locale);

  writeFileSync(
    path.join(outDir, "script.json"),
    `${JSON.stringify(script, null, 2)}\n`,
    "utf8",
  );

  if (!existsSync(FIXTURE_VIDEO) || !existsSync(FIXTURE_AUDIO)) {
    errors.push("Mock fixtures missing — run fixtures/generate-fixtures.mjs");
    return { ok: false, cellId: entry.cellId, errors };
  }

  copyFileSync(FIXTURE_VIDEO, path.join(outDir, "video.mp4"));
  copyFileSync(FIXTURE_AUDIO, path.join(outDir, "audio.mp3"));
  writeFileSync(
    path.join(outDir, "captions.vtt"),
    buildCaptions(entry.locale, entry.lessonId, script.fullText),
    "utf8",
  );

  const media = validateMediaArtifacts({
    lessonId: entry.lessonId,
    locale: entry.locale,
    videoPath: path.join(outDir, "video.mp4"),
    audioPath: path.join(outDir, "audio.mp3"),
    captionsPath: path.join(outDir, "captions.vtt"),
  });

  if (!media.ok) errors.push(...media.errors);

  const checksums = artifactChecksums({
    videoPath: path.join(outDir, "video.mp4"),
    audioPath: path.join(outDir, "audio.mp3"),
    captionsPath: path.join(outDir, "captions.vtt"),
  });

  writeFileSync(
    path.join(outDir, "validation.json"),
    `${JSON.stringify(media, null, 2)}\n`,
    "utf8",
  );

  const statusRecord: VideoStatusRecord = {
    ...entryToStatusRecord(entry, media.ok ? "validated" : "failed"),
    scriptChecksum: script.checksum,
    videoChecksum: checksums.video,
    captionsChecksum: checksums.captions,
    error: errors.length ? errors.join("; ") : undefined,
  };

  writeFileSync(
    path.join(outDir, "status.json"),
    `${JSON.stringify(statusRecord, null, 2)}\n`,
    "utf8",
  );

  updateStatusRecord(entry.cellId, statusRecord);

  if (media.ok && errors.length === 0) {
    enqueueCompletedVideo({
      cellId: entry.cellId,
      lessonId: entry.lessonId,
      locale: entry.locale,
      artifactsDir: outDir,
      statusRecord,
    });
    updateStatusRecord(entry.cellId, { outputStatus: "validated" });
  }

  return {
    ok: media.ok && errors.length === 0,
    cellId: entry.cellId,
    errors,
    statusRecord,
  };
}

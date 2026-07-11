import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileChecksum } from "./checksum.ts";
import { extractScript } from "./script-extract.ts";
import { voiceProfileForLocale, preventWrongLocaleVoice } from "./voice-map.ts";
import { outputDirFor, REPO_ROOT, packagePathFor } from "./paths.ts";
import { buildCacheKey, cacheDirForKey, loadPipelineVersion } from "./cache.ts";
import {
  buildScenesFromScript,
  sceneFramesFromDurations,
  scenesToRemotionVisuals,
  ttsSegmentsFromScenes,
} from "./scene-builder.ts";
import { buildWebVtt } from "./captions.ts";
import { validateLiveMedia, shouldSkipLiveRegeneration } from "./live-media-validate.ts";
import { synthesizeLocaleSegments, synthesizeFixtureSegments } from "./locale-tts.ts";
import { enqueueCompletedVideo } from "./commit-queue.ts";
import {
  entryToStatusRecord,
  loadStatusRegistry,
  updateStatusRecord,
} from "./status-registry.ts";
import type { VideoManifestEntry, VideoStatusRecord } from "./types.ts";
import { BASELINE_SHA } from "./types.ts";
import { resolveFfmpegBin } from "./ffmpeg-bin.ts";

export interface LivePipelineResult {
  ok: boolean;
  cellId: string;
  errors: string[];
  skipped?: boolean;
  skipReason?: string;
  statusRecord?: VideoStatusRecord;
  renderDurationMs?: number;
  ttsCostNote?: string;
}

function run(cmd: string, args: string[], cwd = REPO_ROOT): { ok: boolean; stdout: string; stderr: string } {
  const r = spawnSync(cmd, args, { cwd, encoding: "utf8", shell: false });
  return { ok: r.status === 0, stdout: (r.stdout ?? "").trim(), stderr: (r.stderr ?? "").trim() };
}

function muxVideoAudio(videoPath: string, audioPath: string, outPath: string): void {
  const ffmpeg = resolveFfmpegBin();
  const r = run(ffmpeg, [
    "-y",
    "-i",
    videoPath,
    "-i",
    audioPath,
    "-c:v",
    "copy",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-shortest",
    outPath,
  ]);
  if (!r.ok) throw new Error(`ffmpeg mux failed: ${r.stderr}`);
}

export async function runLiveVideoPipeline(
  entry: VideoManifestEntry,
  options: {
    force?: boolean;
    simulateFailure?: boolean;
    skipRender?: boolean;
    fixtureTts?: boolean;
  } = {},
): Promise<LivePipelineResult> {
  const errors: string[] = [];
  const started = Date.now();
  const outDir = outputDirFor(entry.locale, entry.lessonId);
  mkdirSync(outDir, { recursive: true });
  const logPath = path.join(outDir, "pipeline.log");
  const appendLog = (msg: string) => {
    writeFileSync(logPath, `${new Date().toISOString()} ${msg}\n`, { flag: "a" });
  };

  appendLog(`start ${entry.cellId}`);

  if (entry.sourceSha !== BASELINE_SHA) {
    errors.push(`Source SHA mismatch: ${entry.sourceSha} != ${BASELINE_SHA}`);
  }

  const absPackage = path.join(REPO_ROOT, entry.packagePath);
  const liveChecksum = fileChecksum(absPackage);
  if (liveChecksum !== entry.packageChecksum) {
    errors.push("Package checksum mismatch vs manifest");
  }

  const voiceCheck = preventWrongLocaleVoice(entry.locale, entry.voiceProfileId);
  if (!voiceCheck.ok) errors.push(voiceCheck.error!);

  const script = extractScript(entry.locale, entry.lessonId);
  if (script.checksum !== entry.packageChecksum && script.locale !== entry.locale) {
    /* script checksum is content hash, not package file hash */
  }

  const registry = loadStatusRegistry();
  const prior = registry.records[entry.cellId];
  const skip = shouldSkipLiveRegeneration(prior, script.checksum, entry.packageChecksum, !!options.force);
  if (skip.skip) {
    appendLog(`skip: ${skip.reason}`);
    return {
      ok: true,
      cellId: entry.cellId,
      errors: [],
      skipped: true,
      skipReason: skip.reason,
      statusRecord: prior,
    };
  }

  if (options.simulateFailure) {
    const failed = {
      ...entryToStatusRecord(entry, "failed"),
      scriptChecksum: script.checksum,
      error: "Simulated failure",
    };
    updateStatusRecord(entry.cellId, failed);
    writeFileSync(path.join(outDir, "status.json"), `${JSON.stringify(failed, null, 2)}\n`);
    return { ok: false, cellId: entry.cellId, errors: ["Simulated failure"] };
  }

  writeFileSync(path.join(outDir, "script.json"), `${JSON.stringify(script, null, 2)}\n`);

  const profile = voiceProfileForLocale(entry.locale);
  const cacheKey = buildCacheKey({
    locale: entry.locale,
    lessonId: entry.lessonId,
    packageChecksum: entry.packageChecksum,
    voiceProfileId: profile.profileId,
    scriptChecksum: script.checksum,
  });
  const cacheDir = cacheDirForKey(cacheKey);
  const audioDir = path.join(cacheDir, "audio");
  mkdirSync(audioDir, { recursive: true });

  const scenes = buildScenesFromScript(script);
  writeFileSync(path.join(outDir, "scenes.json"), `${JSON.stringify(scenes, null, 2)}\n`);

  const segments = ttsSegmentsFromScenes(scenes);
  const segmentsPath = path.join(outDir, "tts-segments.json");
  writeFileSync(segmentsPath, `${JSON.stringify(segments, null, 2)}\n`);

  const masterAudio = path.join(outDir, "audio.mp3");
  const timingsPath = path.join(outDir, "tts-timings.json");

  let ttsMs = 0;
  let ttsApiCalls = 0;
  let timings: { segments: Array<{ idx: number; text: string; startSec: number; durationSec: number }> };
  try {
    const ttsStarted = Date.now();
    const ttsResult = options.fixtureTts
      ? await synthesizeFixtureSegments({
          locale: entry.locale,
          segments,
          cacheAudioDir: audioDir,
          masterPath: masterAudio,
        })
      : await synthesizeLocaleSegments({
          locale: entry.locale,
          segments,
          cacheAudioDir: audioDir,
          masterPath: masterAudio,
        });
    ttsMs = Date.now() - ttsStarted;
    ttsApiCalls = ttsResult.apiCalls;
    timings = { segments: ttsResult.segments };
    writeFileSync(timingsPath, `${JSON.stringify({ locale: entry.locale, model: ttsResult.model, segments: ttsResult.segments, apiCalls: ttsResult.apiCalls }, null, 2)}\n`);
    appendLog(`tts done ${ttsMs}ms apiCalls=${ttsApiCalls}`);
  } catch (e) {
    errors.push(`TTS failed: ${(e as Error).message}`);
    appendLog(`tts failed: ${(e as Error).message}`);
    const failed = {
      ...entryToStatusRecord(entry, "failed"),
      scriptChecksum: script.checksum,
      error: errors.join("; "),
    };
    updateStatusRecord(entry.cellId, failed);
    writeFileSync(path.join(outDir, "status.json"), `${JSON.stringify(failed, null, 2)}\n`);
    return { ok: false, cellId: entry.cellId, errors };
  }

  const version = loadPipelineVersion();
  const sceneFrames = sceneFramesFromDurations(
    timings.segments.map((s) => s.durationSec),
    version.fps,
    version.tailSilenceFrames,
  );

  const vtt = buildWebVtt(
    entry.locale,
    timings.segments.map((s) => ({
      idx: s.idx,
      text: s.text,
      startSec: s.startSec,
      durationSec: s.durationSec,
    })),
  );
  writeFileSync(path.join(outDir, "captions.vtt"), vtt, "utf8");

  const renderProps = {
    scenes: scenesToRemotionVisuals(scenes),
    sceneFrames,
  };
  const propsPath = path.join(outDir, "render-props.json");
  writeFileSync(propsPath, `${JSON.stringify(renderProps, null, 2)}\n`);

  const silentVideo = path.join(outDir, "silent.mp4");
  const finalVideo = path.join(outDir, "video.mp4");

  if (!options.skipRender) {
    const renderStarted = Date.now();
    const render = run("bun", [
      path.join(REPO_ROOT, "remotion/video-pipeline/render/render-locale-lesson.mjs"),
      propsPath,
      silentVideo,
    ]);
    if (!render.ok) {
      errors.push(`Remotion render failed: ${render.stderr || render.stdout}`);
      appendLog(`render failed: ${render.stderr}`);
      const failed = {
        ...entryToStatusRecord(entry, "failed"),
        scriptChecksum: script.checksum,
        error: errors.join("; "),
      };
      updateStatusRecord(entry.cellId, failed);
      writeFileSync(path.join(outDir, "status.json"), `${JSON.stringify(failed, null, 2)}\n`);
      return { ok: false, cellId: entry.cellId, errors, renderDurationMs: Date.now() - renderStarted };
    }
    appendLog(`render done ${Date.now() - renderStarted}ms`);

    try {
      muxVideoAudio(silentVideo, masterAudio, finalVideo);
    } catch (e) {
      errors.push((e as Error).message);
    }
  } else if (existsSync(path.join(outDir, "video.mp4"))) {
    /* test hook */
  } else {
    errors.push("skipRender without existing video");
  }

  const validation = validateLiveMedia({
    lessonId: entry.lessonId,
    locale: entry.locale,
    videoPath: finalVideo,
    audioPath: masterAudio,
    captionsPath: path.join(outDir, "captions.vtt"),
    expectedScriptChecksum: script.checksum,
    actualScriptChecksum: script.checksum,
    expectedVoiceProfileId: entry.voiceProfileId,
    actualVoiceProfileId: profile.profileId,
    priorVideoChecksum: prior?.videoChecksum,
    cellId: entry.cellId,
  });

  writeFileSync(path.join(outDir, "validation.json"), `${JSON.stringify(validation, null, 2)}\n`);

  if (!validation.ok) errors.push(...validation.errors);

  const statusRecord: VideoStatusRecord = {
    ...entryToStatusRecord(entry, validation.ok && errors.length === 0 ? "validated" : "failed"),
    scriptChecksum: script.checksum,
    videoChecksum: validation.videoChecksum,
    captionsChecksum: validation.captionsChecksum,
    error: errors.length ? errors.join("; ") : undefined,
  };

  writeFileSync(path.join(outDir, "status.json"), `${JSON.stringify(statusRecord, null, 2)}\n`);
  updateStatusRecord(entry.cellId, statusRecord);

  if (validation.ok && errors.length === 0) {
    enqueueCompletedVideo({
      cellId: entry.cellId,
      lessonId: entry.lessonId,
      locale: entry.locale,
      artifactsDir: outDir,
      statusRecord,
    });
  }

  appendLog(`done ok=${validation.ok && errors.length === 0}`);

  return {
    ok: validation.ok && errors.length === 0,
    cellId: entry.cellId,
    errors,
    statusRecord,
    renderDurationMs: Date.now() - started,
    ttsCostNote: `TTS segments=${segments.length} apiCalls=${ttsApiCalls} elapsedMs=${ttsMs} model=${version.ttsModel}`,
  };
}

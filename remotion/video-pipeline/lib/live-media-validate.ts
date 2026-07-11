import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolveFfprobeBin } from "./ffmpeg-bin.ts";
import { sha256Hex } from "./checksum.ts";
import { captionsLocaleGuard } from "./captions.ts";
import type { VideoLocale } from "./types.ts";
import { preventOverwrittenVideo } from "./media-validate.ts";
import { ensureRenderBrandAsset } from "./brand-guard.ts";

export interface LiveMediaValidationResult {
  ok: boolean;
  lessonId: string;
  locale: VideoLocale;
  errors: string[];
  durationSeconds?: number;
  hasAudio: boolean;
  hasVideo: boolean;
  hasCaptions: boolean;
  videoChecksum?: string;
  audioChecksum?: string;
  captionsChecksum?: string;
  logoChecksum?: string;
  logoDimensions?: string;
  ffprobe?: Record<string, unknown>;
}

function ffprobeJson(path: string): Record<string, unknown> | null {
  const ffprobe = resolveFfprobeBin();
  const r = spawnSync(
    ffprobe,
    [
      "-v",
      "error",
      "-show_format",
      "-show_streams",
      "-of",
      "json",
      path,
    ],
    { encoding: "utf8" },
  );
  if (r.status !== 0) return null;
  try {
    return JSON.parse(r.stdout) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function streamDuration(probe: Record<string, unknown> | null): number | undefined {
  if (!probe) return undefined;
  const fmt = probe.format as { duration?: string } | undefined;
  if (fmt?.duration) return Number(fmt.duration);
  const streams = probe.streams as Array<{ codec_type?: string; duration?: string }> | undefined;
  const video = streams?.find((s) => s.codec_type === "video");
  if (video?.duration) return Number(video.duration);
  return undefined;
}

function hasStream(probe: Record<string, unknown> | null, type: "audio" | "video"): boolean {
  const streams = probe?.streams as Array<{ codec_type?: string }> | undefined;
  return Boolean(streams?.some((s) => s.codec_type === type));
}

export function validateLiveMedia(input: {
  lessonId: string;
  locale: VideoLocale;
  videoPath: string;
  audioPath: string;
  captionsPath: string;
  expectedScriptChecksum: string;
  actualScriptChecksum: string;
  expectedVoiceProfileId: string;
  actualVoiceProfileId: string;
  priorVideoChecksum?: string;
  cellId: string;
}): LiveMediaValidationResult {
  const errors: string[] = [];

  if (input.expectedScriptChecksum !== input.actualScriptChecksum) {
    errors.push("Script checksum mismatch vs manifest extraction");
  }
  if (input.expectedVoiceProfileId !== input.actualVoiceProfileId) {
    errors.push("Voice profile mismatch for locale");
  }

  const brand = ensureRenderBrandAsset();
  let logoChecksum: string | undefined;
  let logoDimensions: string | undefined;
  if (!brand.ok) {
    errors.push(...brand.errors.map((e) => `Brand: ${e}`));
  } else {
    logoChecksum = brand.sha256;
    logoDimensions = `${brand.width}x${brand.height}`;
  }

  const overwrite = preventOverwrittenVideo(
    input.priorVideoChecksum,
    existsSync(input.videoPath) ? sha256Hex(readFileSync(input.videoPath)) : "",
    input.cellId,
  );
  if (!overwrite.ok && input.priorVideoChecksum) errors.push(overwrite.error!);

  let hasAudio = false;
  let hasVideo = false;
  let hasCaptions = false;
  let durationSeconds: number | undefined;
  let videoChecksum: string | undefined;
  let audioChecksum: string | undefined;
  let captionsChecksum: string | undefined;
  let ffprobe: Record<string, unknown> | undefined;

  if (!existsSync(input.videoPath)) {
    errors.push(`Missing video: ${input.videoPath}`);
  } else {
    const st = statSync(input.videoPath);
    if (st.size < 1024) errors.push(`Video too small (${st.size} bytes)`);
    videoChecksum = sha256Hex(readFileSync(input.videoPath));
    ffprobe = ffprobeJson(input.videoPath) ?? undefined;
    hasVideo = hasStream(ffprobe ?? null, "video");
    if (!hasVideo) errors.push("Video stream missing (ffprobe)");
    durationSeconds = streamDuration(ffprobe ?? null);
    if (durationSeconds !== undefined && durationSeconds <= 0) {
      errors.push("Zero or negative video duration");
    }
  }

  if (!existsSync(input.audioPath)) {
    errors.push(`Missing audio: ${input.audioPath}`);
  } else {
    const st = statSync(input.audioPath);
    hasAudio = st.size >= 512;
    if (!hasAudio) errors.push(`Audio too small (${st.size} bytes)`);
    audioChecksum = sha256Hex(readFileSync(input.audioPath));
    const audioProbe = ffprobeJson(input.audioPath);
    if (!hasStream(audioProbe, "audio")) errors.push("Audio stream missing (ffprobe)");
  }

  if (!existsSync(input.captionsPath)) {
    errors.push(`Missing captions: ${input.captionsPath}`);
  } else {
    const vtt = readFileSync(input.captionsPath, "utf8");
    hasCaptions = vtt.includes("WEBVTT") && vtt.length > 20;
    if (!hasCaptions) errors.push("Invalid captions file");
    captionsChecksum = sha256Hex(vtt);
    const localeGuard = captionsLocaleGuard(vtt, input.locale);
    if (!localeGuard.ok) errors.push(localeGuard.error!);
  }

  return {
    ok: errors.length === 0,
    lessonId: input.lessonId,
    locale: input.locale,
    errors,
    durationSeconds,
    hasAudio,
    hasVideo,
    hasCaptions,
    videoChecksum,
    audioChecksum,
    captionsChecksum,
    logoChecksum,
    logoDimensions,
    ffprobe,
  };
}

export function shouldSkipLiveRegeneration(
  record: { outputStatus?: string; scriptChecksum?: string; videoChecksum?: string; packageChecksum?: string } | undefined,
  scriptChecksum: string,
  packageChecksum: string,
  force: boolean,
): { skip: boolean; reason?: string } {
  if (force) return { skip: false };
  if (!record) return { skip: false };
  if (record.outputStatus === "committed" || record.outputStatus === "validated") {
    if (
      record.scriptChecksum === scriptChecksum &&
      record.videoChecksum &&
      record.packageChecksum === packageChecksum
    ) {
      return { skip: true, reason: "Already validated with matching checksums" };
    }
  }
  return { skip: false };
}

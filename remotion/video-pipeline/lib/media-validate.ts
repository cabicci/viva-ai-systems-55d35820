import { existsSync, readFileSync, statSync } from "node:fs";
import { sha256Hex } from "./checksum.ts";
import type { MediaValidationResult, VideoLocale } from "./types.ts";

const MIN_VIDEO_BYTES = 256;
const MIN_AUDIO_BYTES = 64;
const MIN_CAPTION_BYTES = 10;

function readDurationFromVtt(vtt: string): number | undefined {
  const match = vtt.match(/(\d{2}):(\d{2}):(\d{2})\.(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})\.(\d{3})/);
  if (!match) return undefined;
  const end =
    Number(match[5]) * 3600 +
    Number(match[6]) * 60 +
    Number(match[7]) +
    Number(match[8]) / 1000;
  return end;
}

export function validateMediaArtifacts(input: {
  lessonId: string;
  locale: VideoLocale;
  videoPath: string;
  audioPath: string;
  captionsPath: string;
}): MediaValidationResult {
  const errors: string[] = [];
  let hasAudio = false;
  let hasCaptions = false;
  let fileSizeBytes: number | undefined;
  let durationSeconds: number | undefined;

  if (!existsSync(input.videoPath)) {
    errors.push(`Missing video: ${input.videoPath}`);
  } else {
    const st = statSync(input.videoPath);
    fileSizeBytes = st.size;
    if (st.size < MIN_VIDEO_BYTES) {
      errors.push(`Video too small (${st.size} bytes)`);
    }
    if (st.size === 0) {
      errors.push("Zero-duration or corrupt media: video file is empty");
    }
  }

  if (!existsSync(input.audioPath)) {
    errors.push(`Missing audio: ${input.audioPath}`);
  } else {
    const st = statSync(input.audioPath);
    hasAudio = st.size >= MIN_AUDIO_BYTES;
    if (!hasAudio) errors.push(`Audio too small (${st.size} bytes)`);
  }

  if (!existsSync(input.captionsPath)) {
    errors.push(`Missing captions: ${input.captionsPath}`);
  } else {
    const vtt = readFileSync(input.captionsPath, "utf8");
    hasCaptions = vtt.length >= MIN_CAPTION_BYTES && vtt.includes("WEBVTT");
    if (!hasCaptions) errors.push("Captions invalid or missing WEBVTT header");
    durationSeconds = readDurationFromVtt(vtt);
    if (durationSeconds !== undefined && durationSeconds <= 0) {
      errors.push("Zero-duration captions");
    }
  }

  return {
    ok: errors.length === 0,
    lessonId: input.lessonId,
    locale: input.locale,
    errors,
    hasAudio,
    hasCaptions,
    fileSizeBytes,
    durationSeconds,
  };
}

export function artifactChecksums(paths: {
  videoPath: string;
  audioPath: string;
  captionsPath: string;
}): { video: string; audio: string; captions: string } {
  return {
    video: sha256Hex(readFileSync(paths.videoPath)),
    audio: sha256Hex(readFileSync(paths.audioPath)),
    captions: sha256Hex(readFileSync(paths.captionsPath)),
  };
}

export function preventDuplicateOutput(
  existingVideoChecksums: Set<string>,
  newVideoChecksum: string,
  cellId: string,
): { ok: boolean; error?: string } {
  if (existingVideoChecksums.has(newVideoChecksum)) {
    return { ok: false, error: `Duplicate video checksum for ${cellId}` };
  }
  return { ok: true };
}

export function preventOverwrittenVideo(
  priorChecksum: string | undefined,
  newChecksum: string,
  cellId: string,
): { ok: boolean; error?: string } {
  if (priorChecksum && priorChecksum !== newChecksum) {
    return {
      ok: false,
      error: `Would overwrite existing video for ${cellId} (checksum changed)`,
    };
  }
  return { ok: true };
}

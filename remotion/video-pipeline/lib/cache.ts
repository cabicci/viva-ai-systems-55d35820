import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { PIPELINE_ROOT } from "./paths.ts";
import type { VideoLocale } from "./types.ts";

const VERSION_PATH = path.join(PIPELINE_ROOT, "config", "pipeline-version.json");

export interface PipelineVersion {
  rendererVersion: string;
  remotionVersion: string;
  fps: number;
  brandIntroFrames: number;
  tailSilenceFrames: number;
  ttsModel: string;
}

let cachedVersion: PipelineVersion | null = null;

export function loadPipelineVersion(): PipelineVersion {
  if (!cachedVersion) {
    cachedVersion = JSON.parse(readFileSync(VERSION_PATH, "utf8")) as PipelineVersion;
  }
  return cachedVersion;
}

export function buildCacheKey(input: {
  locale: VideoLocale;
  lessonId: string;
  packageChecksum: string;
  voiceProfileId: string;
  scriptChecksum: string;
}): string {
  const version = loadPipelineVersion();
  const raw = [
    input.locale,
    input.lessonId,
    input.packageChecksum,
    input.voiceProfileId,
    input.scriptChecksum,
    version.rendererVersion,
    version.ttsModel,
  ].join("|");
  return createHash("sha256").update(raw).digest("hex");
}

export function cacheDirForKey(cacheKey: string): string {
  return path.join(PIPELINE_ROOT, "cache", cacheKey);
}

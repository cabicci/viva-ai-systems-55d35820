import path from "node:path";
import { fileURLToPath } from "node:url";
import type { VideoLocale } from "./types.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const PIPELINE_ROOT = path.resolve(__dirname, "..");
export const REPO_ROOT = path.resolve(PIPELINE_ROOT, "../..");
export const MANIFEST_PATH = path.join(PIPELINE_ROOT, "manifest", "video-manifest.json");
export const STATUS_REGISTRY_PATH = path.join(PIPELINE_ROOT, "status", "registry.json");
export const VOICE_PROFILES_PATH = path.join(PIPELINE_ROOT, "config", "voice-profiles.json");
export const OUTPUT_ROOT = path.join(PIPELINE_ROOT, "output");
export const QUEUE_DIR = path.join(PIPELINE_ROOT, "queue");

export function localeLessonsDir(locale: VideoLocale): string {
  return path.join(REPO_ROOT, "src/lib/locale-lessons", locale, "lessons");
}

export function packagePathFor(locale: VideoLocale, lessonId: string): string {
  return `src/lib/locale-lessons/${locale}/lessons/${lessonId}.json`;
}

export function cellId(locale: VideoLocale, lessonId: string): string {
  return `${locale}::${lessonId}`;
}

export function outputDirFor(locale: VideoLocale, lessonId: string): string {
  return path.join(OUTPUT_ROOT, locale, lessonId);
}

export function parseCellId(id: string): { locale: VideoLocale; lessonId: string } {
  const idx = id.indexOf("::");
  if (idx < 0) throw new Error(`Invalid cellId: ${id}`);
  return {
    locale: id.slice(0, idx) as VideoLocale,
    lessonId: id.slice(idx + 2),
  };
}

import { readFileSync } from "node:fs";
import path from "node:path";
import arGulfManifest from "../../../src/lib/locale-lessons/ar-Gulf/manifest.json";
import arMsaManifest from "../../../src/lib/locale-lessons/ar-MSA/manifest.json";
import enManifest from "../../../src/lib/locale-lessons/en/manifest.json";
import type { LocalizedLessonPackage } from "../../../src/lib/locale-lessons/types.ts";
import { fileChecksum } from "./checksum.ts";
import { cellId, localeLessonsDir, packagePathFor, REPO_ROOT } from "./paths.ts";
import type {
  VideoLocale,
  VideoManifest,
  VideoManifestEntry,
  VideoTrack,
} from "./types.ts";
import {
  BASELINE_SHA,
  REQUIRED_LOCALE_TOTALS,
  REQUIRED_TOTAL_VIDEOS,
} from "./types.ts";
import { voiceProfileForLocale } from "./voice-map.ts";

const LOCALE_MANIFESTS: Record<VideoLocale, { lessonIds: string[] }> = {
  "ar-MSA": arMsaManifest,
  "ar-Gulf": arGulfManifest,
  en: enManifest,
};

const TRACK_IDS = [
  "intro",
  "business",
  "creator",
  "analyst",
  "automator",
  "builder",
] as const;

function inferTrack(lessonId: string, pathId?: string): VideoTrack {
  if (pathId && TRACK_IDS.includes(pathId as VideoTrack)) {
    return pathId as VideoTrack;
  }
  const prefix = lessonId.split("-")[0];
  if (TRACK_IDS.includes(prefix as VideoTrack)) return prefix as VideoTrack;
  throw new Error(`Cannot infer track for lessonId=${lessonId}`);
}

function loadPackage(locale: VideoLocale, lessonId: string): LocalizedLessonPackage {
  const abs = path.join(localeLessonsDir(locale), `${lessonId}.json`);
  return JSON.parse(readFileSync(abs, "utf8")) as LocalizedLessonPackage;
}

export function buildManifestEntry(
  locale: VideoLocale,
  lessonId: string,
  sourceSha: string = BASELINE_SHA,
): VideoManifestEntry {
  const pkg = loadPackage(locale, lessonId);
  if (pkg.locale !== locale) {
    throw new Error(`Package locale mismatch: expected ${locale}, got ${pkg.locale}`);
  }
  if (pkg.lessonId !== lessonId) {
    throw new Error(`Package lessonId mismatch: expected ${lessonId}, got ${pkg.lessonId}`);
  }

  const relPackagePath = packagePathFor(locale, lessonId);
  const absPackagePath = path.join(REPO_ROOT, relPackagePath);
  const checksum = fileChecksum(absPackagePath);
  const voice = voiceProfileForLocale(locale);

  return {
    cellId: cellId(locale, lessonId),
    lessonId,
    locale,
    track: inferTrack(lessonId, pkg.pathId),
    module: pkg.moduleId ?? `${inferTrack(lessonId, pkg.pathId)}-unknown`,
    packagePath: relPackagePath,
    sourceSha,
    packageChecksum: checksum,
    voiceProfileId: voice.profileId,
    outputStatus: "pending",
  };
}

export function buildVideoManifest(sourceSha: string = BASELINE_SHA): VideoManifest {
  const entries: VideoManifestEntry[] = [];

  for (const locale of ["ar-MSA", "ar-Gulf", "en"] as const) {
    const manifest = LOCALE_MANIFESTS[locale];
    if (manifest.lessonIds.length !== REQUIRED_LOCALE_TOTALS[locale]) {
      throw new Error(
        `${locale} manifest has ${manifest.lessonIds.length} lessons, expected ${REQUIRED_LOCALE_TOTALS[locale]}`,
      );
    }
    for (const lessonId of manifest.lessonIds) {
      entries.push(buildManifestEntry(locale, lessonId, sourceSha));
    }
  }

  entries.sort((a, b) =>
    a.locale === b.locale
      ? a.lessonId.localeCompare(b.lessonId)
      : a.locale.localeCompare(b.locale),
  );

  const localeTotals = {
    "ar-MSA": entries.filter((e) => e.locale === "ar-MSA").length,
    "ar-Gulf": entries.filter((e) => e.locale === "ar-Gulf").length,
    en: entries.filter((e) => e.locale === "en").length,
  };

  if (entries.length !== REQUIRED_TOTAL_VIDEOS) {
    throw new Error(`Expected ${REQUIRED_TOTAL_VIDEOS} entries, got ${entries.length}`);
  }

  return {
    version: 1,
    baselineSha: sourceSha,
    generatedAt: new Date().toISOString(),
    totalVideos: entries.length,
    localeTotals,
    entries,
  };
}

export function assertManifestInvariants(manifest: VideoManifest): void {
  if (manifest.totalVideos !== REQUIRED_TOTAL_VIDEOS) {
    throw new Error(`totalVideos must be ${REQUIRED_TOTAL_VIDEOS}`);
  }
  for (const [locale, expected] of Object.entries(REQUIRED_LOCALE_TOTALS)) {
    const actual = manifest.localeTotals[locale as VideoLocale];
    if (actual !== expected) {
      throw new Error(`${locale} total must be ${expected}, got ${actual}`);
    }
  }

  const ids = new Set<string>();
  for (const entry of manifest.entries) {
    if (ids.has(entry.cellId)) {
      throw new Error(`Duplicate cellId: ${entry.cellId}`);
    }
    ids.add(entry.cellId);
  }
}

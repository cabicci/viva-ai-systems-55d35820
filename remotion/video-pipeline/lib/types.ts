/** Video production pipeline — workstream-scoped types (Agent 3). */

export type VideoLocale = "ar-MSA" | "ar-Gulf" | "en";

export type VideoOutputStatus =
  | "pending"
  | "script_ready"
  | "tts_ready"
  | "rendered"
  | "validated"
  | "committed"
  | "failed";

export type VideoTrack =
  | "intro"
  | "business"
  | "creator"
  | "analyst"
  | "automator"
  | "builder";

export interface VoiceProfile {
  profileId: string;
  locale: VideoLocale;
  dialect: string;
  primaryVoice: string;
  secondaryVoice: string;
  ttsRulesKey: string;
  forbiddenLocales: VideoLocale[];
}

export interface VideoManifestEntry {
  cellId: string;
  lessonId: string;
  locale: VideoLocale;
  track: VideoTrack;
  module: string;
  packagePath: string;
  sourceSha: string;
  packageChecksum: string;
  voiceProfileId: string;
  outputStatus: VideoOutputStatus;
}

export interface VideoManifest {
  version: 1;
  baselineSha: string;
  generatedAt: string;
  totalVideos: number;
  localeTotals: Record<VideoLocale, number>;
  entries: VideoManifestEntry[];
}

export interface ExtractedScriptSection {
  role: string;
  heading: string;
  text: string;
}

export interface ExtractedScript {
  lessonId: string;
  locale: VideoLocale;
  title: string;
  sections: ExtractedScriptSection[];
  fullText: string;
  checksum: string;
}

export interface ScriptValidationResult {
  ok: boolean;
  lessonId: string;
  locale: VideoLocale;
  errors: string[];
  warnings: string[];
}

export interface MediaArtifactPaths {
  videoPath: string;
  audioPath: string;
  captionsPath: string;
  logPath: string;
}

export interface MediaValidationResult {
  ok: boolean;
  lessonId: string;
  locale: VideoLocale;
  errors: string[];
  durationSeconds?: number;
  hasAudio: boolean;
  hasCaptions: boolean;
  fileSizeBytes?: number;
}

export interface VideoStatusRecord {
  cellId: string;
  lessonId: string;
  locale: VideoLocale;
  track: VideoTrack;
  module: string;
  packagePath: string;
  sourceSha: string;
  packageChecksum: string;
  voiceProfileId: string;
  outputStatus: VideoOutputStatus;
  scriptChecksum?: string;
  videoChecksum?: string;
  captionsChecksum?: string;
  committedSha?: string;
  error?: string;
  updatedAt: string;
}

export interface CommitQueueItem {
  cellId: string;
  lessonId: string;
  locale: VideoLocale;
  artifactsDir: string;
  statusRecord: VideoStatusRecord;
}

export const BASELINE_SHA = "3e1ef5aaf0ca4f3dbcf28650751e0dd1de70bfc2";
export const VIDEO_RESULTS_BRANCH = "video-results";
export const REQUIRED_TOTAL_VIDEOS = 300;
export const REQUIRED_LOCALE_TOTALS: Record<VideoLocale, number> = {
  "ar-MSA": 100,
  "ar-Gulf": 100,
  en: 100,
};

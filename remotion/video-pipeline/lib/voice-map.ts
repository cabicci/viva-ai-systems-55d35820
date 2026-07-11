import { readFileSync } from "node:fs";
import { VOICE_PROFILES_PATH } from "./paths.ts";
import type { VideoLocale, VoiceProfile } from "./types.ts";

type VoiceProfileMap = Record<VideoLocale, VoiceProfile>;

let cached: VoiceProfileMap | null = null;

export function loadVoiceProfiles(): VoiceProfileMap {
  if (!cached) {
    cached = JSON.parse(readFileSync(VOICE_PROFILES_PATH, "utf8")) as VoiceProfileMap;
  }
  return cached;
}

export function voiceProfileForLocale(locale: VideoLocale): VoiceProfile {
  const profiles = loadVoiceProfiles();
  const profile = profiles[locale];
  if (!profile) throw new Error(`No voice profile for locale ${locale}`);
  if (profile.locale !== locale) {
    throw new Error(`Voice profile locale mismatch for ${locale}`);
  }
  return profile;
}

export function assertVoiceMappingComplete(
  locales: VideoLocale[],
): Record<VideoLocale, VoiceProfile> {
  const profiles = loadVoiceProfiles();
  const out = {} as Record<VideoLocale, VoiceProfile>;
  for (const locale of locales) {
    out[locale] = voiceProfileForLocale(locale);
  }
  return out;
}

export function validateVoiceForLocale(
  locale: VideoLocale,
  assignedVoice: string,
): { ok: boolean; error?: string } {
  const profile = voiceProfileForLocale(locale);
  const allowed = new Set([profile.primaryVoice, profile.secondaryVoice]);
  if (!allowed.has(assignedVoice)) {
    return {
      ok: false,
      error: `Voice ${assignedVoice} not allowed for ${locale}; allowed: ${[...allowed].join(", ")}`,
    };
  }
  return { ok: true };
}

export function preventWrongLocaleVoice(
  locale: VideoLocale,
  voiceProfileId: string,
): { ok: boolean; error?: string } {
  const profile = voiceProfileForLocale(locale);
  if (profile.profileId !== voiceProfileId) {
    return {
      ok: false,
      error: `Voice profile ${voiceProfileId} does not match locale ${locale} (${profile.profileId})`,
    };
  }
  if (profile.forbiddenLocales.includes(locale)) {
    return { ok: false, error: `Locale ${locale} is forbidden for profile ${voiceProfileId}` };
  }
  return { ok: true };
}

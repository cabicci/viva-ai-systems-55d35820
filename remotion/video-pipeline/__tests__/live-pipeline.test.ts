import { describe, expect, it } from "vitest";
import { buildCacheKey } from "../lib/cache.ts";
import { buildScenesFromScript, ttsSegmentsFromScenes } from "../lib/scene-builder.ts";
import { buildWebVtt, captionsLocaleGuard } from "../lib/captions.ts";
import { extractScript } from "../lib/script-extract.ts";
import { voiceProfileForLocale, preventWrongLocaleVoice } from "../lib/voice-map.ts";
import { shouldSkipLiveRegeneration } from "../lib/live-media-validate.ts";
import { PILOT_LESSON_IDS } from "../lib/pilot-lessons.ts";
import { ensureRenderBrandAsset, validateBrandAsset } from "../lib/brand-guard.ts";
import path from "node:path";
import { writeFileSync, unlinkSync } from "node:fs";
import { REPO_ROOT } from "../lib/paths.ts";

describe("live video pipeline", () => {
  it("builds locale-isolated cache keys", () => {
    const a = buildCacheKey({
      locale: "ar-MSA",
      lessonId: "intro-m1-l4-ai-can-cannot",
      packageChecksum: "abc",
      voiceProfileId: "gemini-ar-msa-formal",
      scriptChecksum: "script-a",
    });
    const b = buildCacheKey({
      locale: "en",
      lessonId: "intro-m1-l4-ai-can-cannot",
      packageChecksum: "abc",
      voiceProfileId: "gemini-en-narrator",
      scriptChecksum: "script-b",
    });
    expect(a).not.toBe(b);
  });

  it("builds scenes and TTS segments for pilot lessons in all locales", () => {
    for (const lessonId of PILOT_LESSON_IDS) {
      for (const locale of ["ar-MSA", "ar-Gulf", "en"] as const) {
        const script = extractScript(locale, lessonId);
        const scenes = buildScenesFromScript(script);
        expect(scenes.length).toBeGreaterThan(3);
        const segments = ttsSegmentsFromScenes(scenes);
        const profile = voiceProfileForLocale(locale);
        for (const seg of segments) {
          expect([profile.primaryVoice, profile.secondaryVoice]).toContain(seg.voice);
        }
        const vtt = buildWebVtt(
          locale,
          segments.map((s, i) => ({
            idx: i + 1,
            text: s.text,
            startSec: i * 5,
            durationSec: 4,
          })),
        );
        expect(captionsLocaleGuard(vtt, locale).ok).toBe(true);
      }
    }
  });

  it("rejects wrong voice profile for locale", () => {
    const gate = preventWrongLocaleVoice("en", "gemini-ar-msa-formal");
    expect(gate.ok).toBe(false);
  });

  it("skips regeneration when validated checksums match", () => {
    const skip = shouldSkipLiveRegeneration(
      {
        outputStatus: "validated",
        scriptChecksum: "s1",
        videoChecksum: "v1",
        packageChecksum: "p1",
      },
      "s1",
      "p1",
      false,
    );
    expect(skip.skip).toBe(true);
  });

  it("accepts verified official logo and rejects placeholder dimensions", () => {
    const official = ensureRenderBrandAsset();
    expect(official.ok).toBe(true);
    expect(official.sha256).toBe("60620006f7f74dcc625ccbd9869a19b45a7683fde04b729694b1c76d1a51d706");
    expect(official.width).toBe(574);
    expect(official.height).toBe(172);

    const placeholderPath = path.join(REPO_ROOT, "remotion/video-pipeline/assets/brand/_test-placeholder.png");
    const buf = Buffer.alloc(44);
    buf.writeUInt32BE(0x89504e47, 0);
    buf.writeUInt32BE(13, 16);
    buf.writeUInt32BE(1, 20);
    writeFileSync(placeholderPath, Buffer.concat([buf, Buffer.alloc(1)]));
    const bad = validateBrandAsset(placeholderPath);
    expect(bad.ok).toBe(false);
    unlinkSync(placeholderPath);
  });

  it("does not skip failed cells on retry", () => {
    const skip = shouldSkipLiveRegeneration(
      { outputStatus: "failed", scriptChecksum: "s1", packageChecksum: "p1" },
      "s1",
      "p1",
      false,
    );
    expect(skip.skip).toBe(false);
  });
});

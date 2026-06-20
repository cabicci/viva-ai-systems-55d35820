import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ARCHIVED_LESSON_ID_SET } from "@/lib/archived-lessons";
import type {
  AdaptationPlanManifest,
  LocalizedLessonManifest,
  LocalizedSampleManifest,
} from "@/lib/locale-lessons/types";
import { ADAPTATION_TARGET_LOCALES, REQUIRED_LESSON_COUNT } from "@/lib/locale-lessons/types";
import { buildAdaptationPrompt } from "../../../scripts/locale-lessons/prompts/build-prompt.ts";
import { buildAdaptationPlan } from "../../../scripts/locale-lessons/plan-adaptation.ts";
import { validateSampleTargetPackage } from "../../../scripts/locale-lessons/generate-localized-samples.ts";
import {
  loadMsaLessonPackage,
  manifestPathForLocale,
  validateMsaSourcePackage,
  validateTargetPackage,
} from "../../../scripts/locale-lessons/lib/source-package.ts";
import { activeLessonIds } from "../../../scripts/locale-lessons/lib/active-lesson-ids.ts";
import { SAMPLE_LESSON_COUNT } from "../../../scripts/locale-lessons/lib/sample-lesson-ids.ts";

const REPO_ROOT = path.resolve(import.meta.dirname, "../../..");
const MSA_MANIFEST = path.join(REPO_ROOT, "src/lib/locale-lessons/ar-MSA/manifest.json");

describe("locale-lessons adaptation pipeline", () => {
  it("validates ar-MSA source package has exactly 100 active lessons", async () => {
    const result = await validateMsaSourcePackage();
    expect(result.ok).toBe(true);
    expect(result.foundLessonCount).toBe(REQUIRED_LESSON_COUNT);
    expect(result.missingIds).toEqual([]);
    expect(result.extraIds).toEqual([]);
    expect(result.archivedIncluded).toEqual([]);
  });

  it("treats target packages as sample (3) or empty — never valid at full 100 until complete", async () => {
    for (const target of ADAPTATION_TARGET_LOCALES) {
      const manifestPath = manifestPathForLocale(target);
      if (existsSync(manifestPath)) {
        const manifest = JSON.parse(
          readFileSync(manifestPath, "utf8"),
        ) as LocalizedSampleManifest;
        if (manifest.packageStatus === "sample") {
          const sample = await validateSampleTargetPackage(target);
          expect(sample.ok).toBe(true);
          expect(sample.count).toBe(SAMPLE_LESSON_COUNT);
          continue;
        }
      }

      const result = await validateTargetPackage(target);
      if (result.foundLessonCount === 0) {
        expect(result.ok).toBe(false);
        continue;
      }

      expect(result.foundLessonCount).not.toBe(REQUIRED_LESSON_COUNT);
      expect(result.ok).toBe(false);
    }
  });

  it("builds adaptation plans with matching lesson IDs and no archived slugs", async () => {
    const expected = activeLessonIds();
    for (const target of ADAPTATION_TARGET_LOCALES) {
      const plan = await buildAdaptationPlan(target, "2026-06-20T00:00:00.000Z");
      expect(plan.sourceLocale).toBe("ar-MSA");
      expect(plan.locale).toBe(target);
      expect(plan.lessonCount).toBe(REQUIRED_LESSON_COUNT);
      expect(plan.lessonIds).toEqual(expected);
      expect(plan.generationBlocked).toBe(true);
      for (const id of plan.lessonIds) {
        expect(ARCHIVED_LESSON_ID_SET.has(id)).toBe(false);
      }
    }
  });

  it("writes committed adaptation plan manifests for ar-Gulf and en", () => {
    for (const target of ADAPTATION_TARGET_LOCALES) {
      const planPath = path.join(
        REPO_ROOT,
        "src/lib/locale-lessons",
        target,
        "adaptation-plan.json",
      );
      expect(existsSync(planPath), planPath).toBe(true);
      const plan = JSON.parse(readFileSync(planPath, "utf8")) as AdaptationPlanManifest;
      expect(plan.status).toBe("planned");
      expect(plan.mode).toBe("dry-run");
      expect(plan.lessonIds).toHaveLength(REQUIRED_LESSON_COUNT);
    }
  });

  it("builds contextual (non-literal) adaptation prompts preserving lesson metadata", async () => {
    const msaManifest = JSON.parse(
      readFileSync(MSA_MANIFEST, "utf8"),
    ) as LocalizedLessonManifest;
    const sampleId = msaManifest.lessonIds[0];
    const source = await loadMsaLessonPackage(sampleId);

    for (const target of ADAPTATION_TARGET_LOCALES) {
      const prompt = buildAdaptationPrompt(target, source);
      expect(prompt.systemPrompt).toContain("Do NOT perform literal");
      expect(prompt.systemPrompt).toContain("preserveLessonId");
      expect(prompt.systemPrompt).toContain("TITLE RULES");
      expect(prompt.userPrompt).toContain(`lessonId: ${sampleId}`);
      expect(prompt.userPrompt).toContain(`targetLocale: ${target}`);
      expect(prompt.userPrompt).toContain(source.pathId ?? "unknown");
      expect(prompt.userPrompt).toContain('"sections"');
    }
  });
});

/**
 * Build production rendering specs from authoritative masters.
 * Replaces the placeholder lesson-visual:${LESSON_ID}:${LOCALE}.
 */
import type { LessonVisualMaster, Locale, Method } from "../types";

export const RENDERING_SPEC_SCHEMA = "lesson-visual-rendering-spec/v1" as const;

export interface LocaleRenderingSpec {
  schemaVersion: typeof RENDERING_SPEC_SCHEMA;
  lessonId: string;
  locale: Locale;
  method: Method;
  title: string;
  coreIdea: string;
  instructionalPurpose: string;
  tension: string;
  missionIntro: string;
  orientation: string[];
  comparison: {
    leftLabel: string;
    rightLabel: string;
    leftBody: string;
    rightBody: string;
  };
  labels: Array<{ id: string; text: string }>;
  altText: string;
  compositionPattern: string;
  masterChecksum: string;
  sourcePackagePath: string;
}

export function buildLocaleRenderingSpec(
  master: LessonVisualMaster,
  locale: Locale,
  method: Method,
): LocaleRenderingSpec {
  const labels = master.labelPacks[locale];
  if (!labels) {
    throw new Error(`master missing labelPacks for locale ${locale}`);
  }
  const comparison = master.contentBrief.comparison[locale];
  if (!comparison) {
    throw new Error(`master missing comparison for locale ${locale}`);
  }
  const title = master.titles[locale];
  if (!title?.trim()) {
    throw new Error(`master missing title for locale ${locale}`);
  }
  return {
    schemaVersion: RENDERING_SPEC_SCHEMA,
    lessonId: master.lessonId,
    locale,
    method,
    title,
    coreIdea: master.contentBrief.coreIdea[locale],
    instructionalPurpose: master.contentBrief.instructionalPurpose[locale],
    tension: master.contentBrief.tension[locale],
    missionIntro: master.contentBrief.missionIntro[locale],
    orientation: [...master.contentBrief.orientation[locale]],
    comparison: { ...comparison },
    labels: labels.map((l) => ({ id: l.id, text: l.text })),
    altText: master.altTexts[locale],
    compositionPattern: master.compositionPattern,
    masterChecksum: master.checksum,
    sourcePackagePath: master.sourcePackages[locale].path,
  };
}

export function serializeRenderingSpec(spec: LocaleRenderingSpec): string {
  return JSON.stringify(spec);
}

/** Text-free OpenAI Images prompt derived from master (never sends internal schema). */
export function buildOpenAIImagesPrompt(master: LessonVisualMaster, locale: Locale): string {
  const contract = master.aiPromptContract;
  const rules = contract?.promptRules?.length
    ? contract.promptRules
    : [
        "Produce a text-free instructional illustration.",
        "Do not render letters, numbers, UI chrome text, watermarks, or logos with readable text.",
      ];
  const purpose = master.contentBrief.instructionalPurpose[locale];
  const core = master.contentBrief.coreIdea[locale];
  const objects = master.contentBrief.lessonObjects.join(", ");
  const relationships = master.contentBrief.relationships.join("; ");
  return [
    `Instructional illustration for lesson ${master.lessonId}.`,
    `Composition pattern: ${master.compositionPattern}.`,
    `Visual intent: ${master.contentBrief.visualIntent.summary}.`,
    `Core idea (for composition only, do not paint as text): ${core}`,
    `Instructional purpose (for composition only, do not paint as text): ${purpose}`,
    `Depict these objects abstractly: ${objects}.`,
    `Show these relationships abstractly: ${relationships}.`,
    ...rules.map((r) => `Rule: ${r}`),
  ].join("\n");
}

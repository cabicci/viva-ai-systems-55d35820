// Shared scene schema for the generic lesson video pipeline.
// Mirrors fields used by all card components in this folder.

import type { PresentationLocale } from "./presentationChrome";

export type { PresentationLocale };

export type SceneAccent =
  | "mint"
  | "lavender"
  | "peach"
  | "yellow"
  | "pink"
  | "mintDeep";

// Approved text-length limits for the design system.
// Enforced by scripts/lesson-text-lint.ts (reports, never deletes).
export const TEXT_LIMITS = {
  titleMaxChars: 60,
  highlightMaxChars: 24,
  subtitleMaxChars: 140,
  bulletMaxChars: 80,
  compareBodyMaxChars: 160,
  maxBullets: 5,
} as const;

/** Optional; stamped only by localized generation. Legacy modules omit it. */
type WithOptionalLocale = {
  locale?: PresentationLocale;
};

export type SceneData =
  | ({
      card: "TitleCard";
      accent: SceneAccent;
      chip: string;
      title: string;
      highlight: string;
      subtitle: string;
    } & WithOptionalLocale)
  | ({
      card: "ConceptCard";
      accent: SceneAccent;
      term: string;
      definition: string;
      tag: string;
    } & WithOptionalLocale)
  | ({
      card: "BigStatCard";
      accent: SceneAccent;
      intro: string;
      big: string;
      outro: string;
    } & WithOptionalLocale)
  | ({
      card: "BulletsCard";
      accent: SceneAccent;
      title: string;
      bullets: string[];
    } & WithOptionalLocale)
  | ({
      card: "CompareCard";
      accent: SceneAccent;
      title: string;
      left: { label: string; body: string };
      right: { label: string; body: string };
    } & WithOptionalLocale)
  | ({
      card: "CTACard";
      accent: SceneAccent;
      eyebrow: string;
      title: string;
      highlight: string;
      tagline: string;
    } & WithOptionalLocale)
  | ({
      card: "ScreenshotCard";
      accent: SceneAccent;
      eyebrow: string;
      title: string;
      caption: string;
      // Public-URL path to a screenshot bundled in remotion/public/
      src: string;
    } & WithOptionalLocale);

/** Prefer an explicit prop; else first scene stamped by localized generation. */
export const resolvePresentationLocale = (
  scenes: SceneData[],
  localeProp?: PresentationLocale,
): PresentationLocale | undefined => {
  if (localeProp) return localeProp;
  for (const scene of scenes) {
    if (scene.locale) return scene.locale;
  }
  return undefined;
};

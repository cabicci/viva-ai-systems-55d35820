// Shared scene schema for the generic lesson video pipeline.
// Mirrors fields used by all card components in this folder.

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

export type SceneData =
  | {
      card: "TitleCard";
      accent: SceneAccent;
      chip: string;
      title: string;
      highlight: string;
      subtitle: string;
    }
  | {
      card: "ConceptCard";
      accent: SceneAccent;
      term: string;
      definition: string;
      tag: string;
    }
  | {
      card: "BigStatCard";
      accent: SceneAccent;
      intro: string;
      big: string;
      outro: string;
    }
  | {
      card: "BulletsCard";
      accent: SceneAccent;
      title: string;
      bullets: string[];
    }
  | {
      card: "CompareCard";
      accent: SceneAccent;
      title: string;
      left: { label: string; body: string };
      right: { label: string; body: string };
    }
  | {
      card: "CTACard";
      accent: SceneAccent;
      eyebrow: string;
      title: string;
      highlight: string;
      tagline: string;
    }
  | {
      card: "ScreenshotCard";
      accent: SceneAccent;
      eyebrow: string;
      title: string;
      caption: string;
      // Public-URL path to a screenshot bundled in remotion/public/
      src: string;
    };

import type { PathId } from "@/lib/curriculum-data";

/** Stable path ids with localized title + tagline overlays (Phase 12.5A). */
export const CURRICULUM_PATH_IDS = [
  "intro",
  "business",
  "creator",
  "analyst",
  "automator",
  "builder",
] as const satisfies readonly PathId[];

export const CURRICULUM_PATH_LABEL_FIELDS = ["title", "tagline"] as const;

export type CurriculumPathLabelKey =
  `${(typeof CURRICULUM_PATH_IDS)[number]}.${(typeof CURRICULUM_PATH_LABEL_FIELDS)[number]}`;

export const CURRICULUM_PATH_LABEL_KEYS = CURRICULUM_PATH_IDS.flatMap((pathId) =>
  CURRICULUM_PATH_LABEL_FIELDS.map(
    (field) => `${pathId}.${field}` as CurriculumPathLabelKey,
  ),
);

import type { PathId } from "@/lib/curriculum-data";
import { PATHS } from "@/lib/curriculum-data";

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

/** Stable module ids with localized title + subtitle overlays (Phase 12.5B). */
export const CURRICULUM_MODULE_IDS = PATHS.flatMap((p) =>
  p.modules.map((m) => m.id),
) as readonly string[];

export const CURRICULUM_MODULE_LABEL_FIELDS = ["title", "subtitle"] as const;

export type CurriculumModuleLabelKey =
  `${(typeof CURRICULUM_MODULE_IDS)[number]}.${(typeof CURRICULUM_MODULE_LABEL_FIELDS)[number]}`;

export const CURRICULUM_MODULE_LABEL_KEYS = CURRICULUM_MODULE_IDS.flatMap((moduleId) =>
  CURRICULUM_MODULE_LABEL_FIELDS.map(
    (field) => `${moduleId}.${field}` as CurriculumModuleLabelKey,
  ),
);

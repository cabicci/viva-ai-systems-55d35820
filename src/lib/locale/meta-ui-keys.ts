import type { UiStringKey } from "./ui-strings";

/** Route head / SEO meta templates (Phase 12.6 Batch 3). */
export const META_UI_KEYS = [
  "meta.brandSuffix",
  "meta.curriculum.title",
  "meta.curriculum.description",
  "meta.dashboard.title",
  "meta.dashboard.description",
  "meta.learn.titleWithLesson",
  "meta.learn.descriptionWithLesson",
  "meta.learn.titlePathOnly",
  "meta.learn.descriptionPathOnly",
  "meta.learn.titleUnknown",
] as const satisfies readonly UiStringKey[];

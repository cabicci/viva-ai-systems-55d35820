import { curriculumCatalogue, type CurriculumSummary } from "@/lib/course-system/intake/client";
import type { SupportedLocale } from "@/lib/locale/types";

// Only the public catalogue of published course titles and outlines is shared.
// Store completed values, never in-flight requests owned by another Worker request.
const byLocale = new Map<SupportedLocale, { expires: number; courses: CurriculumSummary[] }>();
const ttlMs = 60_000;

export async function publicAiCatalogue(locale: SupportedLocale) {
  if (!import.meta.env.SSR) return curriculumCatalogue("ai", locale);
  const cached = byLocale.get(locale);
  if (cached && cached.expires > Date.now()) return cached.courses;

  const courses = await curriculumCatalogue("ai", locale);
  byLocale.set(locale, { expires: Date.now() + ttlMs, courses });
  return courses;
}

// Review-only extension. The shared production registry is not changed.
import * as base from "../../../src/lib/learning-lines";
import logo from "../assets/masaarat-academic-candidate.png";
export * from "../../../src/lib/learning-lines";
export type LearningLine = base.LearningLine | "academic";
export const LEARNING_LINES = [...base.LEARNING_LINES, "academic"] as const;
// Existing Navbar links are typed against the production route registry; this
// isolated memory router adds a review route without altering that registry.
export const LINE_ROUTES = {
  ...base.LINE_ROUTES,
  academic: "/academic",
} as typeof base.LINE_ROUTES & { academic: typeof base.LINE_ROUTES.technical };
export const LINE_PRICING = {
  ...base.LINE_PRICING,
  academic: "/academic/pricing",
} as typeof base.LINE_PRICING & { academic: typeof base.LINE_PRICING.technical };
export const LINE_CURRICULUM = {
  ...base.LINE_CURRICULUM,
  academic: "/academic/curriculum",
} as typeof base.LINE_CURRICULUM & { academic: typeof base.LINE_CURRICULUM.technical };
export const LINE_LOGOS = { ...base.LINE_LOGOS, academic: logo };
export const learningLineForPath = (path: string): LearningLine | null =>
  path.startsWith("/academic") ? "academic" : base.learningLineForPath(path);
export const getLineCopy = (locale: Parameters<typeof base.getLineCopy>[0]) => ({
  ...base.getLineCopy(locale),
  academic: locale === "en" ? "Masaarat Academic" : "مسارات أكاديمي",
});

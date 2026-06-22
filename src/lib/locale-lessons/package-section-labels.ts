import type { LessonPackageLocale } from "./types";

const INTERNAL_HEADINGS = new Set(
  [
    "orientation",
    "tension",
    "core idea",
    "glossary",
    "comparison",
    "quiz",
    "mission",
    "confidence close",
    "screenshot block (intent)",
  ].map((value) => value.toLowerCase()),
);

const EYEBROWS_EN: Record<string, string> = {
  Orientation: "Getting started",
  Tension: "Relatable moment",
  "Core idea": "Core idea",
  Glossary: "Key terms",
  Comparison: "Compare both sides",
  Quiz: "Quick check",
  Mission: "Your mission",
  "Confidence close": "Wrap-up",
  "Screenshot block (intent)": "Inside the platform",
};

const EYEBROWS_AR: Record<string, string> = {
  Orientation: "بداية الدرس",
  Tension: "موقف مألوف",
  "Core idea": "الفكرة الأساسية",
  Glossary: "مصطلحات",
  Comparison: "مقارنة",
  Quiz: "تأكيد سريع",
  Mission: "مهمتك",
  "Confidence close": "الخلاصة",
  "Screenshot block (intent)": "من المنصة",
};

export function isInternalLearnerHeading(heading: string | undefined): boolean {
  if (!heading?.trim()) return false;
  return INTERNAL_HEADINGS.has(heading.trim().toLowerCase());
}

export function isProductionReferenceSection(role: string): boolean {
  return /production reference only/i.test(role);
}

export function localizedSectionEyebrow(
  role: string,
  locale: LessonPackageLocale,
): string {
  const map = locale === "en" ? EYEBROWS_EN : EYEBROWS_AR;
  return map[role] ?? (locale === "en" ? "Section" : "قسم");
}

export function learnerFacingTitle(
  heading: string,
  subtitle: string | undefined,
  fallback: string,
): string {
  if (isInternalLearnerHeading(heading) && subtitle?.trim()) {
    return subtitle.trim();
  }
  if (heading.trim()) return heading.trim();
  return fallback;
}

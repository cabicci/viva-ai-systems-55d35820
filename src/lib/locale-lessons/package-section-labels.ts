import type { LessonPackageLocale } from "./types";

/** Internal section labels — longest entries first for prefix matching. */
const INTERNAL_HEADING_LABELS = [
  "Video block (production reference only)",
  "Screenshot block (intent)",
  "Diagram block (intent)",
  "Screenshot block",
  "Video block",
  "Confidence close",
  "Core idea",
  "Orientation",
  "Comparison",
  "Glossary",
  "Mission",
  "Quiz",
  "Tension",
] as const;

const INTERNAL_HEADINGS = new Set(
  INTERNAL_HEADING_LABELS.map((value) => value.toLowerCase()),
);

const INTERNAL_LABEL_PATTERNS = [...INTERNAL_HEADING_LABELS]
  .sort((left, right) => right.length - left.length)
  .map((label) => {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`^${escaped}(?:\\s*[—\\-:|]\\s*(.*))?$`, "i");
  });

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
  "Screenshot block": "Inside the platform",
  "Diagram block (intent)": "Visual guide",
  "Video block": "Lesson video",
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
  "Screenshot block": "من المنصة",
  "Diagram block (intent)": "رسم توضيحي",
  "Video block": "فيديو الدرس",
};

export type ParsedInternalHeading = {
  isInternal: boolean;
  learnerPart: string;
};

/** Substrings that must not appear in adapted preview output (strict hygiene). */
export const PREVIEW_INTERNAL_LABEL_LEAKS: readonly string[] = [
  "Orientation",
  "Screenshot block (intent)",
  "Screenshot block",
  "Video block (production reference only)",
  "Video block",
  "Diagram block (intent)",
  "production reference",
  "Confidence close",
];

export function parseInternalHeading(
  heading: string | undefined,
): ParsedInternalHeading {
  if (!heading?.trim()) {
    return { isInternal: false, learnerPart: "" };
  }

  const trimmed = heading.trim();
  for (const pattern of INTERNAL_LABEL_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match) {
      return {
        isInternal: true,
        learnerPart: (match[1] ?? "").trim(),
      };
    }
  }

  const lower = trimmed.toLowerCase();
  for (const label of INTERNAL_HEADING_LABELS) {
    const labelLower = label.toLowerCase();
    if (!lower.startsWith(labelLower)) continue;

    const rest = trimmed.slice(label.length);
    const separatorMatch = rest.match(
      /^\s*(?:\([^)]*\))*\s*[—\-:|]\s*(.+)$/s,
    );
    if (separatorMatch?.[1]?.trim()) {
      return { isInternal: true, learnerPart: separatorMatch[1].trim() };
    }

    if (/production reference/i.test(rest) || /^\s*(?:\([^)]*\))*\s*$/.test(rest)) {
      return { isInternal: true, learnerPart: "" };
    }
  }

  return { isInternal: false, learnerPart: trimmed };
}

export function isInternalLearnerHeading(heading: string | undefined): boolean {
  if (!heading?.trim()) return false;
  return (
    INTERNAL_HEADINGS.has(heading.trim().toLowerCase()) ||
    parseInternalHeading(heading).isInternal
  );
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
  const parsed = parseInternalHeading(heading);
  if (parsed.isInternal) {
    if (parsed.learnerPart) return parsed.learnerPart;
    const subtitleText = subtitle?.trim();
    if (subtitleText && !isInternalLearnerHeading(subtitleText)) {
      const subtitleParsed = parseInternalHeading(subtitleText);
      if (
        subtitleParsed.learnerPart &&
        !/production reference/i.test(subtitleParsed.learnerPart)
      ) {
        return subtitleParsed.learnerPart;
      }
      if (!/production reference/i.test(subtitleText)) {
        return subtitleText;
      }
    }
    return fallback;
  }
  if (heading.trim()) return heading.trim();
  return fallback;
}

/** Strip compound internal prefix; exact internal labels pass through for fallback handling. */
export function stripCompoundInternalLabelPrefix(heading: string): string {
  const parsed = parseInternalHeading(heading);
  if (!parsed.isInternal) return heading.trim();
  if (parsed.learnerPart) return parsed.learnerPart;
  return heading.trim();
}

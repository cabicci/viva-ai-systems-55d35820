import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Image as ImageIcon,
  Lightbulb,
  Rocket,
  Scale,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import type { IntroSectionTone } from "@/components/intro/IntroSection";
import {
  isInternalLearnerHeading,
  isProductionReferenceSection,
  learnerFacingTitle,
  localizedSectionEyebrow,
  parseInternalHeading,
} from "./package-section-labels";
import type {
  LessonPackageLocale,
  LocalizedLessonPackage,
  LocalizedLessonSection,
  LocalizedLessonTable,
} from "./types";

export type PreviewLessonBlock =
  | { kind: "paragraphs"; paragraphs: readonly string[] }
  | {
      kind: "concepts";
      items: readonly { term: string; meaning: string; example?: string }[];
    }
  | {
      kind: "comparison";
      left: { label: string; body: string };
      right: { label: string; body: string };
    }
  | { kind: "dataTable"; headers: readonly string[]; rows: readonly (readonly string[])[] }
  | { kind: "quizPreview"; question: string; options: readonly string[] }
  | {
      kind: "missionPreview";
      intro: string;
      delivery: readonly string[];
      rubric: readonly {
        label: string;
        weight: number;
        criteria: readonly string[];
      }[];
    }
  | { kind: "screenshotPlaceholder"; caption?: string }
  | { kind: "videoPreviewNote" };

export type PreviewLessonSection = {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  tone?: IntroSectionTone;
  block: PreviewLessonBlock;
};

export type PreviewLessonPackageInput = Pick<
  LocalizedLessonPackage,
  "locale" | "lessonId" | "title" | "sections"
>;

function normalizeRole(role: string): string {
  return role.trim().toLowerCase();
}

function stripMarkdownEmphasis(text: string): string {
  return text.replace(/\*\*/g, "").trim();
}

function cleanLearnerLine(text: string): string {
  return stripMarkdownEmphasis(text)
    .replace(/^(correct answer|الإجابة الصحيحة)\s*:?\s*/i, "")
    .replace(/\(correctIndex\s*:\s*\d+\)/gi, "")
    .trim();
}

function collectParagraphs(section: LocalizedLessonSection): string[] {
  const lines: string[] = [];
  for (const bullet of section.bullets) {
    const cleaned = cleanLearnerLine(bullet);
    if (cleaned) lines.push(cleaned);
  }
  if (lines.length > 0) return lines;

  const chunks = section.contentMarkdown
    .split(/\n{2,}/)
    .map((chunk) => cleanLearnerLine(chunk))
    .filter(Boolean);
  return chunks;
}

function isGlossaryTable(table: LocalizedLessonTable): boolean {
  const headers = table.headers.map((header) => header.toLowerCase());
  return (
    headers.includes("term") ||
    headers.includes("المصطلح") ||
    headers.includes("meaning") ||
    headers.includes("المعنى")
  );
}

function isComparisonTable(table: LocalizedLessonTable): boolean {
  if (table.headers.length !== 2) return false;
  const joined = table.headers.join(" ").toLowerCase();
  return /misunderstand|understand|غامض|واضح|if you|vs|versus|مقارنة/.test(
    joined,
  );
}

function tableToConcepts(table: LocalizedLessonTable) {
  const termIdx = table.headers.findIndex((header) =>
    /term|مصطلح/i.test(header),
  );
  const meaningIdx = table.headers.findIndex((header) =>
    /meaning|معنى/i.test(header),
  );
  const exampleIdx = table.headers.findIndex((header) =>
    /example|مثال/i.test(header),
  );

  return table.rows
    .map((row) => ({
      term: row[termIdx >= 0 ? termIdx : 0] ?? "",
      meaning: row[meaningIdx >= 0 ? meaningIdx : 1] ?? "",
      example: exampleIdx >= 0 ? row[exampleIdx] : undefined,
    }))
    .filter((item) => item.term && item.meaning);
}

function tableToComparison(table: LocalizedLessonTable) {
  const [leftLabel, rightLabel] = table.headers;
  const row = table.rows[0] ?? ["", ""];
  return {
    left: { label: leftLabel ?? "", body: row[0] ?? "" },
    right: { label: rightLabel ?? "", body: row[1] ?? "" },
  };
}

function sectionIcon(role: string): LucideIcon {
  const normalized = normalizeRole(role);
  if (normalized.includes("orientation")) return Sparkles;
  if (normalized.includes("tension")) return AlertCircle;
  if (normalized.includes("core")) return Lightbulb;
  if (normalized.includes("glossary")) return BookOpen;
  if (normalized.includes("comparison")) return Scale;
  if (normalized.includes("quiz")) return CheckCircle2;
  if (normalized.includes("mission")) return Rocket;
  if (normalized.includes("screenshot")) return ImageIcon;
  return Lightbulb;
}

function sectionTone(role: string): IntroSectionTone {
  const normalized = normalizeRole(role);
  if (normalized.includes("tension")) return "warn";
  if (normalized.includes("mission")) return "primary";
  return "accent";
}

function buildQuizBlock(section: LocalizedLessonSection): PreviewLessonBlock | null {
  if (!section.quiz?.options?.length) return null;
  const question =
    section.quiz.question?.trim() ||
    learnerFacingTitle(section.heading, section.subtitle, "Quick check");
  const options = section.quiz.options
    .map((option) => cleanLearnerLine(option))
    .filter(Boolean);
  if (!question || options.length === 0) return null;
  return { kind: "quizPreview", question, options };
}

function buildMissionBlock(section: LocalizedLessonSection): PreviewLessonBlock | null {
  if (!section.mission) return null;
  const intro =
    section.mission.intro?.trim() ||
    collectParagraphs(section).join("\n\n");
  const delivery = section.mission.delivery.map((line) => cleanLearnerLine(line));
  const rubric = section.mission.rubric.map((row) => ({
    label: row.dimension,
    weight: row.weight,
    criteria: [row.criteria],
  }));
  if (!intro && delivery.length === 0 && rubric.length === 0) return null;
  return { kind: "missionPreview", intro, delivery, rubric };
}

function buildBlock(section: LocalizedLessonSection): PreviewLessonBlock | null {
  const role = section.role;

  if (
    isProductionReferenceSection(role) ||
    /production reference/i.test(section.heading ?? "")
  ) {
    return null;
  }

  if (normalizeRole(role).includes("video")) {
    return { kind: "videoPreviewNote" };
  }

  if (normalizeRole(role).includes("quiz")) {
    return buildQuizBlock(section);
  }

  if (normalizeRole(role).includes("mission")) {
    return buildMissionBlock(section);
  }

  if (normalizeRole(role).includes("screenshot")) {
    const caption = collectParagraphs(section)[0];
    return { kind: "screenshotPlaceholder", caption };
  }

  for (const table of section.tables) {
    if (isGlossaryTable(table)) {
      const items = tableToConcepts(table);
      if (items.length > 0) return { kind: "concepts", items };
    }
    if (isComparisonTable(table)) {
      return { kind: "comparison", ...tableToComparison(table) };
    }
    if (table.headers.length > 0 && table.rows.length > 0) {
      return {
        kind: "dataTable",
        headers: table.headers,
        rows: table.rows,
      };
    }
  }

  const paragraphs = collectParagraphs(section);
  if (paragraphs.length > 0) {
    return { kind: "paragraphs", paragraphs };
  }

  return null;
}

function sectionTitle(
  section: LocalizedLessonSection,
  block: PreviewLessonBlock,
  locale: LessonPackageLocale,
): string {
  if (block.kind === "quizPreview") return block.question;
  return learnerFacingTitle(
    section.heading,
    section.subtitle,
    localizedSectionEyebrow(section.role, locale),
  );
}

function sectionEyebrow(
  section: LocalizedLessonSection,
  locale: LessonPackageLocale,
): string {
  if (
    isInternalLearnerHeading(section.heading) ||
    normalizeRole(section.role).includes("quiz")
  ) {
    return localizedSectionEyebrow(section.role, locale);
  }
  const subtitle = section.subtitle?.trim();
  if (subtitle) {
    const parsed = parseInternalHeading(subtitle);
    if (parsed.isInternal) {
      return localizedSectionEyebrow(section.role, locale);
    }
    if (!isInternalLearnerHeading(subtitle)) {
      return subtitle;
    }
  }
  return localizedSectionEyebrow(section.role, locale);
}

export function adaptLocalizedPackageToPreviewContent(
  pkg: PreviewLessonPackageInput,
): PreviewLessonSection[] {
  const sections: PreviewLessonSection[] = [];

  for (const section of pkg.sections) {
    const block = buildBlock(section);
    if (!block) continue;

    sections.push({
      icon: sectionIcon(section.role),
      eyebrow: sectionEyebrow(section, pkg.locale),
      title: sectionTitle(section, block, pkg.locale),
      tone: sectionTone(section.role),
      block,
    });
  }

  return sections;
}

export function previewBodyDirection(
  locale: LessonPackageLocale,
): "rtl" | "ltr" {
  return locale === "en" ? "ltr" : "rtl";
}

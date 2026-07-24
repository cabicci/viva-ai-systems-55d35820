import type {
  RagLocalizedLessonPackage,
  LocalizedLessonSection,
  LocalizedLessonTable,
} from "@/lib/locale-lessons/types";
import type { ChunkContentType } from "./types";

const ROLE_CONTENT_TYPE: Record<string, ChunkContentType> = {
  orientation: "explanation",
  tension: "explanation",
  "core idea": "explanation",
  glossary: "glossary",
  comparison: "example",
  example: "example",
  quiz: "quiz",
  mission: "mission",
  summary: "summary",
  recap: "summary",
  "key takeaway": "summary",
  "next steps": "summary",
};

export function resolveContentType(role: string, hasQuiz: boolean): ChunkContentType {
  if (hasQuiz) return "quiz";
  const normalized = role.trim().toLowerCase();
  return ROLE_CONTENT_TYPE[normalized] ?? "other";
}

function formatTable(table: LocalizedLessonTable): string {
  const header = `| ${table.headers.join(" | ")} |`;
  const separator = `| ${table.headers.map(() => "---").join(" | ")} |`;
  const rows = table.rows.map((r) => `| ${r.join(" | ")} |`);
  return [header, separator, ...rows].join("\n");
}

function pushIfNonEmpty(parts: string[], value: string | undefined) {
  if (value && value.trim().length > 0) parts.push(value.trim());
}

/** Extract displayable text segments from a lesson section. */
export function extractSectionSegments(
  section: LocalizedLessonSection,
  lessonTitle: string,
): { contentType: ChunkContentType; text: string }[] {
  const hasQuiz = Boolean(section.quiz?.question);
  const contentType = resolveContentType(section.role, hasQuiz);
  const segments: string[] = [];

  const headingParts: string[] = [];
  pushIfNonEmpty(headingParts, lessonTitle);
  pushIfNonEmpty(headingParts, section.heading);
  pushIfNonEmpty(headingParts, section.subtitle);
  if (headingParts.length > 0) {
    segments.push(headingParts.join(" — "));
  }

  pushIfNonEmpty(segments, section.contentMarkdown);

  if (section.bullets.length > 0) {
    segments.push(section.bullets.map((b) => `- ${b}`).join("\n"));
  }

  for (const table of section.tables) {
    if (table.headers.length > 0 && table.rows.length > 0) {
      segments.push(formatTable(table));
    }
  }

  if (section.quiz?.question) {
    const quizParts: string[] = [`**${section.quiz.question}**`];
    if (section.quiz.options?.length) {
      quizParts.push(section.quiz.options.map((o, i) => `${i + 1}. ${o}`).join("\n"));
    }
    pushIfNonEmpty(quizParts, section.quiz.explanation);
    segments.push(quizParts.join("\n"));
  }

  if (section.mission) {
    pushIfNonEmpty(segments, section.mission.intro);
    if (section.mission.delivery?.length) {
      segments.push(section.mission.delivery.map((d, i) => `${i + 1}. ${d}`).join("\n"));
    }
    if (section.mission.rubric?.length) {
      const rubric = section.mission.rubric
        .map((r) => `- ${r.dimension} (${r.weight}%): ${r.criteria}`)
        .join("\n");
      segments.push(rubric);
    }
  }

  const combined = segments.filter((s) => s.trim().length > 0).join("\n\n");
  if (!combined) return [];

  return [{ contentType, text: combined }];
}

/** Extract all section segments from a localized lesson package. */
export function extractPackageSegments(pkg: RagLocalizedLessonPackage): Array<{
  sectionIndex: number;
  sectionRole: string;
  sectionHeading: string;
  contentType: ChunkContentType;
  text: string;
}> {
  const out: Array<{
    sectionIndex: number;
    sectionRole: string;
    sectionHeading: string;
    contentType: ChunkContentType;
    text: string;
  }> = [];

  pkg.sections.forEach((section, sectionIndex) => {
    const segments = extractSectionSegments(section, pkg.title);
    for (const seg of segments) {
      out.push({
        sectionIndex,
        sectionRole: section.role,
        sectionHeading: section.heading,
        contentType: seg.contentType,
        text: seg.text,
      });
    }
  });

  return out;
}

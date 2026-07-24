/**
 * Deterministic projection of frozen ar-EG IntroLessonContent → RagLocalizedLessonPackage.
 * Does not modify source lesson files. Text is extracted only; never invented.
 */

import type {
  IntroBlock,
  IntroLessonContent,
  IntroLessonSection,
} from "@/components/intro/intro-lesson-types";
import type {
  LocalizedLessonMission,
  RagLocalizedLessonPackage,
  LocalizedLessonQuiz,
  LocalizedLessonSection,
  LocalizedLessonTable,
} from "@/lib/locale-lessons/types";
import { sha256Hex } from "./checksum";
import { CONTENT_FREEZE_SHA } from "./constants";

/** Fixed generation stamp — never Date.now() (determinism). */
export const AR_EG_PACKAGE_GENERATED_AT = "2026-07-22T00:00:00.000Z";
export const AR_EG_CANONICAL_VERSION = "curriculum-freeze-ar-eg-ts-v1";
export const AR_EG_INDEX_VERSION = "rag-index-v1";

export interface EgyptianLessonSourceMeta {
  lessonId: string;
  pathId: string;
  moduleId: string;
  title: string;
  productionRoute: string;
  sourceFile: string;
  nextLessonId?: string;
}

function pushText(parts: string[], value: unknown) {
  if (typeof value === "string" && value.trim().length > 0) {
    parts.push(value.trim());
  }
}

function roleForSection(section: IntroLessonSection, index: number): string {
  const eyebrow = section.eyebrow?.trim();
  if (eyebrow) return eyebrow;
  const kind = section.block?.kind;
  if (kind === "concepts") return "Glossary";
  if (kind === "quiz") return "Quiz";
  if (kind === "mission") return "Mission";
  if (kind === "comparison") return "Comparison";
  if (index === 0) return "Orientation";
  return section.title?.trim() || `Section-${index}`;
}

function blockToMarkdownAndExtras(block: IntroBlock): {
  markdownParts: string[];
  bullets: string[];
  tables: LocalizedLessonTable[];
  quiz?: LocalizedLessonQuiz;
  mission?: LocalizedLessonMission;
} {
  const markdownParts: string[] = [];
  const bullets: string[] = [];
  const tables: LocalizedLessonTable[] = [];
  let quiz: LocalizedLessonQuiz | undefined;
  let mission: LocalizedLessonMission | undefined;

  switch (block.kind) {
    case "paragraphs":
      for (const p of block.paragraphs) pushText(markdownParts, p);
      break;
    case "comparison": {
      tables.push({
        headers: [block.left.label, block.right.label],
        rows: [[block.left.body, block.right.body]],
      });
      pushText(markdownParts, `| ${block.left.label} | ${block.right.label} |`);
      pushText(markdownParts, `| ${block.left.body} | ${block.right.body} |`);
      break;
    }
    case "quote":
      pushText(markdownParts, block.quote);
      break;
    case "flow":
      block.steps.forEach((s, i) => {
        const line = `${i + 1}. ${s}`;
        bullets.push(line);
        pushText(markdownParts, line);
      });
      break;
    case "mission": {
      mission = {
        intro: block.intro,
        delivery: [block.prompt],
        rubric: (block.rubric ?? []).map((r) => ({
          dimension: r.label,
          weight: r.weight,
          criteria: r.criteria.join("; "),
        })),
      };
      pushText(markdownParts, block.intro);
      pushText(markdownParts, block.prompt);
      break;
    }
    case "checklist":
    case "numberedList":
      for (const item of block.items) {
        bullets.push(item);
        pushText(markdownParts, `- ${item}`);
      }
      break;
    case "rule":
      pushText(markdownParts, block.statement);
      break;
    case "executionTask":
      pushText(markdownParts, block.title);
      for (const s of block.steps ?? []) {
        bullets.push(s);
        pushText(markdownParts, `- ${s}`);
      }
      pushText(markdownParts, block.expectedResult);
      break;
    case "toolBlock":
      pushText(markdownParts, block.name);
      pushText(markdownParts, block.description);
      break;
    case "warning":
      pushText(markdownParts, block.title);
      pushText(markdownParts, block.body);
      break;
    case "screenshot":
      pushText(markdownParts, block.caption);
      pushText(markdownParts, block.alt);
      break;
    case "concepts": {
      const headers = ["Term", "Meaning", "Example"];
      const rows = block.items.map((it) => [it.term, it.meaning, it.example ?? ""]);
      tables.push({ headers, rows });
      for (const it of block.items) {
        const line = `${it.term}: ${it.meaning}${it.example ? ` (${it.example})` : ""}`;
        bullets.push(line);
        pushText(markdownParts, line);
      }
      break;
    }
    case "diagram":
      pushText(markdownParts, block.label);
      pushText(markdownParts, block.caption);
      break;
    case "quiz": {
      // Flatten first item into package quiz slot; remaining items stay in markdown.
      const first = block.items[0];
      if (first) {
        quiz = {
          question: first.question,
          correctIndex: first.correctIndex,
          options: [...first.options],
          explanation: first.explanation,
        };
      }
      for (const q of block.items) {
        pushText(markdownParts, q.question);
        q.options.forEach((o, i) => pushText(markdownParts, `${i + 1}. ${o}`));
        pushText(markdownParts, q.explanation);
      }
      break;
    }
    case "caseStudy":
      pushText(markdownParts, block.title);
      pushText(markdownParts, block.summary);
      for (const b of block.bullets) {
        bullets.push(b);
        pushText(markdownParts, `- ${b}`);
      }
      break;
    case "lessonVideo":
    case "video":
      pushText(markdownParts, block.caption);
      break;
    default:
      break;
  }

  return { markdownParts, bullets, tables, quiz, mission };
}

/** Project one frozen Egyptian lesson into the portable package schema. */
export function projectEgyptianLessonToPackage(
  content: IntroLessonContent,
  meta: EgyptianLessonSourceMeta,
): RagLocalizedLessonPackage {
  const sections: LocalizedLessonSection[] = content.map((section, index) => {
    const extracted = blockToMarkdownAndExtras(section.block);
    const contentMarkdown = extracted.markdownParts.join("\n\n");
    return {
      role: roleForSection(section, index),
      heading: section.title?.trim() || roleForSection(section, index),
      subtitle: section.eyebrow?.trim() || undefined,
      contentMarkdown,
      bullets: extracted.bullets,
      tables: extracted.tables,
      ...(extracted.quiz ? { quiz: extracted.quiz } : {}),
      ...(extracted.mission ? { mission: extracted.mission } : {}),
    };
  });

  return {
    locale: "ar-EG",
    lessonId: meta.lessonId,
    canonicalVersion: AR_EG_CANONICAL_VERSION,
    pathId: meta.pathId,
    moduleId: meta.moduleId,
    productionRoute: meta.productionRoute,
    title: meta.title,
    nextLessonId: meta.nextLessonId,
    sections,
    sourceFile: meta.sourceFile,
    generatedAt: AR_EG_PACKAGE_GENERATED_AT,
  };
}

/** Canonical JSON bytes for package files (LF, 2-space, trailing newline). */
export function serializePackageCanonical(pkg: RagLocalizedLessonPackage): string {
  return `${JSON.stringify(pkg, null, 2).replace(/\r\n/g, "\n")}\n`;
}

export function packageChecksumFromCanonicalJson(canonicalJson: string): string {
  return sha256Hex(canonicalJson);
}

export function sourceChecksumFromTsFile(rawTsUtf8: string): string {
  return sha256Hex(rawTsUtf8);
}

export function arEgSourceShaContract(): string {
  return CONTENT_FREEZE_SHA;
}

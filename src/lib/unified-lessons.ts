/**
 * Unified Lessons Adapter
 * -----------------------
 * Single source of truth that exposes the SAME public API as the old
 * `@/lib/lessons-data` module (`LESSONS`, `getLesson`, `getNextLesson`,
 * `getPrevLesson`, types) — but builds the data from the NEW system:
 *
 *   PATHS (curriculum-data)  +  INTRO_LESSON_CONTENT (blocks)
 *
 * Goal: the 13 consumers (dashboard, mission-runtime, assistant
 * context, RAG chunking, …) all read from one place that reflects
 * the current five-path curriculum, without anyone touching the
 * old `lessons-data.ts` file. That file becomes fully isolated and
 * safe to delete in a later cleanup.
 */

import { PATHS } from "@/lib/curriculum-data";
import { INTRO_LESSON_CONTENT } from "@/components/intro/lessons";
import type { IntroLessonContent } from "@/components/intro/intro-lesson-types";

/* Inline types — formerly re-exported from lessons-data.ts.
 * Most legacy section fields stay as optional because retrieval/chunking
 * code reads them defensively (and ignores when undefined). The adapter
 * itself only populates id/order/title/stage/difficulty/duration/
 * description/mission/blocks. */
export type Difficulty = "مبتدئ" | "متوسط" | "متقدّم";

export interface MissionBlock {
  title?: string;
  intro?: string;
  prompt?: string;
  outro?: string;
}

export interface LessonContent {
  id: string;
  order: number;
  title: string;
  stage: string;
  difficulty: Difficulty;
  duration: string;
  description: string;
  tags?: string[];
  goal?: { items: string[]; intro?: string };
  concept?: {
    intro?: string[];
    cards?: Array<{ tone: string; icon: string; title: string; body: string }>;
    quote?: string;
  };
  mentalModel?: {
    intro?: string;
    dialogue: Array<{ who: string; tone: string; text: string }>;
    outro?: string;
  };
  models?: Array<{
    name: string;
    vendor: string;
    strength: string;
    use: string;
    tone: string;
  }>;
  comparison?: {
    wrong: { title: string; example: string; note: string };
    right: { title: string; example: string; note: string };
  };
  coreRule?: { eyebrow: string; title: string; subtitle?: string };
  example?: string;
  execution?: string;
  failures?: string;
  takeaways?: { headline: string; note?: string };
  mission?: MissionBlock;
  blocks?: IntroLessonContent;
}

/* -------------------------------------------------------------- */
/*  Build LESSONS by walking the curriculum once.                  */
/* -------------------------------------------------------------- */

function deriveMission(
  blocks: IntroLessonContent | undefined,
): MissionBlock | undefined {
  if (!blocks) return undefined;
  for (const section of blocks) {
    if (section.block.kind === "mission") {
      const m = section.block;
      return {
        title: section.title,
        intro: m.intro,
        prompt: m.prompt,
      };
    }
  }
  return undefined;
}

function deriveDescription(
  blocks: IntroLessonContent | undefined,
): string {
  if (!blocks) return "";
  for (const section of blocks) {
    if (section.block.kind === "paragraphs") {
      return section.block.paragraphs[0] ?? "";
    }
  }
  return "";
}

function buildLessons(): LessonContent[] {
  const out: LessonContent[] = [];
  const seen = new Set<string>();
  let globalOrder = 0;

  for (const path of PATHS) {
    for (const module of path.modules) {
      for (const lesson of module.lessons) {
        if (seen.has(lesson.id)) continue;
        const blocks = INTRO_LESSON_CONTENT[lesson.id];
        // Only emit lessons that have actual content in the new system.
        if (!blocks) continue;
        seen.add(lesson.id);
        globalOrder += 1;
        out.push({
          id: lesson.id,
          order: globalOrder,
          title: lesson.title,
          stage: `${path.title.toUpperCase()} · ${module.title}`,
          difficulty: "مبتدئ",
          duration: "—",
          description: deriveDescription(blocks),
          mission: deriveMission(blocks),
          blocks,
        });
      }
    }
  }

  return out;
}

export const LESSONS: LessonContent[] = buildLessons();

/* -------------------------------------------------------------- */
/*  Helpers — identical signatures to the legacy module.           */
/* -------------------------------------------------------------- */

export const getLesson = (id: string): LessonContent | undefined =>
  LESSONS.find((l) => l.id === id);

export const getNextLesson = (id: string): LessonContent | undefined => {
  const i = LESSONS.findIndex((l) => l.id === id);
  return i >= 0 ? LESSONS[i + 1] : undefined;
};

export const getPrevLesson = (id: string): LessonContent | undefined => {
  const i = LESSONS.findIndex((l) => l.id === id);
  return i > 0 ? LESSONS[i - 1] : undefined;
};
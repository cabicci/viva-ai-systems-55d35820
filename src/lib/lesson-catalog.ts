/**
 * Lightweight synchronous lesson metadata.
 *
 * This module must stay free of lesson-content registry imports so route-tree
 * metadata consumers never download lesson blocks on unrelated pages.
 */
import { PATHS } from "@/lib/curriculum-data";
import type { IntroLessonContent } from "@/components/intro/intro-lesson-types";

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


function buildLessonCatalog(): LessonContent[] {
  const out: LessonContent[] = [];
  const seen = new Set<string>();
  let globalOrder = 0;

  for (const path of PATHS) {
    for (const module of path.modules) {
      for (const lesson of module.lessons) {
        if (seen.has(lesson.id)) continue;
        seen.add(lesson.id);
        globalOrder += 1;
        out.push({
          id: lesson.id,
          order: globalOrder,
          title: lesson.title,
          stage: path.title.toUpperCase() + " · " + module.title,
          difficulty: "مبتدئ",
          duration: "—",
          description: "",
        });
      }
    }
  }
  return out;
}

export const LESSONS: LessonContent[] = buildLessonCatalog();

export function getLesson(id: string): LessonContent | undefined {
  return LESSONS.find((lesson) => lesson.id === id);
}

export function getNextLesson(id: string): LessonContent | undefined {
  const index = LESSONS.findIndex((lesson) => lesson.id === id);
  return index >= 0 ? LESSONS[index + 1] : undefined;
}

export function getPrevLesson(id: string): LessonContent | undefined {
  const index = LESSONS.findIndex((lesson) => lesson.id === id);
  return index > 0 ? LESSONS[index - 1] : undefined;
}

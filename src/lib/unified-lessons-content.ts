import * as React from "react";
import { PATHS } from "@/lib/curriculum-data";
import type {
  LessonContent,
  MissionBlock,
} from "@/lib/lesson-catalog";
import type { IntroLessonContentKey } from "@/components/intro/lessons/lesson-registry";
import type { IntroLessonContent } from "@/components/intro/intro-lesson-types";

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

function buildLessons(
  introContent: Record<IntroLessonContentKey, IntroLessonContent>,
): LessonContent[] {
  const out: LessonContent[] = [];
  const seen = new Set<string>();
  let globalOrder = 0;

  for (const path of PATHS) {
    for (const module of path.modules) {
      for (const lesson of module.lessons) {
        if (seen.has(lesson.id)) continue;
        const blocks = introContent[lesson.id as IntroLessonContentKey];
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


let browserLessonsPromise: Promise<LessonContent[]> | null = null;

async function loadFromRegistry(): Promise<LessonContent[]> {
  const { loadAllIntroLessonContent } = await import(
    "@/components/intro/lessons"
  );
  return buildLessons(await loadAllIntroLessonContent());
}

/**
 * Load full lesson blocks on demand. The browser shares one in-flight result;
 * SSR deliberately avoids mutable cross-request caches.
 */
export function loadUnifiedLessonsContent(): Promise<LessonContent[]> {
  if (typeof window === "undefined") return loadFromRegistry();
  browserLessonsPromise ??= loadFromRegistry().catch((error: unknown) => {
    browserLessonsPromise = null;
    throw error;
  });
  return browserLessonsPromise;
}

export type UnifiedLessonsContentState = {
  lessons: LessonContent[] | null;
  isLoading: boolean;
  error: Error | null;
};

export function useUnifiedLessonsContent(): UnifiedLessonsContentState {
  const [state, setState] = React.useState<UnifiedLessonsContentState>({
    lessons: null,
    isLoading: true,
    error: null,
  });

  React.useEffect(() => {
    let cancelled = false;
    void loadUnifiedLessonsContent().then(
      (lessons) => {
        if (!cancelled) setState({ lessons, isLoading: false, error: null });
      },
      (error: unknown) => {
        if (!cancelled) {
          setState({
            lessons: null,
            isLoading: false,
            error: error instanceof Error ? error : new Error(String(error)),
          });
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

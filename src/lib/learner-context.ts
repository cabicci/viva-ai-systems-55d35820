import { useMemo } from "react";
import { useLocation } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { useLessonProgress, type LessonStatus } from "@/lib/lesson-progress";
import { LESSONS, type LessonContent, type MissionBlock } from "@/lib/unified-lessons";
import {
  PATHS,
  type CurriculumPath,
  type CurriculumModule,
} from "@/lib/curriculum-data";

/**
 * Context Layer — runtime snapshot of where the learner is in the ecosystem.
 *
 * Read-only. Pulls from existing data sources:
 *   - lessons-data.ts
 *   - curriculum-data.ts
 *   - lesson-progress.ts (Lovable Cloud)
 *   - auth-context.tsx
 *   - current route (TanStack)
 *
 * No new tables. No backend. No AI. Infrastructure for future Retrieval + Assistant.
 */

export interface LearnerUserSummary {
  id: string | null;
  email: string | null;
  isAuthenticated: boolean;
}

export interface LearnerContext {
  /* user */
  currentUser: LearnerUserSummary;

  /* navigation */
  currentRoute: string;
  currentPath: CurriculumPath | null;
  currentModule: CurriculumModule | null;
  currentLesson: LessonContent | null;
  currentLessonStatus: LessonStatus | null;
  currentMission: MissionBlock | null;

  /* progress */
  completedLessonsCount: number;
  totalLessonsCount: number;
  lastCompletedLesson: LessonContent | null;
  nextLesson: LessonContent | null;

  /* meta */
  isReady: boolean;
  resolvedAt: string;
}

function findLessonById(id: string | null): LessonContent | null {
  if (!id) return null;
  return LESSONS.find((l) => l.id === id) ?? null;
}

function findCurriculumLocation(lessonId: string | null): {
  path: CurriculumPath | null;
  module: CurriculumModule | null;
} {
  if (!lessonId) return { path: null, module: null };
  for (const p of PATHS) {
    for (const m of p.modules) {
      const l = m.lessons.find((x) => x.id === lessonId);
      if (l) return { path: p, module: m };
    }
  }
  return { path: null, module: null };
}

function parseLessonIdFromPath(pathname: string): string | null {
  // Routes are /learn/{pathId}/{lessonId}
  const m = pathname.match(/^\/learn\/[^/]+\/([^/?#]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

function pathFromRoute(pathname: string): CurriculumPath | null {
  const m = pathname.match(/^\/paths\/([^/?#]+)/);
  if (!m) return null;
  const id = m[1];
  return PATHS.find((p) => p.id === id) ?? null;
}

export function useLearnerContext(): LearnerContext {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const { store, getStatus, isLoaded } = useLessonProgress();

  return useMemo<LearnerContext>(() => {
    const pathname = location.pathname;
    const lessonIdFromRoute = parseLessonIdFromPath(pathname);
    const currentLesson = findLessonById(lessonIdFromRoute);

    const { path: pathFromLesson, module: moduleFromLesson } =
      findCurriculumLocation(lessonIdFromRoute);
    const currentPath = pathFromLesson ?? pathFromRoute(pathname);
    const currentModule = moduleFromLesson;

    const currentLessonStatus = lessonIdFromRoute
      ? getStatus(lessonIdFromRoute)
      : null;
    const currentMission = currentLesson?.mission ?? null;

    /* progress: count across the path the learner is currently in.
       Fallback to intro (the universal onboarding path) if we can't
       infer a path from the route — never silently pick another. */
    const scope =
      currentPath ?? PATHS.find((p) => p.id === "intro") ?? PATHS[0];
    const availableIds = scope
      ? scope.modules
          .flatMap((m) => m.lessons)
          .filter((l) => l.state === "available")
          .map((l) => l.id)
      : [];

    const completedLessonsCount = availableIds.filter(
      (id) => store[id] === "completed",
    ).length;
    const totalLessonsCount = availableIds.length;

    /* last completed lesson — last available lesson (in path order) marked completed */
    let lastCompletedLesson: LessonContent | null = null;
    for (let i = availableIds.length - 1; i >= 0; i--) {
      if (store[availableIds[i]] === "completed") {
        lastCompletedLesson = findLessonById(availableIds[i]);
        break;
      }
    }

    /* next lesson:
       - if on a lesson page → the next available one in path order
       - else → first available not-yet-completed lesson in path */
    let nextLesson: LessonContent | null = null;
    if (lessonIdFromRoute) {
      const idx = availableIds.indexOf(lessonIdFromRoute);
      if (idx >= 0 && idx + 1 < availableIds.length) {
        nextLesson = findLessonById(availableIds[idx + 1]);
      }
    } else {
      const firstUnfinished = availableIds.find(
        (id) => store[id] !== "completed",
      );
      nextLesson = firstUnfinished ? findLessonById(firstUnfinished) : null;
    }

    return {
      currentUser: {
        id: user?.id ?? null,
        email: user?.email ?? null,
        isAuthenticated: !!user,
      },
      currentRoute: pathname,
      currentPath,
      currentModule,
      currentLesson,
      currentLessonStatus,
      currentMission,
      completedLessonsCount,
      totalLessonsCount,
      lastCompletedLesson,
      nextLesson,
      isReady: !authLoading && (!!user ? isLoaded : true),
      resolvedAt: new Date().toISOString(),
    };
  }, [
    location.pathname,
    user,
    authLoading,
    store,
    getStatus,
    isLoaded,
  ]);
}

import type { LearnerContext } from "@/lib/learner-context";
import type { AssistantRuntimeRequestPayload } from "@/lib/assistant-runtime";
import type { RagPackageLocale } from "@/lib/locale-lessons/types";
import { resolveAssistantPackageLocale } from "@/lib/rag/resolve-assistant-locale";
import type { SupportedLocale } from "@/lib/locale/types";

/** Page-level override for localized package lessons (en / ar-MSA / ar-Gulf). */
export type AssistantContextOverride = {
  currentPathId: string;
  currentModuleId: string;
  currentLessonId: string;
  currentPathTitle: string;
  currentModuleTitle: string;
  currentLessonTitle: string;
  nextLessonTitle: string | null;
  currentMission: {
    intro: string;
    prompt: string;
  } | null;
};

export type ResolvedAssistantLearnerContext = {
  locale: RagPackageLocale | null;
  currentPath: string | null;
  currentModule: string | null;
  currentLesson: string | null;
  currentPathTitle: string | null;
  currentModuleTitle: string | null;
  currentLessonTitle: string | null;
  completedLessonsCount: number;
  totalLessonsCount: number;
  nextLessonTitle: string | null;
  currentMission: {
    intro: string | null;
    prompt: string | null;
  } | null;
  preferLessonId: string | null;
  preferPathId: string | null;
};

export function resolveAssistantLearnerContext(
  locale: SupportedLocale,
  ctx: Pick<
    LearnerContext,
    | "currentPath"
    | "currentModule"
    | "currentLesson"
    | "currentMission"
    | "completedLessonsCount"
    | "totalLessonsCount"
    | "nextLesson"
  >,
  override?: AssistantContextOverride | null,
): ResolvedAssistantLearnerContext {
  const assistantLocale = resolveAssistantPackageLocale(locale);

  if (override) {
    return {
      locale: assistantLocale,
      currentPath: override.currentPathId,
      currentModule: override.currentModuleId,
      currentLesson: override.currentLessonId,
      currentPathTitle: override.currentPathTitle,
      currentModuleTitle: override.currentModuleTitle,
      currentLessonTitle: override.currentLessonTitle,
      completedLessonsCount: ctx.completedLessonsCount,
      totalLessonsCount: ctx.totalLessonsCount,
      nextLessonTitle: override.nextLessonTitle,
      currentMission: override.currentMission
        ? {
            intro: override.currentMission.intro,
            prompt: override.currentMission.prompt,
          }
        : null,
      preferLessonId: override.currentLessonId,
      preferPathId: override.currentPathId,
    };
  }

  return {
    locale: assistantLocale,
    currentPath: ctx.currentPath?.id ?? null,
    currentModule: ctx.currentModule?.id ?? null,
    currentLesson: ctx.currentLesson?.id ?? null,
    currentPathTitle: ctx.currentPath?.title ?? null,
    currentModuleTitle: ctx.currentModule?.title ?? null,
    currentLessonTitle: ctx.currentLesson?.title ?? null,
    completedLessonsCount: ctx.completedLessonsCount,
    totalLessonsCount: ctx.totalLessonsCount,
    nextLessonTitle: ctx.nextLesson?.title ?? null,
    currentMission: ctx.currentMission
      ? {
          intro: ctx.currentMission.intro ?? null,
          prompt: ctx.currentMission.prompt ?? null,
        }
      : null,
    preferLessonId: ctx.currentLesson?.id ?? null,
    preferPathId: ctx.currentPath?.id ?? null,
  };
}

export function buildAssistantRuntimePayload(
  query: string,
  resolved: ResolvedAssistantLearnerContext,
  retrievalResults: unknown[],
): AssistantRuntimeRequestPayload {
  return {
    query,
    learnerContext: {
      locale: resolved.locale,
      currentPath: resolved.currentPath,
      currentModule: resolved.currentModule,
      currentLesson: resolved.currentLesson,
      currentPathTitle: resolved.currentPathTitle,
      currentModuleTitle: resolved.currentModuleTitle,
      currentLessonTitle: resolved.currentLessonTitle,
      completedLessonsCount: resolved.completedLessonsCount,
      totalLessonsCount: resolved.totalLessonsCount,
      nextLessonTitle: resolved.nextLessonTitle,
      currentMission: resolved.currentMission,
    },
    retrievalResults,
  };
}

export function buildLocalizedAssistantContextOverride(input: {
  pathId: string;
  pathTitle: string;
  moduleId: string;
  moduleTitle: string;
  lessonId: string;
  lessonTitle: string;
  nextLessonTitle: string | null;
  mission: { intro: string; prompt: string } | null;
}): AssistantContextOverride {
  return {
    currentPathId: input.pathId,
    currentModuleId: input.moduleId,
    currentLessonId: input.lessonId,
    currentPathTitle: input.pathTitle,
    currentModuleTitle: input.moduleTitle,
    currentLessonTitle: input.lessonTitle,
    nextLessonTitle: input.nextLessonTitle,
    currentMission: input.mission,
  };
}

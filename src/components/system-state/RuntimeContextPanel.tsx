import { Activity } from "lucide-react";
import { useLearnerContext } from "@/lib/learner-context";
import { useLocale } from "@/lib/locale/locale-context";
import { useUiString } from "@/lib/locale/use-ui-strings";
import {
  getCurriculumLessonLabel,
  getCurriculumModuleLabel,
  getCurriculumPathLabel,
} from "@/lib/locale-curriculum/resolve-curriculum-label";
import type { PathId } from "@/lib/curriculum-data";
import { Section, StatusPill, Field } from "./primitives";

export function RuntimeContextPanel() {
  const t = useUiString();
  const { locale } = useLocale();
  const ctx = useLearnerContext();

  const pathTitle = ctx.currentPath
    ? getCurriculumPathLabel(locale, ctx.currentPath.id as PathId, "title")
    : null;
  const moduleTitle = ctx.currentModule
    ? getCurriculumModuleLabel(locale, ctx.currentModule.id, "title")
    : null;
  const lessonTitle = ctx.currentLesson
    ? getCurriculumLessonLabel(locale, ctx.currentLesson.id)
    : null;
  const nextLessonTitle = ctx.nextLesson
    ? getCurriculumLessonLabel(locale, ctx.nextLesson.id)
    : null;
  const lastLessonTitle = ctx.lastCompletedLesson
    ? getCurriculumLessonLabel(locale, ctx.lastCompletedLesson.id)
    : null;

  return (
    <Section
      no="00"
      icon={Activity}
      label={t("systemState.runtime.label")}
      title={t("systemState.runtime.title")}
    >
      <div className="glass rounded-2xl p-5 border border-primary/25">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <p className="text-xs text-muted-foreground leading-loose max-w-2xl">
            {t("systemState.runtime.bodyBefore")}{" "}
            <code className="font-mono text-primary">useLearnerContext()</code>{" "}
            {t("systemState.runtime.bodyAfter")}
          </p>
          <StatusPill status={ctx.isReady ? "live" : "partial"} />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          <Field
            label="currentUser"
            value={
              ctx.currentUser.isAuthenticated
                ? (ctx.currentUser.email ?? ctx.currentUser.id)
                : t("systemState.guest")
            }
          />
          <Field label="currentRoute" value={ctx.currentRoute} />
          <Field label="currentPath" value={pathTitle} />
          <Field label="currentModule" value={moduleTitle} />
          <Field
            label="currentLesson"
            value={
              ctx.currentLesson && lessonTitle ? `${lessonTitle} · ${ctx.currentLesson.id}` : null
            }
          />
          <Field label="currentLessonStatus" value={ctx.currentLessonStatus} />
          <Field
            label="completedLessonsCount"
            value={`${ctx.completedLessonsCount} / ${ctx.totalLessonsCount}`}
          />
          <Field
            label="nextLesson"
            value={
              ctx.nextLesson && nextLessonTitle ? `${nextLessonTitle} · ${ctx.nextLesson.id}` : null
            }
          />
          <Field
            label="lastCompletedLesson"
            value={
              ctx.lastCompletedLesson && lastLessonTitle
                ? `${lastLessonTitle} · ${ctx.lastCompletedLesson.id}`
                : null
            }
          />
          <Field
            label="currentMission"
            value={
              ctx.currentMission
                ? (ctx.currentMission.title ??
                  ctx.currentMission.prompt ??
                  ctx.currentMission.intro ??
                  "—")
                : null
            }
          />
          <Field label="resolvedAt" value={ctx.resolvedAt} />
          <Field label="isReady" value={String(ctx.isReady)} />
        </div>
      </div>
    </Section>
  );
}

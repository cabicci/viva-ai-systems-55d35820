import { Activity } from "lucide-react";
import { useLearnerContext } from "@/lib/learner-context";
import { Section, StatusPill, Field } from "./primitives";

export function RuntimeContextPanel() {
  const ctx = useLearnerContext();
  return (
    <Section
      no="00"
      icon={Activity}
      label="RUNTIME CONTEXT LAYER"
      title="Runtime Context Layer"
    >
      <div className="glass rounded-2xl p-5 border border-primary/25">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <p className="text-xs text-muted-foreground leading-loose max-w-2xl">
            مخرجات{" "}
            <code className="font-mono text-primary">useLearnerContext()</code>{" "}
            — Context Layer متصل ويغذّي Retrieval و Assistant Runtime. غير ظاهر
            للمتعلم مباشرة؛ implemented; live smoke test not performed in this
            cleanup.
          </p>
          <StatusPill status={ctx.isReady ? "live" : "partial"} />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          <Field
            label="currentUser"
            value={
              ctx.currentUser.isAuthenticated
                ? ctx.currentUser.email ?? ctx.currentUser.id
                : "guest"
            }
          />
          <Field label="currentRoute" value={ctx.currentRoute} />
          <Field
            label="currentPath"
            value={ctx.currentPath ? ctx.currentPath.title : null}
          />
          <Field
            label="currentModule"
            value={ctx.currentModule ? ctx.currentModule.title : null}
          />
          <Field
            label="currentLesson"
            value={
              ctx.currentLesson
                ? `${ctx.currentLesson.title} · ${ctx.currentLesson.id}`
                : null
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
              ctx.nextLesson
                ? `${ctx.nextLesson.title} · ${ctx.nextLesson.id}`
                : null
            }
          />
          <Field
            label="lastCompletedLesson"
            value={
              ctx.lastCompletedLesson
                ? `${ctx.lastCompletedLesson.title} · ${ctx.lastCompletedLesson.id}`
                : null
            }
          />
          <Field
            label="currentMission"
            value={
              ctx.currentMission
                ? ctx.currentMission.title ??
                  ctx.currentMission.prompt ??
                  ctx.currentMission.intro ??
                  "—"
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
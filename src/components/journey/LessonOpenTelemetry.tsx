import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { logLearnerEvent } from "@/lib/learner-events";
import { trackLessonOpened } from "@/lib/analytics";
import type { LearningLine } from "@/lib/learning-lines";

/** Mounted only alongside an authorized lesson, never on a locked lesson shell. */
export function LessonOpenTelemetry({
  line,
  course,
  lesson,
  pathId,
  moduleId,
}: {
  line: LearningLine;
  course: string;
  lesson: string;
  pathId?: string;
  moduleId?: string;
}) {
  const auth = useAuth();
  const actor = auth.user?.id;
  const generation = auth.authGeneration;
  const latest = useRef(auth);
  latest.current = auth;
  const recorded = useRef<string | null>(null);
  useEffect(() => {
    if (line === "kids" || auth.loading || !actor) return;
    const key = JSON.stringify([actor, line, course, lesson]);
    if (recorded.current === key) return;
    let active = true;
    const isCurrent = () =>
      active &&
      !latest.current.loading &&
      latest.current.user?.id === actor &&
      latest.current.authGeneration === generation &&
      latest.current.isAuthGenerationCurrent(generation);
    // StrictMode's retired setup must not produce a duplicate open event.
    queueMicrotask(() => {
      if (!isCurrent() || recorded.current === key) return;
      recorded.current = key;
      void logLearnerEvent(
        {
          type: "lesson_opened",
          pathId: pathId ?? course,
          moduleId,
          lessonId: lesson,
          metadata: { area: line, course },
        },
        { userId: actor, isCurrent },
      );
      trackLessonOpened({ area: line, course, lesson });
    });
    return () => {
      active = false;
    };
  }, [actor, auth.loading, generation, line, course, lesson, pathId, moduleId]);
  return null;
}

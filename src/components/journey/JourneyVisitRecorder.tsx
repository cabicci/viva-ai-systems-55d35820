import type { LearningLine } from "@/lib/learning-lines";
import type { SupportedLocale } from "@/lib/locale/types";
import { useRecordJourneyVisit } from "@/lib/journey/client";
import { journeyCopy } from "@/lib/journey/copy";
import { LearningLessonNotes } from "./LearningLessonNotes";
import { LearningReadingPosition } from "./LearningReadingPosition";
import { LessonOpenTelemetry } from "./LessonOpenTelemetry";
export function JourneyVisitRecorder({
  line,
  course,
  lesson,
  locale,
  profile,
  pathId,
  moduleId,
}: {
  line: LearningLine;
  course: string;
  lesson: string;
  locale: SupportedLocale;
  profile?: string;
  pathId?: string;
  moduleId?: string;
}) {
  const { failed, retry } = useRecordJourneyVisit(line, course, lesson, locale, true, profile);
  const c = journeyCopy(locale);
  return (
    <>
      <LessonOpenTelemetry
        line={line}
        course={course}
        lesson={lesson}
        pathId={pathId}
        moduleId={moduleId}
      />
      {failed ? (
        <p role="status" className="my-3 text-sm text-muted-foreground">
          {c.bookmarkError}{" "}
          <button className="underline" onClick={retry}>
            {c.retry}
          </button>
        </p>
      ) : null}
      <LearningReadingPosition scope={{ area: line, course, lesson, profileId: profile }} />
      <LearningLessonNotes scope={{ area: line, course, lesson, profileId: profile }} />
    </>
  );
}

import type { LearningLine } from "@/lib/learning-lines";
import type { SupportedLocale } from "@/lib/locale/types";
import { useRecordJourneyVisit } from "@/lib/journey/client";
import { journeyCopy } from "@/lib/journey/copy";
export function JourneyVisitRecorder({
  line,
  course,
  lesson,
  locale,
  profile,
}: {
  line: LearningLine;
  course: string;
  lesson: string;
  locale: SupportedLocale;
  profile?: string;
}) {
  const { failed, retry } = useRecordJourneyVisit(line, course, lesson, locale, true, profile);
  const c = journeyCopy(locale);
  return failed ? (
    <p role="status" className="my-3 text-sm text-muted-foreground">
      {c.bookmarkError}{" "}
      <button className="underline" onClick={retry}>
        {c.retry}
      </button>
    </p>
  ) : null;
}

import type { CurriculumJourney, CurriculumSummary } from "@/lib/course-system/intake/client";
import type { JourneyStep, JourneyVisit } from "./model";
import { scopedSearch } from "@/lib/course-system/intake/navigation";

/** Only validated, version-matching saved positions become in-memory resume hints. */
export function admittedPath(
  course: CurriculumSummary,
  state: CurriculumJourney,
  accountId: string,
) {
  if (
    course.id !== state.course ||
    course.area !== state.area ||
    course.version !== state.activeVersion
  )
    throw new Error("CURRICULUM_CONTENT_CHANGED");
  const link = (lesson?: string) => {
    const search = scopedSearch(
      state.locale,
      state.profileId ?? undefined,
      lesson ? { lesson } : { view: "contents" },
    );
    return `/courses/${encodeURIComponent(course.area)}/${encodeURIComponent(course.id)}?${new URLSearchParams(search)}`;
  };
  const rows = new Map(state.lessons.map((row) => [row.lesson, row]));
  const steps: JourneyStep[] = course.stations.flatMap((station) =>
    station.steps.map((step) => {
      const row = rows.get(step.id);
      return {
        id: step.id,
        title: step.title,
        station: station.title,
        href: link(step.id),
        available: row?.available === true,
        completed: !!row && row.required > 0 && row.done && row.completed === row.required,
      };
    }),
  );
  const saved = state.resume;
  const row = saved ? rows.get(saved.lesson) : undefined;
  const visit: JourneyVisit | undefined =
    saved &&
    !state.reviewOnly &&
    saved.contentVersion === course.version &&
    row?.deliveryVersion === course.version &&
    steps.some((step) => step.id === saved.lesson && step.available)
      ? {
          line: course.area,
          course_id: course.id,
          subject_id: state.profileId ?? accountId,
          profile_id: state.profileId,
          lesson_id: saved.lesson,
          locale: state.locale,
          visited_at: saved.savedAt,
        }
      : undefined;
  return {
    line: course.area,
    id: `intake:${course.area}:${course.id}:${state.profileId ?? accountId}`,
    title: course.title,
    contents: link(),
    steps,
    visit,
  };
}

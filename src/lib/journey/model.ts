import type { LearningLine } from "@/lib/learning-lines";
export type JourneyVisit = {
  line: LearningLine;
  course_id: string;
  subject_id: string;
  profile_id: string | null;
  lesson_id: string;
  locale: string;
  visited_at: string;
};
export type JourneyStep = {
  id: string;
  title: string;
  href: string;
  completed: boolean;
  available: boolean;
  station?: string;
};
export function summarizeJourney(steps: JourneyStep[], visit?: JourneyVisit) {
  const available = steps.filter((step) => step.available);
  const completed = available.filter((step) => step.completed).length;
  const resume = visit ? available.find((step) => step.id === visit.lesson_id) : undefined;
  return {
    total: available.length,
    completed,
    percent: available.length ? Math.round((completed / available.length) * 100) : 0,
    resume,
    next: available.find((step) => !step.completed),
    visitedAt: resume ? visit?.visited_at : undefined,
  };
}
export function scopedVisit(
  visits: JourneyVisit[],
  line: LearningLine,
  course: string,
  subject: string,
) {
  return visits.find((v) => v.line === line && v.course_id === course && v.subject_id === subject);
}

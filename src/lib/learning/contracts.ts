import { z } from "zod";
export const LearningScopeSchema = z.object({
  area: z.enum(["ai", "academic", "technical", "kids"]),
  course: z.string().min(1).max(160),
  lesson: z.string().min(1).max(160),
  profileId: z.string().uuid().optional(),
});
export type LearningScope = z.infer<typeof LearningScopeSchema>;
export type CourseRecord = {
  learning_model?: {
    version: string;
    activities: Array<"reading" | "notes" | "mission" | "questions" | "exam" | "practice">;
    completion: Record<string, unknown>;
  } | null;
  title?: string | null;
  id: string;
  account_id: string;
  subject_id: string;
  profile_id: string | null;
  area: LearningScope["area"];
  course: string;
  first_recorded_at: string;
  last_recorded_at: string;
};
export type LearningEvent = {
  lessonTitle?: string | null;
  id: string;
  lesson: string;
  locale: string | null;
  kind: string;
  origin: string;
  content_version: string | null;
  evidence: Record<string, unknown>;
  recorded_at: string;
};
export type RecordDetail = {
  enrollments?: { starts_at: string; ends_at: string | null; source_key: string }[];
  record: CourseRecord;
  events: LearningEvent[];
  hasMore: boolean;
  notes: { lesson: string; content: string; revision: number }[];
};
export const ReportSchema = z
  .object({
    summary: z.string().min(1).max(4000),
    strengths: z.array(z.string().max(800)).max(10),
    review: z.array(z.string().max(800)).max(10),
    nextSteps: z.array(z.string().max(800)).max(10),
    limitations: z.array(z.string().max(800)).min(1).max(10),
  })
  .strict();
export type LearningReport = z.infer<typeof ReportSchema>;
export type ReportList = {
  sources: { sourceKey: string; startsAt: string; endsAt: string; limit: number; used: number }[];
  reports: {
    id: string;
    subject_id: string;
    source_key: string;
    state: string;
    lease_until?: string;
    created_at: string;
    report: LearningReport | null;
  }[];
};

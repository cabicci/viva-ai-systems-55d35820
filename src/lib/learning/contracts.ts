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

// Validate fields consumed by the learning screens. Keep transport objects intact
// so additional database/export fields remain available to existing callers.
const courseRecordResponseSchema = z.object({
  id: z.string(),
  subject_id: z.string(),
  area: LearningScopeSchema.shape.area,
  course: z.string(),
  account_id: z.string().optional(),
  profile_id: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  first_recorded_at: z.string().optional(),
  last_recorded_at: z.string().optional(),
  learning_model: z.object({
    activities: z.array(z.enum(["reading", "notes", "mission", "questions", "exam", "practice"])),
    version: z.string().optional(),
    completion: z.record(z.string(), z.unknown()).optional(),
  }).nullable().optional(),
});
const noteResponseSchema = z.object({
  content: z.string(),
  revision: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
});
const recordDetailResponseSchema = z.object({
  record: courseRecordResponseSchema,
  events: z.array(z.object({
    id: z.string(),
    lesson: z.string(),
    lessonTitle: z.string().nullable().optional(),
    kind: z.string(),
    origin: z.string(),
    recorded_at: z.string(),
    evidence: z.record(z.string(), z.unknown()),
    content_version: z.string().nullable().optional(),
    locale: z.string().nullable().optional(),
  })),
  hasMore: z.boolean(),
  notes: z.array(noteResponseSchema.extend({ lesson: z.string() })),
  enrollments: z.array(z.object({
    source_key: z.string(),
    starts_at: z.string(),
    ends_at: z.string().nullable(),
  })).optional(),
});
export const learningCommandResponseSchemas: Record<string, z.ZodType> = {
  records: z.array(courseRecordResponseSchema),
  detail: recordDetailResponseSchema,
  export: recordDetailResponseSchema.extend({ noteVersions: z.array(noteResponseSchema.extend({
    record_id: z.string(), lesson: z.string(), recorded_at: z.string(),
  })) }),
  note: noteResponseSchema,
  save_note: noteResponseSchema,
  position: z.object({ ratio: z.number().min(0).max(1).optional() }),
  save_position: z.object({}).strict(),
};
export const learningReportListResponseSchema = z.object({
  sources: z.array(z.object({
    sourceKey: z.string(), startsAt: z.string(), endsAt: z.string(),
    limit: z.number(), used: z.number(),
  })),
  reports: z.array(z.object({
    id: z.string(), subject_id: z.string(), source_key: z.string(), state: z.string(),
    lease_until: z.string().nullable().optional(), created_at: z.string(),
    report: ReportSchema.passthrough().nullable(),
  })),
});

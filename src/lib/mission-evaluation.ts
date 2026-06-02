import { supabase } from "@/integrations/supabase/client";

/**
 * Mission Evaluation Runtime — foundation layer.
 *
 * Adapter around `mission_submissions`. Decoupled from `mission-runtime.ts`
 * (locked → available → started → completed) on purpose: evaluation is a
 * separate lifecycle so we can later layer AI feedback, rubric scoring,
 * retries, and lesson-aware grading without touching mission completion.
 *
 * Today, `submitForEvaluation()` only flips status to `submitted`. No AI
 * judging runs yet.
 */

export type MissionSubmissionStatus =
  | "draft"
  | "submitted"
  | "evaluating"
  | "needs_revision"
  | "passed"
  | "failed";

export interface MissionSubmission {
  id: string;
  user_id: string;
  mission_id: string;
  lesson_id: string | null;
  submission_text: string | null;
  submission_url: string | null;
  submission_metadata: Record<string, unknown>;
  status: MissionSubmissionStatus;
  feedback: string | null;
  score: number | null;
  attempt_count: number;
  submitted_at: string | null;
  evaluated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSubmissionInput {
  missionId: string;
  lessonId?: string | null;
  submissionText?: string | null;
  submissionUrl?: string | null;
  submissionMetadata?: Record<string, unknown>;
}

export interface UpdateSubmissionInput {
  submissionText?: string | null;
  submissionUrl?: string | null;
  submissionMetadata?: Record<string, unknown>;
  status?: MissionSubmissionStatus;
  feedback?: string | null;
  score?: number | null;
}

const TABLE = "mission_submissions" as const;

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error("mission-evaluation: not authenticated");
  }
  return data.user.id;
}

/**
 * Create a new submission row in `draft` status. Returns the inserted row.
 */
export async function createSubmission(
  input: CreateSubmissionInput,
): Promise<MissionSubmission> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from(TABLE)
    // Cast: types.ts not regenerated yet for this table.
    .insert({
      user_id: userId,
      mission_id: input.missionId,
      lesson_id: input.lessonId ?? null,
      submission_text: input.submissionText ?? null,
      submission_url: input.submissionUrl ?? null,
      submission_metadata: input.submissionMetadata ?? {},
      status: "draft",
    } as never)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as MissionSubmission;
}

export async function getSubmission(
  submissionId: string,
): Promise<MissionSubmission | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("id", submissionId)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as MissionSubmission) ?? null;
}

/**
 * Get the latest submission for a given mission for the current user
 * (most recent by created_at). Returns null if none exists.
 */
export async function getLatestSubmissionForMission(
  missionId: string,
): Promise<MissionSubmission | null> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("user_id", userId)
    .eq("mission_id", missionId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as MissionSubmission) ?? null;
}

export async function updateSubmission(
  submissionId: string,
  patch: UpdateSubmissionInput,
): Promise<MissionSubmission> {
  const update: Record<string, unknown> = {};
  if (patch.submissionText !== undefined)
    update.submission_text = patch.submissionText;
  if (patch.submissionUrl !== undefined)
    update.submission_url = patch.submissionUrl;
  if (patch.submissionMetadata !== undefined)
    update.submission_metadata = patch.submissionMetadata;
  if (patch.status !== undefined) update.status = patch.status;
  if (patch.feedback !== undefined) update.feedback = patch.feedback;
  if (patch.score !== undefined) update.score = patch.score;

  const { data, error } = await supabase
    .from(TABLE)
    .update(update as never)
    .eq("id", submissionId)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as MissionSubmission;
}

/**
 * Mark a submission as submitted for evaluation.
 *
 * Foundation behavior: flips status to `submitted`, increments
 * `attempt_count`, and stamps `submitted_at`. No AI judging runs yet —
 * the actual evaluator (rubric + hybrid retrieval + AI feedback) will be
 * wired in a later step without changing this contract.
 */
export async function submitForEvaluation(
  submissionId: string,
): Promise<MissionSubmission> {
  const current = await getSubmission(submissionId);
  if (!current) throw new Error("mission-evaluation: submission not found");

  const { data, error } = await supabase
    .from(TABLE)
    .update({
      status: "submitted",
      submitted_at: new Date().toISOString(),
      attempt_count: (current.attempt_count ?? 0) + 1,
    } as never)
    .eq("id", submissionId)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as MissionSubmission;
}
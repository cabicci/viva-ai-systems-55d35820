/** Honest assistant-preparation state for an approved curriculum edition.
 * Inputs are the latest automatic source event for `<course>:intake` and its
 * linked job (if any). Output carries only bounded codes and counts. */
export type PreparationState = "queued" | "preparing" | "failed" | "ready";
export type Preparation = {
  state: PreparationState;
  done: number | null;
  total: number | null;
  code: string | null;
};
export type SourceEventRow = {
  source_sha: string | null;
  withdrawn: boolean;
  job_id: string | null;
};
export type JobRow = {
  state: "queued" | "running" | "complete" | "held";
  next_offset: number;
  scope_count: number;
  error_code: string | null;
};
const CODE = /^[A-Z][A-Z0-9_]{1,63}$/;
export function preparationStatus(
  versionState: "draft" | "approved" | "ready",
  version: string,
  event: SourceEventRow | null,
  job: JobRow | null,
): Preparation | null {
  if (versionState === "draft") return null;
  if (versionState === "ready") return { state: "ready", done: null, total: null, code: null };
  if (!event || event.withdrawn || event.source_sha !== version)
    return { state: "failed", done: null, total: null, code: "PREPARATION_EVENT_MISSING" };
  if (!event.job_id || !job) return { state: "queued", done: null, total: null, code: null };
  const total = job.scope_count;
  const done = Math.min(Math.max(job.next_offset, 0), total);
  if (job.state === "held")
    return {
      state: "failed",
      done,
      total,
      code: job.error_code && CODE.test(job.error_code) ? job.error_code : "PREPARATION_HELD",
    };
  if (job.state === "queued") return { state: "queued", done, total, code: null };
  // A complete job still waits for the edition's activation to report "ready".
  return { state: "preparing", done: job.state === "complete" ? total : done, total, code: null };
}

/** Curriculum-adapter job row as read for AI curricula (no source events exist for area "ai"). */
export type CurriculumJobRow = JobRow & {
  area: string;
  card_id: string;
  adapter: string | null;
  curriculum_version: string | null;
  created_at: string;
};

/** Exact match only: adapter, area, course and immutable curriculum version; newest wins. */
export function matchCurriculumJob(
  jobs: CurriculumJobRow[],
  area: string,
  course: string,
  version: string,
): CurriculumJobRow | null {
  let best: CurriculumJobRow | null = null;
  for (const j of jobs) {
    if (j.adapter !== "curriculum" || j.area !== area || j.card_id !== course) continue;
    if (j.curriculum_version !== version) continue;
    if (!best || j.created_at > best.created_at) best = j;
  }
  return best;
}

/** AI curricula: derive status from the matching job; an approved edition without one is queued. */
export function aiPreparationStatus(
  versionState: "draft" | "approved" | "ready",
  version: string,
  job: JobRow | null,
): Preparation | null {
  return preparationStatus(
    versionState,
    version,
    { source_sha: version, withdrawn: false, job_id: job ? "job" : null },
    job,
  );
}

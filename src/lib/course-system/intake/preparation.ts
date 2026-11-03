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
export type SourceEventRow = { source_sha: string | null; withdrawn: boolean; job_id: string | null };
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

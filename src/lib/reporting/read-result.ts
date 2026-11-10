/** Supabase can resolve a failed read instead of rejecting its promise. */
export function assertReportRead<T extends { error?: unknown }>(label: string, result: T): T {
  if (result.error != null) throw new Error(`Failed to load ${label}`);
  return result;
}

export type ReportReadFailure = { __error: string };

/** Keep partial reports useful, but never turn a failed section into an empty one.
 * Only trusted section labels are included; provider error details stay private.
 */
export async function captureReportRead<T extends { error?: unknown }>(
  label: string,
  read: PromiseLike<T>,
): Promise<T | ReportReadFailure> {
  try {
    return assertReportRead(label, await read);
  } catch {
    return { __error: label };
  }
}

/** The server may return fewer rows than requested; length is never a total. */
export function reportSampleLabel(
  rowCount: number,
  requestedLimit: number,
  totalCount?: number | null,
): string {
  const sample = `عينة مسترجعة: ${rowCount} سجل (حد الطلب ${requestedLimit}؛ ليست إجمالي المنصة)`;
  if (totalCount === undefined) return sample;
  if (
    typeof totalCount !== "number" ||
    !Number.isSafeInteger(totalCount) ||
    totalCount < rowCount
  ) {
    return `${sample}؛ الإجمالي الدقيق غير متاح`;
  }
  return `${sample}؛ إجمالي السجلات المطابقة للفلتر: ${totalCount}`;
}

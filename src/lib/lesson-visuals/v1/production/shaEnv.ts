/**
 * Resolve content vs execution SHA from workflow env (fail-closed helpers for scripts).
 * SOURCE_SHA remains a legacy alias for content only (failed-only old receipt bundles).
 */

export function resolveContentShaFromEnv(
  env: Record<string, string | undefined> = process.env,
): string {
  return (
    env.CONTENT_SHA ??
    env.APPROVED_CONTENT_SHA ??
    env.SOURCE_SHA ??
    ""
  ).trim();
}

export function resolveExecutionShaFromEnv(
  env: Record<string, string | undefined> = process.env,
): string {
  return (
    env.EXECUTION_SHA ??
    env.APPROVED_EXECUTION_SHA ??
    ""
  ).trim();
}

export function resolveActualExecutionShaFromEnv(
  env: Record<string, string | undefined> = process.env,
): string {
  return (env.ACTUAL_EXECUTION_SHA ?? "").trim();
}

import { currentReleaseFailureCode } from "./contracts";

export type CurrentDatabaseDiagnostic = Readonly<{
  kind: "transport" | "response" | "invalid_response";
  httpStatus: number | null;
  databaseCode: string | null;
}>;
class CurrentDatabaseError extends Error {
  readonly diagnostic: CurrentDatabaseDiagnostic;
  constructor(code: string, diagnostic: CurrentDatabaseDiagnostic) {
    super(code);
    this.diagnostic = Object.freeze({ ...diagnostic });
  }
}
export function currentDatabaseFailureDiagnostic(error: unknown): CurrentDatabaseDiagnostic | null {
  return error instanceof CurrentDatabaseError ? { ...error.diagnostic } : null;
}
type RpcResponse = { data: unknown; error: unknown; status?: unknown };

/** Preserve only bounded transport metadata, never the response body or cause. */
export async function currentDatabaseCall(call: () => Promise<RpcResponse>): Promise<unknown> {
  let response: RpcResponse;
  try { response = await call(); }
  catch {
    throw new CurrentDatabaseError("CURRENT_DATABASE_TRANSPORT_UNAVAILABLE", {
      kind: "transport", httpStatus: null, databaseCode: null,
    });
  }
  if (!response || typeof response !== "object" || !("error" in response) || !("data" in response)) {
    throw new CurrentDatabaseError("CURRENT_DATABASE_UNAVAILABLE", {
      kind: "invalid_response", httpStatus: null, databaseCode: null,
    });
  }
  if (response.error) {
    const error = response.error as { message?: unknown; code?: unknown };
    const databaseCode = typeof error.code === "string" && /^(?:[0-9A-Z]{5}|PGRST[0-9]{3})$/.test(error.code) ? error.code : null;
    const httpStatus = typeof response.status === "number" && Number.isInteger(response.status) &&
      response.status >= 400 && response.status <= 599 ? response.status : null;
    // Existing CURRENT_* contract codes are retained; arbitrary bodies are discarded.
    const code = typeof error.message === "string" && /^CURRENT_[A-Z0-9_]{1,64}$/.test(error.message)
      ? error.message : databaseCode ? `CURRENT_DATABASE_${databaseCode}` : "CURRENT_DATABASE_UNAVAILABLE";
    throw new CurrentDatabaseError(code, { kind: "response", httpStatus, databaseCode });
  }
  return response.data;
}

export type CurrentFailureStage = "status" | "initialize" | "activate" | "rollback" |
  "claim" | "reuse" | "reserve" | "embed" | "commit";
export type CurrentBatchProgress = {
  reservation: "not_attempted" | "unconfirmed" | "reserved";
  embedding: "not_invoked" | "unconfirmed" | "validated";
  commit: "not_attempted" | "unconfirmed";
};
export type CurrentCleanupDiagnostic = Readonly<{
  outcome: "response_received" | "failed";
  errorCode: string | null;
  database: CurrentDatabaseDiagnostic | null;
}>;
export type CurrentFailureDiagnostic = Readonly<{
  stage: CurrentFailureStage;
  reservation: CurrentBatchProgress["reservation"];
  embedding: CurrentBatchProgress["embedding"];
  commit: CurrentBatchProgress["commit"];
  database: CurrentDatabaseDiagnostic | null;
  cleanup: CurrentCleanupDiagnostic | null;
}>;
class CurrentStageError extends Error {
  readonly diagnostic: CurrentFailureDiagnostic;
  constructor(stage: CurrentFailureStage, error: unknown, progress?: CurrentBatchProgress, cleanup?: CurrentCleanupDiagnostic) {
    super(currentReleaseFailureCode(error));
    this.diagnostic = Object.freeze({ stage,
      reservation: progress?.reservation ?? "not_attempted",
      embedding: progress?.embedding ?? "not_invoked",
      commit: progress?.commit ?? "not_attempted",
      database: currentDatabaseFailureDiagnostic(error),
      cleanup: cleanup ? Object.freeze({ ...cleanup }) : null,
    });
  }
}
/** Callers already enforce authorization. No source, vector, token or lease is exposed. */
export function currentReleaseStageError(stage: CurrentFailureStage, error: unknown,
  progress?: CurrentBatchProgress, cleanup?: CurrentCleanupDiagnostic): Error {
  return new CurrentStageError(stage, error, progress, cleanup);
}
export function currentReleaseFailureDiagnostic(error: unknown): CurrentFailureDiagnostic | null {
  if (!(error instanceof CurrentStageError)) return null;
  const d = error.diagnostic;
  return { ...d, database: d.database ? { ...d.database } : null,
    cleanup: d.cleanup ? { ...d.cleanup, database: d.cleanup.database ? { ...d.cleanup.database } : null } : null };
}
export async function atCurrentReleaseStage<T>(stage: CurrentFailureStage, run: () => Promise<T>): Promise<T> {
  try { return await run(); }
  catch (error) { throw currentReleaseStageError(stage, error); }
}

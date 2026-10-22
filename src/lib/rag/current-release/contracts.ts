import type { CurrentAiApproval } from "../current-source-release";
import type { RagChunkRecord } from "../types";
export const CURRENT_BATCH_SIZE = 64;
export const CURRENT_EMBEDDING_MODEL = "text-embedding-3-small";
export const CURRENT_EMBEDDING_DIMENSIONS = 1536;
export type CurrentRelease = { approval: CurrentAiApproval; chunks: RagChunkRecord[]; material: string };
export type CurrentOperation = "status" | "initialize" | "batch" | "activate" | "rollback";
export type CurrentReleaseRequest = {
  operation: CurrentOperation; releaseId: string; requestId: string;
  executionId?: string; expectedActiveVersion?: string | null; confirmation?: string;
};
export type CurrentRpc = (name: string, args: Record<string, unknown>) => Promise<unknown>;
export type CurrentExecutorDependencies = {
  authorized(): Promise<boolean>;
  load(): CurrentRelease;
  rpc: CurrentRpc;
  embed(texts: string[]): Promise<{ vectors: number[][]; tokens?: number }>;
};
export function confirmationFor(operation: Exclude<CurrentOperation, "status">, releaseId: string): string {
  return `current-ai:${operation}:${releaseId}`;
}

/** Fixed diagnostic codes only; never return provider bodies, keys or source text. */
export function currentReleaseFailureCode(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  if (/^CURRENT_[A-Z0-9_]{1,64}$/.test(message)) return message;
  const status = /^PROVIDER_FAILED:HTTP_([45][0-9]{2})$/.exec(message);
  if (status) return `CURRENT_PROVIDER_HTTP_${status[1]}`;
  if (message === "PROVIDER_FAILED:TIMEOUT") return "CURRENT_PROVIDER_TIMEOUT";
  if (/^PROVIDER_RESPONSE_INVALID(?::[a-z_]{1,30})?$/.test(message)) return "CURRENT_PROVIDER_INVALID";
  if (message === "PROVIDER_FAILED") return "CURRENT_PROVIDER_UNAVAILABLE";
  return "CURRENT_OPERATION_UNAVAILABLE";
}

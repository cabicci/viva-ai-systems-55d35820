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

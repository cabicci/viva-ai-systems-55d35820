import approval from "../../../../artifacts/rag/current/approval-snapshot.json";
import chunks from "../../../../artifacts/rag/current/chunks.json";
import type { CurrentAiApproval } from "../current-source-release";
import type { RagChunkRecord } from "../types";
import { validateCurrentRelease } from "./corpus";

export function loadCurrentRelease() {
  return validateCurrentRelease(approval as CurrentAiApproval, chunks as RagChunkRecord[]);
}

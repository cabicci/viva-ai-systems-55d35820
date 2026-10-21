import { confirmationFor, CURRENT_BATCH_SIZE, CURRENT_EMBEDDING_DIMENSIONS,
  type CurrentExecutorDependencies, type CurrentReleaseRequest } from "./contracts";
import { loadNativeReusableEmbeddings } from "../lovable-native/embedding-reuse.server";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const record = (v: unknown): Record<string, unknown> => {
  if (!v || typeof v !== "object" || Array.isArray(v)) throw new Error("CURRENT_RPC_INVALID");
  return v as Record<string, unknown>;
};
const vectorValid = (v: unknown): v is number[] => Array.isArray(v) &&
  v.length === CURRENT_EMBEDDING_DIMENSIONS && v.every(x => typeof x === "number" && Number.isFinite(x)) && v.some(x => x !== 0);

/** One durable, idempotent batch per invocation. Source and vectors never come from the browser. */
export async function executeCurrentRelease(input: CurrentReleaseRequest, deps: CurrentExecutorDependencies) {
  if (!await deps.authorized()) throw new Error("FORBIDDEN");
  if (!input || !["status", "initialize", "batch", "activate", "rollback"].includes(input.operation) ||
    !uuid.test(input.requestId) || !/^[a-f0-9]{64}$/.test(input.releaseId)) throw new Error("CURRENT_REQUEST_INVALID");
  const release = deps.load(), approval = release.approval;
  if (input.releaseId !== approval.releaseId) throw new Error("CURRENT_RELEASE_CHANGED");
  if (input.operation !== "status" && input.confirmation !== confirmationFor(input.operation, input.releaseId))
    throw new Error("CURRENT_CONFIRMATION_REQUIRED");
  const common = { p_release_id: approval.releaseId };
  if (input.operation === "status") return record(await deps.rpc("rag_current_status", common));
  if (input.operation === "initialize") return record(await deps.rpc("rag_current_initialize", {
    ...common, p_material: release.material, p_request_id: input.requestId,
  }));
  if (!input.executionId || !uuid.test(input.executionId)) throw new Error("CURRENT_EXECUTION_REQUIRED");
  const execution = { ...common, p_execution_id: input.executionId, p_request_id: input.requestId };
  if (input.operation === "activate" || input.operation === "rollback") {
    if (!("expectedActiveVersion" in input) ||
      (input.expectedActiveVersion !== null && (typeof input.expectedActiveVersion !== "string" || input.expectedActiveVersion.length > 250)))
      throw new Error("CURRENT_EXPECTED_ACTIVE_REQUIRED");
    return record(await deps.rpc(`rag_current_${input.operation}`, {
      ...execution, p_expected_active: input.expectedActiveVersion,
    }));
  }
  const claim = record(await deps.rpc("rag_current_claim", execution));
  // A lost HTTP response must never result in a repeated provider call.
  if (claim.replayed === true || claim.done === true) return { ...claim, providerCalls: 0 };
  if (!uuid.test(String(claim.leaseToken)) || !Array.isArray(claim.chunkIds) || !claim.chunkIds.length ||
    claim.chunkIds.length > CURRENT_BATCH_SIZE || new Set(claim.chunkIds).size !== claim.chunkIds.length)
    throw new Error("CURRENT_RPC_INVALID");
  const byId = new Map(release.chunks.map(c => [c.chunkId, c]));
  const selected = claim.chunkIds.map(id => byId.get(String(id)));
  if (selected.some(c => !c)) throw new Error("CURRENT_CLAIM_CONTENT_MISMATCH");
  const chunks = selected as typeof release.chunks;
  const lease = { ...execution, p_lease_token: claim.leaseToken };
  try {
    const reused = await loadNativeReusableEmbeddings({ rpc: async (name, args) => ({ data: await deps.rpc(name, args), error: null }) }, chunks);
    // A cache candidate can be provenance-valid yet unusable as a cosine vector.
    for (const [id, vector] of reused) if (!vectorValid(vector)) reused.delete(id);
    const missing = chunks.filter(c => !reused.has(c.chunkId));
    if (missing.length) {
      const reservation = record(await deps.rpc("rag_current_reserve_provider", lease));
      if (reservation.reserved !== true) throw new Error("CURRENT_PROVIDER_ALREADY_RESERVED");
      const result = await deps.embed(missing.map(c => c.displayText));
      if (!Array.isArray(result.vectors) || result.vectors.length !== missing.length || !result.vectors.every(vectorValid))
        throw new Error("CURRENT_PROVIDER_INVALID");
      missing.forEach((c, i) => reused.set(c.chunkId, result.vectors[i]));
    }
    const result = record(await deps.rpc("rag_current_commit", { ...lease,
      p_rows: chunks.map(c => ({ chunkId: c.chunkId, content: c.displayText, embedding: reused.get(c.chunkId) })),
    }));
    return { ...result, providerCalls: missing.length ? 1 : 0, reusedChunks: chunks.length - missing.length };
  } catch (error) {
    // An uncertain commit is never replayed with a fresh provider call under this request ID.
    try { await deps.rpc("rag_current_fail", lease); } catch { /* leave durable lease for operator review */ }
    throw error;
  }
}

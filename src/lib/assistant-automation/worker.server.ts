import { automaticPlans, type AutomaticPlan, type SourceMetadata } from "./manifest";
import { automationRpc, checkAutomaticLease, leaseArguments, reserveAutomaticProvider, type AutomaticLease } from "./store.server";
import { CARD_REGISTRY } from "@/lib/card-assistant/registry";
import { confirmationFor } from "@/lib/rag/current-release/contracts";

declare const __ASSISTANT_INDEXER_BUILD__: string;
type Query = { order(field: string): Query; range(from: number, to: number): Promise<{ data: unknown; error: unknown }> };
async function metadata(table: string, columns: string, order: string[]): Promise<unknown[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const rows: unknown[] = [];
  for (let offset = 0; offset < 100000; offset += 500) {
    let query = supabaseAdmin.from(table as never).select(columns) as unknown as Query;
    for (const field of order) query = query.order(field);
    const result = await query.range(offset, offset + 499);
    if (result.error || !Array.isArray(result.data)) throw new Error("AUTOMATION_SOURCE_UNAVAILABLE");
    rows.push(...result.data);
    if (result.data.length < 500) return rows;
  }
  throw new Error("AUTOMATION_SCOPE_LIMIT");
}
export async function currentAutomaticPlans(): Promise<AutomaticPlan[]> {
  if (typeof __ASSISTANT_INDEXER_BUILD__ !== "string") throw new Error("AUTOMATION_BUILD_UNAVAILABLE");
  const { loadCurrentRelease } = await import("@/lib/rag/current-release/corpus.server");
  const ai = loadCurrentRelease();
  const revisionsBefore = await automationRpc<Record<string, string>>("assistant_auto_source_revisions", { p_registry: CARD_REGISTRY });
  const [kids, technical, academicCourses, academic] = await Promise.all([
    metadata("kids_content_approvals", "level_id,lesson_number,locale,approved_sha256", ["level_id", "lesson_number", "locale"]),
    metadata("technical_lesson_content", "lesson_id,locale,source_sha256", ["lesson_id", "locale"]),
    metadata("academic_courses", "id,enabled,assistant_enabled,assistant_review_enabled", ["id"]),
    metadata("academic_lesson_content", "course_id,lesson_id,locale,approved,source_sha256", ["course_id", "locale", "lesson_id"]),
  ]);
  const revisions = await automationRpc<Record<string, string>>("assistant_auto_source_revisions", { p_registry: CARD_REGISTRY });
  if (JSON.stringify(revisionsBefore) !== JSON.stringify(revisions)) throw new Error("AUTOMATION_SOURCE_CHANGED");
  return automaticPlans(__ASSISTANT_INDEXER_BUILD__, { releaseId: ai.approval.releaseId, chunks: ai.chunks.length }, CARD_REGISTRY,
    { kids, technical, academicCourses, academic } as SourceMetadata, revisions);
}

export async function executeAutomaticScope(lease: AutomaticLease): Promise<Record<string, unknown>> {
  await checkAutomaticLease(lease);
  const manifest = lease.manifest, args = leaseArguments(lease);
  if (manifest.issue) throw new Error(manifest.issue);
  const authority = { check: () => checkAutomaticLease(lease), beforeEmbedding: () => reserveAutomaticProvider(lease),
    sources: manifest.scopes.filter((scope): scope is typeof scope & { sourceSha: string } => typeof scope.sourceSha === "string") };
  if (manifest.area === "ai") {
    const [{ currentReleaseDependencies }, { executeCurrentRelease }] = await Promise.all([
      import("@/lib/rag/current-release/dependencies.server"), import("@/lib/rag/current-release/executor.server"),
    ]);
    const deps = await currentReleaseDependencies({ beforeEmbedding: authority.beforeEmbedding });
    const release = deps.load();
    if (release.approval.releaseId !== manifest.releaseId) throw new Error("AUTOMATION_SOURCE_CHANGED");
    const releaseId = release.approval.releaseId;
    const status = await deps.rpc("rag_current_status", { p_release_id: releaseId }) as { executionId?: string; currentActiveVersion?: string };
    if (status.currentActiveVersion === release.approval.indexVersion) return { alreadyActive: true };
    // A legacy/manual uncertain batch is never reissued automatically, even
    // after its lease expires. An operator must reconcile its actual outcome.
    if (lease.offset > 0 && lease.offset < manifest.scopeCount - 1 &&
      await automationRpc("assistant_auto_ai_clear", { p_release: releaseId }) !== true)
      throw new Error("AUTOMATION_AI_REQUEST_NEEDS_REVIEW");
    const operation = lease.offset === 0 ? "initialize" : lease.offset === manifest.scopeCount - 1 ? "activate" : "batch";
    const result = await executeCurrentRelease({ operation, releaseId, requestId: lease.requestId,
      executionId: status.executionId, confirmation: confirmationFor(operation, releaseId),
      ...(operation === "activate" ? { expectedActiveVersion: status.currentActiveVersion ?? null } : {}) }, deps);
    if (operation === "batch" && result.committed !== true && result.done !== true) throw new Error("AUTOMATION_BATCH_UNCONFIRMED");
    if (operation === "activate" && result.activated !== true) throw new Error("AUTOMATION_ACTIVATION_UNCONFIRMED");
    return { operation, committed: result.committed === true, activated: result.activated === true,
      providerCalls: result.providerCalls ?? 0, reusedChunks: result.reusedChunks ?? 0 };
  }
  if (lease.offset === manifest.scopeCount - 1) {
    const published = await automationRpc(manifest.area === "academic" ? "assistant_auto_publish_academic" : "assistant_auto_publish_card", args);
    if (published !== true) throw new Error("AUTOMATION_PUBLICATION_UNCONFIRMED");
    return { activated: true };
  }
  const expected = manifest.scopes[lease.offset];
  if (!expected?.sourceSha) throw new Error("AUTOMATION_SOURCE_UNAPPROVED");
  const result = manifest.area === "academic"
    ? await (await import("@/lib/academic-education/assistant.server")).indexAcademicBatchWithAuthority({ courseId: manifest.cardId, offset: lease.offset, batchSize: 1 }, authority)
    : await (await import("@/lib/card-assistant/assistant.server")).indexCardBatchWithAuthority({ area: manifest.area, cardId: manifest.cardId, offset: lease.offset, batchSize: 1 }, authority);
  if (result.proofs.length !== 1 || result.proofs[0].stepId !== expected.stepId || result.proofs[0].locale !== expected.locale ||
    result.proofs[0].sourceSha !== expected.sourceSha) throw new Error("AUTOMATION_SCOPE_CHANGED");
  return { proofs: result.proofs, embedded: result.embedded, reused: result.reused };
}

export type AutomaticTickDependencies = {
  plans(): Promise<AutomaticPlan[]>;
  rpc: typeof automationRpc;
  execute(lease: AutomaticLease): Promise<Record<string, unknown>>;
  registry: typeof CARD_REGISTRY;
};

/** Internal server ports permit a disposable DB transport without replacing the
 * queue/receipt algorithm. They are never accepted from an HTTP request. */
export async function automaticTick(requestId: string, dependencies?: AutomaticTickDependencies): Promise<Record<string, unknown>> {
  const ports = dependencies ?? { plans: currentAutomaticPlans, rpc: automationRpc,
    execute: executeAutomaticScope, registry: CARD_REGISTRY };
  const plans = await ports.plans();
  const keys = plans.map(plan => plan.key);
  await ports.rpc("assistant_auto_register", { p_jobs: plans.map(({ key, material }) => ({ key, material })), p_registry: ports.registry });
  await ports.rpc("assistant_auto_link_sources", { p_keys: keys });
  const claim = await ports.rpc<Record<string, unknown>>("assistant_auto_claim", { p_keys: keys, p_request: requestId });
  if (claim.claimed !== true) return claim;
  const lease = claim as unknown as AutomaticLease;
  try {
    const receipt = await ports.execute(lease);
    const done = lease.offset + 1 === lease.manifest.scopeCount;
    let confirmed = false;
    try {
      confirmed = await ports.rpc("assistant_auto_finish", { ...leaseArguments(lease), p_done: done, p_receipt: receipt }) === true;
    } catch { /* The mutation may have committed. Never execute or finish again. */ }
    if (!confirmed) {
      try {
        confirmed = await ports.rpc("assistant_auto_receipt", { p_job: lease.jobId, p_request: lease.requestId,
          p_offset: lease.offset, p_receipt: receipt }) === true;
      } catch { /* Unknown remains held for reconciliation, never success. */ }
    }
    if (!confirmed) throw new Error("AUTOMATION_FINISH_UNCONFIRMED");
    return { progressed: true, area: lease.manifest.area, cardId: lease.manifest.cardId, completedScopes: lease.offset + 1,
      totalScopes: lease.manifest.scopeCount, cardComplete: done };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const code = /^AUTOMATION_[A-Z0-9_]{1,64}$/.test(message) ? message : "AUTOMATION_OPERATION_UNAVAILABLE";
    try { await ports.rpc("assistant_auto_hold", { ...leaseArguments(lease), p_code: code }); } catch { /* durable lease remains held */ }
    return { held: true, area: lease.manifest.area, cardId: lease.manifest.cardId, code };
  }
}

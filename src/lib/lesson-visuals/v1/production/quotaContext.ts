/**
 * Immutable preflight runtime attempt-quota context + static attempt slots.
 * Matrix jobs do not share a mutable counter — slots are derived deterministically.
 */
import { createHash } from "node:crypto";
import {
  assertRuntimeAttemptWithinQuota,
  computeAttemptQuotaEnvelope,
} from "./attemptQuota";

export const QUOTA_CONTEXT_SCHEMA = "lesson-visual-runtime-quota-context/v1" as const;

export interface RuntimeQuotaContext {
  schemaVersion: typeof QUOTA_CONTEXT_SCHEMA;
  runId: string;
  controlRoomAuthorizationId: string;
  contentSha: string;
  executionSha: string;
  approvedManifestSha256: string;
  mode: "full" | "failed-only" | "pilot";
  totalAuthorizedCells: number;
  validSkippedCells: number;
  eligibleCells: number;
  maxRetries: number;
  attemptsPerEligibleCell: number;
  maxProviderAttempts: number;
  configuredProviderAttemptQuota: number;
  /** Authoritative matrix order (400 full/failed-only, or 12 pilot). */
  allCellIds: string[];
  /** Cells eligible for provider calls (ordered subset of allCellIds). */
  eligibleCellIds: string[];
  /** Cells with fully validated prior ACCEPTED receipts. */
  skippedCellIds: string[];
  /** Present when mode=pilot — SHA-256 of AUTHORIZED_PILOT_12.json bytes. */
  approvedPilotManifestSha256: string | null;
  /** SHA-256 of canonical context body excluding fingerprint field. */
  fingerprint: string;
}

export interface AttemptSlot {
  cellId: string;
  attemptNumber: number;
  eligibleIndex: number;
  slotIndex: number;
  slotKey: string;
}

function canonicalWithoutFingerprint(
  ctx: Omit<RuntimeQuotaContext, "fingerprint"> & { fingerprint?: string },
): string {
  const { fingerprint: _fp, ...rest } = ctx;
  return JSON.stringify(rest);
}

export function fingerprintQuotaContext(
  ctx: Omit<RuntimeQuotaContext, "fingerprint">,
): string {
  return createHash("sha256").update(canonicalWithoutFingerprint(ctx), "utf8").digest("hex");
}

export function buildRuntimeQuotaContext(input: {
  runId: string;
  controlRoomAuthorizationId: string;
  contentSha: string;
  executionSha: string;
  approvedManifestSha256: string;
  mode: "full" | "failed-only" | "pilot";
  allCellIds: readonly string[];
  skippedCellIds: readonly string[];
  maxRetries: number;
  configuredProviderAttemptQuota: number;
  approvedPilotManifestSha256?: string | null;
}): { ok: boolean; errors: string[]; context: RuntimeQuotaContext | null } {
  const errors: string[] = [];
  const allCellIds = [...input.allCellIds];
  const skippedSet = new Set(input.skippedCellIds);
  for (const id of skippedSet) {
    if (!allCellIds.includes(id)) errors.push(`skipped cell not in matrix: ${id}`);
  }
  if (input.mode === "pilot") {
    if (allCellIds.length !== 12) {
      errors.push(`pilot quota matrix must be 12 cells, got ${allCellIds.length}`);
    }
    if (skippedSet.size !== 0) {
      errors.push("pilot mode must not mix failed-only skips");
    }
    const pilotDigest = (input.approvedPilotManifestSha256 ?? "").toLowerCase();
    if (!/^[a-f0-9]{64}$/.test(pilotDigest)) {
      errors.push("approvedPilotManifestSha256 required for pilot");
    }
  } else if (input.approvedPilotManifestSha256) {
    errors.push("approvedPilotManifestSha256 only allowed for pilot mode");
  }
  const eligibleCellIds = allCellIds.filter((id) => !skippedSet.has(id));
  const envelope = computeAttemptQuotaEnvelope({
    authoritativeCells: allCellIds.length,
    eligibleCells: eligibleCellIds.length,
    validSkippedCells: skippedSet.size,
    maxRetries: input.maxRetries,
    configuredProviderAttemptQuota: input.configuredProviderAttemptQuota,
  });
  if (!envelope.ok) errors.push(...envelope.errors);
  if (!input.runId.trim()) errors.push("runId missing");
  if (!input.controlRoomAuthorizationId.trim()) errors.push("controlRoomAuthorizationId missing");
  if (!/^[a-f0-9]{40}$/.test(input.contentSha)) errors.push("contentSha invalid");
  if (!/^[a-f0-9]{40}$/.test(input.executionSha)) errors.push("executionSha invalid");
  if (!/^[a-f0-9]{64}$/.test(input.approvedManifestSha256)) {
    errors.push("approvedManifestSha256 invalid");
  }

  if (errors.length) return { ok: false, errors, context: null };

  const base: Omit<RuntimeQuotaContext, "fingerprint"> = {
    schemaVersion: QUOTA_CONTEXT_SCHEMA,
    runId: input.runId,
    controlRoomAuthorizationId: input.controlRoomAuthorizationId,
    contentSha: input.contentSha,
    executionSha: input.executionSha,
    approvedManifestSha256: input.approvedManifestSha256,
    mode: input.mode,
    totalAuthorizedCells: allCellIds.length,
    validSkippedCells: skippedSet.size,
    eligibleCells: eligibleCellIds.length,
    maxRetries: input.maxRetries,
    attemptsPerEligibleCell: envelope.attemptsPerEligibleCell,
    maxProviderAttempts: envelope.maxProviderAttempts,
    configuredProviderAttemptQuota: input.configuredProviderAttemptQuota,
    allCellIds,
    eligibleCellIds,
    skippedCellIds: allCellIds.filter((id) => skippedSet.has(id)),
    approvedPilotManifestSha256:
      input.mode === "pilot" ? (input.approvedPilotManifestSha256 ?? "").toLowerCase() : null,
  };
  const fingerprint = fingerprintQuotaContext(base);
  return { ok: true, errors: [], context: { ...base, fingerprint } };
}

export function validateRuntimeQuotaContext(
  raw: unknown,
  expected?: Partial<
    Pick<
      RuntimeQuotaContext,
      "runId" | "controlRoomAuthorizationId" | "contentSha" | "executionSha" | "approvedManifestSha256" | "mode"
    >
  >,
): { ok: boolean; errors: string[]; context: RuntimeQuotaContext | null } {
  const errors: string[] = [];
  if (!raw || typeof raw !== "object") {
    return { ok: false, errors: ["quota context not an object"], context: null };
  }
  const c = raw as RuntimeQuotaContext & { sourceSha?: string };
  const contentSha = c.contentSha ?? c.sourceSha ?? "";
  const executionSha = c.executionSha ?? c.sourceSha ?? "";
  if (c.schemaVersion !== QUOTA_CONTEXT_SCHEMA) errors.push("unsupported quota context schemaVersion");
  if (!Array.isArray(c.allCellIds) || !Array.isArray(c.eligibleCellIds) || !Array.isArray(c.skippedCellIds)) {
    errors.push("quota context cell id arrays malformed");
  }
  const rebuilt = fingerprintQuotaContext({
    schemaVersion: c.schemaVersion,
    runId: c.runId,
    controlRoomAuthorizationId: c.controlRoomAuthorizationId,
    contentSha,
    executionSha,
    approvedManifestSha256: c.approvedManifestSha256,
    mode: c.mode,
    totalAuthorizedCells: c.totalAuthorizedCells,
    validSkippedCells: c.validSkippedCells,
    eligibleCells: c.eligibleCells,
    maxRetries: c.maxRetries,
    attemptsPerEligibleCell: c.attemptsPerEligibleCell,
    maxProviderAttempts: c.maxProviderAttempts,
    configuredProviderAttemptQuota: c.configuredProviderAttemptQuota,
    allCellIds: c.allCellIds,
    eligibleCellIds: c.eligibleCellIds,
    skippedCellIds: c.skippedCellIds,
    approvedPilotManifestSha256: c.approvedPilotManifestSha256 ?? null,
  });
  if (c.fingerprint !== rebuilt) errors.push("quota context fingerprint mismatch");
  if (c.mode !== "full" && c.mode !== "failed-only" && c.mode !== "pilot") {
    errors.push("quota context mode invalid");
  }
  if (c.mode === "pilot") {
    if (!c.approvedPilotManifestSha256 || !/^[a-f0-9]{64}$/.test(c.approvedPilotManifestSha256)) {
      errors.push("pilot quota context missing approvedPilotManifestSha256");
    }
    if (c.totalAuthorizedCells !== 12) {
      errors.push("pilot quota context totalAuthorizedCells must be 12");
    }
  } else if (c.approvedPilotManifestSha256) {
    errors.push("non-pilot quota context must not carry pilot digest");
  }
  if (expected?.runId && c.runId !== expected.runId) errors.push("quota context runId mismatch");
  if (
    expected?.controlRoomAuthorizationId &&
    c.controlRoomAuthorizationId !== expected.controlRoomAuthorizationId
  ) {
    errors.push("quota context authorization mismatch");
  }
  if (expected?.contentSha && contentSha !== expected.contentSha) {
    errors.push("quota context contentSha mismatch");
  }
  if (expected?.executionSha && executionSha !== expected.executionSha) {
    errors.push("quota context executionSha mismatch");
  }
  if (
    expected?.approvedManifestSha256 &&
    c.approvedManifestSha256 !== expected.approvedManifestSha256
  ) {
    errors.push("quota context manifest digest mismatch");
  }
  if (expected?.mode && c.mode !== expected.mode) errors.push("quota context mode mismatch");

  if (errors.length) return { ok: false, errors, context: null };
  return { ok: true, errors: [], context: c };
}

export function resolveAttemptSlot(
  context: RuntimeQuotaContext,
  cellId: string,
  attemptNumber: number,
): { ok: boolean; errors: string[]; slot: AttemptSlot | null } {
  const errors: string[] = [];
  if (context.skippedCellIds.includes(cellId)) {
    return { ok: false, errors: [`cell ${cellId} is skipped — no provider attempt slot`], slot: null };
  }
  const eligibleIndex = context.eligibleCellIds.indexOf(cellId);
  if (eligibleIndex < 0) {
    return { ok: false, errors: [`cell ${cellId} not in eligible set`], slot: null };
  }
  if (!Number.isInteger(attemptNumber) || attemptNumber < 1) {
    errors.push("attemptNumber invalid");
  }
  if (attemptNumber > context.attemptsPerEligibleCell) {
    errors.push(
      `attemptNumber ${attemptNumber} exceeds per-cell allowance ${context.attemptsPerEligibleCell}`,
    );
  }
  const slotIndex = eligibleIndex * context.attemptsPerEligibleCell + (attemptNumber - 1);
  const usedThroughThis = slotIndex + 1;
  const over = assertRuntimeAttemptWithinQuota(usedThroughThis, context.maxProviderAttempts);
  if (over) errors.push(over);
  if (slotIndex >= context.maxProviderAttempts) {
    errors.push(`slotIndex ${slotIndex} outside envelope ${context.maxProviderAttempts}`);
  }
  if (errors.length) return { ok: false, errors, slot: null };
  return {
    ok: true,
    errors: [],
    slot: {
      cellId,
      attemptNumber,
      eligibleIndex,
      slotIndex,
      slotKey: `${cellId}:${attemptNumber}`,
    },
  };
}

export function reconcileAttemptRecords(
  context: RuntimeQuotaContext,
  records: Array<{ cellId: string; attemptNumber: number; slotKey?: string; providerAttempted: boolean }>,
): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  const seenSlots = new Set<number>();
  const seenKeys = new Set<string>();
  let providerCalls = 0;

  for (const r of records) {
    if (!r.providerAttempted) {
      if (context.eligibleCellIds.includes(r.cellId) && r.attemptNumber >= 1) {
        // skipped/failed without attempt is fine
      }
      continue;
    }
    providerCalls += 1;
    if (context.skippedCellIds.includes(r.cellId)) {
      errors.push(`provider attempt recorded for skipped cell ${r.cellId}`);
      continue;
    }
    const slot = resolveAttemptSlot(context, r.cellId, r.attemptNumber);
    if (!slot.ok || !slot.slot) {
      errors.push(...slot.errors.map((e) => `attempt ${r.cellId}@${r.attemptNumber}: ${e}`));
      continue;
    }
    if (seenSlots.has(slot.slot.slotIndex) || seenKeys.has(slot.slot.slotKey)) {
      errors.push(`duplicate attempt slot ${slot.slot.slotKey}`);
    }
    seenSlots.add(slot.slot.slotIndex);
    seenKeys.add(slot.slot.slotKey);
    if (r.slotKey && r.slotKey !== slot.slot.slotKey) {
      errors.push(`slotKey mismatch for ${r.cellId}: ${r.slotKey} != ${slot.slot.slotKey}`);
    }
  }

  const envelopeErr = assertRuntimeAttemptWithinQuota(providerCalls, context.maxProviderAttempts);
  if (envelopeErr) errors.push(envelopeErr);
  if (providerCalls > context.configuredProviderAttemptQuota) {
    errors.push(
      `provider calls ${providerCalls} exceed configured quota ${context.configuredProviderAttemptQuota}`,
    );
  }

  return { ok: errors.length === 0, errors };
}

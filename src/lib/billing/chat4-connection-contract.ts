import type { DenialReasonCode, QuotaBucket } from "./types";

/**
 * Chat 4 (assistant-runtime) <-> billing connection contract.
 *
 * This module is DOCUMENTATION-ONLY. It declares the types and the required
 * call sequence for the Chat 4 assistant runtime. It is intentionally NOT
 * imported by supabase/functions/assistant-runtime/index.ts; the entitlement
 * edge only ever calls `evaluate_access` / `get_entitlement_snapshot`.
 *
 * PostgREST transport (Lovable Cloud): Edge Functions call **public.***
 * thin wrappers via the default exposed schema (`/rest/v1/rpc/...` with
 * service-role auth and **no** Accept-Profile / Content-Profile headers).
 * Each public wrapper is service_role-only and delegates to the matching
 * private `billing.*` implementation (see migration
 * `20260728140000_public_billing_rpc_bridge.sql`). Private billing tables
 * and private functions are not browser-accessible.
 *
 * Caller: service_role ONLY. userId is always server-derived from the verified
 * JWT — never trusted from the request body.
 */

export interface Chat4ReserveInput {
  /** Server-derived from the authenticated session; never client-supplied. */
  userId: string;
  /** Correlation id for the whole request lifecycle. */
  requestId: string;
  /** AI usage category; maps to the canonical `ai_assistant` quota bucket. */
  category: "assistant_runtime" | "mission_evaluation" | "reveal_answer" | "wow_path";
  lessonId?: string | null;
  idempotencyKey: string;
  units: number;
}

export interface Chat4ReserveOutput {
  allowed: boolean;
  denialCode: DenialReasonCode | null;
  reservationId: string | null;
  requestId: string;
  quotaBucket: QuotaBucket;
  remaining: number | null;
  idempotentReplay: boolean;
  expiresAt: string | null;
}

/**
 * Canonical PostgREST RPC names used by Chat 4 (public wrappers).
 * All are service_role only and delegate to matching billing.* functions.
 */
export const CHAT4_RPC = {
  reserve: "public.reserve_learner_ai_access",
  registerProviderAttempt: "public.register_provider_attempt",
  finalizeProviderAttempt: "public.finalize_provider_attempt",
  commit: "public.commit_ai_quota",
  release: "public.release_ai_quota",
} as const;

/** Private billing implementations behind the public wrappers. */
export const CHAT4_PRIVATE_RPC = {
  reserve: "billing.reserve_learner_ai_access",
  registerProviderAttempt: "billing.register_provider_attempt",
  finalizeProviderAttempt: "billing.finalize_provider_attempt",
  commit: "billing.commit_ai_quota",
  release: "billing.release_ai_quota",
} as const;

/**
 * Required Chat 4 sequence (enforced by the RPCs, documented here for callers):
 *
 *  1. reserve            -> `reserve_learner_ai_access`
 *                           If denied, STOP (do not call the provider).
 *  2. register attempt   -> `register_provider_attempt(reservation, provider,
 *                           providerRequestId, attemptIdempotencyKey?)`.
 *                           MUST run before each provider invocation. The DB
 *                           allocates the attempt_index server-side (1, 2, 3 ...)
 *                           and writes a DURABLE per-attempt ledger row. The
 *                           logical quota unit is committed exactly once, on the
 *                           FIRST provider start (reserved -> used).
 *  3. generate           -> call the AI provider.
 *  4. finalize attempt   -> `finalize_provider_attempt(reservation, attemptIndex,
 *                           status, ...)` records the terminal per-attempt
 *                           outcome (succeeded/failed/timed_out/canceled/
 *                           provider_rejected). Never moves quota.
 *  5. commit             -> `commit_ai_quota` exactly once with final token
 *                           counts (idempotent; no double counting).
 *  6. retries            -> `register_provider_attempt(reservation, ...)` again
 *                           for subsequent provider attempts under the same
 *                           reservation; the unit is never re-charged. Each
 *                           retry is its own durable ledger row.
 *  7. release            -> `release_ai_quota` ONLY if the provider never began
 *                           (no attempt registered). A started reservation is
 *                           committed, never released.
 */
export const CHAT4_SEQUENCE = [
  "reserve",
  "deny_stop",
  "register_provider_attempt_1",
  "generate",
  "commit_once",
  "retry_attempt_index_2_plus",
  "release_only_if_provider_never_began",
] as const;

export type Chat4SequenceStep = (typeof CHAT4_SEQUENCE)[number];

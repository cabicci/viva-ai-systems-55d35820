import type { QuotaBucket } from "../types";

/** Provider attempts are 1-indexed; the first attempt is registered as 1. */
export const FIRST_ATTEMPT_INDEX = 1;

export interface QuotaReservation {
  reservationId: string;
  userId: string;
  units: number;
  status: "reserved" | "committed" | "released";
  idempotencyKey: string;
  attemptIndex: number;
}

/**
 * Map an AI ledger usage category to its canonical quota bucket. Mirrors
 * billing.map_ledger_category_to_quota_bucket; unsupported categories throw.
 */
export function mapLedgerCategoryToQuotaBucket(category: string): QuotaBucket {
  if (
    category === "assistant_runtime" ||
    category === "mission_evaluation" ||
    category === "reveal_answer" ||
    category === "wow_path"
  ) {
    return "ai_assistant";
  }
  throw new Error(`QUOTA_CATEGORY_UNSUPPORTED:${category}`);
}

/**
 * A reservation is releasable only while still reserved and before the provider
 * began. Once the provider started, the logical unit is committed, never freed.
 */
export function canReleaseReservation(input: {
  status: "reserved" | "committed" | "released" | "stale_reconciled";
  providerStartedAt: string | null;
}): boolean {
  return input.status === "reserved" && input.providerStartedAt === null;
}

const reservationStore = new Map<string, QuotaReservation>();

export function reserveAiQuota(input: {
  userId: string;
  units: number;
  remaining: number;
  idempotencyKey: string;
}): QuotaReservation {
  const existing = [...reservationStore.values()].find(
    (r) => r.idempotencyKey === input.idempotencyKey,
  );
  if (existing) return existing;

  if (input.remaining < input.units) {
    throw new Error("QUOTA_EXCEEDED");
  }

  const reservation: QuotaReservation = {
    reservationId: crypto.randomUUID(),
    userId: input.userId,
    units: input.units,
    status: "reserved",
    idempotencyKey: input.idempotencyKey,
    attemptIndex: FIRST_ATTEMPT_INDEX,
  };
  reservationStore.set(reservation.reservationId, reservation);
  return reservation;
}

export function commitAiQuota(reservationId: string): QuotaReservation {
  const reservation = reservationStore.get(reservationId);
  if (!reservation || reservation.status !== "reserved") {
    throw new Error("RESERVATION_NOT_FOUND");
  }
  reservation.status = "committed";
  return reservation;
}

export function releaseAiQuota(reservationId: string): void {
  const reservation = reservationStore.get(reservationId);
  if (!reservation || reservation.status !== "reserved") {
    throw new Error("RESERVATION_NOT_FOUND");
  }
  reservation.status = "released";
}

export function _resetQuotaStoreForTests(): void {
  reservationStore.clear();
}

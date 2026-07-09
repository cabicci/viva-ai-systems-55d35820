export interface QuotaReservation {
  reservationId: string;
  userId: string;
  units: number;
  status: "reserved" | "committed" | "released";
  idempotencyKey: string;
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

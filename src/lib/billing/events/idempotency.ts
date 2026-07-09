export function buildIdempotencyKey(parts: readonly string[]): string {
  return parts.filter(Boolean).join(":");
}

export function isDuplicateIdempotencyKey<T extends { idempotencyKey: string }>(
  rows: readonly T[],
  key: string,
): boolean {
  return rows.some((row) => row.idempotencyKey === key);
}

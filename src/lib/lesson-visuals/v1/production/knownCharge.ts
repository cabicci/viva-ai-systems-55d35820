/** One non-estimating predicate shared by reuse, acceptance and aggregate reporting. */
export function hasKnownCharge(cost: unknown, method: number, providerName: string | null): cost is string {
  if (typeof cost !== "string" || !/^\d+$/.test(cost)) return false;
  // OpenAI generation replies never supplied a monetary charge. Unsupported zero
  // receipts cannot become accepted evidence through alternate numeric spellings.
  return method !== 2 || providerName !== "openai" || BigInt(cost) > 0n;
}

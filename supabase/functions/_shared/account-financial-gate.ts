type FinancialGateRpc = <T>(name: string, args: Record<string, unknown>) => Promise<T>;

// Only call after signature/TEST verification and authoritative provider
// metadata resolution. Never use a client-supplied user_id for this decision.
export async function financialDeliveryExpired(userId: unknown, rpc: FinancialGateRpc) {
  if (typeof userId !== "string" || !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(userId))
    return false;
  const expired = await rpc<boolean>("lc09_financial_expired", { p_user_id: userId });
  if (typeof expired !== "boolean") throw new Error("LC09_FINANCIAL_GATE_INVALID");
  return expired;
}

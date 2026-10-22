import type { AutomaticManifest } from "./manifest";
export type AutomaticLease = { jobId: string; requestId: string; leaseToken: string; offset: number; manifest: AutomaticManifest };
export async function automationRpc<T>(name: string, args: Record<string, unknown>): Promise<T> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const result = await supabaseAdmin.rpc(name as never, args as never);
  if (result.error) throw new Error("AUTOMATION_DATABASE_UNAVAILABLE");
  return result.data as T;
}
export function leaseArguments(lease: AutomaticLease) {
  return { p_job: lease.jobId, p_request: lease.requestId, p_lease: lease.leaseToken };
}
export async function checkAutomaticLease(lease: AutomaticLease): Promise<void> {
  if (await automationRpc("assistant_auto_check", leaseArguments(lease)) !== true) throw new Error("AUTOMATION_LEASE_UNAVAILABLE");
}
export async function reserveAutomaticProvider(lease: AutomaticLease): Promise<void> {
  if (await automationRpc("assistant_auto_reserve", leaseArguments(lease)) !== true) throw new Error("AUTOMATION_PROVIDER_ALREADY_RESERVED");
}

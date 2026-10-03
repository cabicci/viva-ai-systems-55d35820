import {
  isImmediateMailTarget,
  type ImmediateMailTarget,
} from "../../supabase/functions/_shared/immediate-mail-request";

/** Reuse the installed worker authorization, exclusively inside the server. */
export async function dispatchImmediateMail(target: ImmediateMailTarget) {
  if (!isImmediateMailTarget(target)) throw new Error("mail_dispatch_target_invalid");
  const url = process.env.SUPABASE_URL;
  const secret = process.env.ACCOUNT_WELCOME_JOB_SECRET;
  if (!url || !secret || secret.length < 32) throw new Error("mail_dispatch_unconfigured");
  let endpoint: URL;
  try {
    endpoint = new URL("/functions/v1/account-welcome-job", url);
  } catch {
    throw new Error("mail_dispatch_unconfigured");
  }
  if (
    endpoint.protocol !== "https:" ||
    !endpoint.hostname.endsWith(".supabase.co") ||
    endpoint.username ||
    endpoint.password ||
    endpoint.port
  )
    throw new Error("mail_dispatch_unconfigured");
  let response: Response;
  try {
    response = await fetch(endpoint.toString(), {
      method: "POST",
      redirect: "error",
      signal: AbortSignal.timeout(20_000),
      headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
      body: JSON.stringify({ immediate: target }),
    });
  } catch {
    console.warn("mail:immediate_dispatch_failure", { kind: "network" });
    throw new Error("mail_dispatch_unavailable");
  }
  if (!response.ok) {
    console.warn("mail:immediate_dispatch_failure", {
      kind: "worker_response",
      status: response.status,
    });
    throw new Error("mail_dispatch_unavailable");
  }
  const body = await response.json().catch(() => null);
  if (body?.enabled === false) throw new Error("mail_dispatch_disabled");
  const stats = body?.[target.stream];
  if (
    !stats ||
    !Number.isInteger(stats.accepted) ||
    !Number.isInteger(stats.deferred) ||
    stats.accepted < 0 ||
    stats.deferred < 0 ||
    stats.accepted + stats.deferred > 1
  )
    throw new Error("mail_dispatch_invalid_response");
  if (stats.deferred > 0) {
    console.warn("mail:immediate_dispatch_failure", { kind: "worker_deferred" });
    throw new Error("mail_dispatch_deferred");
  }
  return { accepted: stats.accepted as number, deferred: stats.deferred as number };
}

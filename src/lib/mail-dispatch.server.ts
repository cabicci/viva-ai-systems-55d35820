import {
  isImmediateMailTarget,
  type ImmediateMailTarget,
} from "../../supabase/functions/_shared/immediate-mail-request";

import {
  isContactAdministrationCommand,
  type ContactAdministrationCommand,
} from "../../supabase/functions/_shared/contact-automation-admin-worker";

/** Reuse the installed worker authorization, exclusively inside the server. */
async function postMailWorker(payload: Record<string, unknown>, adminAuthorization?: string) {
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
      redirect: "manual",
      signal: AbortSignal.timeout(20_000),
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
        ...(adminAuthorization ? { "X-Contact-Admin-Authorization": adminAuthorization } : {}),
      },
      body: JSON.stringify(payload),
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
  return response.json().catch(() => null);
}

export async function dispatchImmediateMail(target: ImmediateMailTarget) {
  if (!isImmediateMailTarget(target)) throw new Error("mail_dispatch_target_invalid");
  const body = await postMailWorker({ immediate: target });
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

/** Reads/admin actions use the same worker's Deno environment as actual sending. */
export async function dispatchContactAdministration(
  command: ContactAdministrationCommand,
  adminAuthorization: string,
): Promise<unknown> {
  if (!isContactAdministrationCommand(command)) throw new Error("contact_admin_request_invalid");
  if (!/^Bearer \S+$/.test(adminAuthorization ?? ""))
    throw new Error("contact_admin_authorization_required");
  const body = await postMailWorker({ contactAdministration: command }, adminAuthorization);
  if (!body || !body.contactAdministration || typeof body.contactAdministration !== "object")
    throw new Error("contact_admin_response_invalid");
  return body.contactAdministration;
}

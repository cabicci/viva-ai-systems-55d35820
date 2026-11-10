import { runContactMailJob } from "./contact-mail-worker.ts";

type Db = Parameters<typeof runContactMailJob>[0];
type Send = Parameters<typeof runContactMailJob>[1];

/** Only deployment configuration supplies this destination; never form fields or email text. */
export function contactAutomationOwner(value: string | undefined): string | null {
  const email = value?.trim().toLowerCase();
  return email && email.length <= 254 && /^[^\s<>@,;]+@[^\s<>@,;]+\.[^\s<>@,;]+$/.test(email)
    ? email
    : null;
}

/** Reuse the installed worker, sender, claim lease, receipt and idempotency key. */
export async function runContactAutomationJob(
  db: Db,
  send: Send,
  ownerEmail?: string,
  outboxId?: string,
) {
  const owner = contactAutomationOwner(ownerEmail);
  let preparationFailed = false;
  let scheduled = 0;
  let awaitingOwner = 0;
  try {
    const prepared = await db.rpc("prepare_contact_automation", {
      p_owner: owner,
      p_id: outboxId ?? null,
    });
    const plan = prepared.data as { scheduled?: unknown; awaiting_owner?: unknown } | null;
    if (
      prepared.error ||
      !plan ||
      !Number.isInteger(plan.scheduled) ||
      (plan.scheduled as number) < 0 ||
      !Number.isInteger(plan.awaiting_owner) ||
      (plan.awaiting_owner as number) < 0
    )
      throw new Error("contact_automation_prepare_failed");
    scheduled = plan.scheduled as number;
    awaitingOwner = plan.awaiting_owner as number;
  } catch {
    // Owner preparation is independent of the already persisted acknowledgement.
    preparationFailed = true;
    console.warn("contact:owner_preparation_failed");
  }
  const activeOwner = preparationFailed ? null : owner;
  const scopedDb: Db = {
    rpc: (name, args) =>
      name === "claim_contact_acknowledgements" || name === "claim_contact_acknowledgement"
        ? db.rpc("claim_contact_automation", { p_owner: activeOwner, p_id: args?.p_id ?? null })
        : db.rpc(name, args),
  };
  const mail = await runContactMailJob(scopedDb, send, outboxId, async (claim) => {
    const result = await db.rpc("begin_contact_mail_send", {
      p_id: claim.id,
      p_claim: claim.claim_token,
      p_owner: activeOwner,
    });
    if (result.error || typeof result.data !== "boolean")
      throw new Error("contact_mail_begin_failed");
    return result.data;
  });
  let reconciliation: Record<string, number> | null = null;
  try {
    const result = await db.rpc("contact_automation_status", {
      p_owner: owner,
      p_id: outboxId ?? null,
    });
    if (result.error || !result.data || typeof result.data !== "object")
      throw new Error("status_unavailable");
    const value = result.data as Record<string, unknown>;
    const keys = [
      "awaitingOwner",
      "ownerReconciliation",
      "retryWindowExpired",
      "messageWindowExpired",
      "intakeReconciliation",
      "inFlight",
      "withdrawn",
    ];
    if (!keys.every((key) => Number.isInteger(value[key]) && (value[key] as number) >= 0))
      throw new Error("status_unavailable");
    reconciliation = Object.fromEntries(keys.map((key) => [key, value[key] as number]));
    awaitingOwner = reconciliation.awaitingOwner;
  } catch {
    console.warn("contact:status_unavailable");
  }
  return {
    ...mail,
    automation: {
      status: preparationFailed
        ? "owner_preparation_failed"
        : owner
          ? "configured"
          : "owner_configuration_required",
      scheduled,
      awaitingOwner,
      reconciliation,
      statusReadFailed: reconciliation === null,
    },
  };
}

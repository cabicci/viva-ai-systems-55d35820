import { contactAutomationOwner } from "./contact-automation-worker.ts";

export type ContactAdministrationCommand = {
  actor: string;
  action: "status" | "withdraw" | "close_manual";
  id: string | null;
  reference: string | null;
};
const uuid = (value: unknown): value is string =>
  typeof value === "string" && /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value);
export function isContactAdministrationCommand(
  value: unknown,
): value is ContactAdministrationCommand {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const c = value as Record<string, unknown>;
  if (Object.keys(c).sort().join(",") !== "action,actor,id,reference" || !uuid(c.actor))
    return false;
  if (c.action === "status") return (c.id === null || uuid(c.id)) && c.reference === null;
  if (!uuid(c.id)) return false;
  if (c.action === "withdraw") return c.reference === null;
  return (
    c.action === "close_manual" &&
    typeof c.reference === "string" &&
    /^[A-Za-z0-9:/_.-]{3,200}$/.test(c.reference)
  );
}

/** Envelope parsing grants no authority. The user token is verified separately. */
export async function readContactAdministrationCommand(
  request: Request,
): Promise<ContactAdministrationCommand | null> {
  const raw = await request.text();
  if (raw.length > 4096) throw new Error("contact_admin_request_invalid");
  if (!raw.trim()) return null;
  const body: unknown = JSON.parse(raw);
  if (!body || typeof body !== "object" || Array.isArray(body))
    throw new Error("contact_admin_request_invalid");
  if (!("contactAdministration" in body)) return null;
  if (Object.keys(body).length !== 1 || !isContactAdministrationCommand(body.contactAdministration))
    throw new Error("contact_admin_request_invalid");
  return body.contactAdministration;
}

/** No prepare, claim, send, or customer delivery is reachable from this command. */
export async function runContactAdministrationCommand(
  db: {
    rpc(
      name: string,
      args: Record<string, unknown>,
    ): PromiseLike<{ data: unknown; error: unknown }>;
  },
  command: ContactAdministrationCommand,
  workerOwnerEmail: string | undefined,
) {
  if (!isContactAdministrationCommand(command)) throw new Error("contact_admin_request_invalid");
  const result = await db.rpc("admin_contact_automation_command", {
    p_actor: command.actor,
    p_action: command.action,
    p_id: command.id,
    p_owner: contactAutomationOwner(workerOwnerEmail),
    p_reference: command.reference,
  });
  if (result.error || !result.data || typeof result.data !== "object")
    throw new Error("contact_admin_unavailable");
  return result.data;
}

export async function verifyContactAdministrator(
  request: Request,
  command: ContactAdministrationCommand,
  auth: {
    getUser(token: string): PromiseLike<{ data: { user: { id: string } | null }; error: unknown }>;
  },
) {
  const header = request.headers.get("x-contact-admin-authorization") ?? "";
  if (!/^Bearer \S+$/.test(header)) return false;
  try {
    const result = await auth.getUser(header.slice(7));
    return !result.error && result.data.user?.id === command.actor;
  } catch {
    return false;
  }
}

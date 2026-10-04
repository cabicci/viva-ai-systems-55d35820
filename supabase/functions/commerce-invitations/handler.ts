import { invitationContent } from "../_shared/masaarat-mail.ts";
import type { ResendResult, TransactionalEmail } from "../_shared/resend.ts";
type Db = {
  auth: {
    getUser(token: string): PromiseLike<{ data: { user: { id: string } | null }; error: unknown }>;
  };
  rpc(name: string, args: Record<string, unknown>): PromiseLike<{ data: unknown; error: unknown }>;
};
/** Explicit admin batch only. No new job secret, credential, cron or implicit send. */
export async function handleCommerceInvitations(
  request: Request,
  db: Db,
  send: (message: TransactionalEmail) => Promise<ResendResult>,
) {
  if (request.method !== "POST") return new Response(null, { status: 405 });
  const bearer = request.headers.get("Authorization");
  if (!bearer?.startsWith("Bearer ")) return new Response(null, { status: 401 });
  const verified = await db.auth.getUser(bearer.slice(7));
  if (verified.error || !verified.data.user) return new Response(null, { status: 401 });
  if (Number(request.headers.get("content-length")) > 2000)
    return new Response(null, { status: 413 });
  let group: string;
  try {
    const text = await request.text();
    if (text.length > 2000) throw new Error();
    const body = JSON.parse(text);
    if (
      typeof body.group_id !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.group_id)
    )
      throw new Error();
    group = body.group_id;
  } catch {
    return new Response(null, { status: 400 });
  }
  const rpc = async (action: string, data: Record<string, unknown>) => {
    const result = await db.rpc("commerce_mail", { p_action: action, p_data: data });
    if (result.error) throw new Error("Commerce mail step failed");
    return result.data;
  };
  try {
    const rows = (await rpc("claim", { actor: verified.data.user.id, group_id: group })) as {
      id: string;
      invitation_id: string;
      recipient: string;
      payload: Omit<Parameters<typeof invitationContent>[0], "id">;
    }[];
    let accepted = 0,
      pending = 0;
    for (const row of rows) {
      if ((await rpc("authorize_attempt", { id: row.id })) !== true) {
        pending++;
        continue;
      }
      const content = invitationContent({ id: row.invitation_id, ...row.payload });
      const result = await send({
        to: row.recipient,
        ...content,
        idempotencyKey: `commerce-invitation/${row.id}`,
      });
      await rpc("result", {
        id: row.id,
        provider_id: result.ok ? result.emailId : null,
        retryable: !result.ok && result.retryable,
      });
      if (result.ok) accepted++;
      else pending++;
    }
    return Response.json({ accepted, pending, claimed: rows.length });
  } catch {
    return Response.json({ error: "commerce_mail_unavailable" }, { status: 503 });
  }
}

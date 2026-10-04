import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { parseCommand } from "./contracts";
import { validateReceipt } from "./receipts";

export const commerceCommand = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(parseCommand)
  .handler(async ({ data, context }): Promise<import("@/integrations/supabase/types").Json> => {
    if (data.action === "email_confirmation") {
      const orderId = (data.data as { id: string }).id;
      const queued = (await context.supabase.rpc(
        "queue_commerce_payment_confirmation" as never,
        { p_order: orderId } as never,
      )) as unknown as { data: { id: string; status: string } | null; error: unknown };
      if (queued.error || !queued.data) throw new Error("COMMERCE_CONFIRMATION_UNAVAILABLE");
      const mail = queued.data as { status: string };
      if (mail.status === "sent") return { mail_status: "accepted" };
      if (!["pending", "sending"].includes(mail.status))
        throw new Error("COMMERCE_CONFIRMATION_UNAVAILABLE");
      const { dispatchImmediateMail } = await import("@/lib/mail-dispatch.server");
      try {
        const sent = await dispatchImmediateMail({ stream: "commerce", id: orderId });
        return { mail_status: sent.accepted ? "accepted" : "queued" };
      } catch {
        return { mail_status: "queued" };
      }
    }
    // Keep the user's verified JWT all the way through the SQL authorization
    // boundary. No service role is used for orders/grants/admin commands.
    const { data: result, error } = await context.supabase.rpc(
      "commerce_command" as never,
      { p_action: data.action, p_data: data.data } as never,
    );
    if (error) throw new Error(error.message);
    if (data.action === "confirm" || data.action === "allocate") {
      // Payment is already committed. A mail failure must never roll it back or
      // prompt the administrator to create another payment. Batch retries use
      // the same stored outbox and provider idempotency key.
      const { dispatchImmediateMail } = await import("@/lib/mail-dispatch.server");
      const allocations = (data.data as { allocations: { order_id: string }[] }).allocations;
      await Promise.allSettled(
        allocations
          .slice(0, 5)
          .map((allocation) =>
            dispatchImmediateMail({ stream: "commerce", id: allocation.order_id }),
          ),
      );
    }
    return result;
  });
export const uploadCommerceReceipt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z
      .object({
        orderId: z.string().uuid(),
        mime: z.enum(["image/jpeg", "image/png", "application/pdf"]),
        base64: z.string().min(12).max(7_000_000),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const rpc = async (action: string, parameters: unknown) => {
      const result = await supabaseAdmin.rpc(
        "commerce_receipt" as never,
        { p_actor: context.userId, p_action: action, p_data: parameters } as never,
      );
      if (result.error) throw new Error(result.error.message);
      return result.data;
    };
    await rpc("authorize", { order_id: data.orderId });
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(data.base64)) throw new Error("Invalid receipt encoding");
    const bytes = Uint8Array.from(atob(data.base64), (c) => c.charCodeAt(0));
    validateReceipt(bytes, data.mime);
    const digest = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)))
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("");
    const id = crypto.randomUUID(),
      path = `${data.orderId}/${id}`;
    // Register the private object before upload, so an uncertain storage result
    // always has an owned retention manifest. Never leave an untracked object.
    const receipt = await rpc("attach", {
      id,
      order_id: data.orderId,
      storage_path: path,
      mime: data.mime,
      size_bytes: bytes.length,
      digest,
    });
    try {
      const stored = await supabaseAdmin.storage
        .from("commerce-receipts")
        .upload(path, bytes, { contentType: data.mime, upsert: false });
      if (stored.error) throw new Error("Receipt could not be stored");
    } catch (error) {
      const cleanup = await supabaseAdmin.storage.from("commerce-receipts").remove([path]);
      // Keep the manifest if removal was uncertain; the account's existing
      // financial retention worker will erase it at the authoritative deadline.
      if (!cleanup.error) await rpc("discard", { id, order_id: data.orderId });
      throw error;
    }
    // The manifest transaction already queued a durable sales notification.
    // Dispatch only after storage succeeds; mail failure never deletes a receipt.
    const { dispatchImmediateMail } = await import("@/lib/mail-dispatch.server");
    try {
      await dispatchImmediateMail({ stream: "commerce_receipt", id });
    } catch {
      // The existing scheduled worker retries the same outbox message.
    }
    return receipt;
  });
export const readCommerceReceipt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const row = await supabaseAdmin.rpc(
      "commerce_receipt" as never,
      { p_actor: context.userId, p_action: "read", p_data: { id: data.id } } as never,
    );
    if (row.error) throw new Error("Receipt access denied");
    const path = (row.data as unknown as { storage_path: string }).storage_path;
    const file = await supabaseAdmin.storage.from("commerce-receipts").download(path);
    if (file.error || !file.data) throw new Error("Receipt unavailable");
    const bytes = new Uint8Array(await file.data.arrayBuffer());
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    // No publicly reusable signed URL; every download rechecks authorization.
    return { base64: btoa(binary), mime: file.data.type };
  });

export const previewCommerceInvitation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const response = await context.supabase.rpc(
      "commerce_command" as never,
      { p_action: "admin_list", p_data: {} } as never,
    );
    if (response.error) throw new Error("Administrator required");
    const rows = response.data as unknown as { invitations: import("./contracts").Invitation[] };
    const row = rows.invitations.find((x) => x.id === data.id);
    if (!row) throw new Error("Invitation missing");
    const { invitationContent } = await import("../../../supabase/functions/_shared/masaarat-mail");
    return invitationContent(row);
  });

export const dispatchCommerceInvitations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ groupId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    // Invoke the new explicit batch endpoint using the verified caller JWT.
    // Mail credentials remain in the existing Supabase mail environment.
    const response = await context.supabase.functions.invoke("commerce-invitations", {
      body: { group_id: data.groupId },
    });
    if (response.error) throw new Error("Invitation batch unavailable");
    return response.data as { accepted: number; pending: number; claimed: number };
  });

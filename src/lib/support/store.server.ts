import type { SupportProvider } from "./config";

export type ClaimDecision = "process" | "public_facts" | "duplicate" | "handoff" | "rate_limited";
export type MarkStatus = "sending" | "replied" | "failed" | "ambiguous" | "ignored" | "handoff";
export interface SupportStore {
  claim(provider: SupportProvider, eventKey: string, senderHash: string): Promise<ClaimDecision>;
  mark(provider: SupportProvider, eventKey: string, status: MarkStatus): Promise<boolean>;
  handoff(senderHash: string, hours: number): Promise<void>;
}

/** Service-only RPCs over the private support schema; callers are verified first. */
export async function cloudSupportStore(): Promise<SupportStore> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const rpc = async (name: string, args: Record<string, unknown>) => {
    const r = await supabaseAdmin.rpc(name as never, args as never);
    if (r.error) throw new Error("SUPPORT_STORE_UNAVAILABLE");
    return r.data as unknown;
  };
  return {
    async claim(provider, eventKey, senderHash) {
      const v = await rpc(provider === "twilio_whatsapp" ? "support_claim_event" : "support_claim_meta_event", {
        p_provider: provider,
        p_event_key: eventKey,
        p_sender_hash: senderHash,
      });
      if (v === "process" || v === "public_facts" || v === "duplicate" || v === "handoff" || v === "rate_limited") return v;
      throw new Error("SUPPORT_STORE_UNAVAILABLE");
    },
    async mark(provider, eventKey, status) {
      return (await rpc("support_mark_event", {
        p_provider: provider,
        p_event_key: eventKey,
        p_status: status,
      })) === true;
    },
    async handoff(senderHash, hours) {
      await rpc("support_set_handoff", { p_sender_hash: senderHash, p_hours: hours });
    },
  };
}

export async function senderHash(family: string, id: string): Promise<string> {
  const bytes = new TextEncoder().encode(`masaarat-support:${family}:${id}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

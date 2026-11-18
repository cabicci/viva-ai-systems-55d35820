import type { SupportProvider } from "./config";

export type ClaimDecision = "process" | "public_facts" | "duplicate" | "handoff" | "rate_limited";
export type MarkStatus = "sending" | "replied" | "failed" | "ambiguous" | "ignored" | "handoff";
export type EchoMatch = "own" | "pending" | "unmatched" | "unavailable";
export type OutboundStatus = "sent" | "rejected" | "ambiguous";
export interface SupportStore {
  claim(provider: SupportProvider, eventKey: string, senderHash: string): Promise<ClaimDecision>;
  mark(provider: SupportProvider, eventKey: string, status: MarkStatus): Promise<boolean>;
  handoff(senderHash: string, hours: number): Promise<void>;
  /** Optional outbound-DM ledger (hashes only) used to recognise this app's own echoes by message ID. */
  beginOutbound?(attemptHash: string, conversationHash: string): Promise<void>;
  finishOutbound?(attemptHash: string, midHash: string | null, status: OutboundStatus): Promise<void>;
  matchEcho?(conversationHash: string, midHash: string): Promise<EchoMatch>;
}

// Set once per isolate when the ledger RPCs are not installed yet, so calls stop until redeploy.
let outboundLedgerMissing = false;
const LEDGER_MISSING = Symbol("ledger-missing");

/** Service-only RPCs over the private support schema; callers are verified first. */
export async function cloudSupportStore(): Promise<SupportStore> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const rpc = async (name: string, args: Record<string, unknown>) => {
    const r = await supabaseAdmin.rpc(name as never, args as never);
    if (r.error) throw new Error("SUPPORT_STORE_UNAVAILABLE");
    return r.data as unknown;
  };
  const ledger = async (name: string, args: Record<string, unknown>) => {
    if (outboundLedgerMissing) return LEDGER_MISSING;
    const r = await supabaseAdmin.rpc(name as never, args as never);
    if (r.error?.code === "PGRST202") {
      outboundLedgerMissing = true;
      console.error("SUPPORT_OUTBOUND_LEDGER_NOT_INSTALLED");
      return LEDGER_MISSING;
    }
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
    async beginOutbound(attemptHash, conversationHash) {
      await ledger("support_begin_outbound", { p_attempt_hash: attemptHash, p_conversation_hash: conversationHash });
    },
    async finishOutbound(attemptHash, midHash, status) {
      await ledger("support_finish_outbound", { p_attempt_hash: attemptHash, p_mid_hash: midHash, p_status: status });
    },
    async matchEcho(conversationHash, midHash) {
      const v = await ledger("support_match_echo", { p_conversation_hash: conversationHash, p_mid_hash: midHash });
      if (v === LEDGER_MISSING) return "unavailable";
      if (v === "own" || v === "pending" || v === "unmatched") return v;
      throw new Error("SUPPORT_STORE_UNAVAILABLE");
    },
  };
}

export async function senderHash(family: string, id: string): Promise<string> {
  const bytes = new TextEncoder().encode(`masaarat-support:${family}:${id}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

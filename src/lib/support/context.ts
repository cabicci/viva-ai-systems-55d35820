// Short, already-redacted topic context for follow-ups. Holds only opaque structured
// references (area/program/plan/market/term/lesson ids), never message text. Keys are
// scoped by channel family + thread + visibility, so a DM topic can never reach a
// public comment thread and threads never share context.
//
// No durable table exists for this yet (see PROPOSED_CONTEXT_MIGRATION.md). The default
// store is a bounded, short-lived per-isolate memory map: when it has nothing (new isolate,
// expired, other thread) the reply policy asks a brief clarifying question instead.

export type SupportArea = "ai" | "academic" | "technical" | "kids";
export type SupportMarket = "domestic" | "international";
export type SupportTerm = "monthly" | "quarterly" | "semiannual" | "yearly";
export type SupportVisibility = "private" | "public";

export type TopicRef = {
  subject?: "pricing" | "lesson" | "program" | "offer" | "general";
  area?: SupportArea;
  program?: string;
  plan?: string;
  market?: SupportMarket;
  term?: SupportTerm;
  lesson?: string;
};

export interface ContextStore {
  get(key: string): Promise<TopicRef | null>;
  set(key: string, ref: TopicRef): Promise<void>;
}

const ID_RE = /^[a-z0-9][a-z0-9._-]{0,119}$/;
const SUBJECTS = new Set(["pricing", "lesson", "program", "offer", "general"]);
const AREAS = new Set(["ai", "academic", "technical", "kids"]);
const MARKETS = new Set(["domestic", "international"]);
const TERMS = new Set(["monthly", "quarterly", "semiannual", "yearly"]);

/** Drops anything that is not an allow-listed enum or a short opaque id. */
export function cleanTopic(ref: TopicRef | null | undefined): TopicRef {
  const out: TopicRef = {};
  if (!ref) return out;
  if (ref.subject && SUBJECTS.has(ref.subject)) out.subject = ref.subject;
  if (ref.area && AREAS.has(ref.area)) out.area = ref.area;
  if (ref.market && MARKETS.has(ref.market)) out.market = ref.market;
  if (ref.term && TERMS.has(ref.term)) out.term = ref.term;
  for (const k of ["program", "plan", "lesson"] as const) {
    const v = ref[k];
    if (typeof v === "string" && ID_RE.test(v)) out[k] = v;
  }
  return out;
}

export async function contextKey(
  family: string,
  thread: string,
  visibility: SupportVisibility,
): Promise<string> {
  const bytes = new TextEncoder().encode(`masaarat-support-ctx:${visibility}:${family}:${thread}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function memoryContextStore(opts: { ttlMs?: number; max?: number; now?: () => number } = {}): ContextStore {
  const ttl = opts.ttlMs ?? 30 * 60_000;
  const max = opts.max ?? 2000;
  const now = opts.now ?? Date.now;
  const map = new Map<string, { ref: TopicRef; at: number }>();
  return {
    async get(key) {
      const v = map.get(key);
      if (!v) return null;
      if (now() - v.at > ttl) {
        map.delete(key);
        return null;
      }
      return { ...v.ref };
    },
    async set(key, ref) {
      map.delete(key);
      map.set(key, { ref: cleanTopic(ref), at: now() });
      while (map.size > max) map.delete(map.keys().next().value as string);
    },
  };
}

/** Process-wide default; best-effort only, never relied on for correctness. */
export const defaultContextStore: ContextStore = memoryContextStore();

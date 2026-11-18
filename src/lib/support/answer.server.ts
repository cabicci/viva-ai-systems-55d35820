import { createClient } from "@supabase/supabase-js";
import { SUPPORT_MODEL } from "./config";
import {
  detectLang,
  fallbackReply,
  offerFacts,
  parseModelJson,
  redactQuestion,
  sanitizeAnswer,
  systemPrompt,
  type FreeAccessState,
} from "./compose";
import { PUBLIC_FACTS } from "./facts";

export type SupportAnswer = { text: string | null; source: "openai" | "fallback" | "skip" };

/** Live public free-access state from the existing anonymous public offer source. */
export async function readFreeAccessState(fetchImpl: typeof fetch = fetch): Promise<FreeAccessState> {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return { kind: "unknown" };
  try {
    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
      global: { fetch: (input, init) => fetchImpl(input, { ...init, signal: AbortSignal.timeout(4000) }) },
    });
    const r = await client.rpc("get_free_access_announcement" as never);
    if (r.error) return { kind: "unknown" };
    const v = r.data as { ends_at?: string; server_time?: string } | null;
    if (!v) return { kind: "inactive" };
    if (!v.ends_at || !v.server_time) return { kind: "unknown" };
    return Date.parse(v.ends_at) > Date.parse(v.server_time)
      ? { kind: "active", endsAt: v.ends_at }
      : { kind: "inactive" };
  } catch {
    return { kind: "unknown" };
  }
}

export type AnswerDeps = {
  openaiKey?: string;
  fetchImpl?: typeof fetch;
  freeAccess?: () => Promise<FreeAccessState>;
  timeoutMs?: number;
};

/** Sends only the redacted question text to OpenAI; always returns a safe, linked reply. */
export async function answerQuestion(
  question: string,
  opts: { publicComment: boolean },
  deps: AnswerDeps = {},
): Promise<SupportAnswer> {
  const lang = detectLang(question);
  const redacted = redactQuestion(question);
  const key = deps.openaiKey ?? process.env.OPENAI_API_KEY;
  const fetchImpl = deps.fetchImpl ?? fetch;
  if (!redacted || !key) return { text: fallbackReply(lang), source: "fallback" };
  const offer = await (deps.freeAccess ?? (() => readFreeAccessState(fetchImpl)))();
  try {
    const res = await fetchImpl("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: SUPPORT_MODEL,
        temperature: 0.3,
        max_tokens: 450,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt(PUBLIC_FACTS, offerFacts(offer), opts.publicComment, lang) },
          { role: "user", content: redacted },
        ],
      }),
      signal: AbortSignal.timeout(deps.timeoutMs ?? 9000),
    });
    if (!res.ok) {
      await res.body?.cancel().catch(() => undefined);
      console.error(`SUPPORT_OPENAI_STATUS_${res.status}`);
      return { text: fallbackReply(lang), source: "fallback" };
    }
    const json = (await res.json()) as { choices?: { message?: { content?: unknown } }[] };
    const content = json.choices?.[0]?.message?.content;
    const parsed = typeof content === "string" ? parseModelJson(content) : null;
    if (!parsed) return { text: fallbackReply(lang), source: "fallback" };
    if (parsed.action === "skip")
      return opts.publicComment
        ? { text: null, source: "skip" }
        : { text: fallbackReply(lang), source: "fallback" };
    const text = sanitizeAnswer(parsed.answer, parsed.link, lang, offer);
    return text ? { text, source: "openai" } : { text: fallbackReply(lang), source: "fallback" };
  } catch {
    console.error("SUPPORT_OPENAI_UNAVAILABLE");
    return { text: fallbackReply(lang), source: "fallback" };
  }
}

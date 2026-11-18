import { createClient } from "@supabase/supabase-js";
import { SUPPORT_MODEL } from "./config";
import {
  detectLang,
  fallbackReply,
  finish,
  numbersIn,
  offerFacts,
  offerLine,
  parseModelJson,
  redactQuestion,
  sanitizeAnswer,
  systemPrompt,
  type FreeAccessState,
} from "./compose";
import { contextKey, defaultContextStore, type ContextStore, type SupportVisibility } from "./context";
import { decide } from "./resolve";
import { liveLessons, staticCatalogue, type CatalogueLesson, type LiveCatalogueByLang } from "./sources";
import { GENERAL_FACTS } from "./facts";
import { KIDS_LEVELS } from "@/lib/kids/catalogue";
import { COURSE_AREAS } from "@/lib/course-system/contract";
import { OFFICIAL_LINKS } from "./config";

export type SupportAnswer = { text: string | null; source: "openai" | "fallback" | "deterministic" | "skip" };
export type ThreadRef = { family: string; thread: string; visibility: SupportVisibility };

function publicClient(fetchImpl: typeof fetch) {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: { fetch: (input, init) => fetchImpl(input, { ...init, signal: AbortSignal.timeout(4000) }) },
  });
}

/** Live public free-access state from the existing anonymous public offer source. */
export async function readFreeAccessState(fetchImpl: typeof fetch = fetch): Promise<FreeAccessState> {
  const client = publicClient(fetchImpl);
  if (!client) return { kind: "unknown" };
  try {
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

const str = (v: unknown) => (typeof v === "string" ? v : "");
const rows = (v: unknown) => (Array.isArray(v) ? (v as Record<string, unknown>[]) : []);
function projectAcademic(c: Record<string, unknown>) {
  return {
    id: str(c.id),
    title: str(c.title),
    released: c.released === false ? false : undefined,
    reviewOnly: c.reviewOnly === true ? true : undefined,
    lessons: rows(c.lessons).map((l) => ({ id: str(l.id), title: str(l.title), introductory: l.introductory === true })),
  };
}
function projectIntake(c: Record<string, unknown>, area: (typeof COURSE_AREAS)[number]) {
  return {
    area,
    id: str(c.id),
    title: str(c.title),
    stations: rows(c.stations).map((st) => ({ steps: rows(st.steps).map((x) => ({ id: str(x.id), title: str(x.title) })) })),
  };
}

let liveCache: { at: number; value: CatalogueLesson[] } | null = null;
/** Anonymous public catalogue reads (released academic, active intake, approved kids titles). */
export async function readPublicCatalogue(fetchImpl: typeof fetch = fetch): Promise<CatalogueLesson[]> {
  if (liveCache && Date.now() - liveCache.at < 10 * 60_000) return liveCache.value;
  const client = publicClient(fetchImpl);
  const base = staticCatalogue();
  if (!client) return base;
  const live: LiveCatalogueByLang = {};
  await Promise.all(
    (["ar", "en"] as const).map(async (lang) => {
      const locale = lang === "ar" ? "ar-EG" : "en";
      const entry: NonNullable<LiveCatalogueByLang["ar"]> = {};
      live[lang] = entry;
      // Each response is projected to ids/titles immediately; no other field is kept.
      const academic = await client.rpc("academic_catalogue" as never, { p_locale: locale } as never).then(
        (r) => (r.error || !Array.isArray(r.data) ? undefined : (r.data as Record<string, unknown>[]).map(projectAcademic)),
        () => undefined,
      );
      if (academic) entry.academic = academic;
      const intake = await Promise.all(
        COURSE_AREAS.map((area) =>
          client.rpc("curriculum_catalogue" as never, { p_area: area, p_locale: locale } as never).then(
            (r) => (r.error || !Array.isArray(r.data) ? [] : (r.data as Record<string, unknown>[]).map((c) => projectIntake(c, area))),
            () => [],
          ),
        ),
      );
      entry.intake = intake.flat();
      const kids = await Promise.all(
        KIDS_LEVELS.map((level) =>
          client.functions.invoke("kids-catalogue", { body: { levelId: level.id, locale } }).then(
            (r) => {
              const d = r.data as { levelId?: string; locale?: string; titles?: { lessonNumber: number; title: string }[] } | null;
              if (r.error || !d || d.levelId !== level.id || d.locale !== locale || !Array.isArray(d.titles)) return [];
              return d.titles.map((t) => ({ levelId: level.id, lessonNumber: t.lessonNumber, title: String(t.title ?? "") }));
            },
            () => [],
          ),
        ),
      );
      entry.kids = kids.flat();
    }),
  );
  const value = [...base, ...liveLessons(live)];
  liveCache = { at: Date.now(), value };
  return value;
}

export type AnswerDeps = {
  openaiKey?: string;
  fetchImpl?: typeof fetch;
  freeAccess?: () => Promise<FreeAccessState>;
  catalogue?: () => Promise<CatalogueLesson[]>;
  context?: ContextStore;
  timeoutMs?: number;
};

/**
 * Resolves the question against public sources first. Only plan/price/program/general
 * questions are phrased by OpenAI, with the redacted question and allowlisted facts; any
 * lesson, teaching, quiz/exercise or pasted-passage request is answered deterministically
 * with a navigation link and never sent. Always returns one official link.
 */
export async function answerQuestion(
  question: string,
  opts: { publicComment: boolean; thread?: ThreadRef },
  deps: AnswerDeps = {},
): Promise<SupportAnswer> {
  const lang = detectLang(question);
  const redacted = redactQuestion(question);
  const fetchImpl = deps.fetchImpl ?? fetch;
  const offerP = (deps.freeAccess ?? (() => readFreeAccessState(fetchImpl)))();
  if (!redacted) return { text: fallbackReply(lang, await offerP), source: "fallback" };
  const store = deps.context ?? defaultContextStore;
  const key = opts.thread ? await contextKey(opts.thread.family, opts.thread.thread, opts.thread.visibility) : null;
  const [prior, catalogue, offer] = await Promise.all([
    key ? store.get(key).catch(() => null) : Promise.resolve(null),
    (deps.catalogue ?? (() => readPublicCatalogue(fetchImpl)))().catch(() => staticCatalogue()),
    offerP,
  ]);
  const decision = decide(redacted, lang, prior, catalogue);
  if (key) await store.set(key, decision.topic).catch(() => undefined);

  if (decision.kind !== "facts") {
    return { text: finish(decision.text, decision.link, lang), source: "deterministic" };
  }
  // Lesson-scoped decisions never reach the model: the reply is the allowlisted listing only.
  if (!decision.model) {
    const line = offerLine(offer, lang);
    return { text: finish(line ? `${decision.draft}\n${line}` : decision.draft, decision.link, lang), source: "deterministic" };
  }

  const facts = decision.draft ? decision.facts : [...decision.facts, ...GENERAL_FACTS[lang]];
  const deterministic = () => {
    if (!decision.draft) return fallbackReply(lang, offer);
    const line = offerLine(offer, lang);
    return finish(line ? `${decision.draft}\n${line}` : decision.draft, decision.link, lang);
  };
  const apiKey = deps.openaiKey ?? process.env.OPENAI_API_KEY;
  if (!apiKey) return { text: deterministic(), source: decision.draft ? "deterministic" : "fallback" };
  const allowed = new Set([...numbersIn(facts.join(" ")), ...numbersIn(redacted)]);
  try {
    const res = await fetchImpl("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: SUPPORT_MODEL,
        temperature: 0.3,
        max_tokens: 450,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt(facts, offerFacts(offer), opts.publicComment, lang) },
          { role: "user", content: redacted },
        ],
      }),
      signal: AbortSignal.timeout(deps.timeoutMs ?? 9000),
    });
    if (!res.ok) {
      await res.body?.cancel().catch(() => undefined);
      console.error(`SUPPORT_OPENAI_STATUS_${res.status}`);
      return { text: deterministic(), source: "fallback" };
    }
    const json = (await res.json()) as { choices?: { message?: { content?: unknown } }[] };
    const content = json.choices?.[0]?.message?.content;
    const parsed = typeof content === "string" ? parseModelJson(content) : null;
    if (!parsed) return { text: deterministic(), source: "fallback" };
    if (parsed.action === "skip")
      return opts.publicComment ? { text: null, source: "skip" } : { text: deterministic(), source: "fallback" };
    const link = parsed.contact ? OFFICIAL_LINKS.contact : decision.link;
    // Price answers always carry the displayed tax wording.
    const ensure = decision.topic.subject === "pricing" ? decision.facts.slice(-1) : [];
    const text = sanitizeAnswer(parsed.answer, link, lang, offer, allowed, ensure);
    return text ? { text, source: "openai" } : { text: deterministic(), source: "fallback" };
  } catch {
    console.error("SUPPORT_OPENAI_UNAVAILABLE");
    return { text: deterministic(), source: "fallback" };
  }
}

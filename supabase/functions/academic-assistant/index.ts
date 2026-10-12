import { handleAcademicAssistant, type AcademicDeps, type Chunk, type Locale } from "./handler.ts";

const url = Deno.env.get("SUPABASE_URL") ?? "";
const publishable = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? "";
const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const openai = Deno.env.get("OPENAI_API_KEY") ?? "";
const lovable = Deno.env.get("LOVABLE_API_KEY") ?? "";
const monthlyLimit = Number(Deno.env.get("ACADEMIC_ASSISTANT_MONTHLY_LIMIT") ?? 0);
const enabled = Deno.env.get("ACADEMIC_ASSISTANT_ENABLED") === "true" &&
  Number.isSafeInteger(monthlyLimit) && monthlyLimit >= 0 && monthlyLimit <= 10000 &&
  !!url && !!publishable && !!service && !!openai && !!lovable;
const origins = new Set((Deno.env.get("ACADEMIC_ASSISTANT_ALLOWED_ORIGINS") ??
  "https://masaarat.ai,https://www.masaarat.ai").split(",").map(s => s.trim()));

async function rpc<T>(name: string, body: Record<string, unknown>, key: string, token: string): Promise<T> {
  const res = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: key, Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Academic RPC ${name} failed: ${res.status}`);
  return await res.json() as T;
}

const deps: AcademicDeps = {
  enabled,
  async verifyUser(token) {
    const response = await fetch(`${url}/auth/v1/user`, {
      headers: { apikey: publishable, Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return null;
    const user = await response.json() as { id?: unknown };
    return typeof user.id === "string" ? user.id : null;
  },
  async allowed(token, course, lesson, locale) {
    const mode = await rpc<"admin" | "learner" | "none">("academic_assistant_access", {
      p_course: course, p_lesson: lesson, p_locale: locale,
    }, publishable, token);
    return mode === "admin" || mode === "learner" ? mode : null;
  },
  async consumeLimit(user, course) {
    if (monthlyLimit <= 0) return false;
    const result = await rpc<{ allowed: boolean }[] | { allowed: boolean }>("consume_rate_limit", {
      p_user_id: user, p_bucket_key: `academic-assistant:${course}`,
      p_max_calls: monthlyLimit, p_window_seconds: 2592000,
    }, service, service);
    const row = Array.isArray(result) ? result[0] : result;
    return row?.allowed === true;
  },
  async embed(query) {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${openai}` },
      body: JSON.stringify({ model: "text-embedding-3-small", input: query }),
    });
    if (!response.ok) return null;
    const data = await response.json() as { data?: { embedding?: number[] }[] };
    return data.data?.[0]?.embedding ?? null;
  },
  async retrieve(course: string, locale: Locale, embedding: number[]): Promise<Chunk[]> {
    const result = await rpc<Chunk[]>("academic_rag_match", {
      p_course: course, p_locale: locale, p_embedding: JSON.stringify(embedding), p_limit: 6,
    }, service, service);
    if (!Array.isArray(result)) throw new Error("Malformed Academic RAG result");
    return result;
  },
  async answer(system, user) {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${lovable}` },
      body: JSON.stringify({ model: "google/gemini-3-flash-preview", temperature: 0.2,
        messages: [{ role: "system", content: system }, { role: "user", content: user }] }),
    });
    if (!response.ok) return null;
    const data = await response.json() as { choices?: { message?: { content?: string } }[] };
    return data.choices?.[0]?.message?.content ?? null;
  },
};

Deno.serve(async request => {
  const origin = request.headers.get("Origin");
  const cors = origin && origins.has(origin) ? {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  } : {};
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  const result = await handleAcademicAssistant(request, deps);
  const headers = new Headers(result.headers);
  for (const [name, value] of Object.entries(cors)) headers.set(name, value);
  return new Response(result.body, { status: result.status, headers });
});

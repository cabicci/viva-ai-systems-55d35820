// Kids-only authored retrieval. The source is private Storage, never the
// public adult corpus or a JSON bundle exposed to the browser.
import { parseKidsPlaybackRequest } from "../kids-playback/token.ts";

const ALLOWED_ORIGINS = new Set(["https://masaarat.ai", "https://www.masaarat.ai"]);
const KEYS = new Set(["profileId", "levelId", "lessonNumber", "locale", "hintId"]);
const BUCKET = "kids-lesson-content";
function headersFor(request: Request): HeadersInit {
  const origin = request.headers.get("Origin") ?? "";
  return {
    ...(ALLOWED_ORIGINS.has(origin) ? { "Access-Control-Allow-Origin": origin } : {}),
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Cache-Control": "no-store",
    Vary: "Origin",
  };
}
function reply(request: Request, status: number, value: Record<string, unknown>): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { ...headersFor(request), "Content-Type": "application/json" },
  });
}
type HintRequest = NonNullable<ReturnType<typeof parseKidsPlaybackRequest>> & {
  hintId: string;
};
function parseHintRequest(value: unknown): HintRequest | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (Object.keys(record).length !== KEYS.size || Object.keys(record).some((key) => !KEYS.has(key)))
    return null;
  const scope = parseKidsPlaybackRequest(record);
  if (!scope || typeof record.hintId !== "string" || !/^hint-[1-9][0-9]?$/.test(record.hintId))
    return null;
  return { ...scope, hintId: record.hintId };
}
type AuthoredHint = {
  question?: unknown;
  answer?: unknown;
  source?: unknown;
  sourceScene?: unknown;
};
type AuthoredLesson = {
  locale?: unknown;
  hints?: unknown;
  scenes?: unknown;
  reading?: unknown;
  materials?: unknown;
};

export async function handleKidsLessonHelp(
  request: Request,
  env: (name: string) => string | undefined,
  fetcher: typeof fetch = fetch,
): Promise<Response> {
  if (request.method === "OPTIONS") return new Response(null, { headers: headersFor(request) });
  if (request.method !== "POST") return reply(request, 405, { error: "Method not allowed" });
  const bearer = request.headers.get("Authorization");
  if (!bearer?.startsWith("Bearer ")) return reply(request, 401, { error: "Unauthorized" });
  const base = env("SUPABASE_URL");
  const anon = env("SUPABASE_ANON_KEY") ?? env("SUPABASE_PUBLISHABLE_KEY");
  const service = env("SUPABASE_SERVICE_ROLE_KEY");
  if (!base || !anon || !service) return reply(request, 503, { error: "Unavailable" });
  let input: HintRequest | null;
  try {
    if (Number(request.headers.get("Content-Length") ?? "0") > 2048)
      return reply(request, 400, { error: "Invalid request" });
    const body = await request.text();
    input = body.length <= 2048 ? parseHintRequest(JSON.parse(body)) : null;
  } catch {
    input = null;
  }
  if (!input) return reply(request, 400, { error: "Invalid request" });

  try {
    const user = await fetcher(new URL("/auth/v1/user", base), {
      headers: { Authorization: bearer, apikey: anon },
    });
    if (!user.ok) return reply(request, 401, { error: "Unauthorized" });
    const identity = (await user.json()) as { id?: string };
    if (!identity.id) return reply(request, 401, { error: "Unauthorized" });
    // The caller JWT establishes auth.uid() for parent/profile, locale and
    // content approval checks; service role is used only after this gate.
    const access = await fetcher(new URL("/rest/v1/rpc/kids_can_access_lesson", base), {
      method: "POST",
      headers: { Authorization: bearer, apikey: anon, "Content-Type": "application/json" },
      body: JSON.stringify({
        requested_profile: input.profileId,
        requested_level: input.levelId,
        requested_lesson: input.lessonNumber,
        requested_locale: input.locale,
      }),
    });
    if (!access.ok) return reply(request, 503, { error: "Unavailable" });
    if ((await access.json()) !== true) return reply(request, 403, { error: "Unavailable" });

    const objectPath =
      input.levelId +
      "/lesson-" +
      String(input.lessonNumber).padStart(2, "0") +
      "/" +
      input.locale +
      ".json";
    const objectUrl = new URL("/storage/v1/object/" + BUCKET + "/" + objectPath, base);
    const object = await fetcher(objectUrl, {
      headers: { Authorization: "Bearer " + service, apikey: service },
    });
    if (!object.ok) return reply(request, 503, { error: "Unavailable" });
    const bytes = new Uint8Array(await object.arrayBuffer());
    if (bytes.length > 200000) return reply(request, 503, { error: "Unavailable" });
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    const sourceSha256 = Array.from(new Uint8Array(digest), (byte) =>
      byte.toString(16).padStart(2, "0"),
    ).join("");
    // Approval is tied to the exact source bytes, so replacing an object
    // invalidates previously approved content even if its path is unchanged.
    const approvalUrl = new URL("/rest/v1/kids_content_approvals", base);
    approvalUrl.searchParams.set("level_id", "eq." + input.levelId);
    approvalUrl.searchParams.set("lesson_number", "eq." + input.lessonNumber);
    approvalUrl.searchParams.set("locale", "eq." + input.locale);
    approvalUrl.searchParams.set("select", "approved_sha256");
    approvalUrl.searchParams.set("limit", "2");
    const approval = await fetcher(approvalUrl, {
      headers: { Authorization: "Bearer " + service, apikey: service },
    });
    if (!approval.ok) return reply(request, 503, { error: "Unavailable" });
    const approvals = (await approval.json()) as Array<{ approved_sha256?: string }>;
    if (
      !Array.isArray(approvals) ||
      approvals.length !== 1 ||
      approvals[0]?.approved_sha256 !== sourceSha256
    )
      return reply(request, 503, { error: "Unavailable" });
    const lesson = JSON.parse(
      new TextDecoder("utf-8", { fatal: true }).decode(bytes),
    ) as AuthoredLesson;
    if (lesson.locale !== input.locale || !Array.isArray(lesson.hints)) {
      return reply(request, 503, { error: "Unavailable" });
    }
    const index = Number(input.hintId.slice(5)) - 1;
    const hint = lesson.hints[index] as AuthoredHint | undefined;
    const sourceId = hint?.sourceScene ?? hint?.source;
    const referenced = ["scenes", "reading", "materials"].some((section) => {
      const entries = lesson[section as keyof AuthoredLesson];
      return (
        Array.isArray(entries) &&
        entries.some((entry) => entry && typeof entry === "object" && entry.id === sourceId)
      );
    });
    if (
      !hint ||
      typeof hint.question !== "string" ||
      !hint.question.trim() ||
      typeof hint.answer !== "string" ||
      !hint.answer.trim() ||
      typeof sourceId !== "string" ||
      !referenced
    )
      return reply(request, 503, { error: "Unavailable" });
    return reply(request, 200, {
      question: hint.question,
      answer: hint.answer,
      citation: {
        product: "kids",
        levelId: input.levelId,
        lessonNumber: input.lessonNumber,
        locale: input.locale,
        sourceId,
      },
    });
  } catch {
    return reply(request, 503, { error: "Unavailable" });
  }
}

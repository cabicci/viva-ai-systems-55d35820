import { parseKidsPlaybackRequest } from "../kids-playback/token.ts";
import { checkQuiz, studentLesson } from "./public-lesson.ts";

const ORIGINS = new Set(["https://masaarat.ai", "https://www.masaarat.ai"]);
const MAX_LESSON_BYTES = 262144;
const DIGEST = /^[0-9a-f]{64}$/;
function headers(request: Request): HeadersInit {
  const origin = request.headers.get("Origin") ?? "";
  return {
    ...(ORIGINS.has(origin) ? { "Access-Control-Allow-Origin": origin } : {}),
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Cache-Control": "private, no-store, max-age=0",
    "X-Content-Type-Options": "nosniff",
    Vary: "Origin",
  };
}
function error(request: Request, status: number): Response {
  return new Response(JSON.stringify({ error: status === 401 ? "Unauthorized" : "Unavailable" }), {
    status,
    headers: { ...headers(request), "Content-Type": "application/json" },
  });
}
export async function handleKidsLessonContent(
  request: Request,
  env: (name: string) => string | undefined,
  fetcher: typeof fetch = fetch,
): Promise<Response> {
  if (request.method === "OPTIONS") return new Response(null, { headers: headers(request) });
  if (request.method !== "POST") return error(request, 405);
  const bearer = request.headers.get("Authorization");
  if (!bearer?.startsWith("Bearer ") || bearer.length <= 7) return error(request, 401);
  const base = env("SUPABASE_URL");
  const anon = env("SUPABASE_ANON_KEY") ?? env("SUPABASE_PUBLISHABLE_KEY");
  const service = env("SUPABASE_SERVICE_ROLE_KEY");
  if (!base || !anon || !service) return error(request, 503);
  let input: ReturnType<typeof parseKidsPlaybackRequest> = null;
  let action: "lesson" | "quiz-check" = "lesson";
  let questionId = "";
  let selectedIndex = -1;
  try {
    if (Number(request.headers.get("Content-Length") ?? "0") > 2048) return error(request, 400);
    const body = await request.text();
    if (body.length <= 2048) {
      const parsed = JSON.parse(body);
      input = parseKidsPlaybackRequest(parsed);
      if (parsed.action === "quiz-check") {
        action = "quiz-check";
        questionId = typeof parsed.questionId === "string" ? parsed.questionId : "";
        selectedIndex = parsed.selectedIndex;
        if (!/^[a-zA-Z0-9_-]{1,40}$/.test(questionId) || !Number.isInteger(selectedIndex)) {
          return error(request, 400);
        }
      } else if (parsed.action !== undefined && parsed.action !== "lesson")
        return error(request, 400);
    }
  } catch {
    /* Invalid input fails closed. */
  }
  if (!input) return error(request, 400);
  try {
    const user = await fetcher(new URL("/auth/v1/user", base), {
      headers: { Authorization: bearer, apikey: anon },
    });
    if (!user.ok || !(await user.json())?.id) return error(request, 401);
    const gate = await fetcher(new URL("/rest/v1/rpc/kids_can_access_lesson", base), {
      method: "POST",
      headers: { Authorization: bearer, apikey: anon, "Content-Type": "application/json" },
      body: JSON.stringify({
        requested_profile: input.profileId,
        requested_level: input.levelId,
        requested_lesson: input.lessonNumber,
        requested_locale: input.locale,
      }),
    });
    if (!gate.ok) return error(request, 503);
    if ((await gate.json()) !== true) return error(request, 403);
    const approvalUrl = new URL("/rest/v1/kids_content_approvals", base);
    approvalUrl.searchParams.set("level_id", `eq.${input.levelId}`);
    approvalUrl.searchParams.set("lesson_number", `eq.${input.lessonNumber}`);
    approvalUrl.searchParams.set("locale", `eq.${input.locale}`);
    approvalUrl.searchParams.set("select", "approved_sha256");
    approvalUrl.searchParams.set("limit", "2");
    const approval = await fetcher(approvalUrl, {
      headers: { Authorization: `Bearer ${service}`, apikey: service },
    });
    if (!approval.ok) return error(request, 503);
    const rows = (await approval.json()) as Array<{ approved_sha256?: string }>;
    if (!Array.isArray(rows) || rows.length !== 1 || !DIGEST.test(rows[0]?.approved_sha256 ?? "")) {
      return error(request, 503);
    }
    const path = `${input.levelId}/lesson-${String(input.lessonNumber).padStart(2, "0")}/${input.locale}.json`;
    const object = await fetcher(new URL(`/storage/v1/object/kids-lesson-content/${path}`, base), {
      headers: { Authorization: `Bearer ${service}`, apikey: service },
    });
    if (!object.ok || Number(object.headers.get("Content-Length") ?? "0") > MAX_LESSON_BYTES) {
      return error(request, 503);
    }
    const bytes = await object.arrayBuffer();
    if (!bytes.byteLength || bytes.byteLength > MAX_LESSON_BYTES) return error(request, 503);
    const actual = Array.from(
      new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
      (byte) => byte.toString(16).padStart(2, "0"),
    ).join("");
    if (actual !== rows[0].approved_sha256) return error(request, 503);
    const lesson = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
    if (
      !lesson ||
      (lesson.level !== undefined && lesson.level !== input.levelId) ||
      lesson.locale !== input.locale
    )
      return error(request, 503);
    const citation = {
      product: "kids",
      levelId: input.levelId,
      lessonNumber: input.lessonNumber,
      locale: input.locale,
      sourceSha256: actual,
    };
    const result =
      action === "quiz-check"
        ? checkQuiz(lesson, questionId, selectedIndex)
        : studentLesson(lesson);
    if (!result) return error(request, 503);
    return new Response(
      JSON.stringify(action === "lesson" ? { lesson: result, citation } : { ...result, citation }),
      {
        status: 200,
        headers: { ...headers(request), "Content-Type": "application/json; charset=utf-8" },
      },
    );
  } catch {
    return error(request, 503);
  }
}

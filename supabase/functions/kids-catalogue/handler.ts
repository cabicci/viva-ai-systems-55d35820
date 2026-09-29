/** Public lesson names only. Private lesson bodies and media never reach this response. */
const ORIGINS = new Set([
  "https://masaarat.ai",
  "https://www.masaarat.ai",
  "https://id-preview--658adce0-747d-4c8e-90e3-d22225070b94.lovable.app",
]);
const LEVELS = new Set(["level-1", "level-2", "level-3"]);
const LOCALES = new Set(["ar-EG", "ar-MSA", "ar-Gulf", "en"]);
const DIGEST = /^[0-9a-f]{64}$/;
const MAX_BYTES = 262144;

function respond(request: Request, status: number, payload: unknown): Response {
  const origin = request.headers.get("Origin") ?? "";
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      ...(ORIGINS.has(origin) ? { "Access-Control-Allow-Origin": origin } : {}),
      Vary: "Origin",
    },
  });
}

export async function handleKidsCatalogue(
  request: Request,
  env: (name: string) => string | undefined,
  fetcher: typeof fetch = fetch,
): Promise<Response> {
  if (request.method === "OPTIONS") return respond(request, 200, {});
  if (request.method !== "POST") return respond(request, 405, { error: "Unavailable" });
  let input: { levelId?: string; locale?: string };
  try {
    if (Number(request.headers.get("Content-Length") ?? "0") > 256)
      return respond(request, 400, { error: "Unavailable" });
    const body = await request.text();
    input = body.length <= 256 ? JSON.parse(body) : {};
  } catch {
    return respond(request, 400, { error: "Unavailable" });
  }
  if (!LEVELS.has(input?.levelId ?? "") || !LOCALES.has(input?.locale ?? ""))
    return respond(request, 400, { error: "Unavailable" });
  const base = env("SUPABASE_URL");
  const service = env("SUPABASE_SERVICE_ROLE_KEY");
  if (!base || !service) return respond(request, 503, { error: "Unavailable" });
  const auth = { apikey: service, Authorization: `Bearer ${service}` };
  try {
    const launch = await fetcher(new URL("/rest/v1/rpc/kids_public_launch_open", base), {
      method: "POST",
      headers: { ...auth, "Content-Type": "application/json" },
      body: "{}",
    });
    if (!launch.ok || (await launch.json()) !== true)
      return respond(request, 503, { error: "Unavailable" });
    const approvalsUrl = new URL("/rest/v1/kids_content_approvals", base);
    approvalsUrl.searchParams.set("level_id", `eq.${input.levelId}`);
    approvalsUrl.searchParams.set("locale", `eq.${input.locale}`);
    approvalsUrl.searchParams.set("select", "lesson_number,approved_sha256");
    approvalsUrl.searchParams.set("order", "lesson_number.asc");
    approvalsUrl.searchParams.set("limit", "13");
    const approval = await fetcher(approvalsUrl, { headers: auth });
    if (!approval.ok) return respond(request, 503, { error: "Unavailable" });
    const rows = (await approval.json()) as Array<{
      lesson_number?: number;
      approved_sha256?: string;
    }>;
    if (
      !Array.isArray(rows) ||
      rows.length !== 12 ||
      rows.some(
        (row, index) => row.lesson_number !== index + 1 || !DIGEST.test(row.approved_sha256 ?? ""),
      )
    )
      return respond(request, 503, { error: "Unavailable" });

    const titles = await Promise.all(
      rows.map(async (row) => {
        const path = `${input.levelId}/lesson-${String(row.lesson_number).padStart(2, "0")}/${input.locale}.json`;
        const object = await fetcher(
          new URL(`/storage/v1/object/kids-lesson-content/${path}`, base),
          {
            headers: auth,
          },
        );
        if (!object.ok || Number(object.headers.get("Content-Length") ?? "0") > MAX_BYTES)
          throw new Error("Unavailable");
        const bytes = await object.arrayBuffer();
        if (!bytes.byteLength || bytes.byteLength > MAX_BYTES) throw new Error("Unavailable");
        const actual = Array.from(
          new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
          (byte) => byte.toString(16).padStart(2, "0"),
        ).join("");
        if (actual !== row.approved_sha256) throw new Error("Unavailable");
        const lesson = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
        if (
          lesson?.locale !== input.locale ||
          (lesson.level !== undefined && lesson.level !== input.levelId) ||
          typeof lesson.title !== "string" ||
          !lesson.title.trim() ||
          lesson.title.length > 160
        )
          throw new Error("Unavailable");
        return { lessonNumber: row.lesson_number, title: lesson.title.trim() };
      }),
    );
    return respond(request, 200, { levelId: input.levelId, locale: input.locale, titles });
  } catch {
    return respond(request, 503, { error: "Unavailable" });
  }
}

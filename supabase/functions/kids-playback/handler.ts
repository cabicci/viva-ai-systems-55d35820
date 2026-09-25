import { parseKidsPlaybackRequest, signedKidsEmbedUrl } from "./token.ts";

const ALLOWED_ORIGINS = new Set(["https://masaarat.ai", "https://www.masaarat.ai"]);
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

export async function handleKidsPlayback(
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
  const tokenKey = env("BUNNY_KIDS_STREAM_TOKEN_KEY");
  if (!base || !anon || !service || !tokenKey) return reply(request, 503, { error: "Unavailable" });

  let input: ReturnType<typeof parseKidsPlaybackRequest>;
  try {
    if (Number(request.headers.get("Content-Length") ?? "0") > 2048) {
      return reply(request, 400, { error: "Invalid request" });
    }
    const body = await request.text();
    input = body.length <= 2048 ? parseKidsPlaybackRequest(JSON.parse(body)) : null;
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

    // The caller's JWT, rather than the service key, establishes auth.uid() in the RPC.
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

    const mediaUrl = new URL("/rest/v1/kids_media", base);
    mediaUrl.searchParams.set("level_id", `eq.${input.levelId}`);
    mediaUrl.searchParams.set("lesson_number", `eq.${input.lessonNumber}`);
    mediaUrl.searchParams.set("locale", `eq.${input.locale}`);
    mediaUrl.searchParams.set("select", "video_guid");
    mediaUrl.searchParams.set("limit", "2");
    const media = await fetcher(mediaUrl, {
      headers: { Authorization: `Bearer ${service}`, apikey: service },
    });
    if (!media.ok) return reply(request, 503, { error: "Unavailable" });
    const rows = (await media.json()) as Array<{ video_guid?: string }>;
    if (!Array.isArray(rows) || rows.length !== 1 || !rows[0]?.video_guid) {
      return reply(request, 503, { error: "Unavailable" });
    }
    const expires = Math.floor(Date.now() / 1000) + 300;
    const embedUrl = await signedKidsEmbedUrl(rows[0].video_guid, tokenKey, expires);
    return reply(request, 200, { embedUrl, expires });
  } catch {
    return reply(request, 503, { error: "Unavailable" });
  }
}

// Billing entitlement — server-authoritative foundation (no provider calls).

const ALLOWED_ORIGINS = new Set<string>([
  "https://masaarat.ai",
  "https://www.masaarat.ai",
  "http://localhost:5173",
  "http://localhost:3000",
]);

function corsHeadersFor(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  const allowOrigin = ALLOWED_ORIGINS.has(origin) ? origin : "";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    Vary: "Origin",
  };
}

async function verifyJwt(
  req: Request,
): Promise<{ ok: true; userId: string } | { ok: false }> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return { ok: false };
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const ANON =
    Deno.env.get("SUPABASE_ANON_KEY") ??
    Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  if (!SUPABASE_URL || !ANON) return { ok: false };
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { Authorization: authHeader, apikey: ANON },
    });
    if (!res.ok) return { ok: false };
    const user = await res.json();
    if (!user?.id) return { ok: false };
    return { ok: true, userId: user.id as string };
  } catch {
    return { ok: false };
  }
}

async function fetchSnapshot(userId: string): Promise<Record<string, unknown>> {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!SUPABASE_URL || !SERVICE_KEY) {
    return {
      paid_content_entitled: false,
      denial_reason_code: "ENTITLEMENT_UNAVAILABLE",
    };
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_entitlement_snapshot`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SERVICE_KEY}`,
      apikey: SERVICE_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ p_user_id: userId }),
  });

  if (!res.ok) {
    return {
      paid_content_entitled: false,
      denial_reason_code: "ENTITLEMENT_UNAVAILABLE",
    };
  }

  const data = await res.json();
  return (data ?? {
    paid_content_entitled: false,
    denial_reason_code: "ENTITLEMENT_UNAVAILABLE",
  }) as Record<string, unknown>;
}

Deno.serve(async (req: Request) => {
  const cors = corsHeadersFor(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  if (req.method !== "GET" && req.method !== "POST") {
    return new Response(JSON.stringify({ error: "METHOD_NOT_ALLOWED" }), {
      status: 405,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const auth = await verifyJwt(req);
  if (!auth.ok) {
    return new Response(
      JSON.stringify({
        paid_content_entitled: false,
        denial_reason_code: "ENTITLEMENT_UNAVAILABLE",
      }),
      { status: 401, headers: { ...cors, "Content-Type": "application/json" } },
    );
  }

  let resourceType: string | undefined;
  let resourceId: string | undefined;
  if (req.method === "POST") {
    try {
      const body = await req.json();
      resourceType = body?.resourceType;
      resourceId = body?.resourceId;
    } catch {
      return new Response(JSON.stringify({ error: "INVALID_JSON" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }
  }

  const snapshot = await fetchSnapshot(auth.userId);

  if (resourceType) {
    const entitled = snapshot.paid_content_entitled === true;
    const lessonIds = Array.isArray(
        (snapshot.lessons as { entitled_lesson_ids?: string[] } | undefined)
          ?.entitled_lesson_ids,
      )
      ? ((snapshot.lessons as { entitled_lesson_ids: string[] })
          .entitled_lesson_ids)
      : [];

    let allowed = entitled;
    let denial = snapshot.denial_reason_code ?? "ENTITLEMENT_UNAVAILABLE";

    if (entitled && resourceType === "lesson" && resourceId) {
      allowed = lessonIds.includes(resourceId);
      denial = allowed ? null : "LESSON_NOT_ENTITLED";
    }

    if (!entitled) allowed = false;

    return new Response(
      JSON.stringify({
        allowed,
        denial_reason_code: allowed ? null : denial,
        snapshot_version: snapshot.snapshot_version ?? null,
        generated_at: snapshot.generated_at ?? null,
        expires_at: snapshot.expires_at ?? null,
      }),
      { status: allowed ? 200 : 403, headers: { ...cors, "Content-Type": "application/json" } },
    );
  }

  return new Response(JSON.stringify(snapshot), {
    status: 200,
    headers: { ...cors, "Content-Type": "application/json" },
  });
});

import { liveCheckoutSchema, livePortalSchema } from "./schemas";

const headers = { "Cache-Control": "no-store" };

function rejectMethod(request: Request): Response | null {
  return request.method === "POST"
    ? null
    : Response.json(
        { error: "METHOD_NOT_ALLOWED" },
        { status: 405, headers: { ...headers, Allow: "POST" } },
      );
}

export async function handleLiveCheckout(request: Request): Promise<Response> {
  if (request.method === "GET" && new URL(request.url).searchParams.get("options") === "1") {
    const { authenticateBearer, liveRuntime } = await import("./runtime.server");
    const user = await authenticateBearer(request);
    if (!user) return Response.json({ error: "UNAUTHORIZED" }, { status: 401, headers });
    try {
      const options = await liveRuntime().rpc<{
        curricula: { area: string; course: string; title: string | Record<string, string> }[];
        children: { id: string; name: string }[];
      }>("list_commercial_purchase_options", { p_user_id: user.id });
      const locale = new URL(request.url).searchParams.get("locale") ?? "ar-EG";
      return Response.json(
        {
          ...options,
          curricula: options.curricula.map((item) => ({
            ...item,
            title:
              typeof item.title === "string"
                ? item.title
                : (item.title[locale] ?? item.title["ar-EG"] ?? item.title.en ?? item.course),
          })),
        },
        { headers },
      );
    } catch {
      return Response.json({ error: "PURCHASE_OPTIONS_UNAVAILABLE" }, { status: 503, headers });
    }
  }
  const rejected = rejectMethod(request);
  if (rejected) return rejected;
  const { liveRuntime, authenticateBearer, trustedLiveOriginFor } =
    await import("./runtime.server");
  const origin = trustedLiveOriginFor(request);
  if (!origin) return Response.json({ error: "UNTRUSTED_ORIGIN" }, { status: 403, headers });
  const user = await authenticateBearer(request);
  if (!user) return Response.json({ error: "UNAUTHORIZED" }, { status: 401, headers });
  const parsed = liveCheckoutSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return Response.json({ error: "INVALID_CHECKOUT_SELECTION" }, { status: 400, headers });
  const { createLiveCheckout } = await import("./stripe-live");
  const result = await createLiveCheckout(user, parsed.data, origin, liveRuntime());
  return Response.json(result.body, { status: result.status, headers });
}

export async function handleLivePortal(request: Request): Promise<Response> {
  const rejected = rejectMethod(request);
  if (rejected) return rejected;
  const { liveRuntime, authenticateBearer, trustedLiveOriginFor } =
    await import("./runtime.server");
  const origin = trustedLiveOriginFor(request);
  if (!origin) return Response.json({ error: "UNTRUSTED_ORIGIN" }, { status: 403, headers });
  const user = await authenticateBearer(request);
  if (!user) return Response.json({ error: "UNAUTHORIZED" }, { status: 401, headers });
  const parsed = livePortalSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return Response.json({ error: "INVALID_PORTAL_SCOPE" }, { status: 400, headers });
  const { createLivePortal } = await import("./stripe-live");
  const result = await createLivePortal(user, parsed.data.scope, origin, liveRuntime());
  return Response.json(result.body, { status: result.status, headers });
}

export async function handleLiveWebhook(request: Request): Promise<Response> {
  const rejected = rejectMethod(request);
  if (rejected) return rejected;
  const { liveRuntime } = await import("./runtime.server");
  const { handleLiveWebhookEvent } = await import("./stripe-live");
  const result = await handleLiveWebhookEvent(
    await request.text(),
    request.headers.get("stripe-signature"),
    liveRuntime(),
  );
  return Response.json(result.body, { status: result.status, headers });
}

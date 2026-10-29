/** Read-only, non-personal mode response shared by file-route and Worker entry. */
export async function handleBillingMode(request: Request): Promise<Response> {
  const headers = { "Cache-Control": "no-store" };
  if (request.method !== "GET")
    return Response.json({ error: "METHOD_NOT_ALLOWED" }, { status: 405, headers: { ...headers, Allow: "GET" } });
  const intent = new URL(request.url).searchParams.get("intent");
  if (intent !== "checkout" && intent !== "portal")
    return Response.json({ error: "INVALID_INTENT" }, { status: 400, headers });
  const scope = new URL(request.url).searchParams.get("scope");
  if (intent === "portal" && scope !== null) {
    if (!["core", "kids", "academic", "technical"].includes(scope))
      return Response.json({ error: "INVALID_PORTAL_SCOPE" }, { status: 400, headers });
    const { authenticateBearer, liveRuntime } = await import("./live/runtime.server");
    const user = await authenticateBearer(request);
    if (!user) return Response.json({ error: "UNAUTHORIZED" }, { status: 401, headers });
    try {
      const environment = await liveRuntime().rpc("get_stripe_portal_environment", { p_user_id: user.id, p_scope: scope });
      const { isTestStripeLocked } = await import("../../../supabase/functions/_shared/billing-mode");
      const { portalModeForExistingSubscription } = await import("./portal-continuity");
      const mode = portalModeForExistingSubscription(environment, isTestStripeLocked(name => process.env[name]));
      return Response.json({ mode }, { headers });
    } catch {
      return Response.json({ error: "PORTAL_UNAVAILABLE" }, { status: 503, headers });
    }
  }
  const { decideBillingMode } = await import("./billing-mode");
  const getEnv = (name: string) => process.env[name];
  const mode = await decideBillingMode(intent, getEnv, async () => {
    const { liveRuntime } = await import("./live/runtime.server");
    return liveRuntime().databaseLiveEnabled();
  });
  return Response.json({ mode }, { headers });
}
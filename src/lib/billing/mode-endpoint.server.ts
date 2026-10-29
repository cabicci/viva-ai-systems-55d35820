/** Read-only, non-personal mode response shared by file-route and Worker entry. */
export async function handleBillingMode(request: Request): Promise<Response> {
  const headers = { "Cache-Control": "no-store" };
  if (request.method !== "GET")
    return Response.json({ error: "METHOD_NOT_ALLOWED" }, { status: 405, headers: { ...headers, Allow: "GET" } });
  const intent = new URL(request.url).searchParams.get("intent");
  if (intent !== "checkout" && intent !== "portal")
    return Response.json({ error: "INVALID_INTENT" }, { status: 400, headers });
  const { decideBillingMode } = await import("./billing-mode");
  const getEnv = (name: string) => process.env[name];
  const mode = await decideBillingMode(intent, getEnv, async () => {
    const { liveRuntime } = await import("./live/runtime.server");
    return liveRuntime().databaseLiveEnabled();
  });
  return Response.json({ mode }, { headers });
}
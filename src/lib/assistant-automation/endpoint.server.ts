import { verifyIndexerIdentity } from "./github-identity.server";
export const AUTOMATIC_INDEXING_PATH = "/api/internal/assistant-indexing";
type EndpointDependencies = {
  authorize?: (request: Request) => Promise<unknown>;
  status?: () => Promise<unknown>;
  tick?: (requestId: string) => Promise<Record<string, unknown>>;
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { "content-type": "application/json", "cache-control": "no-store" },
});
export async function handleAutomaticIndexing(request: Request, dependencies: EndpointDependencies = {}): Promise<Response> {
  if (request.method !== "POST") return json({ code: "AUTOMATION_METHOD_NOT_ALLOWED" }, 405);
  try { await (dependencies.authorize ?? verifyIndexerIdentity)(request); }
  catch { return json({ code: "AUTOMATION_FORBIDDEN" }, 401); }
  try {
    const raw = await request.text();
    if (raw.length > 2000) return json({ code: "AUTOMATION_REQUEST_INVALID" }, 400);
    const body = JSON.parse(raw) as Record<string, unknown>;
    if (!body || Array.isArray(body) || typeof body !== "object" ||
      Object.keys(body).some(key => !["operation", "requestId"].includes(key))) return json({ code: "AUTOMATION_REQUEST_INVALID" }, 400);
    if (body.operation === "status" && body.requestId === undefined) {
      const status = dependencies.status ?? (async () => (await import("./store.server")).automationRpc("assistant_auto_status", {}));
      return json(await status());
    }
    if (body.operation !== "tick" || typeof body.requestId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.requestId))
      return json({ code: "AUTOMATION_REQUEST_INVALID" }, 400);
    const tick = dependencies.tick ?? (async requestId => (await import("./worker.server")).automaticTick(requestId));
    return json(await tick(body.requestId));
  } catch { return json({ code: "AUTOMATION_OPERATION_UNAVAILABLE" }, 503); }
}

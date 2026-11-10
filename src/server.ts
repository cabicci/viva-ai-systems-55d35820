import "./lib/error-capture";

import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => ((m as { default?: ServerEntry }).default ?? (m as unknown as ServerEntry)),
    );
  }
  return serverEntryPromise;
}

function brandedErrorResponse(): Response {
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isCatastrophicSsrErrorBody(body: string, responseStatus: number): boolean {
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return false;
  }

  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    return false;
  }

  const fields = payload as Record<string, unknown>;
  const expectedKeys = new Set(["message", "status", "unhandled"]);
  if (!Object.keys(fields).every((key) => expectedKeys.has(key))) {
    return false;
  }

  return (
    fields.unhandled === true &&
    fields.message === "HTTPError" &&
    (fields.status === undefined || fields.status === responseStatus)
  );
}

const SSR_ERROR_BODY_LIMIT = 1024;
const SSR_ERROR_PROBE_TIMEOUT_MS = 100;
const SSR_ERROR_PROBE_CHUNKS = 128;

async function readSmallSsrError(response: Response): Promise<string | null> {
  if (!response.body || response.bodyUsed || response.body.locked ||
    Number(response.headers.get("content-length")) > SSR_ERROR_BODY_LIMIT) return null;

  const reader = response.clone().body?.getReader();
  if (!reader) return null;
  const decoder = new TextDecoder();
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<null>(resolve => {
    timeout = setTimeout(() => resolve(null), SSR_ERROR_PROBE_TIMEOUT_MS);
  });
  let bytes = 0;
  let text = "";
  try {
    for (let count = 0; count < SSR_ERROR_PROBE_CHUNKS; count++) {
      const part = await Promise.race([reader.read(), deadline]);
      if (part === null) return null;
      if (part.done) return text + decoder.decode();
      bytes += part.value.byteLength;
      if (bytes > SSR_ERROR_BODY_LIMIT) return null;
      text += decoder.decode(part.value, { stream: true });
    }
    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
    // Cancelling a tee branch can wait for the original response to finish.
    void reader.cancel().catch(() => {});
  }
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} instead of throwing.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await readSmallSsrError(response);
  if (body === null || !isCatastrophicSsrErrorBody(body, response.status)) {
    return response;
  }

  console.error("SSR_HTTP_ERROR_NORMALIZED");
  return brandedErrorResponse();
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      // The published Worker reaches this entry even when its bundled file-route
      // dispatcher misses a server route. Each exact path shares its original
      // guarded handler with the file route; no blanket API bypass is allowed.
      if (new URL(request.url).pathname === "/api/billing/mode") {
        const { handleBillingMode } = await import("./lib/billing/mode-endpoint.server");
        return await handleBillingMode(request);
      }
      const pathname = new URL(request.url).pathname;
      if (pathname === "/api/stripe-live/checkout") {
        const { handleLiveCheckout } = await import("./lib/billing/live/endpoints.server");
        return await handleLiveCheckout(request);
      }
      if (pathname === "/api/stripe-live/portal") {
        const { handleLivePortal } = await import("./lib/billing/live/endpoints.server");
        return await handleLivePortal(request);
      }
      if (pathname === "/api/public/stripe-live-webhook") {
        const { handleLiveWebhook } = await import("./lib/billing/live/endpoints.server");
        return await handleLiveWebhook(request);
      }
      if (new URL(request.url).pathname === "/api/public/assistant-indexing") {
        const { handlePublicAutomaticIndexing } = await import("./lib/assistant-automation/public-endpoint.server");
        return await handlePublicAutomaticIndexing(request);
      }
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch {
      console.error("SERVER_REQUEST_FAILED");
      return brandedErrorResponse();
    }
  },
};


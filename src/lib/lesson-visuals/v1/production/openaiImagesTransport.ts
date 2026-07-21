/**
 * Method 2 transport: official OpenAI Images API only.
 * Injectable fetch — tests never hit the live network.
 */
import type { LessonVisualMaster } from "../types";
import type { ProviderTransport } from "./providerContract";
import {
  assertOpenAIRequestDoesNotLeakInternalSchema,
  mapOpenAIImagesResponseToInternal,
  toOpenAIImagesRequest,
  type OpenAIImagesGenerationsResponse,
} from "./openaiImagesAdapter";
import type { ProviderGenerationRequest, ProviderGenerationResponse } from "./types";

export const DEFAULT_OPENAI_IMAGES_ENDPOINT = "https://api.openai.com/v1/images/generations";

export interface OpenAIImagesTransportOptions {
  apiKey: string;
  endpoint?: string;
  timeoutMs: number;
  providerName: string;
  model: string;
  accountId: string;
  projectId: string | null;
  authId: string;
  master: LessonVisualMaster;
  requiredWidth: number;
  requiredHeight: number;
  fetchImpl?: typeof fetch;
  /** Test clock — defaults to Date.now ISO. */
  nowIso?: () => string;
}

function redact(msg: string, apiKey: string): string {
  if (!apiKey || apiKey.length < 8) return msg;
  return msg.split(apiKey).join("[REDACTED]");
}

export function createOpenAIImagesTransport(
  opts: OpenAIImagesTransportOptions,
): ProviderTransport & {
  isMock: false;
  kind: "openai-images";
  generateCallCount: number;
  httpCallCount: number;
  lastOpenAIRequestBody: unknown | null;
} {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const endpoint = (opts.endpoint ?? DEFAULT_OPENAI_IMAGES_ENDPOINT).trim();
  const transport = {
    isMock: false as const,
    kind: "openai-images" as const,
    generateCallCount: 0,
    httpCallCount: 0,
    lastOpenAIRequestBody: null as unknown | null,
    async generate(request: ProviderGenerationRequest): Promise<ProviderGenerationResponse> {
      transport.generateCallCount += 1;
      if (request.method !== 2) {
        throw new Error(`openai images transport requires method 2, got ${request.method}`);
      }
      if (!opts.apiKey.trim()) throw new Error("openai api key missing");
      if (!endpoint) throw new Error("openai images endpoint missing");

      const body = toOpenAIImagesRequest({
        model: opts.model,
        master: opts.master,
        locale: request.locale,
        width: opts.requiredWidth,
        height: opts.requiredHeight,
      });
      assertOpenAIRequestDoesNotLeakInternalSchema(body);
      transport.lastOpenAIRequestBody = body;

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), opts.timeoutMs);
      let res: Response;
      try {
        transport.httpCallCount += 1;
        res = await fetchImpl(endpoint, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            accept: "application/json",
            authorization: `Bearer ${opts.apiKey}`,
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
      } catch (e) {
        const raw = e instanceof Error ? e.message : String(e);
        if (e instanceof Error && e.name === "AbortError") {
          throw new Error("openai images request timed out");
        }
        throw new Error(`openai images network error: ${redact(raw, opts.apiKey)}`);
      } finally {
        clearTimeout(timer);
      }

      const requestId = res.headers.get("x-request-id") ?? res.headers.get("X-Request-Id");
      let json: OpenAIImagesGenerationsResponse;
      try {
        json = (await res.json()) as OpenAIImagesGenerationsResponse;
      } catch {
        throw new Error(`openai images non-JSON response status=${res.status}`);
      }
      if (!res.ok) {
        throw new Error(
          `openai images HTTP ${res.status}: ${json.error?.message ?? "request failed"}`,
        );
      }

      const mapped = mapOpenAIImagesResponseToInternal({
        request,
        openaiBody: json,
        responseRequestId: requestId,
        providerName: opts.providerName,
        model: opts.model,
        accountId: opts.accountId,
        projectId: opts.projectId,
        authId: opts.authId,
        requiredWidth: opts.requiredWidth,
        requiredHeight: opts.requiredHeight,
        generatedAt: opts.nowIso?.() ?? new Date().toISOString(),
      });
      if (!mapped.ok || !mapped.response) {
        throw new Error(mapped.errors.join("; "));
      }
      return mapped.response;
    },
  };
  return transport;
}

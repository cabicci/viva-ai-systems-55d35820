/**
 * Real HTTP provider transport for production execution mode.
 * Never logs API keys, auth tokens, secret headers, or full sensitive bodies.
 * Injectable fetch for offline tests — no live network in unit tests.
 */
import { createHash } from "node:crypto";
import type { ProviderTransport } from "./providerContract";
import type { ProviderGenerationRequest, ProviderGenerationResponse } from "./types";

export interface HttpProviderOptions {
  endpoint: string;
  apiKey: string;
  timeoutMs: number;
  expectedProviderName: string;
  expectedModel: string;
  expectedAccountId: string;
  expectedProjectId: string | null;
  expectedAuthId: string;
  /** Injected for tests; defaults to global fetch. */
  fetchImpl?: typeof fetch;
}

function redactErrorMessage(msg: string, apiKey: string): string {
  if (!apiKey) return msg;
  return msg.split(apiKey).join("[REDACTED]");
}

function assertNonSecretLogPayload(payload: unknown, apiKey: string): void {
  // Only check when the key is long enough to avoid false positives on short fixtures.
  if (!apiKey || apiKey.length < 8) return;
  const s = JSON.stringify(payload);
  if (s.includes(apiKey)) {
    throw new Error("refusing to surface provider secret material");
  }
}

export function createHttpProvider(opts: HttpProviderOptions): ProviderTransport & {
  isMock: false;
  generateCallCount: number;
} {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const transport = {
    isMock: false as const,
    generateCallCount: 0,
    async generate(request: ProviderGenerationRequest): Promise<ProviderGenerationResponse> {
      transport.generateCallCount += 1;
      if (!opts.endpoint.trim()) {
        throw new Error("provider endpoint missing");
      }
      if (!opts.apiKey.trim()) {
        throw new Error("provider API key missing");
      }
      if (!Number.isSafeInteger(opts.timeoutMs) || opts.timeoutMs <= 0) {
        throw new Error("provider timeout invalid");
      }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), opts.timeoutMs);
      let res: Response;
      try {
        res = await fetchImpl(opts.endpoint, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            accept: "application/json",
            authorization: `Bearer ${opts.apiKey}`,
            "x-masaarat-provider-auth-id": opts.expectedAuthId,
            "x-masaarat-provider-account-id": opts.expectedAccountId,
            "x-masaarat-idempotency-key": request.idempotencyKey,
          },
          body: JSON.stringify(request),
          signal: controller.signal,
        });
      } catch (e) {
        const raw = e instanceof Error ? e.message : String(e);
        const name = e instanceof Error ? e.name : "";
        if (name === "AbortError" || /abort/i.test(raw)) {
          throw new Error("provider request timed out");
        }
        throw new Error(`provider network error: ${redactErrorMessage(raw, opts.apiKey)}`);
      } finally {
        clearTimeout(timer);
      }

      if (!res.ok) {
        throw new Error(`provider HTTP ${res.status}`);
      }

      let bodyText: string;
      try {
        bodyText = await res.text();
      } catch (e) {
        throw new Error(
          `provider response body read failed: ${redactErrorMessage(
            e instanceof Error ? e.message : String(e),
            opts.apiKey,
          )}`,
        );
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(bodyText);
      } catch {
        throw new Error("provider response is not valid JSON");
      }

      assertNonSecretLogPayload(parsed, opts.apiKey);

      if (!parsed || typeof parsed !== "object") {
        throw new Error("provider response not an object");
      }
      const r = parsed as Partial<ProviderGenerationResponse>;
      if (r.schemaVersion !== "lesson-visual-provider-response/v1") {
        throw new Error("unsupported provider response schemaVersion");
      }
      if (!r.providerRequestId || typeof r.providerRequestId !== "string") {
        throw new Error("missing provider request ID");
      }
      if (r.providerName !== opts.expectedProviderName) {
        throw new Error("provider name mismatch");
      }
      if (r.modelOrRenderer !== opts.expectedModel) {
        throw new Error("provider model mismatch");
      }
      if (r.providerAccountId !== opts.expectedAccountId) {
        throw new Error("provider account mismatch");
      }
      const expectedProject = opts.expectedProjectId ?? null;
      const gotProject = r.providerProjectId ?? null;
      if (gotProject !== expectedProject) {
        throw new Error("provider project mismatch");
      }
      if (r.providerAuthId !== opts.expectedAuthId) {
        throw new Error("provider auth identity mismatch");
      }
      if (!r.outputBytesBase64 && !r.secureByteReference) {
        throw new Error("missing image output");
      }
      if (r.outputBytesBase64 === "") {
        throw new Error("empty output bytes");
      }
      if (typeof r.providerReportedCostMicros !== "string" || !/^\d+$/.test(r.providerReportedCostMicros)) {
        throw new Error("missing or malformed cost metadata");
      }
      if (typeof r.contentChecksumSha256 !== "string" || !/^[a-f0-9]{64}$/.test(r.contentChecksumSha256)) {
        throw new Error("missing or malformed content checksum");
      }

      // Identity echo fields must match the request (fail closed early).
      if (r.cellId !== request.cellId) throw new Error("response cellId mismatch");
      if (r.lessonId !== request.lessonId) throw new Error("response lessonId mismatch");
      if (r.locale !== request.locale) throw new Error("response locale mismatch");
      if (r.method !== request.method) throw new Error("response method mismatch");
      if (r.runId !== request.runId) throw new Error("response runId mismatch");
      if (r.controlRoomAuthorizationId !== request.controlRoomAuthorizationId) {
        throw new Error("response authorization mismatch");
      }
      if (r.sourceSha !== request.sourceSha) throw new Error("response sourceSha mismatch");
      if (r.approvedManifestSha256 !== request.approvedManifestSha256) {
        throw new Error("response manifest digest mismatch");
      }
      if (r.idempotencyKey !== request.idempotencyKey) {
        throw new Error("response idempotencyKey mismatch");
      }
      if (r.attemptNumber !== request.attemptNumber) {
        throw new Error("response attemptNumber mismatch");
      }

      return r as ProviderGenerationResponse;
    },
  };
  return transport;
}

/** Deterministic offline request-id helper for HTTP mock doubles in tests. */
export function deterministicProviderRequestId(idempotencyKey: string, attempt: number): string {
  return createHash("sha256").update(`${idempotencyKey}:${attempt}`).digest("hex").slice(0, 32);
}

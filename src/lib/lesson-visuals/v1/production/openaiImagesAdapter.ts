/**
 * OpenAI Images API adapter — official request/response shapes only.
 * Never forwards Masaarat's internal provider schema to OpenAI.
 * Maps external fields into internal receipts without fabricating metadata.
 */
import { createHash } from "node:crypto";
import type { LessonVisualMaster, Locale } from "../types";
import { inspectPng, normalizePngToExactSize, sha256Hex } from "./pngCodec";
import { buildGreenfieldRights } from "./rights";
import { buildOpenAIImagesPrompt } from "./renderingSpec";
import type { ProviderGenerationRequest, ProviderGenerationResponse } from "./types";

/** Official OpenAI Images generations request body (subset we send). */
export interface OpenAIImagesGenerationsRequest {
  model: string;
  prompt: string;
  n: 1;
  size: string;
  response_format: "b64_json";
}

/** Official OpenAI Images generations response (relevant fields only). */
export interface OpenAIImagesGenerationsResponse {
  created?: number;
  data?: Array<{
    b64_json?: string;
    url?: string;
    revised_prompt?: string;
  }>;
  error?: { message?: string; type?: string; code?: string };
}

export function openAIImagesSizeFor(width: number, height: number): string {
  // Official size tokens; callers still normalize pixels to exact configured dims.
  if (width === 1024 && height === 1024) return "1024x1024";
  if (width === 1792 && height === 1024) return "1792x1024";
  if (width === 1024 && height === 1792) return "1024x1792";
  // Closest landscape token for 1280x720 policy; normalize afterward.
  return "1792x1024";
}

export function toOpenAIImagesRequest(args: {
  model: string;
  master: LessonVisualMaster;
  locale: Locale;
  width: number;
  height: number;
}): OpenAIImagesGenerationsRequest {
  return {
    model: args.model,
    prompt: buildOpenAIImagesPrompt(args.master, args.locale),
    n: 1,
    size: openAIImagesSizeFor(args.width, args.height),
    response_format: "b64_json",
  };
}

/**
 * Assert payload is OpenAI-shaped and does not contain Masaarat internal schema keys.
 */
export function assertOpenAIRequestDoesNotLeakInternalSchema(
  body: OpenAIImagesGenerationsRequest,
): void {
  const json = JSON.stringify(body);
  const banned = [
    "lesson-visual-provider-request",
    "controlRoomAuthorizationId",
    "approvedManifestSha256",
    "promptOrRenderingSpec",
    "expectedProviderAccountId",
    "rightsProvenanceRequirements",
  ];
  for (const key of banned) {
    if (json.includes(key)) {
      throw new Error(`refusing to send internal schema field to OpenAI: ${key}`);
    }
  }
}

export function mapOpenAIImagesResponseToInternal(args: {
  request: ProviderGenerationRequest;
  openaiBody: OpenAIImagesGenerationsResponse;
  /** From response headers only — never invented. */
  responseRequestId: string | null;
  providerName: string;
  model: string;
  accountId: string;
  projectId: string | null;
  authId: string;
  requiredWidth: number;
  requiredHeight: number;
  generatedAt: string;
}): {
  ok: boolean;
  errors: string[];
  response: ProviderGenerationResponse | null;
  bytes: Buffer | null;
} {
  const errors: string[] = [];
  if (args.openaiBody.error) {
    errors.push(
      `openai images error: ${args.openaiBody.error.message ?? args.openaiBody.error.type ?? "unknown"}`,
    );
  }
  const first = args.openaiBody.data?.[0];
  if (!first?.b64_json) {
    errors.push("openai images response missing data[0].b64_json");
  }
  if (!args.responseRequestId?.trim()) {
    errors.push("openai images response missing request id header (x-request-id)");
  }
  if (errors.length > 0) {
    return { ok: false, errors, response: null, bytes: null };
  }

  let bytes = Buffer.from(first!.b64_json!, "base64");
  const mimeProbe = inspectPng(bytes);
  if (!mimeProbe) {
    // Accept other image magics only after we can normalize; fail if not PNG for now.
    errors.push("openai images output is not a decodable PNG");
    return { ok: false, errors, response: null, bytes: null };
  }
  const normalized = normalizePngToExactSize(bytes, args.requiredWidth, args.requiredHeight);
  if (!normalized.ok) {
    return { ok: false, errors: normalized.errors, response: null, bytes: null };
  }
  bytes = Buffer.from(normalized.bytes);
  const checksum = sha256Hex(bytes);
  const providerRequestId = args.responseRequestId!;

  const metadata: Record<string, string> = {
    transport: "openai-images",
  };
  if (typeof args.openaiBody.created === "number") {
    metadata.openaiCreated = String(args.openaiBody.created);
  }
  if (first!.revised_prompt) {
    metadata.revisedPromptPresent = "true";
  }
  // OpenAI Images generations JSON does not include a cost field — report 0, not an estimate.
  metadata.costSource = "openai-images-api-no-cost-field";

  const rights = buildGreenfieldRights({
    method: 2,
    providerName: args.providerName,
    model: args.model,
    providerRequestId,
    generatedAt: args.generatedAt,
    cellId: args.request.cellId,
    contentSha: args.request.contentSha,
    executionSha: args.request.executionSha,
    approvedManifestSha256: args.request.approvedManifestSha256,
    outputContentSha256: checksum,
    sourceReferences: [`master:${args.request.lessonId}`, `openai-images:${args.model}`],
    evidenceChecksums: [
      createHash("sha256").update(args.request.promptOrRenderingSpec).digest("hex"),
    ],
  });
  rights.transformationRecord = ["openai-images-generations", "normalize-png-exact-dims"];

  const response: ProviderGenerationResponse = {
    schemaVersion: "lesson-visual-provider-response/v1",
    providerName: args.providerName,
    providerRequestId,
    modelOrRenderer: args.model,
    providerAccountId: args.accountId,
    providerProjectId: args.projectId,
    providerAuthId: args.authId,
    outputBytesBase64: bytes.toString("base64"),
    secureByteReference: null,
    mimeType: "image/png",
    width: args.requiredWidth,
    height: args.requiredHeight,
    byteLength: bytes.length,
    providerReportedCostMicros: "0",
    generationTimestamp: args.generatedAt,
    providerMetadata: metadata,
    rightsProvenance: rights,
    contentChecksumSha256: checksum,
    cellId: args.request.cellId,
    lessonId: args.request.lessonId,
    locale: args.request.locale,
    method: args.request.method,
    runId: args.request.runId,
    controlRoomAuthorizationId: args.request.controlRoomAuthorizationId,
    contentSha: args.request.contentSha,
    executionSha: args.request.executionSha,
    approvedManifestSha256: args.request.approvedManifestSha256,
    idempotencyKey: args.request.idempotencyKey,
    attemptNumber: args.request.attemptNumber,
  };

  return { ok: true, errors: [], response, bytes };
}

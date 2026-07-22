/**
 * Local Method 1 / 4 transport — deterministic master/locale PNG, zero network.
 * Method 2 supported only via gated local-master fallback (hybrid render path).
 */
import { createHash } from "node:crypto";
import type { LessonVisualMaster } from "../types";
import { localRendererIdentity, renderLocalMasterPng } from "./localMasterRenderer";
import { sha256Hex } from "./pngCodec";
import type { ProviderTransport } from "./providerContract";
import { buildGreenfieldRights } from "./rights";
import type { ProviderGenerationRequest, ProviderGenerationResponse } from "./types";

export interface LocalMasterTransportOptions {
  method: 1 | 2 | 4;
  master: LessonVisualMaster;
  accountId: string;
  projectId: string | null;
  authId: string;
  requiredWidth: number;
  requiredHeight: number;
  nowIso?: () => string;
  /** Strict gate: Method 2 may use this transport only when fallback is enabled. */
  method2Fallback?: boolean;
}

export function createLocalMasterTransport(
  opts: LocalMasterTransportOptions,
): ProviderTransport & {
  isMock: false;
  kind: "local-deterministic" | "local-hybrid" | "local-hybrid-method2-fallback";
  generateCallCount: number;
  httpCallCount: 0;
} {
  if (opts.method === 2 && !opts.method2Fallback) {
    throw new Error("createLocalMasterTransport method 2 requires method2Fallback");
  }
  const identity = localRendererIdentity(opts.method, {
    method2Fallback: opts.method2Fallback,
  });
  const kind =
    opts.method === 1
      ? ("local-deterministic" as const)
      : opts.method === 2
        ? ("local-hybrid-method2-fallback" as const)
        : ("local-hybrid" as const);
  const transport = {
    isMock: false as const,
    kind,
    generateCallCount: 0,
    httpCallCount: 0 as const,
    async generate(request: ProviderGenerationRequest): Promise<ProviderGenerationResponse> {
      transport.generateCallCount += 1;
      if (request.method !== opts.method) {
        throw new Error(
          `local master transport method mismatch transport=${opts.method} request=${request.method}`,
        );
      }
      if (opts.master.lessonId !== request.lessonId) {
        throw new Error("local master transport lessonId mismatch");
      }

      const bytes = renderLocalMasterPng({
        master: opts.master,
        locale: request.locale,
        method: opts.method,
        width: opts.requiredWidth,
        height: opts.requiredHeight,
        method2Fallback: opts.method2Fallback,
      });
      const checksum = sha256Hex(bytes);
      const providerRequestId = createHash("sha256")
        .update(
          `local:${opts.method}${opts.method2Fallback ? ":m2-fallback" : ""}:${request.idempotencyKey}:${request.locale}:${checksum}`,
        )
        .digest("hex")
        .slice(0, 32);
      const generatedAt = opts.nowIso?.() ?? new Date().toISOString();
      const rights = buildGreenfieldRights({
        method: opts.method,
        providerName: identity.providerName,
        model: identity.modelOrRenderer,
        providerRequestId,
        generatedAt,
        cellId: request.cellId,
        contentSha: request.contentSha,
        executionSha: request.executionSha,
        approvedManifestSha256: request.approvedManifestSha256,
        outputContentSha256: checksum,
        sourceReferences: [
          `master:${request.lessonId}`,
          `master-checksum:${opts.master.checksum}`,
          ...(opts.method2Fallback
            ? ["method2-fallback:local-master", "LESSON_VISUALS_METHOD2_FALLBACK=local-master"]
            : []),
        ],
        evidenceChecksums: [opts.master.checksum],
      });
      if (opts.method === 1) {
        rights.transformationRecord = ["local-deterministic-master-png"];
      } else if (opts.method2Fallback) {
        rights.transformationRecord = [
          "method2-fallback-local-master",
          "local-hybrid-master-png",
        ];
        rights.licenseOrUsageBasis =
          "greenfield-local-master-fallback-when-ai-illustration-provider-unavailable";
      } else {
        rights.transformationRecord = ["local-hybrid-master-png"];
      }

      return {
        schemaVersion: "lesson-visual-provider-response/v1",
        providerName: identity.providerName,
        providerRequestId,
        modelOrRenderer: identity.modelOrRenderer,
        providerAccountId: opts.accountId,
        providerProjectId: opts.projectId,
        providerAuthId: opts.authId,
        outputBytesBase64: bytes.toString("base64"),
        secureByteReference: null,
        mimeType: "image/png",
        width: opts.requiredWidth,
        height: opts.requiredHeight,
        byteLength: bytes.length,
        providerReportedCostMicros: "0",
        generationTimestamp: generatedAt,
        providerMetadata: {
          transport: transport.kind,
          network: "none",
          ...(opts.method2Fallback
            ? {
                method2Fallback: "local-master",
                fallbackReason: "provider-api-key-missing-or-placeholder",
              }
            : {}),
        },
        rightsProvenance: rights,
        contentChecksumSha256: checksum,
        cellId: request.cellId,
        lessonId: request.lessonId,
        locale: request.locale,
        method: request.method,
        runId: request.runId,
        controlRoomAuthorizationId: request.controlRoomAuthorizationId,
        contentSha: request.contentSha,
        executionSha: request.executionSha,
        approvedManifestSha256: request.approvedManifestSha256,
        idempotencyKey: request.idempotencyKey,
        attemptNumber: request.attemptNumber,
      };
    },
  };
  return transport;
}

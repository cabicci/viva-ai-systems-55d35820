/**
 * Local Method 1 / 4 transport — deterministic master/locale PNG, zero network.
 */
import { createHash } from "node:crypto";
import type { LessonVisualMaster } from "../types";
import { localRendererIdentity, renderLocalMasterPng } from "./localMasterRenderer";
import { sha256Hex } from "./pngCodec";
import type { ProviderTransport } from "./providerContract";
import { buildGreenfieldRights } from "./rights";
import type { ProviderGenerationRequest, ProviderGenerationResponse } from "./types";

export interface LocalMasterTransportOptions {
  method: 1 | 4;
  master: LessonVisualMaster;
  accountId: string;
  projectId: string | null;
  authId: string;
  requiredWidth: number;
  requiredHeight: number;
  nowIso?: () => string;
}

export function createLocalMasterTransport(
  opts: LocalMasterTransportOptions,
): ProviderTransport & {
  isMock: false;
  kind: "local-deterministic" | "local-hybrid";
  generateCallCount: number;
  httpCallCount: 0;
} {
  const identity = localRendererIdentity(opts.method);
  const transport = {
    isMock: false as const,
    kind: (opts.method === 1 ? "local-deterministic" : "local-hybrid") as
      | "local-deterministic"
      | "local-hybrid",
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
      });
      const checksum = sha256Hex(bytes);
      const providerRequestId = createHash("sha256")
        .update(
          `local:${opts.method}:${request.idempotencyKey}:${request.locale}:${checksum}`,
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
        ],
        evidenceChecksums: [opts.master.checksum],
      });
      rights.transformationRecord =
        opts.method === 1
          ? ["local-deterministic-master-png"]
          : ["local-hybrid-master-png"];

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

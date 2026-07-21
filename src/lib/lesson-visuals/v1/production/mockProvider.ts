/**
 * Deterministic offline mock provider — no network.
 * Allowed only in dry-run / unit tests.
 */
import { createHash } from "node:crypto";
import { encodeSolidPng, sha256Hex } from "./pngCodec";
import { buildGreenfieldRights } from "./rights";
import type { ProviderTransport } from "./providerContract";
import type { ProviderGenerationRequest, ProviderGenerationResponse } from "./types";

export interface MockProviderOptions {
  providerName: string;
  model: string;
  accountId: string;
  projectId: string | null;
  authId: string;
  width: number;
  height: number;
  costMicros: string;
  failMode?:
    | "empty-bytes"
    | "wrong-mime"
    | "wrong-dimensions"
    | "checksum-mismatch"
    | "wrong-cell"
    | "wrong-locale"
    | "missing-rights"
    | "url-only"
    | "high-cost"
    | "wrong-account"
    | "wrong-project"
    | "wrong-auth"
    | "wrong-content-sha"
    | "wrong-manifest"
    | "wrong-run"
    | "wrong-attempt"
    | "legacy-source-ref"
    | null;
}

export function createMockProvider(opts: MockProviderOptions): ProviderTransport & {
  isMock: true;
  generateCallCount: number;
} {
  const transport = {
    isMock: true as const,
    generateCallCount: 0,
    async generate(request: ProviderGenerationRequest): Promise<ProviderGenerationResponse> {
      transport.generateCallCount += 1;
      const providerRequestId = createHash("sha256")
        .update(`${request.idempotencyKey}:${request.attemptNumber}`)
        .digest("hex")
        .slice(0, 32);

      const generatedAt = new Date("2026-07-21T00:00:00.000Z").toISOString();
      const hue = createHash("sha256").update(request.cellId).digest();
      const rgb: [number, number, number] = [hue[0]!, hue[1]!, hue[2]!];
      let width = opts.width;
      let height = opts.height;
      let mimeType = "image/png";
      let bytes = encodeSolidPng(width, height, rgb);
      let cost = opts.costMicros;
      let cellId = request.cellId;
      let lessonId = request.lessonId;
      let locale = request.locale;
      let method = request.method;
      let runId = request.runId;
      let controlRoomAuthorizationId = request.controlRoomAuthorizationId;
      let contentSha = request.contentSha;
      let executionSha = request.executionSha;
      let approvedManifestSha256 = request.approvedManifestSha256;
      let attemptNumber = request.attemptNumber;
      let accountId = opts.accountId;
      let projectId = opts.projectId;
      let authId = opts.authId;
      let sourceReferences = [`master:${request.lessonId}`];
      let outputBytesBase64: string | null = bytes.toString("base64");
      let secureByteReference: string | null = null;
      let checksum = sha256Hex(bytes);

      switch (opts.failMode) {
        case "empty-bytes":
          bytes = Buffer.alloc(0);
          outputBytesBase64 = "";
          checksum = sha256Hex(bytes);
          break;
        case "wrong-mime":
          bytes = Buffer.from("<html>error</html>", "utf8");
          mimeType = "image/png";
          outputBytesBase64 = bytes.toString("base64");
          checksum = sha256Hex(bytes);
          break;
        case "wrong-dimensions":
          bytes = encodeSolidPng(16, 16, [1, 2, 3]);
          width = 16;
          height = 16;
          outputBytesBase64 = bytes.toString("base64");
          checksum = sha256Hex(bytes);
          break;
        case "checksum-mismatch":
          checksum = "0".repeat(64);
          break;
        case "wrong-cell":
          cellId = "other-lesson__en";
          lessonId = "other-lesson";
          break;
        case "wrong-locale":
          locale = locale === "en" ? "ar-EG" : "en";
          break;
        case "url-only":
          outputBytesBase64 = null;
          secureByteReference = "https://example.invalid/legacy/image.png";
          break;
        case "high-cost":
          cost = "999999999999";
          break;
        case "wrong-account":
          accountId = "wrong-account";
          break;
        case "wrong-project":
          projectId = "wrong-project";
          break;
        case "wrong-auth":
          authId = "wrong-auth";
          break;
        case "wrong-content-sha":
          contentSha = "0".repeat(40);
          break;
        case "wrong-manifest":
          approvedManifestSha256 = "1".repeat(64);
          break;
        case "wrong-run":
          runId = "wrong-run";
          break;
        case "wrong-attempt":
          attemptNumber = request.attemptNumber + 1;
          break;
        case "legacy-source-ref":
          sourceReferences = ["docs/lesson-visuals/legacy/gallery/old.png"];
          break;
        case "missing-rights":
          break;
        default:
          break;
      }

      const rights = buildGreenfieldRights({
        method: request.method,
        providerName: opts.providerName,
        model: opts.model,
        providerRequestId,
        generatedAt,
        cellId: request.cellId,
        contentSha: request.contentSha,
        executionSha: request.executionSha,
        approvedManifestSha256: request.approvedManifestSha256,
        outputContentSha256: checksum === "0".repeat(64) ? sha256Hex(bytes) : checksum,
        sourceReferences,
        evidenceChecksums: [createHash("sha256").update(request.lessonId).digest("hex")],
      });
      if (opts.failMode === "missing-rights") {
        rights.licenseOrUsageBasis = "";
      }
      if (opts.failMode === "checksum-mismatch") {
        // rights bind to real bytes; response checksum is wrong — contract must reject
        rights.outputContentSha256 = sha256Hex(bytes);
      }

      return {
        schemaVersion: "lesson-visual-provider-response/v1",
        providerName: opts.providerName,
        providerRequestId,
        modelOrRenderer: opts.model,
        providerAccountId: accountId,
        providerProjectId: projectId,
        providerAuthId: authId,
        outputBytesBase64,
        secureByteReference,
        mimeType,
        width,
        height,
        byteLength: bytes.length,
        providerReportedCostMicros: cost,
        generationTimestamp: generatedAt,
        providerMetadata: { transport: "mock", network: "none" },
        rightsProvenance: rights,
        contentChecksumSha256: checksum,
        cellId,
        lessonId,
        locale,
        method,
        runId,
        controlRoomAuthorizationId,
        contentSha,
        executionSha,
        approvedManifestSha256,
        idempotencyKey: request.idempotencyKey,
        attemptNumber,
      };
    },
  };
  return transport;
}

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
  width: number;
  height: number;
  costMicros: string;
  /** Force failures for tests */
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
    | null;
}

export function createMockProvider(opts: MockProviderOptions): ProviderTransport & {
  isMock: true;
} {
  return {
    isMock: true,
    async generate(request: ProviderGenerationRequest): Promise<ProviderGenerationResponse> {
      const providerRequestId = createHash("sha256")
        .update(`${request.idempotencyKey}:${request.attemptNumber}`)
        .digest("hex")
        .slice(0, 32);

      const generatedAt = new Date("2026-07-21T00:00:00.000Z").toISOString();
      const rights = buildGreenfieldRights({
        method: request.method,
        providerName: opts.providerName,
        model: opts.model,
        providerRequestId,
        generatedAt,
        sourceReferences: [`master:${request.lessonId}`],
        evidenceChecksums: [
          createHash("sha256").update(request.lessonId).digest("hex"),
        ],
      });

      if (opts.failMode === "missing-rights") {
        rights.licenseOrUsageBasis = "";
      }

      let width = opts.width;
      let height = opts.height;
      let mimeType = "image/png";
      // Deterministic unique raster per cell (avoids duplicate checksum across cells).
      const hue = createHash("sha256").update(request.cellId).digest();
      const rgb: [number, number, number] = [hue[0]!, hue[1]!, hue[2]!];
      let bytes = encodeSolidPng(width, height, rgb);
      let cost = opts.costMicros;
      let cellId = request.cellId;
      let lessonId = request.lessonId;
      let locale = request.locale;
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
          secureByteReference = "https://example.invalid/image.png";
          break;
        case "high-cost":
          cost = "999999999999";
          break;
        default:
          break;
      }

      return {
        schemaVersion: "lesson-visual-provider-response/v1",
        providerName: opts.providerName,
        providerRequestId,
        modelOrRenderer: opts.model,
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
        runId: request.runId,
        idempotencyKey: request.idempotencyKey,
        attemptNumber: request.attemptNumber,
      };
    },
  };
}

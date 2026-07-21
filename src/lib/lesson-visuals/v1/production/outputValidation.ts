import { FIXTURE_BYTE_MARKER, STUB_RECEIPT_MARKER } from "../constants";
import { detectMimeFromBytes, inspectPng, sha256Hex } from "./pngCodec";
import type { ExecutionMode, OutputValidationRecord, ProductionConfig } from "./types";

export interface ValidateOutputInput {
  bytes: Buffer | null | undefined;
  declaredMime: string;
  declaredWidth: number;
  declaredHeight: number;
  declaredChecksum: string;
  declaredByteLength: number;
  config: ProductionConfig;
  authorizedMimeTypes?: readonly string[];
  /** When true, reject fixture marker even in dry-run if production gate forced. */
  forceProductionGates?: boolean;
}

export function validateOutputBytes(input: ValidateOutputInput): OutputValidationRecord {
  const errors: string[] = [];
  let fixtureRejected = false;
  let stubRejected = false;
  const mode: ExecutionMode = input.forceProductionGates ? "production" : input.config.executionMode;

  if (!input.bytes || input.bytes.length === 0) {
    return {
      schemaVersion: "lesson-visual-output-validation/v1",
      ok: false,
      errors: ["missing or empty output bytes"],
      detectedMime: null,
      width: null,
      height: null,
      byteLength: 0,
      contentChecksumSha256: null,
      fixtureRejected: false,
      stubRejected: false,
    };
  }

  const bytes = input.bytes;
  if (bytes.length > input.config.maxOutputBytes) {
    errors.push(`byte length ${bytes.length} exceeds max ${input.config.maxOutputBytes}`);
  }
  if (input.declaredByteLength !== bytes.length) {
    errors.push(
      `declared byteLength ${input.declaredByteLength} != actual ${bytes.length}`,
    );
  }

  const asText = bytes.toString("utf8");
  if (asText.includes(FIXTURE_BYTE_MARKER)) {
    fixtureRejected = true;
    if (mode === "production") {
      errors.push("production mode rejects fixture/stub marker bytes");
    }
  }
  if (asText.includes(STUB_RECEIPT_MARKER)) {
    stubRejected = true;
    errors.push("stub marker rejected in output bytes");
  }

  const detectedMime = detectMimeFromBytes(bytes);
  if (!detectedMime) {
    errors.push("unable to detect MIME from bytes");
  } else {
    const allowed = input.authorizedMimeTypes ?? input.config.allowedMimeTypes;
    if (!allowed.includes(detectedMime)) {
      errors.push(`MIME ${detectedMime} not in allowed set [${allowed.join(",")}]`);
    }
    if (detectedMime !== input.declaredMime) {
      errors.push(`declared MIME ${input.declaredMime} != detected ${detectedMime}`);
    }
    if (
      detectedMime === "image/svg+xml" ||
      detectedMime === "application/json" ||
      detectedMime === "text/html"
    ) {
      if (!allowed.includes(detectedMime)) {
        errors.push(`non-raster MIME ${detectedMime} masquerading as production raster output`);
      }
    }
  }

  let width: number | null = null;
  let height: number | null = null;
  if (detectedMime === "image/png") {
    const info = inspectPng(bytes);
    if (!info) {
      errors.push("PNG inspect failed");
    } else {
      width = info.width;
      height = info.height;
      if (!info.decodable) errors.push("PNG not decodable");
      if (info.width !== input.config.requiredWidth || info.height !== input.config.requiredHeight) {
        errors.push(
          `dimensions ${info.width}x${info.height} != required ${input.config.requiredWidth}x${input.config.requiredHeight}`,
        );
      }
      if (info.width !== input.declaredWidth || info.height !== input.declaredHeight) {
        errors.push(
          `declared dimensions ${input.declaredWidth}x${input.declaredHeight} != actual ${info.width}x${info.height}`,
        );
      }
    }
  } else if (detectedMime === "image/png" || input.config.allowedMimeTypes.includes("image/png")) {
    // non-png path: still enforce declared dims match policy when raster policy is png-only
  }

  const checksum = sha256Hex(bytes);
  if (input.declaredChecksum && input.declaredChecksum !== checksum) {
    errors.push(`checksum mismatch declared ${input.declaredChecksum} != actual ${checksum}`);
  }

  // dry-run may use fixture-marked metadata in provider layer, but bytes themselves must not contain marker in production
  if (mode === "production" && fixtureRejected) {
    // already pushed
  }

  return {
    schemaVersion: "lesson-visual-output-validation/v1",
    ok: errors.length === 0,
    errors,
    detectedMime,
    width,
    height,
    byteLength: bytes.length,
    contentChecksumSha256: checksum,
    fixtureRejected,
    stubRejected,
  };
}

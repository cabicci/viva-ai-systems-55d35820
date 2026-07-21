import { FIXTURE_BYTE_MARKER, STUB_RECEIPT_MARKER, SUPPORTED_PRODUCTION_MIME_TYPES } from "../constants";
import { detectMimeFromBytes, inspectPng, sha256Hex } from "./pngCodec";
import { validateOutputValidationSchema } from "./schemaValidator";
import type { ExecutionMode, OutputValidationRecord, ProductionConfig } from "./types";

export interface ValidateOutputInput {
  bytes: Buffer | null | undefined;
  declaredMime: string;
  declaredWidth: number;
  declaredHeight: number;
  declaredChecksum: string;
  declaredByteLength: number;
  config: ProductionConfig;
  cellId: string;
  sourceSha: string;
  approvedManifestSha256: string;
  forceProductionGates?: boolean;
}

export function validateOutputBytes(input: ValidateOutputInput): OutputValidationRecord {
  const errors: string[] = [];
  let fixtureRejected = false;
  let stubRejected = false;
  const mode: ExecutionMode = input.forceProductionGates ? "production" : input.config.executionMode;

  const base = {
    schemaVersion: "lesson-visual-output-validation/v1" as const,
    cellId: input.cellId,
    sourceSha: input.sourceSha,
    approvedManifestSha256: input.approvedManifestSha256,
  };

  if (!input.bytes || input.bytes.length === 0) {
    const rec: OutputValidationRecord = {
      ...base,
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
    return rec;
  }

  const bytes = input.bytes;
  if (bytes.length > input.config.maxOutputBytes) {
    errors.push(`byte length ${bytes.length} exceeds max ${input.config.maxOutputBytes}`);
  }
  if (input.declaredByteLength !== bytes.length) {
    errors.push(`declared byteLength ${input.declaredByteLength} != actual ${bytes.length}`);
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

  for (const mime of input.config.allowedMimeTypes) {
    if (!(SUPPORTED_PRODUCTION_MIME_TYPES as readonly string[]).includes(mime)) {
      errors.push(`configured MIME ${mime} has no implemented validator`);
    }
  }

  const detectedMime = detectMimeFromBytes(bytes);
  if (!detectedMime) {
    errors.push("unable to detect MIME from bytes");
  } else {
    if (!(SUPPORTED_PRODUCTION_MIME_TYPES as readonly string[]).includes(detectedMime)) {
      errors.push(`MIME ${detectedMime} not a supported production raster type`);
    }
    if (!input.config.allowedMimeTypes.includes(detectedMime)) {
      errors.push(`MIME ${detectedMime} not in allowed set`);
    }
    if (detectedMime !== input.declaredMime) {
      errors.push(`declared MIME ${input.declaredMime} != detected ${detectedMime}`);
    }
    if (
      detectedMime === "image/svg+xml" ||
      detectedMime === "application/json" ||
      detectedMime === "text/html"
    ) {
      errors.push(`non-raster MIME ${detectedMime} rejected as production raster output`);
    }
  }

  let width: number | null = null;
  let height: number | null = null;
  if (detectedMime === "image/png") {
    const info = inspectPng(bytes);
    if (!info) {
      errors.push("PNG inspect failed / corrupt PNG");
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
      // Trailing masquerade: after IEND, reject non-empty non-padding garbage that looks like HTML/JSON
      const iend = bytes.lastIndexOf(Buffer.from("IEND"));
      if (iend >= 0) {
        const after = bytes.subarray(iend + 8); // IEND + CRC
        const tail = after.toString("utf8").trim();
        if (tail.startsWith("<") || tail.startsWith("{") || /<\/?html/i.test(tail)) {
          errors.push("trailing error-document masquerade after PNG IEND");
        }
      }
    }
  } else if (detectedMime) {
    errors.push(`no decoder implemented for ${detectedMime}`);
  }

  const checksum = sha256Hex(bytes);
  if (input.declaredChecksum && input.declaredChecksum !== checksum) {
    errors.push(`checksum mismatch declared ${input.declaredChecksum} != actual ${checksum}`);
  }

  const rec: OutputValidationRecord = {
    ...base,
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
  const schema = validateOutputValidationSchema(rec);
  if (!schema.ok) {
    rec.ok = false;
    rec.errors = [...rec.errors, ...schema.errors];
  }
  return rec;
}

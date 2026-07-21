import { validateMappingSchema } from "./schemaValidator";
import type { ProductionCellReceipt, ProductionMapping } from "./types";

export function buildMappingFromAcceptedReceipt(
  receipt: ProductionCellReceipt,
): ProductionMapping | null {
  if (receipt.status !== "ACCEPTED") return null;
  if (
    !receipt.outputPathOrStorageKey ||
    !receipt.contentSha256 ||
    !receipt.mimeType ||
    receipt.width == null ||
    receipt.height == null ||
    !receipt.rightsProvenanceRef ||
    !receipt.validationRef
  ) {
    return null;
  }
  const mapping: ProductionMapping = {
    schemaVersion: "lesson-visual-production-mapping/v1",
    cellId: receipt.cellId,
    lessonId: receipt.lessonId,
    locale: receipt.locale,
    immutableOutputStorageId: receipt.outputPathOrStorageKey,
    contentSha256: receipt.contentSha256,
    mimeType: receipt.mimeType,
    width: receipt.width,
    height: receipt.height,
    sourceSha: receipt.sourceSha,
    approvedManifestSha256: receipt.approvedManifestSha256,
    receiptRef: `receipts/${receipt.cellId}.receipt.json`,
    rightsProvenanceRef: receipt.rightsProvenanceRef,
    validationRef: receipt.validationRef,
    acceptedValidationStatus: "ACCEPTED",
    runId: receipt.runId,
  };
  const schema = validateMappingSchema(mapping);
  if (!schema.ok) return null;
  return mapping;
}

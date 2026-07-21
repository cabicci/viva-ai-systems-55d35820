import type { RightsProvenanceRecord } from "./types";

export function validateRightsProvenance(
  rights: RightsProvenanceRecord | null | undefined,
): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!rights) {
    return { ok: false, errors: ["rights/provenance record missing"] };
  }
  if (rights.schemaVersion !== "lesson-visual-rights/v1") {
    errors.push(`bad rights schemaVersion ${rights.schemaVersion}`);
  }
  if (![1, 2, 3, 4].includes(rights.generationMethod)) {
    errors.push("generationMethod invalid");
  }
  if (!rights.providerOrSource?.trim()) errors.push("providerOrSource missing");
  if (!rights.providerModelOrRenderer?.trim()) errors.push("providerModelOrRenderer missing");
  if (!rights.generatedAt?.trim()) errors.push("generatedAt missing");
  if (!rights.providerRequestId?.trim()) errors.push("providerRequestId missing");
  if (!Array.isArray(rights.sourceReferences)) errors.push("sourceReferences missing");
  if (!rights.licenseOrUsageBasis?.trim()) errors.push("licenseOrUsageBasis missing");
  if (
    rights.humanReviewRequirement !== "required" &&
    rights.humanReviewRequirement !== "not-required"
  ) {
    errors.push("humanReviewRequirement invalid");
  }
  if (
    !["pending", "approved", "rejected", "not-applicable"].includes(rights.humanReviewStatus)
  ) {
    errors.push("humanReviewStatus invalid");
  }
  if (rights.prohibitedLegacySource !== false) {
    errors.push("prohibitedLegacySource must be false (greenfield/no-legacy)");
  }
  if (!Array.isArray(rights.transformationRecord)) errors.push("transformationRecord missing");
  if (!Array.isArray(rights.evidenceReferences)) errors.push("evidenceReferences missing");
  if (!Array.isArray(rights.evidenceChecksums)) errors.push("evidenceChecksums missing");
  if (
    rights.evidenceReferences.length > 0 &&
    rights.evidenceReferences.length !== rights.evidenceChecksums.length
  ) {
    errors.push("evidenceReferences/checksums length mismatch");
  }
  return { ok: errors.length === 0, errors };
}

export function buildGreenfieldRights(args: {
  method: 1 | 2 | 3 | 4;
  providerName: string;
  model: string;
  providerRequestId: string;
  generatedAt: string;
  screenshotSiteIdentity?: string | null;
  sourceReferences?: string[];
  evidenceChecksums?: string[];
}): RightsProvenanceRecord {
  return {
    schemaVersion: "lesson-visual-rights/v1",
    generationMethod: args.method,
    providerOrSource: args.providerName,
    providerModelOrRenderer: args.model,
    generatedAt: args.generatedAt,
    providerRequestId: args.providerRequestId,
    sourceReferences: args.sourceReferences ?? [],
    screenshotSiteIdentity: args.screenshotSiteIdentity ?? null,
    licenseOrUsageBasis: "greenfield-generated-for-masaarat-lesson-visuals",
    humanReviewRequirement: "required",
    humanReviewStatus: "pending",
    prohibitedLegacySource: false,
    transformationRecord: ["provider-generate"],
    evidenceReferences: args.sourceReferences ?? [],
    evidenceChecksums: args.evidenceChecksums ?? [],
  };
}

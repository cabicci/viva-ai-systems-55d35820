import { assertGreenfieldReferences } from "./greenfield";
import { validateRightsSchema } from "./schemaValidator";
import type { RightsProvenanceRecord } from "./types";

export function validateRightsProvenance(
  rights: RightsProvenanceRecord | null | undefined,
  expected: {
    cellId: string;
    sourceSha: string;
    approvedManifestSha256: string;
    providerRequestId: string;
    outputContentSha256: string;
  },
): { ok: boolean; errors: string[] } {
  const schema = validateRightsSchema(rights);
  if (!schema.ok || !rights) {
    return { ok: false, errors: schema.errors.length ? schema.errors : ["rights/provenance missing"] };
  }
  const errors: string[] = [...schema.errors];
  if (rights.cellId !== expected.cellId) errors.push("rights cellId mismatch");
  if (rights.sourceSha !== expected.sourceSha) errors.push("rights sourceSha mismatch");
  if (rights.approvedManifestSha256 !== expected.approvedManifestSha256) {
    errors.push("rights manifest digest mismatch");
  }
  if (rights.providerRequestId !== expected.providerRequestId) {
    errors.push("rights providerRequestId mismatch");
  }
  if (rights.outputContentSha256 !== expected.outputContentSha256) {
    errors.push("rights outputContentSha256 mismatch vs accepted bytes");
  }
  const refs = [
    ...rights.sourceReferences,
    ...rights.evidenceReferences,
    ...(rights.screenshotSiteIdentity ? [rights.screenshotSiteIdentity] : []),
  ];
  const gf = assertGreenfieldReferences(refs);
  if (!gf.ok) errors.push(...gf.errors);
  return { ok: errors.length === 0, errors };
}

export function buildGreenfieldRights(args: {
  method: 1 | 2 | 3 | 4;
  providerName: string;
  model: string;
  providerRequestId: string;
  generatedAt: string;
  cellId: string;
  sourceSha: string;
  approvedManifestSha256: string;
  outputContentSha256: string;
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
    cellId: args.cellId,
    sourceSha: args.sourceSha,
    approvedManifestSha256: args.approvedManifestSha256,
    outputContentSha256: args.outputContentSha256,
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

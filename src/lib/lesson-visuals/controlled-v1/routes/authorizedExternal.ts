import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { DOCS_CONTROLLED_V1_RIGHTS } from "../paths";
import type { CellStatus, Locale } from "../types";

export interface RightsEvidenceRecord {
  schemaVersion: "controlled-v1-rights-evidence/1";
  lessonId: string;
  locale?: Locale;
  externalSurface: string;
  rightsBasis: "licensed" | "public-docs" | "vendor-permission";
  grantedBy: string;
  grantedAt: string;
  evidenceReferences: string[];
  /** Must be explicit; a quality/methodology reference is never sufficient. */
  isProductionRightsGrant: true;
  notes?: string;
}

export interface AuthorizedExternalRouteResult {
  status: CellStatus;
  reason: string;
  rightsPath: string | null;
}

function candidateRightsPaths(lessonId: string, locale: Locale): string[] {
  return [
    resolve(DOCS_CONTROLLED_V1_RIGHTS, `${lessonId}__${locale}.rights.json`),
    resolve(DOCS_CONTROLLED_V1_RIGHTS, `${lessonId}.rights.json`),
  ];
}

function loadRightsEvidence(path: string): RightsEvidenceRecord | null {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8")) as RightsEvidenceRecord;
  } catch {
    return null;
  }
}

function isValidRightsRecord(record: RightsEvidenceRecord): boolean {
  if (record.schemaVersion !== "controlled-v1-rights-evidence/1") return false;
  if (record.isProductionRightsGrant !== true) return false;
  if (!["licensed", "public-docs", "vendor-permission"].includes(record.rightsBasis)) {
    return false;
  }
  if (!record.grantedBy || !record.grantedAt || !record.externalSurface) {
    return false;
  }
  if (!Array.isArray(record.evidenceReferences) || record.evidenceReferences.length === 0) {
    return false;
  }
  return true;
}

/**
 * Method B route: AUTHORIZED_EXTERNAL_SCREENSHOT. Fails closed to
 * BLOCKED_UNRESOLVED_SPEC whenever there is no explicit, Control-Room-approved
 * rights evidence file for this lesson/locale under docs/lesson-visuals/controlled-v1/rights/.
 *
 * A "methodology reference" or "quality reference only" sample (see
 * docs/lesson-visuals/controlled-v1/golden-references.json and rights/ledger.json)
 * is explicitly NOT sufficient — `isProductionRightsGrant` must be `true`.
 */
export function runAuthorizedExternalRoute(
  lessonId: string,
  locale: Locale,
): AuthorizedExternalRouteResult {
  for (const rightsPath of candidateRightsPaths(lessonId, locale)) {
    const record = loadRightsEvidence(rightsPath);
    if (!record) continue;
    if (!isValidRightsRecord(record)) {
      return {
        status: "BLOCKED_UNRESOLVED_SPEC",
        reason: "rights evidence file found but failed schema validation",
        rightsPath,
      };
    }
    return {
      status: "BLOCKED_UNRESOLVED_SPEC",
      reason:
        "valid production rights grant found, but live external capture execution is not implemented in this pipeline revision — human/CI capture step required",
      rightsPath,
    };
  }

  return {
    status: "BLOCKED_UNRESOLVED_SPEC",
    reason:
      "no Control-Room-approved rights evidence found under docs/lesson-visuals/controlled-v1/rights/ — see rights/ledger.json",
    rightsPath: null,
  };
}

/**
 * Deterministic materialization of Method C historical canonical-repair source.
 *
 * Extracts the exact accepted GitHub Actions source artifact zip committed under
 * docs/.../acceptance/method-c-canonical-historical-source/. Never regenerates
 * selection JSON or visuals. Fail-closed on missing evidence or SHA-256 mismatch.
 * No network access.
 */
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import {
  METHOD_C_CANONICAL_SOURCE_ARTIFACT_DIGEST,
  METHOD_C_CANONICAL_SOURCE_ARTIFACT_ID,
  METHOD_C_CANONICAL_SOURCE_ARTIFACT_NAME,
  METHOD_C_REMAINING_SELECTION_JSON_SHA256,
} from "./constants";
import { ARTIFACTS_ROOT, DOCS_CONTROLLED_V1, REPO_ROOT } from "./paths";

export const METHOD_C_HISTORICAL_SOURCE_EVIDENCE_DIR = resolve(
  DOCS_CONTROLLED_V1,
  "acceptance/method-c-canonical-historical-source",
);

export const METHOD_C_HISTORICAL_SOURCE_SELECTION_EVIDENCE_PATH = join(
  METHOD_C_HISTORICAL_SOURCE_EVIDENCE_DIR,
  "method-c-remaining-selection.json",
);

export const METHOD_C_HISTORICAL_SOURCE_ZIP_EVIDENCE_PATH = join(
  METHOD_C_HISTORICAL_SOURCE_EVIDENCE_DIR,
  `${METHOD_C_CANONICAL_SOURCE_ARTIFACT_NAME}.zip`,
);

/** Gitignored extract root under artifacts/controlled-v1. */
export const METHOD_C_HISTORICAL_SOURCE_MATERIALIZE_ROOT = resolve(
  ARTIFACTS_ROOT,
  ".method-c-historical-source",
);

const MARKER_NAME = ".materialize-ok.json";

function sha256File(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex").toUpperCase();
}

function selectionPathUnder(root: string): string {
  return join(root, "artifacts/controlled-v1/reports/method-c-remaining-selection.json");
}

function extractZip(zipPath: string, destRoot: string): void {
  mkdirSync(destRoot, { recursive: true });
  // Prefer tar (Git for Windows + Linux/macOS). Fall back to unzip.
  const tar = spawnSync("tar", ["-xf", zipPath, "-C", destRoot], {
    encoding: "utf8",
    windowsHide: true,
  });
  if (tar.status === 0) return;

  const unzip = spawnSync("unzip", ["-o", "-q", zipPath, "-d", destRoot], {
    encoding: "utf8",
    windowsHide: true,
  });
  if (unzip.status === 0) return;

  throw new Error(
    `BLOCKED_METHOD_C_HISTORICAL_SOURCE_EXTRACT: failed to extract ${zipPath} (tar status=${tar.status}, unzip status=${unzip.status})`,
  );
}

export type MaterializeMethodCHistoricalSourceResult = {
  ok: boolean;
  errors: string[];
  sourceRoot: string;
  selectionPath: string;
  selectionSha256: string;
  zipSha256: string;
};

/**
 * Materialize the historical Method C source tree for hermetic validation.
 * Idempotent when marker + selection hash already match.
 */
export function materializeMethodCHistoricalSource(): MaterializeMethodCHistoricalSourceResult {
  const errors: string[] = [];
  const sourceRoot = METHOD_C_HISTORICAL_SOURCE_MATERIALIZE_ROOT;
  const selectionEvidence = METHOD_C_HISTORICAL_SOURCE_SELECTION_EVIDENCE_PATH;
  const zipEvidence = METHOD_C_HISTORICAL_SOURCE_ZIP_EVIDENCE_PATH;

  if (!existsSync(selectionEvidence)) {
    errors.push(`accepted selection JSON evidence missing: ${selectionEvidence}`);
  }
  if (!existsSync(zipEvidence)) {
    errors.push(`accepted source artifact zip missing: ${zipEvidence}`);
  }
  if (errors.length) {
    return {
      ok: false,
      errors,
      sourceRoot,
      selectionPath: selectionPathUnder(sourceRoot),
      selectionSha256: "",
      zipSha256: "",
    };
  }

  const selectionEvidenceSha = sha256File(selectionEvidence);
  if (selectionEvidenceSha !== METHOD_C_REMAINING_SELECTION_JSON_SHA256) {
    errors.push(
      `accepted selection JSON hash mismatch: got ${selectionEvidenceSha}, expected ${METHOD_C_REMAINING_SELECTION_JSON_SHA256}`,
    );
  }

  const zipSha = sha256File(zipEvidence);
  if (zipSha !== METHOD_C_CANONICAL_SOURCE_ARTIFACT_DIGEST) {
    errors.push(
      `accepted source zip hash mismatch: got ${zipSha}, expected ${METHOD_C_CANONICAL_SOURCE_ARTIFACT_DIGEST} (artifact ${METHOD_C_CANONICAL_SOURCE_ARTIFACT_ID})`,
    );
  }

  if (errors.length) {
    return {
      ok: false,
      errors,
      sourceRoot,
      selectionPath: selectionPathUnder(sourceRoot),
      selectionSha256: selectionEvidenceSha,
      zipSha256: zipSha,
    };
  }

  const markerPath = join(sourceRoot, MARKER_NAME);
  const extractedSelection = selectionPathUnder(sourceRoot);
  if (
    existsSync(markerPath) &&
    existsSync(extractedSelection) &&
    sha256File(extractedSelection) === METHOD_C_REMAINING_SELECTION_JSON_SHA256
  ) {
    try {
      const marker = JSON.parse(readFileSync(markerPath, "utf8")) as {
        zipSha256?: string;
        selectionSha256?: string;
      };
      if (
        marker.zipSha256 === zipSha &&
        marker.selectionSha256 === METHOD_C_REMAINING_SELECTION_JSON_SHA256
      ) {
        return {
          ok: true,
          errors: [],
          sourceRoot,
          selectionPath: extractedSelection,
          selectionSha256: METHOD_C_REMAINING_SELECTION_JSON_SHA256,
          zipSha256: zipSha,
        };
      }
    } catch {
      // fall through to rematerialize
    }
  }

  rmSync(sourceRoot, { recursive: true, force: true });
  mkdirSync(sourceRoot, { recursive: true });
  extractZip(zipEvidence, sourceRoot);

  if (!existsSync(extractedSelection)) {
    errors.push(
      `extracted source missing selection JSON at ${extractedSelection}`,
    );
    return {
      ok: false,
      errors,
      sourceRoot,
      selectionPath: extractedSelection,
      selectionSha256: "",
      zipSha256: zipSha,
    };
  }

  const extractedSha = sha256File(extractedSelection);
  if (extractedSha !== METHOD_C_REMAINING_SELECTION_JSON_SHA256) {
    errors.push(
      `extracted selection JSON hash mismatch: got ${extractedSha}, expected ${METHOD_C_REMAINING_SELECTION_JSON_SHA256}`,
    );
  }
  if (extractedSha !== selectionEvidenceSha) {
    errors.push(
      `extracted selection JSON does not match committed evidence bytes (${extractedSha} vs ${selectionEvidenceSha})`,
    );
  }

  if (errors.length) {
    return {
      ok: false,
      errors,
      sourceRoot,
      selectionPath: extractedSelection,
      selectionSha256: extractedSha,
      zipSha256: zipSha,
    };
  }

  writeFileSync(
    markerPath,
    `${JSON.stringify(
      {
        schemaVersion: "controlled-v1-method-c-historical-source-materialize/1",
        repoRoot: REPO_ROOT,
        artifactId: METHOD_C_CANONICAL_SOURCE_ARTIFACT_ID,
        artifactName: METHOD_C_CANONICAL_SOURCE_ARTIFACT_NAME,
        zipSha256: zipSha,
        selectionSha256: METHOD_C_REMAINING_SELECTION_JSON_SHA256,
        selectionPath: "artifacts/controlled-v1/reports/method-c-remaining-selection.json",
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  return {
    ok: true,
    errors: [],
    sourceRoot,
    selectionPath: extractedSelection,
    selectionSha256: METHOD_C_REMAINING_SELECTION_JSON_SHA256,
    zipSha256: zipSha,
  };
}

/**
 * Resolve the materialized historical source root. Fail-closed — never falls
 * back to machine-specific absolute paths or external HISTORICAL_SOURCE trees.
 */
export function resolveMethodCHistoricalSourceRoot(): string {
  const selection = selectionPathUnder(METHOD_C_HISTORICAL_SOURCE_MATERIALIZE_ROOT);
  if (
    existsSync(selection) &&
    sha256File(selection) === METHOD_C_REMAINING_SELECTION_JSON_SHA256
  ) {
    return METHOD_C_HISTORICAL_SOURCE_MATERIALIZE_ROOT;
  }
  const result = materializeMethodCHistoricalSource();
  if (!result.ok) {
    throw new Error(
      `BLOCKED_METHOD_C_HISTORICAL_SOURCE_MISSING: ${result.errors.join("; ")}`,
    );
  }
  return result.sourceRoot;
}

import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { ARTIFACT_REL_PATHS } from "./constants";
import type { ArtifactDigests } from "./types";

export function sha256File(absPath: string): string {
  const buf = fs.readFileSync(absPath);
  return createHash("sha256").update(buf).digest("hex");
}

export function sha256Text(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

export function resolveArtifactPaths(repoRoot: string) {
  return {
    packageManifest: path.join(repoRoot, ARTIFACT_REL_PATHS.packageManifest),
    chunkManifest: path.join(repoRoot, ARTIFACT_REL_PATHS.chunkManifest),
    chunks: path.join(repoRoot, ARTIFACT_REL_PATHS.chunks),
    authoritativeLookup: path.join(repoRoot, ARTIFACT_REL_PATHS.authoritativeLookup),
  };
}

export function computeArtifactDigests(repoRoot: string): ArtifactDigests {
  const paths = resolveArtifactPaths(repoRoot);
  for (const p of Object.values(paths)) {
    if (!fs.existsSync(p)) {
      throw new Error(`Missing required artifact: ${path.relative(repoRoot, p)}`);
    }
  }
  return {
    packageManifestSha256: sha256File(paths.packageManifest),
    chunkManifestSha256: sha256File(paths.chunkManifest),
    chunksSha256: sha256File(paths.chunks),
    authoritativeLookupSha256: sha256File(paths.authoritativeLookup),
  };
}

/**
 * Deterministic staging version key — no uncontrolled timestamp sole identity.
 * Ties index version, source SHA, artifact digests, and authorized execution id.
 */
export function buildStagingVersionKey(input: {
  indexVersion: string;
  sourceSha: string;
  packageManifestSha256: string;
  chunkManifestSha256: string;
  executionId: string;
}): string {
  const material = [
    input.indexVersion,
    input.sourceSha,
    input.packageManifestSha256,
    input.chunkManifestSha256,
    input.executionId,
  ].join("|");
  const digest = sha256Text(material).slice(0, 16);
  return `${input.indexVersion}-${input.sourceSha.slice(0, 8)}-${digest}`;
}

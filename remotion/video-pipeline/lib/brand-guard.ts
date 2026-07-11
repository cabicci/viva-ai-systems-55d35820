import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileChecksum } from "./checksum.ts";
import { REPO_ROOT } from "./paths.ts";

export interface OfficialBrandManifest {
  sourcePath: string;
  sourceCommit: string;
  gitBlobSha: string;
  pipelineAssetPath: string;
  pipelineRenderPath: string;
  sha256: string;
  width: number;
  height: number;
  minBytes: number;
  visualIdentity: {
    arabicWordmark: string;
    englishUrl: string;
    iconPlacement: string;
  };
}

export interface BrandValidationResult {
  ok: boolean;
  errors: string[];
  path?: string;
  sha256?: string;
  width?: number;
  height?: number;
  bytes?: number;
  sourceCommit?: string;
  sourcePath?: string;
}

const MANIFEST_PATH = path.join(REPO_ROOT, "remotion/video-pipeline/config/official-brand.json");

export function loadOfficialBrandManifest(): OfficialBrandManifest {
  return JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) as OfficialBrandManifest;
}

function pngDimensions(buf: Buffer): { width: number; height: number } | null {
  if (buf.length < 24 || buf.readUInt32BE(0) !== 0x89504e47) return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

export function validateBrandAsset(absPath: string, manifest = loadOfficialBrandManifest()): BrandValidationResult {
  const errors: string[] = [];
  if (!existsSync(absPath)) {
    return {
      ok: false,
      errors: [`Official logo missing at ${absPath}`],
      sourceCommit: manifest.sourceCommit,
      sourcePath: manifest.sourcePath,
    };
  }

  const st = statSync(absPath);
  const buf = readFileSync(absPath);
  const sha256 = fileChecksum(absPath);
  const dims = pngDimensions(buf);

  if (st.size < manifest.minBytes) {
    errors.push(`Logo file too small (${st.size} bytes) — placeholder or corrupt asset rejected`);
  }
  if (!dims) {
    errors.push("Not a valid PNG");
  } else {
    if (dims.width <= 2 || dims.height <= 2) {
      errors.push(`Placeholder dimensions rejected (${dims.width}x${dims.height})`);
    }
    if (dims.width !== manifest.width || dims.height !== manifest.height) {
      errors.push(`Logo dimensions mismatch: ${dims.width}x${dims.height} != ${manifest.width}x${manifest.height}`);
    }
  }
  if (sha256 !== manifest.sha256) {
    errors.push("Logo SHA-256 does not match verified baseline asset");
  }

  return {
    ok: errors.length === 0,
    errors,
    path: absPath,
    sha256,
    width: dims?.width,
    height: dims?.height,
    bytes: st.size,
    sourceCommit: manifest.sourceCommit,
    sourcePath: manifest.sourcePath,
  };
}

/** Sync verified baseline logo into Remotion publicDir and validate before render. */
export function ensureRenderBrandAsset(manifest = loadOfficialBrandManifest()): BrandValidationResult {
  const assetAbs = path.join(REPO_ROOT, manifest.pipelineAssetPath);
  const renderAbs = path.join(REPO_ROOT, manifest.pipelineRenderPath);
  mkdirSync(path.dirname(renderAbs), { recursive: true });

  const assetCheck = validateBrandAsset(assetAbs, manifest);
  if (!assetCheck.ok) {
    return {
      ...assetCheck,
      errors: [`Pipeline asset invalid: ${assetCheck.errors.join("; ")}`],
    };
  }

  const renderCheck = validateBrandAsset(renderAbs, manifest);
  if (!renderCheck.ok) {
    copyFileSync(assetAbs, renderAbs);
  }

  return validateBrandAsset(renderAbs, manifest);
}

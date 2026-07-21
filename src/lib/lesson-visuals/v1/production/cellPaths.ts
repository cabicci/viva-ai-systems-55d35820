/**
 * Safe cell artifact path resolution under an authorized artifacts root.
 * Rejects traversal / unsafe cell identifiers before any filesystem write.
 */
import { mkdirSync } from "node:fs";
import { join, resolve, sep } from "node:path";

/** Authoritative cellId shape: lessonId__locale (no path separators). */
const CELL_ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)+__(?:ar-EG|ar-MSA|ar-Gulf|en)$/;

export function assertSafeCellId(cellId: string): string {
  const id = (cellId ?? "").trim();
  if (!id) throw new Error("cellId missing");
  if (id.includes("..") || id.includes("/") || id.includes("\\") || id.includes("\0")) {
    throw new Error(`unsafe cellId path characters: ${id}`);
  }
  if (!CELL_ID_RE.test(id)) {
    throw new Error(`cellId failed safety/shape validation: ${id}`);
  }
  return id;
}

export function resolveUnderArtifactsRoot(artifactsRoot: string, ...segments: string[]): string {
  const root = resolve(artifactsRoot);
  const target = resolve(root, ...segments);
  const rootWithSep = root.endsWith(sep) ? root : root + sep;
  if (target !== root && !target.startsWith(rootWithSep)) {
    throw new Error(`path escapes artifacts root: ${target}`);
  }
  return target;
}

export function ensureCellArtifactDir(artifactsRoot: string, cellId: string): string {
  const safe = assertSafeCellId(cellId);
  const dir = resolveUnderArtifactsRoot(artifactsRoot, "cells", safe);
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function cellReceiptPath(artifactsRoot: string, cellId: string): string {
  const safe = assertSafeCellId(cellId);
  return resolveUnderArtifactsRoot(artifactsRoot, "receipts", `${safe}.receipt.json`);
}

export function cellAttemptMetaPath(artifactsRoot: string, cellId: string): string {
  const safe = assertSafeCellId(cellId);
  return resolveUnderArtifactsRoot(artifactsRoot, "cells", safe, "attempt-meta.json");
}

export function cellPriorEvidencePath(artifactsRoot: string, cellId: string): string {
  const safe = assertSafeCellId(cellId);
  return resolveUnderArtifactsRoot(artifactsRoot, "cells", safe, "prior-evidence.json");
}

export function joinRel(artifactsRoot: string, rel: string): string {
  const parts = rel.split(/[/\\]+/).filter(Boolean);
  return resolveUnderArtifactsRoot(artifactsRoot, ...parts);
}

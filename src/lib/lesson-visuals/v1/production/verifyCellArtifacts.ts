/**
 * Fail-closed required artifact presence check (importable).
 */
import { existsSync, statSync } from "node:fs";
import { resolve as resolvePath } from "node:path";
import { assertSafeCellId, resolveUnderArtifactsRoot } from "./cellPaths";

export function verifyCellArtifacts(input: {
  artifactsRoot: string;
  cellId: string;
  status: string;
}): { ok: boolean; required: string[]; missing: string[]; unexpected: string[] } {
  const cellId = assertSafeCellId(input.cellId);
  const root = resolvePath(input.artifactsRoot);
  const required: string[] = [
    `receipts/${cellId}.receipt.json`,
    `cells/${cellId}/attempt-meta.json`,
  ];

  if (input.status === "ACCEPTED") {
    required.push(
      `cells/${cellId}/output.png`,
      `mappings/${cellId}.mapping.json`,
      `rights/${cellId}.rights.json`,
      `validations/${cellId}.validation.json`,
    );
  } else if (input.status === "SKIPPED") {
    required.push(`cells/${cellId}/prior-evidence.json`);
  } else {
    required.push(`cells/${cellId}/failure.json`);
  }

  const missing: string[] = [];
  for (const rel of required) {
    const abs = resolveUnderArtifactsRoot(root, ...rel.split("/"));
    if (!existsSync(abs) || !statSync(abs).isFile() || statSync(abs).size <= 0) {
      missing.push(rel);
    }
  }

  const unexpected: string[] = [];
  if (input.status === "SKIPPED") {
    for (const rel of [
      `cells/${cellId}/output.png`,
      `mappings/${cellId}.mapping.json`,
      `rights/${cellId}.rights.json`,
      `validations/${cellId}.validation.json`,
    ]) {
      const abs = resolveUnderArtifactsRoot(root, ...rel.split("/"));
      if (existsSync(abs)) unexpected.push(rel);
    }
  }

  return { ok: missing.length === 0 && unexpected.length === 0, required, missing, unexpected };
}

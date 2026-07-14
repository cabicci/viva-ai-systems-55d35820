#!/usr/bin/env bun
/** Import portable batch into mock/disposable store only. */
import path from "node:path";
import { ProductionCompatibleImporter } from "../../src/lib/rag/portable-importer";

const artifactDir = process.argv[2];
if (!artifactDir) {
  console.error("Usage: bun run scripts/rag/import-portable-batch.ts <artifact-dir> [--dry-run]");
  process.exit(1);
}

const dryRun = process.argv.includes("--dry-run");
const importer = new ProductionCompatibleImporter();
const report = importer.importPortableArtifact(path.resolve(artifactDir), { dryRun });

console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);

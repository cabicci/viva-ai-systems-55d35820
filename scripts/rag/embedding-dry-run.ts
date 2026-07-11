#!/usr/bin/env bun
import path from "node:path";
import { generateAllChunks } from "../../src/lib/rag/manifests";
import { buildEmbeddingDryRunReport } from "../../src/lib/rag/embedding-dry-run";
import { discoverApprovedPackages } from "../../src/lib/rag/corpus-discovery";

const REPO_ROOT = path.resolve(import.meta.dirname, "../..");
const packages = discoverApprovedPackages(REPO_ROOT);
const chunks = generateAllChunks(REPO_ROOT, packages);
const report = buildEmbeddingDryRunReport(chunks);

console.log(JSON.stringify(report, null, 2));

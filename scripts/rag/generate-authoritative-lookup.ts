#!/usr/bin/env bun
/**
 * Generate authoritative corpus lookup JSON from committed manifests.
 * Writes:
 *   artifacts/rag/authoritative-lookup.json
 *   supabase/functions/assistant-runtime/authoritative-corpus-lookup.json
 */
import fs from "node:fs";
import path from "node:path";
import {
  loadAuthoritativeLookupFromRepo,
  serializeAuthoritativeLookup,
} from "../../src/lib/rag/authoritative-manifest-lookup";
import { RAG_ARTIFACTS_DIR } from "../../src/lib/rag/constants";

const REPO_ROOT = path.resolve(import.meta.dirname, "../..");

const lookup = loadAuthoritativeLookupFromRepo(REPO_ROOT);
const json = serializeAuthoritativeLookup(lookup);

const artifactsPath = path.join(REPO_ROOT, RAG_ARTIFACTS_DIR, "authoritative-lookup.json");
const edgePath = path.join(
  REPO_ROOT,
  "supabase/functions/assistant-runtime/authoritative-corpus-lookup.json",
);

fs.mkdirSync(path.dirname(artifactsPath), { recursive: true });
fs.mkdirSync(path.dirname(edgePath), { recursive: true });
const body = `${JSON.stringify(json, null, 2)}\n`;
fs.writeFileSync(artifactsPath, body);
fs.writeFileSync(edgePath, body);

console.log(
  JSON.stringify(
    {
      ok: true,
      recordCount: lookup.recordCount,
      sourceSha: lookup.sourceSha,
      indexVersion: lookup.indexVersion,
      artifactsPath: path.relative(REPO_ROOT, artifactsPath).replace(/\\/g, "/"),
      edgePath: path.relative(REPO_ROOT, edgePath).replace(/\\/g, "/"),
    },
    null,
    2,
  ),
);

#!/usr/bin/env bun
/**
 * Generate authoritative corpus lookup JSON from committed manifests.
 * Writes:
 *   artifacts/rag/authoritative-lookup.json
 *   supabase/functions/assistant-runtime/authoritative-corpus-lookup.json
 *   supabase/functions/assistant-runtime/card-membership.json
 */
import fs from "node:fs";
import path from "node:path";
import {
  loadAuthoritativeLookupFromRepo,
  serializeAuthoritativeLookup,
} from "../../src/lib/rag/authoritative-manifest-lookup";
import { RAG_ARTIFACTS_DIR } from "../../src/lib/rag/constants";
import { loadCardMembershipFromRepo } from "../../src/lib/rag/card-membership";

const REPO_ROOT = path.resolve(import.meta.dirname, "../..");

const lookup = loadAuthoritativeLookupFromRepo(REPO_ROOT);
const json = serializeAuthoritativeLookup(lookup);
// Validate both derived registries before writing either. Future approved
// cards inherit the same scope policy without a second registration command.
const membership = loadCardMembershipFromRepo(REPO_ROOT);

const artifactsPath = path.join(REPO_ROOT, RAG_ARTIFACTS_DIR, "authoritative-lookup.json");
const edgePath = path.join(
  REPO_ROOT,
  "supabase/functions/assistant-runtime/authoritative-corpus-lookup.json",
);
const membershipPath = path.join(REPO_ROOT, "supabase/functions/assistant-runtime/card-membership.json");

fs.mkdirSync(path.dirname(artifactsPath), { recursive: true });
fs.mkdirSync(path.dirname(edgePath), { recursive: true });
const body = `${JSON.stringify(json, null, 2)}\n`;
fs.writeFileSync(artifactsPath, body);
fs.writeFileSync(edgePath, body);
fs.writeFileSync(membershipPath, `${JSON.stringify(membership, null, 2)}\n`);

console.log(
  JSON.stringify(
    {
      ok: true,
      recordCount: lookup.recordCount,
      sourceSha: lookup.sourceSha,
      indexVersion: lookup.indexVersion,
      artifactsPath: path.relative(REPO_ROOT, artifactsPath).replace(/\\/g, "/"),
      edgePath: path.relative(REPO_ROOT, edgePath).replace(/\\/g, "/"),
      membershipPath: path.relative(REPO_ROOT, membershipPath).replace(/\\/g, "/"),
    },
    null,
    2,
  ),
);

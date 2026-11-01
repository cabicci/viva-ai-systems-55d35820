import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Preserve the existing queue identity: only indexing-algorithm changes invalidate its receipts.
export const INDEXER_ALGORITHM_INPUTS = Object.freeze([
  "src/lib/assistant-automation/manifest.ts", "src/lib/assistant-automation/worker.server.ts",
  "src/lib/card-assistant/corpus.ts", "src/lib/card-assistant/assistant.server.ts",
  "src/lib/academic-education/assistant-corpus.ts", "src/lib/academic-education/assistant.server.ts",
  "src/lib/rag/current-release/executor.server.ts", "src/lib/rag/current-release/corpus.ts",
]);

// This separate identity proves which compiled content and protected endpoint are published.
// Never include credentials, environment files, generated route output, timestamps, or machine paths.
export const ASSISTANT_DEPLOYMENT_INPUTS = Object.freeze([
  "scripts/assistant/indexer-build.mjs",
  "vite.config.ts",
  "src/routes/api/public/assistant-indexing.ts",
  "src/lib/assistant-automation/public-endpoint.server.ts",
  "src/lib/assistant-automation/endpoint.server.ts",
  "src/lib/assistant-automation/github-identity.server.ts",
  "src/lib/assistant-automation/public-indexer-target.ts",
  "src/lib/assistant-automation/driver.ts",
  "src/lib/assistant-automation/store.server.ts",
  "src/lib/card-assistant/registry.ts",
  "src/lib/kids/catalogue.ts",
  "src/lib/technical-education/catalog.json",
  "src/lib/course-system/contract.ts",
  "src/lib/rag/current-release/dependencies.server.ts",
  "src/lib/rag/current-release/contracts.ts",
  "src/lib/rag/current-release/corpus.server.ts",
  "src/lib/rag/lovable-native/embedding-reuse.server.ts",
  "src/lib/rag/lovable-native/embedding-provider.server.ts",
  "src/integrations/supabase/client.server.ts",
  "artifacts/rag/current/approval-snapshot.json",
  "artifacts/rag/current/chunks.json",
]);

function addFiles(hash, root, files) {
  for (const file of files) {
    const source = readFileSync(resolve(root, file), "utf8").replace(/\r\n/g, "\n");
    hash.update(file).update("\0").update(source).update("\0");
  }
  return hash;
}

/**
 * Shared by Vite and the trusted-main workflow. Reading a missing input throws,
 * so neither side can accidentally accept a partial source snapshot.
 * @param {string} [root]
 * @returns {{indexerBuild: string, deploymentFingerprint: string}}
 */
export function computeAssistantBuildIdentities(root = process.cwd()) {
  const indexerBuild = addFiles(createHash("sha256"), root, INDEXER_ALGORITHM_INPUTS).digest("hex");
  const deployment = createHash("sha256").update("masaarat-assistant-deployment-v1\0").update(indexerBuild).update("\0");
  const deploymentFingerprint = addFiles(deployment, root, ASSISTANT_DEPLOYMENT_INPUTS).digest("hex");
  return { indexerBuild, deploymentFingerprint };
}


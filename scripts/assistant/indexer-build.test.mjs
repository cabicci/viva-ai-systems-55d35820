import assert from "node:assert/strict";
import { test } from "node:test";
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { computeAssistantBuildIdentities, INDEXER_ALGORITHM_INPUTS, ASSISTANT_DEPLOYMENT_INPUTS } from "./indexer-build.mjs";
const inputs = [...new Set([...INDEXER_ALGORITHM_INPUTS, ...ASSISTANT_DEPLOYMENT_INPUTS])];
function fixture(omit) {
  const root = mkdtempSync(join(tmpdir(), "masaarat-build-identity-"));
  for (const file of inputs) {
    if (file === omit) continue;
    const target = join(root, file);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, "fixture:" + file + "\nsecond line\n");
  }
  return root;
}
function change(root, file) { const target = join(root, file); writeFileSync(target, readFileSync(target, "utf8") + "approved change\n"); }

test("queue fingerprint remains byte-compatible with the existing Vite algorithm", () => {
  const root = fixture(), legacy = createHash("sha256");
  for (const file of INDEXER_ALGORITHM_INPUTS)
    legacy.update(file).update("\0").update(readFileSync(join(root, file), "utf8").replace(/\r\n/g, "\n")).update("\0");
  const ids = computeAssistantBuildIdentities(root);
  assert.equal(ids.indexerBuild, legacy.digest("hex"));
  assert.match(ids.indexerBuild, /^[a-f0-9]{64}$/);
  assert.match(ids.deploymentFingerprint, /^[a-f0-9]{64}$/);
});

test("Windows and hosted LF source snapshots have identical identities", () => {
  const root = fixture(), before = computeAssistantBuildIdentities(root);
  for (const file of inputs) { const target = join(root, file); writeFileSync(target, readFileSync(target, "utf8").replace(/\n/g, "\r\n")); }
  assert.deepEqual(computeAssistantBuildIdentities(root), before);
});

for (const [label, file] of [
  ["new registered curriculum", "src/lib/card-assistant/registry.ts"],
  ["new compiled AI content", "artifacts/rag/current/chunks.json"],
  ["changed protected endpoint", "src/lib/assistant-automation/public-endpoint.server.ts"],
]) test(label + " changes deployment readiness without invalidating algorithm receipts", () => {
  const root = fixture(), before = computeAssistantBuildIdentities(root);
  change(root, file);
  const after = computeAssistantBuildIdentities(root);
  assert.equal(after.indexerBuild, before.indexerBuild);
  assert.notEqual(after.deploymentFingerprint, before.deploymentFingerprint);
});

test("indexing algorithm changes invalidate both identities", () => {
  const root = fixture(), before = computeAssistantBuildIdentities(root);
  change(root, "src/lib/assistant-automation/worker.server.ts");
  const after = computeAssistantBuildIdentities(root);
  assert.notEqual(after.indexerBuild, before.indexerBuild);
  assert.notEqual(after.deploymentFingerprint, before.deploymentFingerprint);
});

test("missing compiled input refuses readiness instead of hashing a partial build", () => {
  const root = fixture("artifacts/rag/current/approval-snapshot.json");
  assert.throws(() => computeAssistantBuildIdentities(root), { code: "ENOENT" });
});

test("unrelated UI changes leave both assistant identities unchanged", () => {
  const root = fixture(), before = computeAssistantBuildIdentities(root);
  const target = join(root, "src/unrelated-display-only.ts");
  writeFileSync(target, "const display = 'new color';\n");
  assert.deepEqual(computeAssistantBuildIdentities(root), before);
});


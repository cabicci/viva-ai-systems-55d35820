/**
 * Build an isolated disposable Supabase project tree for local/CI validation.
 * Authorization: CR-BILLING-RAG-PR15-BOUNDED-CORRECTION-20260801-04
 *
 * Never writes adapted bytes into the repository supabase/migrations/ tree.
 * Product migration bytes remain immutable. Only the disposable copy substitutes
 * the local-owner-incompatible realtime operation and exact original-only
 * assistant operational patches, whose catalog/data prerequisites are tested separately.
 */
import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const EXPECTED_HIST_BLOB = "d185dd59549f611fcb984bcb3459c9d5d6969ef5";
export const HIST_MIGRATION_NAME = "20260526105117_25fc4182-0343-4234-a231-0cf38569014a.sql";
export const REALTIME_OWNER_OP = "ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY";

// These five reviewed patches target the existing original assistant catalog/data.
// Their strict production pins cannot describe a fresh deletion/privacy fixture.
export const ORIGINAL_ASSISTANT_OPERATIONAL_PATCHES: Readonly<Record<string, string>> = Object.freeze({
  "20261101213301_original_assistant_source_events.sql": "ba9948ec2efabd3c420d252c8a0f132d00c947f34531891edb4277802d6d9bd2",
  "20261101214105_original_assistant_publication_epoch_and_preparation.sql": "50250030ede50ad691bcbccc12d95af0f6a08c54d1bfa8edce3a45619bbc6c8b",
  "20261101234350_original_ai_bounded_validation.sql": "cc70945bbf9dea9783aa073fc3ba99006b4357279af51ae03c1ea175a40572c8",
  "20261102003309_original_ai_compact_activation.sql": "70fcfb2ba60d7a38199dab3f7113d93ed7442ce3c30e4c284eeab97c1b74dc5a",
  "20261102003321_original_ai_verified_retirement.sql": "76255d8555be080cf7e0c1c8bd390fdfc5d1ce8941128d72dc83afd6ab492477",
});

function disposableOriginalAssistantNotice(name: string, sha256: string): string {
  return `-- DISPOSABLE DELETION/PRIVACY VALIDATION ONLY; not the original assistant catalog.
-- Exact reviewed source: ${name}; SHA-256: ${sha256}
-- This target-bound operational patch is tested separately against its pinned assistant prerequisites.
-- Production bytes/guards and every deletion/privacy migration/assertion remain unchanged.
DO $original_assistant_fixture$ BEGIN
 RAISE NOTICE 'disposable-only: original assistant operational patch requires its independently reviewed target';
END $original_assistant_fixture$;
`;
}

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

/** Git blob SHA-1 for raw file bytes (matches `git hash-object`). */
export function gitBlobSha1(content: Buffer): string {
  const header = Buffer.from(`blob ${content.length}\0`, "utf8");
  return createHash("sha1").update(header).update(content).digest("hex");
}

export function verifyHistoricalRealtimeMigration(sourcePath: string): Buffer {
  if (!existsSync(sourcePath)) {
    throw new Error(`missing historical migration: ${sourcePath}`);
  }
  const bytes = readFileSync(sourcePath);
  const blob = gitBlobSha1(bytes);
  if (blob !== EXPECTED_HIST_BLOB) {
    throw new Error(
      `historical migration blob mismatch: got ${blob}, expected ${EXPECTED_HIST_BLOB}`,
    );
  }
  const text = bytes.toString("utf8");
  if (!text.includes(REALTIME_OWNER_OP)) {
    throw new Error(`expected realtime.messages owner operation not found: ${REALTIME_OWNER_OP}`);
  }
  if (!/realtime\.messages/i.test(text)) {
    throw new Error("expected realtime.messages references missing from historical migration");
  }
  return bytes;
}

/** Disposable-only substitute: omit local-owner-incompatible realtime.messages DDL. */
export function disposableOmitRealtimeMessagesSql(verifiedBlob: string): string {
  return `-- DISPOSABLE VALIDATION ONLY — not a Product migration.
-- Verified source blob: ${verifiedBlob}
-- Omitted local-owner-incompatible operation:
--   ${REALTIME_OWNER_OP}
-- (and dependent uad_* policies on realtime.messages)
-- Reason: local Supabase migrator is not owner of realtime.messages (SQLSTATE 42501).
DO $billing_disposable_omit$
BEGIN
  RAISE NOTICE 'billing-disposable: omitted realtime.messages UAD RLS (local non-owner)';
END;
$billing_disposable_omit$;
`;
}

export function prepareDisposableSupabaseTree(opts: { repoRoot?: string; destRoot: string }): {
  destRoot: string;
  migrationsCopied: number;
  adaptedHistorical: boolean;
  sourceBlob: string;
  adaptedOriginalAssistantPatches: { name: string; sha256: string }[];
} {
  const repoRoot = opts.repoRoot ?? REPO_ROOT;
  const destRoot = path.resolve(opts.destRoot);
  const srcMig = path.join(repoRoot, "supabase/migrations");
  const destMig = path.join(destRoot, "supabase/migrations");
  const srcConfig = path.join(repoRoot, "supabase/config.toml");

  if (!existsSync(srcConfig)) {
    throw new Error(`missing supabase/config.toml at ${srcConfig}`);
  }
  if (!existsSync(srcMig)) {
    throw new Error(`missing supabase/migrations at ${srcMig}`);
  }

  // Refuse changed original patch bytes before clearing or writing the disposable destination.
  const adaptedOriginalAssistantPatches: { name: string; sha256: string }[] = [];
  for (const [name, expected] of Object.entries(ORIGINAL_ASSISTANT_OPERATIONAL_PATCHES)) {
    const source = path.join(srcMig, name);
    if (!existsSync(source)) continue;
    const observed = createHash("sha256").update(readFileSync(source)).digest("hex");
    if (observed !== expected) throw new Error(`original assistant operational patch changed: ${name}`);
    adaptedOriginalAssistantPatches.push({ name, sha256: observed });
  }

  rmSync(destRoot, { recursive: true, force: true });
  mkdirSync(destMig, { recursive: true });
  copyFileSync(srcConfig, path.join(destRoot, "supabase/config.toml"));
  writeFileSync(path.join(destRoot, "supabase/seed.sql"), "");

  let migrationsCopied = 0;
  let adaptedHistorical = false;
  let sourceBlob = "";

  for (const name of readdirSync(srcMig).sort()) {
    if (!name.endsWith(".sql")) continue;
    const srcPath = path.join(srcMig, name);
    const destPath = path.join(destMig, name);

    const originalPatch = adaptedOriginalAssistantPatches.find(patch => patch.name === name);
    if (originalPatch) {
      writeFileSync(destPath, disposableOriginalAssistantNotice(name, originalPatch.sha256), "utf8");
      migrationsCopied += 1;
      continue;
    }

    if (name === HIST_MIGRATION_NAME) {
      const bytes = verifyHistoricalRealtimeMigration(srcPath);
      sourceBlob = gitBlobSha1(bytes);
      writeFileSync(destPath, disposableOmitRealtimeMessagesSql(sourceBlob), "utf8");
      adaptedHistorical = true;
      migrationsCopied += 1;
      continue;
    }

    // Preserve every unrelated migration byte exactly.
    copyFileSync(srcPath, destPath);
    migrationsCopied += 1;
  }

  if (!adaptedHistorical) {
    throw new Error(`historical migration ${HIST_MIGRATION_NAME} was not found/adapted`);
  }

  return { destRoot, migrationsCopied, adaptedHistorical, sourceBlob, adaptedOriginalAssistantPatches };
}

function parseArgs(argv: string[]): { dest: string } {
  let dest = "";
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--dest") {
      dest = argv[i + 1] ?? "";
      i += 1;
    }
  }
  if (!dest) {
    throw new Error("usage: bun scripts/billing/prepare-disposable-supabase-tree.ts --dest <path>");
  }
  return { dest };
}

if ((import.meta as ImportMeta & { main?: boolean }).main) {
  const { dest } = parseArgs(process.argv.slice(2));
  const result = prepareDisposableSupabaseTree({ destRoot: dest });
  console.log(JSON.stringify(result, null, 2));
}

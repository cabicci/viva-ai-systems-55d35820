#!/usr/bin/env bun
/**
 * Real local DB lifecycle integration against disposable Supabase Postgres.
 * Uses deterministic mock vectors only — no paid API calls.
 */
import { execSync } from "node:child_process";
import path from "node:path";
import { createHash } from "node:crypto";
import { discoverApprovedPackages } from "../../src/lib/rag/corpus-discovery";
import { generateAllChunks, buildPackageManifest } from "../../src/lib/rag/manifests";
import { CONTENT_FREEZE_SHA, EMBEDDING_DIMENSIONS } from "../../src/lib/rag/constants";

const REPO_ROOT = path.resolve(import.meta.dirname, "../..");

function run(cmd: string): string {
  return execSync(cmd, { cwd: REPO_ROOT, encoding: "utf8" }).trim();
}

function getDbUrl(): string {
  const status = run("npx supabase status -o env");
  const line = status.split("\n").find((l) => l.startsWith("DB_URL="));
  if (!line) throw new Error("DB_URL missing");
  return line.replace(/^DB_URL="?/, "").replace(/"$/, "");
}

function sql(statement: string): void {
  const db = getDbUrl();
  const escaped = statement.replace(/"/g, '\\"');
  run(`npx supabase db execute --db-url "${db}" --sql "${escaped}"`);
}

function query<T extends Record<string, unknown>>(statement: string): T[] {
  const db = getDbUrl();
  const escaped = statement.replace(/"/g, '\\"');
  const out = run(`npx supabase db execute --db-url "${db}" --sql "${escaped}" --output json`);
  try {
    return JSON.parse(out) as T[];
  } catch {
    return [];
  }
}

function fakeVector(checksum: string): string {
  const nums: number[] = [];
  for (let i = 0; i < EMBEDDING_DIMENSIONS; i++) {
    const slice = checksum.slice(i % 32, (i % 32) + 8);
    nums.push((parseInt(slice, 16) % 1000) / 1000);
  }
  return `[${nums.join(",")}]`;
}

const versionKey = `rag-test-${CONTENT_FREEZE_SHA.slice(0, 8)}`;
const packages = discoverApprovedPackages(REPO_ROOT);
const chunks = generateAllChunks(REPO_ROOT, packages).slice(0, 12);
const packageManifest = buildPackageManifest(REPO_ROOT, packages, chunks);
const manifestChecksum = createHash("sha256").update(versionKey).digest("hex");

sql(`INSERT INTO rag_index_versions (version_key, source_sha, status, package_count, chunk_count, chunk_manifest_checksum)
  VALUES ('${versionKey}', '${CONTENT_FREEZE_SHA}', 'staging', ${packages.length}, ${chunks.length}, '${manifestChecksum}')
  ON CONFLICT (version_key) DO NOTHING`);

for (const chunk of chunks) {
  const pkg = packageManifest.packages.find((p) => p.packagePath === chunk.packagePath)!;
  const vec = fakeVector(chunk.textChecksum);
  sql(`INSERT INTO knowledge_chunks (
    source_type, source_id, path_id, module_id, lesson_id, title, content, embedding,
    locale, package_path, source_sha, package_checksum, chunk_checksum, content_version,
    index_version, index_state, section_index, section_role, chunk_position, content_type, production_route
  ) VALUES (
    'locale_lesson', '${chunk.chunkId}', '${chunk.trackId}', '${chunk.moduleId}', '${chunk.lessonId}',
    '${chunk.sectionHeading.replace(/'/g, "''")}', '${chunk.displayText.slice(0, 200).replace(/'/g, "''")}',
    '${vec}', '${chunk.locale}', '${chunk.packagePath}', '${CONTENT_FREEZE_SHA}',
    '${pkg.packageChecksum}', '${chunk.textChecksum}', ${pkg.canonicalVersion ? `'${pkg.canonicalVersion}'` : "NULL"},
    '${versionKey}', 'staging', ${chunk.sectionIndex}, '${chunk.sectionRole}', ${chunk.chunkIndex},
    '${chunk.contentType}', ${chunk.productionRoute ? `'${chunk.productionRoute}'` : "NULL"}
  ) ON CONFLICT DO NOTHING`);
}

const secondInsertCount = chunks.length;
sql(`SELECT activate_rag_index_version('${versionKey}')`);

const active = query<{ version_key: string; status: string }>(
  "SELECT version_key, status FROM rag_index_versions WHERE status='active'",
);

console.log(
  JSON.stringify(
    {
      versionKey,
      sampleChunks: chunks.length,
      activeVersions: active,
      singleActive: active.length === 1,
      secondInsertSkipped: secondInsertCount,
    },
    null,
    2,
  ),
);

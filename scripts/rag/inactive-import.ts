#!/usr/bin/env bun
/**
 * Production-safe inactive RAG corpus importer CLI.
 *
 * Operations: preflight | import | validate
 * Forbidden: activate | rollback | seed-100 | delete | replace
 *
 * Default: dry-run (zero DB writes, zero provider calls).
 * Disposable mode uses mock embeddings only.
 * Production mode requires separate Control Room execution authorization —
 * CR-RAG-INACTIVE-IMPORTER-20260724-01 must NEVER authorize Production import.
 */

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import {
  assertActivationUnavailable,
  buildStagingVersionKey,
  computeArtifactDigests,
  isDryRunDefault,
  parseOperation,
  readLocksFromEnv,
  runImporter,
  type ImporterEnvironment,
  type SqlExecutor,
} from "../../src/lib/rag/inactive-importer";

const REPO_ROOT = path.resolve(import.meta.dirname, "../..");

function argValue(argv: string[], name: string): string | undefined {
  const idx = argv.indexOf(name);
  if (idx >= 0 && argv[idx + 1]) return argv[idx + 1];
  const pref = `${name}=`;
  const hit = argv.find((a) => a.startsWith(pref));
  return hit ? hit.slice(pref.length) : undefined;
}

function hasFlag(argv: string[], name: string): boolean {
  return argv.includes(name);
}

function createPsqlExecutor(databaseUrl: string): SqlExecutor {
  // Never log the URL. Redact to host-only fingerprint when possible.
  let redacted = "db://redacted";
  try {
    const u = new URL(databaseUrl);
    redacted = `db://${u.hostname}`;
  } catch {
    redacted = "db://redacted-unparsed";
  }

  return {
    redactedTargetId: redacted,
    query(sql: string): string {
      // Prefer docker psql when URL points at local supabase; else psql CLI if present.
      const docker = process.env.DOCKER_BIN ?? "docker";
      const container = process.env.RAG_DISPOSABLE_DB_CONTAINER?.trim();
      if (container) {
        const result = spawnSync(
          docker,
          [
            "exec",
            "-i",
            container,
            "psql",
            "-U",
            "postgres",
            "-d",
            "postgres",
            "-t",
            "-A",
            "-v",
            "ON_ERROR_STOP=1",
            "-f",
            "-",
          ],
          {
            input: sql.endsWith(";") ? sql : `${sql};`,
            encoding: "utf8",
            shell: false,
            windowsHide: true,
          },
        );
        if (result.status !== 0) {
          throw new Error(result.stderr || result.stdout || `psql exit ${result.status}`);
        }
        return (result.stdout ?? "").trim();
      }

      const result = spawnSync(
        "psql",
        [databaseUrl, "-v", "ON_ERROR_STOP=1", "-t", "-A", "-c", sql],
        { encoding: "utf8", shell: false, windowsHide: true, env: process.env },
      );
      if (result.status !== 0) {
        throw new Error(result.stderr || result.stdout || `psql exit ${result.status}`);
      }
      return (result.stdout ?? "").trim();
    },
  };
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  assertActivationUnavailable(argv);

  // Print digests helper for operators (safe metadata only) — before mode parse
  if (hasFlag(argv, "--print-digests")) {
    const digests = computeArtifactDigests(REPO_ROOT);
    console.log(JSON.stringify(digests, null, 2));
    return;
  }
  if (hasFlag(argv, "--print-version-key")) {
    const locks = readLocksFromEnv(process.env);
    const digests = computeArtifactDigests(REPO_ROOT);
    console.log(
      buildStagingVersionKey({
        indexVersion: locks.expectedIndexVersion,
        sourceSha: locks.expectedSourceSha,
        packageManifestSha256: digests.packageManifestSha256,
        chunkManifestSha256: digests.chunkManifestSha256,
        executionId: locks.executionId,
      }),
    );
    return;
  }

  const operation = parseOperation(argValue(argv, "--op") ?? argv[0] ?? "preflight");
  const environment = (
    argValue(argv, "--env") ??
    process.env.RAG_IMPORTER_ENV ??
    "disposable"
  ).toLowerCase() as ImporterEnvironment;
  if (environment !== "disposable" && environment !== "production") {
    throw new Error(`Invalid --env ${environment}`);
  }

  const dryRun = !hasFlag(argv, "--execute") && isDryRunDefault(process.env);
  const reportDir =
    argValue(argv, "--report-dir") ??
    path.join(REPO_ROOT, "artifacts/rag/inactive-importer-reports");
  const stagingVersionKey = argValue(argv, "--version-key");
  const interruptAfter = argValue(argv, "--interrupt-after-packages");

  const locks = readLocksFromEnv(process.env);
  let sql: SqlExecutor | undefined;
  if (!dryRun && (operation === "import" || operation === "validate")) {
    const url = process.env[locks.databaseUrlEnvName];
    if (!url) {
      throw new Error(`Missing database env ${locks.databaseUrlEnvName}`);
    }
    sql = createPsqlExecutor(url);
  }

  const report = await runImporter(
    {
      repoRoot: REPO_ROOT,
      operation,
      environment,
      dryRun: operation === "preflight" ? true : dryRun,
      locks,
      stagingVersionKey,
      interruptAfterPackages: interruptAfter ? Number(interruptAfter) : undefined,
      reportDir,
      sql,
    },
    process.env,
  );

  console.log(JSON.stringify(report, null, 2));

  // Touch version key helper file (safe)
  if (report.stagingVersionKey) {
    fs.mkdirSync(reportDir, { recursive: true });
    fs.writeFileSync(
      path.join(reportDir, "staging-version-key.txt"),
      `${report.stagingVersionKey}\n`,
      "utf8",
    );
  }
}

main().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(JSON.stringify({ ok: false, error: message.slice(0, 500) }));
  process.exit(1);
});

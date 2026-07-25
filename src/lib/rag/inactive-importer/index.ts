import fs from "node:fs";
import path from "node:path";
import { loadAdmittedCorpus } from "./admission";
import { EXPECTED_PROJECT_REF, EXPECTED_REPOSITORY, type ImporterEnvironment } from "./constants";
import { buildStagingVersionKey } from "./digests";
import {
  assertProviderMatchesEnvironment,
  createMockEmbeddingProvider,
  createOpenAIEmbeddingProvider,
} from "./embeddings";
import { runInactiveImport } from "./import-engine";
import { assertLocksAgainstAdmission, LockError, resolveCheckedOutSourceSha } from "./locks";
import { ModeError, parseOperation } from "./modes";
import { assertReportRedacted, buildReport, emptyRowProgress, redactSecrets } from "./reports";
import type {
  EmbeddingProvider,
  ImporterConfig,
  ImporterReport,
  SqlExecutor,
  TargetLocks,
} from "./types";
import { snapshotActiveCorpusFingerprint, validateStagingVersion } from "./validate-staging";

export class RunnerError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "RunnerError";
    this.code = code;
  }
}

function writeReport(reportDir: string | undefined, name: string, report: ImporterReport) {
  const leaks = assertReportRedacted(report);
  if (leaks.length > 0) {
    throw new RunnerError("REDACTION_FAILURE", `Report leaked: ${leaks.join(",")}`);
  }
  if (!reportDir) return;
  fs.mkdirSync(reportDir, { recursive: true });
  const outPath = path.join(reportDir, name);
  fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

function envFlag(name: string, env: NodeJS.ProcessEnv): boolean {
  const v = env[name]?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

function resolveProvider(
  environment: ImporterEnvironment,
  locks: TargetLocks,
  env: NodeJS.ProcessEnv,
  injected?: EmbeddingProvider,
): { provider: EmbeddingProvider; attemptedRef: { value: number } } {
  if (injected) {
    assertProviderMatchesEnvironment(injected, environment);
    return { provider: injected, attemptedRef: { value: 0 } };
  }
  if (environment === "disposable") {
    return {
      provider: createMockEmbeddingProvider(),
      attemptedRef: { value: 0 },
    };
  }
  const key = env[locks.providerCredentialEnvName] ?? "";
  const attemptedRef = { value: 0 };
  const provider = createOpenAIEmbeddingProvider({
    apiKey: key,
    maxRequests: locks.maxEmbeddingRequests,
    getAttempted: () => attemptedRef.value,
    recordAttempts: (n) => {
      attemptedRef.value += n;
    },
  });
  return { provider, attemptedRef };
}

export async function runImporter(
  config: ImporterConfig,
  env: NodeJS.ProcessEnv = process.env,
): Promise<ImporterReport> {
  const operation = parseOperation(config.operation);
  const { admission, packageManifest, chunks } = loadAdmittedCorpus(config.repoRoot);

  const databaseUrl = env[config.locks.databaseUrlEnvName] ?? "";
  const providerCred = env[config.locks.providerCredentialEnvName] ?? "";

  try {
    // Observed SHA is always derived from checked-out Git (or test DI).
    // Never trust caller-supplied OBSERVED_MAIN_SHA from the environment.
    const observedSourceSha = resolveCheckedOutSourceSha({
      cwd: config.repoRoot,
      resolveSha: config.resolveObservedSourceSha,
    });
    assertLocksAgainstAdmission(config.locks, admission.digests, config.environment, {
      observedSourceSha,
      observedProjectRef: env.OBSERVED_PROJECT_REF ?? EXPECTED_PROJECT_REF,
      databaseUrlPresent: Boolean(databaseUrl),
      providerCredentialPresent: Boolean(providerCred),
      databaseHostHint: databaseUrl || env.DATABASE_HOST_HINT,
    });
  } catch (err) {
    const code = err instanceof LockError ? err.code : "LOCK_FAILURE";
    const report = buildReport({
      reportKind: "failure",
      timestamp: new Date().toISOString(),
      executionEnvironment: config.environment,
      operation,
      dryRun: config.dryRun,
      redactedTargetId: "locks-failed",
      repository: EXPECTED_REPOSITORY,
      mainSha: config.locks.expectedMainSha,
      sourceSha: admission.sourceSha,
      indexVersion: admission.indexVersion,
      artifactDigests: admission.digests,
      packageCount: admission.packageCount,
      chunkCount: admission.chunkCount,
      embeddingModel: admission.embeddingModel,
      embeddingDimensions: admission.embeddingDimensions,
      requestCeiling: config.locks.maxEmbeddingRequests,
      attemptedRequestCount: 0,
      stagingVersionKey: null,
      rowProgress: emptyRowProgress(),
      activeCorpusMutationCount: 0,
      validationStatus: "fail",
      errorCode: code,
      errorMessageRedacted: redactSecrets(err instanceof Error ? err.message : "lock failure"),
      authorizationIdPresent: Boolean(config.locks.controlRoomAuthorizationId),
      confirmationTokenPresent: Boolean(config.locks.confirmInactiveRagImport),
    });
    writeReport(config.reportDir, "failure.json", report);
    throw err;
  }

  const stagingVersionKey =
    config.stagingVersionKey ??
    buildStagingVersionKey({
      indexVersion: admission.indexVersion,
      sourceSha: admission.sourceSha,
      packageManifestSha256: admission.digests.packageManifestSha256,
      chunkManifestSha256: admission.digests.chunkManifestSha256,
      executionId: config.locks.executionId,
    });

  if (operation === "preflight" || config.dryRun) {
    const report = buildReport({
      reportKind: "preflight",
      timestamp: new Date().toISOString(),
      executionEnvironment: config.environment,
      operation,
      dryRun: true,
      redactedTargetId: "preflight-no-db",
      repository: EXPECTED_REPOSITORY,
      mainSha: config.locks.expectedMainSha,
      sourceSha: admission.sourceSha,
      indexVersion: admission.indexVersion,
      artifactDigests: admission.digests,
      packageCount: admission.packageCount,
      chunkCount: admission.chunkCount,
      embeddingModel: admission.embeddingModel,
      embeddingDimensions: admission.embeddingDimensions,
      requestCeiling: config.locks.maxEmbeddingRequests,
      attemptedRequestCount: 0,
      stagingVersionKey,
      rowProgress: emptyRowProgress(),
      activeCorpusMutationCount: 0,
      validationStatus: "dry_run",
      errorCode: null,
      errorMessageRedacted: null,
      authorizationIdPresent: true,
      confirmationTokenPresent: Boolean(config.locks.confirmInactiveRagImport),
    });
    writeReport(config.reportDir, "preflight.json", report);
    return report;
  }

  if (!config.sql) {
    throw new RunnerError(
      "MISSING_SQL",
      "SQL executor required for import/validate (no write without explicit executor)",
    );
  }

  const sql = config.sql;
  const beforeActive = snapshotActiveCorpusFingerprint(sql);

  if (operation === "validate") {
    const validation = validateStagingVersion(sql, stagingVersionKey);
    const afterActive = snapshotActiveCorpusFingerprint(sql);
    const report = buildReport({
      reportKind: "validation",
      timestamp: new Date().toISOString(),
      executionEnvironment: config.environment,
      operation,
      dryRun: false,
      redactedTargetId: sql.redactedTargetId,
      repository: EXPECTED_REPOSITORY,
      mainSha: config.locks.expectedMainSha,
      sourceSha: admission.sourceSha,
      indexVersion: admission.indexVersion,
      artifactDigests: admission.digests,
      packageCount: admission.packageCount,
      chunkCount: admission.chunkCount,
      embeddingModel: admission.embeddingModel,
      embeddingDimensions: admission.embeddingDimensions,
      requestCeiling: config.locks.maxEmbeddingRequests,
      attemptedRequestCount: 0,
      stagingVersionKey,
      rowProgress: emptyRowProgress(),
      activeCorpusMutationCount: beforeActive === afterActive ? 0 : 1,
      validationStatus: validation.ok ? "pass" : "fail",
      errorCode: validation.ok ? null : "VALIDATION_FAILED",
      errorMessageRedacted: validation.ok ? null : redactSecrets(validation.errors.join("; ")),
      authorizationIdPresent: true,
      confirmationTokenPresent: Boolean(config.locks.confirmInactiveRagImport),
    });
    writeReport(config.reportDir, "validation.json", report);
    if (!validation.ok) {
      throw new RunnerError("VALIDATION_FAILED", validation.errors.join("; "));
    }
    return report;
  }

  // import
  if (config.environment === "production" && !config.locks.confirmInactiveRagImport) {
    throw new ModeError("MISSING_CONFIRMATION", "CONFIRM_INACTIVE_RAG_IMPORT required");
  }

  const { provider, attemptedRef } = resolveProvider(
    config.environment,
    config.locks,
    env,
    config.embeddings,
  );

  const result = await runInactiveImport({
    sql,
    environment: config.environment,
    provider,
    versionKey: stagingVersionKey,
    packageManifest,
    chunks,
    chunkManifestChecksum: admission.chunkManifestChecksum,
    maxEmbeddingRequests: config.locks.maxEmbeddingRequests,
    interruptAfterPackages: config.interruptAfterPackages,
    initialAttemptedRequests: attemptedRef.value,
  });

  const afterActive = snapshotActiveCorpusFingerprint(sql);
  const activeMutations = beforeActive === afterActive ? 0 : 1;
  if (activeMutations !== 0) {
    throw new RunnerError("ACTIVE_MUTATION", "Inactive import mutated active corpus state");
  }

  const report = buildReport({
    reportKind: result.interrupted ? "progress" : "completion",
    timestamp: new Date().toISOString(),
    executionEnvironment: config.environment,
    operation: "import",
    dryRun: false,
    redactedTargetId: sql.redactedTargetId,
    repository: EXPECTED_REPOSITORY,
    mainSha: config.locks.expectedMainSha,
    sourceSha: admission.sourceSha,
    indexVersion: admission.indexVersion,
    artifactDigests: admission.digests,
    packageCount: admission.packageCount,
    chunkCount: admission.chunkCount,
    embeddingModel: admission.embeddingModel,
    embeddingDimensions: admission.embeddingDimensions,
    requestCeiling: config.locks.maxEmbeddingRequests,
    attemptedRequestCount: result.attemptedRequestCount,
    stagingVersionKey,
    rowProgress: result.progress,
    activeCorpusMutationCount: activeMutations,
    validationStatus: result.interrupted ? "not_run" : "not_run",
    errorCode: null,
    errorMessageRedacted: null,
    authorizationIdPresent: true,
    confirmationTokenPresent: Boolean(config.locks.confirmInactiveRagImport),
  });
  writeReport(config.reportDir, result.interrupted ? "progress.json" : "completion.json", report);
  return report;
}

export function isDryRunDefault(env: NodeJS.ProcessEnv = process.env): boolean {
  if (envFlag("RAG_INACTIVE_IMPORT_EXECUTE", env)) return false;
  if (env.DRY_RUN === "false" || env.DRY_RUN === "0") return false;
  return true;
}

export * from "./constants";
export * from "./admission";
export * from "./digests";
export * from "./locks";
export * from "./modes";
export * from "./reports";
export * from "./embeddings";
export * from "./import-engine";
export * from "./validate-staging";
export * from "./memory-sql";
export * from "./types";
export type * from "./types";

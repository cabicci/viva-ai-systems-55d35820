/**
 * LocalMaster batch runner for Method 1 + 4 production cells.
 * Batches of 20; continues on failure; maintains artifacts/qa/blocker-ledger.json.
 *
 * Usage:
 *   bun run scripts/lesson-visuals-localmaster-batch.ts [--max-cells=40] [--batch-size=20] [--offset=0]
 */
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { inspectPng } from "../src/lib/lesson-visuals/v1/production/pngCodec";
import { verifyCellArtifacts } from "../src/lib/lesson-visuals/v1/production/verifyCellArtifacts";
import { buildRuntimeQuotaContext } from "../src/lib/lesson-visuals/v1/production/quotaContext";

type ManifestCell = {
  cellId: string;
  lessonId: string;
  locale: string;
  method: number;
  masterRelativePath?: string;
};

type BlockerEntry = {
  cellId: string;
  lessonId: string;
  locale: string;
  method: number;
  code: string;
  message: string;
  at: string;
  batchIndex: number;
};

type Ledger = {
  schemaVersion: "lesson-visuals-blocker-ledger/v1";
  updatedAt: string;
  executionSha: string;
  contentSha: string;
  approvedManifestSha256: string;
  scope: "method-1-4-localmaster";
  totals: {
    attempted: number;
    accepted: number;
    failed: number;
    skipped: number;
  };
  blockers: BlockerEntry[];
  method2Plan?: { status: string; detail: string };
  method3Plan?: { status: string; detail: string };
};

function argValue(name: string, fallback: string): string {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
}

function ensureProdEnv(contentSha: string, executionSha: string, manifestSha: string): void {
  const defaults: Record<string, string> = {
    LESSON_VISUALS_EXECUTION_MODE: "production",
    LESSON_VISUALS_PROVIDER_NAME: "openai",
    LESSON_VISUALS_PROVIDER_MODEL: "gpt-image-1",
    LESSON_VISUALS_PROVIDER_API_KEY: "sk-test-not-real",
    LESSON_VISUALS_PROVIDER_ACCOUNT_ID: "acct-test",
    LESSON_VISUALS_PROVIDER_PROJECT_ID: "proj-test",
    LESSON_VISUALS_AI_AUTH_ID: "auth-test",
    LESSON_VISUALS_PROVIDER_ENDPOINT: "https://api.openai.com/v1/images/generations",
    LESSON_VISUALS_PROVIDER_TIMEOUT_MS: "30000",
    LESSON_VISUALS_STORAGE_CREDENTIAL: "",
    LESSON_VISUALS_RUN_COST_CEILING_USD_MICROS: "1000000000",
    LESSON_VISUALS_CELL_COST_CEILING_USD_MICROS: "100000",
    LESSON_VISUALS_MAX_OUTPUT_BYTES: "5000000",
    LESSON_VISUALS_ALLOWED_MIME_TYPES: "image/png",
    LESSON_VISUALS_REQUIRED_WIDTH: "1280",
    LESSON_VISUALS_REQUIRED_HEIGHT: "720",
    LESSON_VISUALS_PROVIDER_ATTEMPT_QUOTA: "800",
    LESSON_VISUALS_MAX_RETRIES: "1",
    LESSON_VISUALS_OUTPUT_STORAGE_TARGET: "artifact://lesson-visuals",
    LOVABLE_DISPATCH_ACTORS: "lovable",
    CONTENT_SHA: contentSha,
    EXECUTION_SHA: executionSha,
    APPROVED_MANIFEST_SHA256: manifestSha,
    CONTROL_ROOM_AUTHORIZATION_ID: "CR-lesson-images-localmaster-20260722",
    RUN_ID: `lv-localmaster-m14-${executionSha.slice(0, 8)}`,
    MODE: "full",
    QUOTA_CONTEXT_PATH: "artifacts/qa/runtime-quota-context.json",
  };
  for (const [k, v] of Object.entries(defaults)) {
    if (!process.env[k]?.trim()) process.env[k] = v;
  }
}

function loadLedger(path: string, meta: Omit<Ledger, "schemaVersion" | "updatedAt" | "totals" | "blockers"> & { blockers?: BlockerEntry[]; totals?: Ledger["totals"] }): Ledger {
  if (existsSync(path)) {
    return JSON.parse(readFileSync(path, "utf8")) as Ledger;
  }
  return {
    schemaVersion: "lesson-visuals-blocker-ledger/v1",
    updatedAt: new Date().toISOString(),
    executionSha: meta.executionSha,
    contentSha: meta.contentSha,
    approvedManifestSha256: meta.approvedManifestSha256,
    scope: "method-1-4-localmaster",
    totals: { attempted: 0, accepted: 0, failed: 0, skipped: 0 },
    blockers: [],
  };
}

function writeLedger(path: string, ledger: Ledger): void {
  ledger.updatedAt = new Date().toISOString();
  mkdirSync(resolve(path, ".."), { recursive: true });
  writeFileSync(path, JSON.stringify(ledger, null, 2) + "\n");
}

function main(): void {
  const repoRoot = process.cwd();
  const batchSize = Number(argValue("batch-size", "20"));
  const maxCells = Number(argValue("max-cells", "0")); // 0 = all
  const offset = Number(argValue("offset", "0"));

  const manifestPath = resolve(repoRoot, "docs/lesson-visuals/v1/AUTHORIZED_MANIFEST.json");
  const bytes = readFileSync(manifestPath);
  const manifest = JSON.parse(bytes.toString("utf8")) as {
    sourceSha: string;
    cells: ManifestCell[];
  };
  const contentSha = manifest.sourceSha;
  const executionSha = spawnSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf8",
    cwd: repoRoot,
  }).stdout.trim();
  const approvedManifestSha256 = createHash("sha256").update(bytes).digest("hex");

  const allM14 = manifest.cells.filter((c) => c.method === 1 || c.method === 4);
  const sliceEnd = maxCells > 0 ? offset + maxCells : allM14.length;
  const target = allM14.slice(offset, sliceEnd);

  ensureProdEnv(contentSha, executionSha, approvedManifestSha256);

  mkdirSync(resolve(repoRoot, "artifacts/qa"), { recursive: true });
  const quota = buildRuntimeQuotaContext({
    runId: process.env.RUN_ID!,
    controlRoomAuthorizationId: process.env.CONTROL_ROOM_AUTHORIZATION_ID!,
    contentSha,
    executionSha,
    approvedManifestSha256,
    mode: "full",
    allCellIds: allM14.map((c) => c.cellId),
    skippedCellIds: [],
    maxRetries: 1,
    configuredProviderAttemptQuota: 800,
  });
  if (!quota.ok || !quota.context) {
    console.error(JSON.stringify({ ok: false, errors: quota.errors }));
    process.exit(1);
  }
  writeFileSync(
    resolve(repoRoot, "artifacts/qa/runtime-quota-context.json"),
    JSON.stringify(quota.context, null, 2) + "\n",
  );

  const ledgerPath = resolve(repoRoot, "artifacts/qa/blocker-ledger.json");
  const ledger = loadLedger(ledgerPath, {
    executionSha,
    contentSha,
    approvedManifestSha256,
    scope: "method-1-4-localmaster",
  });

  const hasOpenAi = Boolean(process.env.OPENAI_API_KEY?.trim());
  const hasProviderKey = Boolean(process.env.LESSON_VISUALS_PROVIDER_API_KEY?.trim()) &&
    process.env.LESSON_VISUALS_PROVIDER_API_KEY !== "sk-test-not-real";
  if (!hasOpenAi && !hasProviderKey) {
    ledger.method2Plan = {
      status: "BLOCKED_NO_PROVIDER",
      detail: "OPENAI_API_KEY / real LESSON_VISUALS_PROVIDER_API_KEY absent; Method 2 deferred",
    };
  } else {
    ledger.method2Plan = {
      status: "PLANNED",
      detail: "Provider key present; Method 2 can run after Method 1/4 localMaster completes",
    };
  }

  let playwrightOk = false;
  try {
    require("playwright");
    playwrightOk = true;
  } catch {
    playwrightOk = false;
  }
  ledger.method3Plan = {
    status: playwrightOk ? "PLANNED_CAPTURE_IF_BROWSERS" : "BLOCKED_NO_PLAYWRIGHT",
    detail: playwrightOk
      ? "Playwright package present; rights already in screenshot_rights_ledger — prefer capture once chromium browsers are installed (bunx playwright install chromium). Do not remethod to diagram while rights are proven."
      : "Playwright package missing; Method 3 blocked until install. Rights ledger already present — do not remethod under Control Room rule 8.",
  };

  const cellScript = resolve(
    repoRoot,
    "src/lib/lesson-visuals/v1/scripts/run_production_cell.ts",
  );
  const verifyScript = resolve(
    repoRoot,
    "src/lib/lesson-visuals/v1/scripts/verify_cell_artifacts.ts",
  );

  console.log(
    JSON.stringify({
      phase: "start",
      totalM14: allM14.length,
      offset,
      maxCells: maxCells || allM14.length,
      batchSize,
      targetCount: target.length,
      contentSha,
      executionSha,
      approvedManifestSha256,
    }),
  );

  let batchIndex = 0;
  for (let i = 0; i < target.length; i += batchSize) {
    batchIndex += 1;
    const batch = target.slice(i, i + batchSize);
    console.log(
      JSON.stringify({
        phase: "batch-start",
        batchIndex,
        size: batch.length,
        from: batch[0]?.cellId,
        to: batch[batch.length - 1]?.cellId,
      }),
    );

    for (const cell of batch) {
      ledger.totals.attempted += 1;
      const env = {
        ...process.env,
        CELL_ID: cell.cellId,
        LESSON_ID: cell.lessonId,
        LOCALE: cell.locale,
        METHOD: String(cell.method),
        ATTEMPT_NUMBER: "1",
      };
      if (cell.masterRelativePath) {
        env.MASTER_RELATIVE_PATH = cell.masterRelativePath;
      } else {
        delete env.MASTER_RELATIVE_PATH;
      }

      const run = spawnSync("bun", ["run", cellScript], {
        cwd: repoRoot,
        env,
        encoding: "utf8",
      });
      let status = "FAILED";
      let ok = false;
      let message = (run.stderr || run.stdout || "").trim();
      try {
        const lines = (run.stdout || "").trim().split(/\r?\n/).filter(Boolean);
        const last = lines[lines.length - 1] ?? "";
        const parsed = JSON.parse(last) as { ok?: boolean; status?: string; cellId?: string };
        status = parsed.status ?? status;
        ok = Boolean(parsed.ok) && (status === "ACCEPTED" || status === "SKIPPED");
        message = last;
      } catch {
        ok = false;
      }

      if (run.status !== 0) ok = false;

      if (ok && status === "ACCEPTED") {
        const pngPath = resolve(repoRoot, "artifacts/cells", cell.cellId, "output.png");
        if (!existsSync(pngPath)) {
          ok = false;
          status = "FAILED";
          message = "ACCEPTED but output.png missing";
        } else {
          const info = inspectPng(readFileSync(pngPath));
          if (!info?.decodable || info.width !== 1280 || info.height !== 720) {
            ok = false;
            status = "FAILED";
            message = `PNG verify failed: ${JSON.stringify(info)}`;
          }
        }
        const verify = spawnSync("bun", ["run", verifyScript], {
          cwd: repoRoot,
          env: { ...env, CELL_STATUS: status },
          encoding: "utf8",
        });
        if (verify.status !== 0) {
          ok = false;
          status = "FAILED";
          message = (verify.stderr || verify.stdout || "artifact verify failed").trim();
        }
      }

      if (ok && status === "ACCEPTED") {
        ledger.totals.accepted += 1;
        ledger.blockers = ledger.blockers.filter((b) => b.cellId !== cell.cellId);
      } else if (ok && status === "SKIPPED") {
        ledger.totals.skipped += 1;
      } else {
        ledger.totals.failed += 1;
        ledger.blockers = ledger.blockers.filter((b) => b.cellId !== cell.cellId);
        ledger.blockers.push({
          cellId: cell.cellId,
          lessonId: cell.lessonId,
          locale: cell.locale,
          method: cell.method,
          code: "CELL_RUN_FAILED",
          message: message.slice(0, 2000),
          at: new Date().toISOString(),
          batchIndex,
        });
      }

      console.log(
        JSON.stringify({
          phase: "cell",
          batchIndex,
          cellId: cell.cellId,
          method: cell.method,
          ok,
          status,
        }),
      );
      writeLedger(ledgerPath, ledger);
    }

    console.log(
      JSON.stringify({
        phase: "batch-end",
        batchIndex,
        totals: ledger.totals,
        blockerCount: ledger.blockers.length,
      }),
    );
  }

  writeLedger(ledgerPath, ledger);
  console.log(
    JSON.stringify({
      phase: "done",
      totals: ledger.totals,
      blockerCount: ledger.blockers.length,
      method2Plan: ledger.method2Plan,
      method3Plan: ledger.method3Plan,
      ledgerPath: "artifacts/qa/blocker-ledger.json",
    }),
  );

  if (ledger.totals.failed > 0 && ledger.totals.accepted === 0) process.exit(1);
}

main();

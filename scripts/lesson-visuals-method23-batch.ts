/**
 * Method 2 + 3 production batch (unpaid paths only).
 * - Method 3: LESSON_VISUALS_SCREENSHOT_ENGINE=chrome-cli (system Chrome headless)
 * - Method 2: LESSON_VISUALS_METHOD2_FALLBACK=local-master (no OpenAI spend)
 *
 * Usage:
 *   bun run scripts/lesson-visuals-method23-batch.ts [--methods=2,3] [--batch-size=12]
 */
import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { inspectPng } from "../src/lib/lesson-visuals/v1/production/pngCodec";
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
  scope: string;
  totals: {
    attempted: number;
    accepted: number;
    failed: number;
    skipped: number;
  };
  blockers: BlockerEntry[];
  method2Plan?: { status: string; detail: string };
  method3Plan?: { status: string; detail: string };
  summary?: Record<string, unknown>;
};

function argValue(name: string, fallback: string): string {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
}

function syncCollected(repoRoot: string): void {
  const collected = resolve(repoRoot, "collected");
  mkdirSync(join(collected, "receipts"), { recursive: true });
  mkdirSync(join(collected, "mappings"), { recursive: true });
  mkdirSync(join(collected, "validations"), { recursive: true });
  mkdirSync(join(collected, "rights"), { recursive: true });
  mkdirSync(join(collected, "cells"), { recursive: true });

  for (const name of readdirSync(resolve(repoRoot, "artifacts/receipts"))) {
    if (!name.endsWith(".receipt.json")) continue;
    copyFileSync(
      resolve(repoRoot, "artifacts/receipts", name),
      join(collected, "receipts", name),
    );
  }
  for (const name of readdirSync(resolve(repoRoot, "artifacts/mappings"))) {
    if (!name.endsWith(".mapping.json")) continue;
    copyFileSync(
      resolve(repoRoot, "artifacts/mappings", name),
      join(collected, "mappings", name),
    );
  }
  for (const name of readdirSync(resolve(repoRoot, "artifacts/validations"))) {
    if (!name.endsWith(".validation.json")) continue;
    copyFileSync(
      resolve(repoRoot, "artifacts/validations", name),
      join(collected, "validations", name),
    );
  }
  if (existsSync(resolve(repoRoot, "artifacts/rights"))) {
    for (const name of readdirSync(resolve(repoRoot, "artifacts/rights"))) {
      copyFileSync(
        resolve(repoRoot, "artifacts/rights", name),
        join(collected, "rights", name),
      );
    }
  }
  // cell attempt meta / claims / pngs
  const cellsRoot = resolve(repoRoot, "artifacts/cells");
  if (existsSync(cellsRoot)) {
    const destCells = join(collected, "cells");
    mkdirSync(destCells, { recursive: true });
    for (const cellId of readdirSync(cellsRoot)) {
      const src = join(cellsRoot, cellId);
      if (!statSync(src).isDirectory()) continue;
      const dest = join(destCells, cellId);
      mkdirSync(dest, { recursive: true });
      for (const f of readdirSync(src)) {
        copyFileSync(join(src, f), join(dest, f));
      }
    }
  }
}

function ensureProdEnv(contentSha: string, executionSha: string, manifestSha: string): void {
  const defaults: Record<string, string> = {
    LESSON_VISUALS_EXECUTION_MODE: "production",
    LESSON_VISUALS_PROVIDER_NAME: "openai",
    LESSON_VISUALS_PROVIDER_MODEL: "gpt-image-1",
    // Placeholder only — Method 2 uses local-master fallback; never a real OpenAI key.
    LESSON_VISUALS_PROVIDER_API_KEY: "sk-test-not-real",
    LESSON_VISUALS_PROVIDER_ACCOUNT_ID: "acct-test",
    LESSON_VISUALS_PROVIDER_PROJECT_ID: "proj-test",
    LESSON_VISUALS_AI_AUTH_ID: "auth-test",
    LESSON_VISUALS_PROVIDER_ENDPOINT: "https://api.openai.com/v1/images/generations",
    LESSON_VISUALS_PROVIDER_TIMEOUT_MS: "60000",
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
    LESSON_VISUALS_METHOD2_FALLBACK: "local-master",
    LESSON_VISUALS_SCREENSHOT_ENGINE: "chrome-cli",
    LESSON_VISUALS_CHROME_PATH:
      process.platform === "win32"
        ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
        : "google-chrome",
    CONTENT_SHA: contentSha,
    EXECUTION_SHA: executionSha,
    APPROVED_MANIFEST_SHA256: manifestSha,
    CONTROL_ROOM_AUTHORIZATION_ID: "CR-lesson-images-localmaster-20260722",
    // Keep same run identity as Method 1/4 accepted cells.
    RUN_ID: `lv-localmaster-m14-${executionSha.slice(0, 8)}`,
    MODE: "full",
    QUOTA_CONTEXT_PATH: "artifacts/qa/runtime-quota-context.json",
  };
  for (const [k, v] of Object.entries(defaults)) {
    if (!process.env[k]?.trim()) process.env[k] = v;
  }
  // Hard safety: never inherit a real OpenAI key into this unpaid batch.
  if (process.env.OPENAI_API_KEY?.trim()) {
    delete process.env.OPENAI_API_KEY;
  }
  process.env.LESSON_VISUALS_PROVIDER_API_KEY = "sk-test-not-real";
  process.env.LESSON_VISUALS_METHOD2_FALLBACK = "local-master";
  process.env.LESSON_VISUALS_SCREENSHOT_ENGINE = "chrome-cli";
}

function loadLedger(path: string): Ledger | null {
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf8")) as Ledger;
}

function countAccepted(repoRoot: string): number {
  const dir = resolve(repoRoot, "artifacts/receipts");
  if (!existsSync(dir)) return 0;
  let n = 0;
  for (const name of readdirSync(dir)) {
    if (!name.endsWith(".receipt.json")) continue;
    const r = JSON.parse(readFileSync(join(dir, name), "utf8")) as { status?: string };
    if (r.status === "ACCEPTED") n += 1;
  }
  return n;
}

function main(): void {
  const repoRoot = process.cwd();
  const batchSize = Number(argValue("batch-size", "12"));
  const methodsArg = argValue("methods", "3,2");
  const methods = new Set(
    methodsArg
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((n) => n === 2 || n === 3),
  );
  if (methods.size === 0) {
    console.error(JSON.stringify({ ok: false, errors: ["--methods must include 2 and/or 3"] }));
    process.exit(1);
  }

  const manifestPath = resolve(repoRoot, "docs/lesson-visuals/v1/AUTHORIZED_MANIFEST.json");
  const bytes = readFileSync(manifestPath);
  const manifest = JSON.parse(bytes.toString("utf8")) as {
    sourceSha: string;
    cells: ManifestCell[];
  };
  const contentSha = manifest.sourceSha;
  // Pin to the Method 1/4 run execution SHA for coherent aggregate identity.
  const executionSha = (
    process.env.EXECUTION_SHA ??
    "acf0fc0764e432fa18aaf45de6e3b90f4b1874dc"
  ).trim();
  const approvedManifestSha256 = createHash("sha256").update(bytes).digest("hex");

  const allCells = manifest.cells;
  const target = allCells.filter((c) => methods.has(c.method));
  // Prefer Method 3 first (authenticity path), then Method 2 fallback.
  target.sort((a, b) => a.method - b.method || a.cellId.localeCompare(b.cellId));
  // Actually user asked method 3 then 2 — sort 3 before 2:
  target.sort((a, b) => {
    if (a.method !== b.method) return b.method - a.method; // 3 before 2
    return a.cellId.localeCompare(b.cellId);
  });

  ensureProdEnv(contentSha, executionSha, approvedManifestSha256);

  mkdirSync(resolve(repoRoot, "artifacts/qa"), { recursive: true });
  const quota = buildRuntimeQuotaContext({
    runId: process.env.RUN_ID!,
    controlRoomAuthorizationId: process.env.CONTROL_ROOM_AUTHORIZATION_ID!,
    contentSha,
    executionSha,
    approvedManifestSha256,
    mode: "full",
    allCellIds: allCells.map((c) => c.cellId),
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
  const priorAccepted = countAccepted(repoRoot);
  let ledger = loadLedger(ledgerPath) ?? {
    schemaVersion: "lesson-visuals-blocker-ledger/v1" as const,
    updatedAt: new Date().toISOString(),
    executionSha,
    contentSha,
    approvedManifestSha256,
    scope: "method-2-3-unpaid",
    totals: { attempted: priorAccepted, accepted: priorAccepted, failed: 0, skipped: 0 },
    blockers: [],
  };
  ledger.scope = "method-1-4-localmaster+method-2-fallback+method-3-chrome-cli";
  ledger.executionSha = executionSha;
  ledger.contentSha = contentSha;
  ledger.approvedManifestSha256 = approvedManifestSha256;
  ledger.method2Plan = {
    status: methods.has(2) ? "RUNNING_LOCAL_MASTER_FALLBACK" : "SKIPPED",
    detail:
      "LESSON_VISUALS_METHOD2_FALLBACK=local-master with placeholder API key; zero OpenAI spend",
  };
  ledger.method3Plan = {
    status: methods.has(3) ? "RUNNING_CHROME_CLI" : "SKIPPED",
    detail:
      "LESSON_VISUALS_SCREENSHOT_ENGINE=chrome-cli; allowlisted URLs only; fail on login redirect",
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
      methods: [...methods],
      targetCount: target.length,
      priorAccepted,
      batchSize,
      runId: process.env.RUN_ID,
      screenshotEngine: process.env.LESSON_VISUALS_SCREENSHOT_ENGINE,
      method2Fallback: process.env.LESSON_VISUALS_METHOD2_FALLBACK,
    }),
  );

  let batchIndex = 0;
  for (let i = 0; i < target.length; i += batchSize) {
    batchIndex += 1;
    const batch = target.slice(i, i + batchSize);
    for (const cell of batch) {
      const receiptPath = resolve(repoRoot, "artifacts/receipts", `${cell.cellId}.receipt.json`);
      if (existsSync(receiptPath)) {
        const prev = JSON.parse(readFileSync(receiptPath, "utf8")) as { status?: string };
        if (prev.status === "ACCEPTED") {
          console.log(
            JSON.stringify({
              phase: "cell-skip-accepted",
              cellId: cell.cellId,
              method: cell.method,
            }),
          );
          ledger.blockers = ledger.blockers.filter((b) => b.cellId !== cell.cellId);
          continue;
        }
        // Clear prior failure artifacts for retry
        rmSync(receiptPath, { force: true });
      }

      ledger.totals.attempted += 1;
      const env = {
        ...process.env,
        CELL_ID: cell.cellId,
        LESSON_ID: cell.lessonId,
        LOCALE: cell.locale,
        METHOD: String(cell.method),
        ATTEMPT_NUMBER: "1",
      };
      if (cell.masterRelativePath) env.MASTER_RELATIVE_PATH = cell.masterRelativePath;
      else delete env.MASTER_RELATIVE_PATH;

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
        const parsed = JSON.parse(last) as { ok?: boolean; status?: string };
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
          code: cell.method === 3 ? "METHOD3_CAPTURE_FAILED" : "METHOD2_FALLBACK_FAILED",
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
      ledger.updatedAt = new Date().toISOString();
      writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2) + "\n");
    }
  }

  const acceptedNow = countAccepted(repoRoot);
  const m2Accepted = allCells.filter(
    (c) =>
      c.method === 2 &&
      existsSync(resolve(repoRoot, "artifacts/receipts", `${c.cellId}.receipt.json`)) &&
      (JSON.parse(
        readFileSync(resolve(repoRoot, "artifacts/receipts", `${c.cellId}.receipt.json`), "utf8"),
      ) as { status?: string }).status === "ACCEPTED",
  ).length;
  const m3Accepted = allCells.filter(
    (c) =>
      c.method === 3 &&
      existsSync(resolve(repoRoot, "artifacts/receipts", `${c.cellId}.receipt.json`)) &&
      (JSON.parse(
        readFileSync(resolve(repoRoot, "artifacts/receipts", `${c.cellId}.receipt.json`), "utf8"),
      ) as { status?: string }).status === "ACCEPTED",
  ).length;

  ledger.totals.accepted = acceptedNow;
  ledger.method2Plan = {
    status: m2Accepted === 48 ? "ACCEPTED_LOCAL_MASTER_FALLBACK" : "PARTIAL_OR_BLOCKED",
    detail: `${m2Accepted}/48 Method 2 cells ACCEPTED via local-master fallback (no OpenAI)`,
  };
  ledger.method3Plan = {
    status: m3Accepted === 12 ? "ACCEPTED_CHROME_CLI" : "PARTIAL_OR_BLOCKED",
    detail: `${m3Accepted}/12 Method 3 cells ACCEPTED via chrome-cli capture`,
  };
  ledger.summary = {
    method1_4_accepted: acceptedNow - m2Accepted - m3Accepted,
    method3_accepted: m3Accepted,
    method2_accepted: m2Accepted,
    totalAccepted: acceptedNow,
    totalAuthorized: 400,
    completionBlockedBy: ledger.blockers.map((b) => b.code).filter((v, i, a) => a.indexOf(v) === i),
  };
  ledger.updatedAt = new Date().toISOString();
  writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2) + "\n");

  syncCollected(repoRoot);

  console.log(
    JSON.stringify({
      phase: "done",
      acceptedNow,
      m2Accepted,
      m3Accepted,
      blockerCount: ledger.blockers.length,
      ledgerPath: "artifacts/qa/blocker-ledger.json",
    }),
  );

  if (m2Accepted + m3Accepted === 0 && target.length > 0) process.exit(1);
}

main();

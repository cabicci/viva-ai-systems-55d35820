import {
  appendFileSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  unlinkSync,
} from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import type { CommitQueueItem, VideoStatusRecord } from "./types.ts";
import { VIDEO_RESULTS_BRANCH } from "./types.ts";
import { OUTPUT_ROOT, QUEUE_DIR, REPO_ROOT } from "./paths.ts";
import { preventCommittingFailed } from "./status-registry.ts";

const LOCK_FILE = path.join(QUEUE_DIR, "commit-queue.lock");
const LOG_FILE = path.join(QUEUE_DIR, "commit-queue.log");
const ORDER_FILE = path.join(QUEUE_DIR, "commit-order.json");

export interface CommitQueueState {
  order: string[];
  processed: string[];
  lastCommitSha?: string;
}

function loadOrder(): CommitQueueState {
  if (!existsSync(ORDER_FILE)) {
    return { order: [], processed: [] };
  }
  return JSON.parse(readFileSync(ORDER_FILE, "utf8")) as CommitQueueState;
}

function saveOrder(state: CommitQueueState): void {
  mkdirSync(QUEUE_DIR, { recursive: true });
  writeFileSync(ORDER_FILE, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

function log(msg: string): void {
  mkdirSync(QUEUE_DIR, { recursive: true });
  appendFileSync(LOG_FILE, `[${new Date().toISOString()}] ${msg}\n`, "utf8");
}

function acquireLock(): void {
  mkdirSync(QUEUE_DIR, { recursive: true });
  if (existsSync(LOCK_FILE)) {
    throw new Error("Commit queue lock held — concurrent push prevented");
  }
  writeFileSync(LOCK_FILE, String(process.pid), "utf8");
}

function releaseLock(): void {
  if (existsSync(LOCK_FILE)) {
    try {
      writeFileSync(LOCK_FILE, "", "utf8");
    } catch {
      /* ignore */
    }
  }
}

function git(args: string[], cwd = REPO_ROOT): { ok: boolean; stdout: string; stderr: string } {
  const r = spawnSync("git", args, { cwd, encoding: "utf8", shell: false });
  return {
    ok: r.status === 0,
    stdout: (r.stdout ?? "").trim(),
    stderr: (r.stderr ?? "").trim(),
  };
}

export function enqueueCompletedVideo(item: CommitQueueItem): void {
  const state = loadOrder();
  if (!state.order.includes(item.cellId)) {
    state.order.push(item.cellId);
    saveOrder(state);
  }
  log(`enqueued ${item.cellId}`);
}

export function processCommitQueue(options: {
  dryRun?: boolean;
  targetBranch?: string;
  maxItems?: number;
}): { committed: string[]; skipped: string[]; errors: string[] } {
  const targetBranch = options.targetBranch ?? VIDEO_RESULTS_BRANCH;
  const committed: string[] = [];
  const skipped: string[] = [];
  const errors: string[] = [];

  acquireLock();
  try {
    const state = loadOrder();
    const pending = state.order.filter((id) => !state.processed.includes(id));
    const batch = options.maxItems ? pending.slice(0, options.maxItems) : pending;

    for (const cellId of batch) {
      const recordPath = path.join(OUTPUT_ROOT, cellId.replace("::", "/"), "status.json");
      if (!existsSync(recordPath)) {
        errors.push(`${cellId}: missing status.json in output`);
        continue;
      }
      const record = JSON.parse(readFileSync(recordPath, "utf8")) as VideoStatusRecord;
      const gate = preventCommittingFailed(record);
      if (!gate.ok) {
        skipped.push(cellId);
        log(`skip ${cellId}: ${gate.error}`);
        continue;
      }

      if (options.dryRun) {
        committed.push(cellId);
        log(`dry-run commit ${cellId}`);
        continue;
      }

      const [locale, lessonId] = cellId.split("::");
      const artifactsDir = path.join(OUTPUT_ROOT, locale!, lessonId!);
      const destRoot = path.join(
        REPO_ROOT,
        "remotion/video-pipeline/results",
        locale!,
        lessonId!,
      );
      mkdirSync(destRoot, { recursive: true });

      for (const file of ["video.mp4", "audio.mp3", "captions.vtt", "status.json", "validation.json"]) {
        const src = path.join(artifactsDir, file);
        if (existsSync(src)) copyFileSync(src, path.join(destRoot, file));
      }

      git(["checkout", "-B", targetBranch], REPO_ROOT);
      git(["add", `remotion/video-pipeline/results/${locale}/${lessonId}`], REPO_ROOT);

      const commitMsg = `video(${locale}): ${lessonId} [${record.videoChecksum?.slice(0, 8)}]`;
      const commit = git(["commit", "-m", commitMsg], REPO_ROOT);
      if (!commit.ok && !commit.stdout.includes("nothing to commit")) {
        errors.push(`${cellId}: commit failed — ${commit.stderr}`);
        continue;
      }

      const sha = git(["rev-parse", "HEAD"], REPO_ROOT).stdout;
      state.processed.push(cellId);
      state.lastCommitSha = sha;
      saveOrder(state);
      committed.push(cellId);
      log(`committed ${cellId} -> ${sha}`);
    }
  } finally {
    releaseLock();
  }

  return { committed, skipped, errors };
}

export function resetCommitQueueForTest(): void {
  mkdirSync(QUEUE_DIR, { recursive: true });
  writeFileSync(ORDER_FILE, JSON.stringify({ order: [], processed: [] }, null, 2), "utf8");
  writeFileSync(LOG_FILE, "", "utf8");
  releaseLock();
  if (existsSync(LOCK_FILE)) {
    try {
      unlinkSync(LOCK_FILE);
    } catch {
      /* ignore */
    }
  }
}

export function getCommitOrder(): CommitQueueState {
  return loadOrder();
}

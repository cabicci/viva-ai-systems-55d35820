import { promises as fs } from "node:fs";
import path from "node:path";
import { REPORTS_DIR } from "./corpus.ts";

export const LOCK_PATH = path.join(REPORTS_DIR, ".audit.lock");

export interface AuditLock {
  pid: number;
  startedAt: string;
  command: string;
}

async function isProcessAlive(pid: number): Promise<boolean> {
  if (pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export async function readLock(): Promise<AuditLock | null> {
  try {
    const raw = await fs.readFile(LOCK_PATH, "utf8");
    return JSON.parse(raw) as AuditLock;
  } catch {
    return null;
  }
}

export async function forceUnlock(): Promise<void> {
  await fs.mkdir(REPORTS_DIR, { recursive: true });
  try {
    await fs.unlink(LOCK_PATH);
    console.log(`Removed lock: ${LOCK_PATH}`);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
    console.log("No lock file present.");
  }
}

export async function acquireLock(command: string): Promise<void> {
  await fs.mkdir(REPORTS_DIR, { recursive: true });
  const existing = await readLock();
  if (existing) {
    const alive = await isProcessAlive(existing.pid);
    if (alive && existing.pid !== process.pid) {
      throw new Error(
        `Audit already running (pid ${existing.pid}, started ${existing.startedAt}). Use --force-unlock if stale.`,
      );
    }
    if (!alive) {
      console.warn(`Removing stale lock from pid ${existing.pid}`);
      await forceUnlock();
    }
  }

  const lock: AuditLock = {
    pid: process.pid,
    startedAt: new Date().toISOString(),
    command,
  };
  await fs.writeFile(LOCK_PATH, JSON.stringify(lock, null, 2), "utf8");
}

export async function releaseLock(): Promise<void> {
  const existing = await readLock();
  if (!existing) return;
  if (existing.pid !== process.pid) return;
  try {
    await fs.unlink(LOCK_PATH);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  }
}

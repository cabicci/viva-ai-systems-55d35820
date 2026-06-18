import { promises as fs } from "node:fs";
import path from "node:path";
import type { AuditResultLabel, LessonAuditEntry } from "../types.ts";
import { REPORTS_DIR } from "./corpus.ts";

export const CHECKPOINT_JSON = path.join(REPORTS_DIR, "API_AUDIT_checkpoint.json");
export const CHECKPOINT_MD = path.join(REPORTS_DIR, "API_AUDIT_checkpoint.md");

export interface AuditCheckpoint {
  generatedAt: string;
  updatedAt: string;
  provider: string;
  model: string;
  dryRun: boolean;
  entries: LessonAuditEntry[];
}

export interface RunPlan {
  queue: string[];
  skipped: string[];
  prior: Map<string, LessonAuditEntry>;
}

const TERMINAL_OK: AuditResultLabel[] = ["PASS", "PASS WITH NOTES"];

export async function loadCheckpoint(): Promise<AuditCheckpoint | null> {
  try {
    const raw = await fs.readFile(CHECKPOINT_JSON, "utf8");
    return JSON.parse(raw) as AuditCheckpoint;
  } catch {
    return null;
  }
}

export async function findLatestDatedReport(): Promise<string | null> {
  const files = await fs.readdir(REPORTS_DIR);
  const dated = files
    .filter((f) => /^API_AUDIT_\d{4}-\d{2}-\d{2}\.json$/.test(f))
    .sort()
    .reverse();
  if (!dated.length) return null;
  return path.join(REPORTS_DIR, dated[0]);
}

export async function loadPreviousEntries(): Promise<Map<string, LessonAuditEntry>> {
  const map = new Map<string, LessonAuditEntry>();

  const checkpoint = await loadCheckpoint();
  if (checkpoint?.entries?.length) {
    for (const e of checkpoint.entries) map.set(e.lessonId, e);
    return map;
  }

  const latest = await findLatestDatedReport();
  if (!latest) return map;

  try {
    const raw = await fs.readFile(latest, "utf8");
    const parsed = JSON.parse(raw) as { entries?: LessonAuditEntry[] };
    for (const e of parsed.entries ?? []) map.set(e.lessonId, e);
  } catch {
    // ignore corrupt prior report
  }

  return map;
}

export function buildRunPlan(
  selected: string[],
  prior: Map<string, LessonAuditEntry>,
  opts: {
    resume: boolean;
    retryErrors: boolean;
    retryContentFails: boolean;
  },
): RunPlan {
  if (opts.retryErrors) {
    const queue = selected.filter((id) => prior.get(id)?.result === "ERROR_RETRY_REQUIRED");
    const skipped = selected.filter((id) => !queue.includes(id));
    return { queue, skipped, prior };
  }

  if (opts.retryContentFails) {
    const queue = selected.filter((id) => prior.get(id)?.result === "CONTENT FAIL");
    const skipped = selected.filter((id) => !queue.includes(id));
    return { queue, skipped, prior };
  }

  if (opts.resume) {
    const queue: string[] = [];
    const skipped: string[] = [];
    for (const id of selected) {
      const prev = prior.get(id);
      if (!prev) {
        queue.push(id);
        continue;
      }
      if (TERMINAL_OK.includes(prev.result)) {
        skipped.push(id);
        continue;
      }
      if (prev.result === "CONTENT FAIL") {
        skipped.push(id);
        continue;
      }
      queue.push(id);
    }
    return { queue, skipped, prior };
  }

  return { queue: [...selected], skipped: [], prior };
}

export function mergeEntries(
  prior: Map<string, LessonAuditEntry>,
  updated: LessonAuditEntry[],
): LessonAuditEntry[] {
  const merged = new Map(prior);
  for (const e of updated) merged.set(e.lessonId, e);
  return [...merged.values()].sort((a, b) => a.lessonId.localeCompare(b.lessonId));
}

export async function writeCheckpoint(
  entries: LessonAuditEntry[],
  meta: {
    provider: string;
    model: string;
    dryRun: boolean;
    generatedAt: string;
    renderReport: (entries: LessonAuditEntry[], meta: {
      provider: string;
      model: string;
      dryRun: boolean;
      generatedAt: string;
      partial?: boolean;
    }) => string;
  },
): Promise<void> {
  await fs.mkdir(REPORTS_DIR, { recursive: true });
  const checkpoint: AuditCheckpoint = {
    generatedAt: meta.generatedAt,
    updatedAt: new Date().toISOString(),
    provider: meta.provider,
    model: meta.model,
    dryRun: meta.dryRun,
    entries,
  };

  await fs.writeFile(CHECKPOINT_JSON, JSON.stringify(checkpoint, null, 2), "utf8");
  const md = meta.renderReport(entries, {
    ...meta,
    partial: true,
  });
  await fs.writeFile(CHECKPOINT_MD, md, "utf8");
}

import { randomUUID, createHash } from "node:crypto";
import { CheckpointReviewRequired } from "./input-identity.ts";
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

function parseCheckpoint(raw: string): AuditCheckpoint {
  let parsed: AuditCheckpoint;
  try { parsed = JSON.parse(raw); } catch { throw new CheckpointReviewRequired("Malformed checkpoint/report preserved; review required"); }
  if (!parsed || typeof parsed.provider !== "string" || typeof parsed.model !== "string" ||
      typeof parsed.dryRun !== "boolean" || typeof parsed.generatedAt !== "string" || !Array.isArray(parsed.entries)) {
    throw new CheckpointReviewRequired("Unverified checkpoint/report metadata preserved; review required");
  }
  const seen = new Set<string>();
  const checks = ["objectivePreservation", "oneAhaPreservation", "missionRubricPreservation", "quizKeyPreservation", "noHallucinatedConcepts", "msaClarity", "englishTermGlossIssues", "metadataSlugIssues", "assistantBoundaryIssues", "videoScriptSuitability"] as const;
  for (const entry of parsed.entries) {
    if (!entry || typeof entry.lessonId !== "string" || !entry.lessonId || seen.has(entry.lessonId) ||
        !/^[a-f0-9]{64}$/.test(entry.inputIdentity ?? "") ||
        !["not-started", "settled", "uncertain"].includes(entry.requestState ?? "") ||
        !["PASS", "PASS WITH NOTES", "CONTENT FAIL", "ERROR_RETRY_REQUIRED"].includes(entry.result) ||
        typeof entry.apiReviewed !== "boolean" || typeof entry.preflightPassed !== "boolean" ||
        [entry.summary, entry.productionFile, entry.canonicalFile].some(v=>typeof v!=="string") ||
        [entry.preflightErrors, entry.hardBlockers, entry.softNotes, entry.fixRecommendations].some(v=>!Array.isArray(v)||v.some(x=>typeof x!=="string")) ||
        checks.some(key=>!["pass","fail","notes","skipped","unknown"].includes(entry[key]))) {
      throw new CheckpointReviewRequired("Unverified checkpoint entry preserved; review required");
    }
    seen.add(entry.lessonId);
  }
  return parsed;
}

export async function loadCheckpoint(): Promise<AuditCheckpoint | null> {
  let raw: string;
  try { raw = await fs.readFile(CHECKPOINT_JSON, "utf8"); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw new CheckpointReviewRequired("Checkpoint unreadable; preserved and review required");
  }
  return parseCheckpoint(raw);
}

export async function findLatestDatedReport(): Promise<string | null> {
  let files: string[];
  try { files = await fs.readdir(REPORTS_DIR); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return null; throw error; }
  const dated = files.filter((f) => /^API_AUDIT_\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort().reverse();
  return dated.length ? path.join(REPORTS_DIR, dated[0]) : null;
}

export async function loadPreviousEntries(): Promise<Map<string, LessonAuditEntry>> {
  const checkpoint = await loadCheckpoint();
  if (checkpoint) return new Map(checkpoint.entries.map(entry=>[entry.lessonId,entry]));
  const latest = await findLatestDatedReport();
  if (!latest) return new Map();
  let raw: string;
  try { raw = await fs.readFile(latest,"utf8"); }
  catch { throw new CheckpointReviewRequired("Prior report unreadable; preserved and review required"); }
  return new Map(parseCheckpoint(raw).entries.map(entry=>[entry.lessonId,entry]));
}

export function buildRunPlan(
  selected: string[],
  prior: Map<string, LessonAuditEntry>,
  opts: {
    identities?: ReadonlyMap<string, string>;
    resume: boolean;
    retryErrors: boolean;
    retryContentFails: boolean;
  },
): RunPlan {
  if ([...prior.values()].some(entry=>entry.requestState === "uncertain")) {
    throw new CheckpointReviewRequired("A prior request may still be running or billed; reconcile before starting further work");
  }
  for (const id of selected) {
    const previous = prior.get(id);
    if (!previous) continue;
    if (!previous.inputIdentity || previous.inputIdentity !== opts.identities?.get(id)) {
      throw new CheckpointReviewRequired(`Checkpoint inputs changed or unverified for ${id}; no automatic regeneration`);
    }
    if (previous.requestState === "uncertain" || !previous.requestState) {
      throw new CheckpointReviewRequired(`Prior request for ${id} may still be running or billed; reconcile before retry`);
    }
  }
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
  // Check any existing bytes before mutation; malformed/unproven work is never
  // treated as absent. A durable uncertain entry is written before dispatch.
  await loadCheckpoint();
  const checkpoint: AuditCheckpoint = {
    generatedAt: meta.generatedAt, updatedAt: new Date().toISOString(),
    provider: meta.provider, model: meta.model, dryRun: meta.dryRun, entries,
  };
  const encoded = JSON.stringify(checkpoint, null, 2);
  parseCheckpoint(encoded);
  const md = meta.renderReport(entries, { ...meta, partial: true });
  await fs.mkdir(REPORTS_DIR, { recursive: true });
  await writePreservingFile(CHECKPOINT_JSON, encoded);
  await writePreservingFile(CHECKPOINT_MD, md);
}

export async function writePreservingFile(target: string, next: string): Promise<void> {
  let previous: Buffer | null = null;
  try { previous = await fs.readFile(target); }
  catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
  if (previous) {
    const saved = `${target}.preserved-${createHash("sha256").update(previous).digest("hex")}`;
    try { await fs.writeFile(saved, previous, { flag: "wx" }); }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST" || !(await fs.readFile(saved)).equals(previous)) throw error;
    }
  }
  const temporary = `${target}.pending-${randomUUID()}`;
  try {
    const file = await fs.open(temporary,"wx");
    try { await file.writeFile(next,"utf8"); await file.sync(); } finally { await file.close(); }
    await fs.rename(temporary,target);
  } finally { await fs.unlink(temporary).catch(error=>{if(error.code!=="ENOENT")throw error;}); }
}

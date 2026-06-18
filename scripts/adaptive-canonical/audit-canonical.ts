import { promises as fs } from "node:fs";
import path from "node:path";
import type { AuditResultLabel, LessonAuditEntry } from "./types.ts";
import {
  buildRunPlan,
  loadCheckpoint,
  loadPreviousEntries,
  mergeEntries,
  writeCheckpoint,
} from "./lib/checkpoint.ts";
import {
  CANONICAL_DIR,
  REPORTS_DIR,
  listCanonicalLessonIds,
  loadPathsLessonIds,
  preflightLesson,
} from "./lib/corpus.ts";
import {
  extractCanonicalSections,
  extractProductionText,
  localCanonicalHeuristics,
} from "./lib/extract.ts";
import { acquireLock, forceUnlock, releaseLock } from "./lib/lock.ts";
import { isRetryableError, reviewTimeoutMs, withRetry, withTimeout } from "./lib/retry.ts";
import { resolveReviewer } from "./reviewers/index.ts";

interface CliArgs {
  limit: number | null;
  all: boolean;
  lessons: string[] | null;
  dryRun: boolean;
  resume: boolean;
  retryErrors: boolean;
  retryContentFails: boolean;
  forceUnlock: boolean;
  allowBackground: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  let limit: number | null = null;
  let all = false;
  let lessons: string[] | null = null;
  let dryRun = false;
  let resume = false;
  let retryErrors = false;
  let retryContentFails = false;
  let forceUnlockFlag = false;
  let allowBackground = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--all") all = true;
    else if (arg === "--dry-run") dryRun = true;
    else if (arg === "--resume") resume = true;
    else if (arg === "--retry-errors") retryErrors = true;
    else if (arg === "--retry-content-fails") retryContentFails = true;
    else if (arg === "--force-unlock") forceUnlockFlag = true;
    else if (arg === "--allow-background") allowBackground = true;
    else if (arg === "--limit" && argv[i + 1]) {
      limit = Number(argv[++i]);
    } else if (arg === "--lessons" && argv[i + 1]) {
      lessons = argv[++i].split(",").map((s) => s.trim()).filter(Boolean);
    }
  }

  return {
    limit,
    all,
    lessons,
    dryRun,
    resume,
    retryErrors,
    retryContentFails,
    forceUnlock: forceUnlockFlag,
    allowBackground,
  };
}

function mergeResult(
  preflightOk: boolean,
  localHard: string[],
  localSoft: string[],
  api?: {
    result: AuditResultLabel;
    hardBlockers: string[];
    softNotes: string[];
  } | null,
): AuditResultLabel {
  if (!preflightOk || localHard.length) return "CONTENT FAIL";
  if (api) {
    if (api.result === "CONTENT FAIL" || api.hardBlockers.length) return "CONTENT FAIL";
    if (api.result === "PASS WITH NOTES" || api.softNotes.length || localSoft.length) {
      return "PASS WITH NOTES";
    }
    if (api.result === "PASS") return "PASS";
  }
  if (localSoft.length) return "PASS WITH NOTES";
  return "PASS";
}

function todayStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

function renderReport(
  entries: LessonAuditEntry[],
  meta: {
    provider: string;
    model: string;
    dryRun: boolean;
    generatedAt: string;
    partial?: boolean;
  },
): string {
  const counts: Record<AuditResultLabel, number> = {
    PASS: 0,
    "PASS WITH NOTES": 0,
    "CONTENT FAIL": 0,
    "ERROR_RETRY_REQUIRED": 0,
  };
  for (const e of entries) counts[e.result]++;

  const lines: string[] = [
    "# MSA Canonical API Audit Report",
    "",
    `**Generated:** ${meta.generatedAt}`,
    meta.partial ? `**Updated:** ${new Date().toISOString()}` : "",
    meta.partial ? `**Status:** partial checkpoint (in progress)` : "",
    `**Provider:** ${meta.provider}${meta.model ? ` · \`${meta.model}\`` : ""}`,
    `**Mode:** ${meta.dryRun ? "dry-run (preflight + heuristics only)" : "API + preflight"}`,
    `**Corpus:** ${entries.length} lessons in report`,
    "",
    "## Summary",
    "",
    "| Result | Count |",
    "|--------|-------|",
    `| PASS | ${counts.PASS} |`,
    `| PASS WITH NOTES | ${counts["PASS WITH NOTES"]} |`,
    `| CONTENT FAIL | ${counts["CONTENT FAIL"]} |`,
    `| ERROR_RETRY_REQUIRED | ${counts["ERROR_RETRY_REQUIRED"]} |`,
    "",
    "---",
    "",
  ].filter(Boolean);

  for (const e of entries) {
    lines.push(`## ${e.lessonId}`);
    lines.push("");
    lines.push(`**Result:** ${e.result}`);
    lines.push(
      `**API reviewed:** ${e.apiReviewed ? "yes" : "no"}${e.attemptCount ? ` · attempts: ${e.attemptCount}` : ""}${e.apiError ? ` · error: ${e.apiError}` : ""}`,
    );
    lines.push("");
    lines.push("| Check | Status |");
    lines.push("|-------|--------|");
    lines.push(`| Objective preservation | ${e.objectivePreservation} |`);
    lines.push(`| oneAha preservation | ${e.oneAhaPreservation} |`);
    lines.push(`| Mission rubric preservation | ${e.missionRubricPreservation} |`);
    lines.push(`| Quiz key preservation | ${e.quizKeyPreservation} |`);
    lines.push(`| No hallucinated concepts/tools | ${e.noHallucinatedConcepts} |`);
    lines.push(`| MSA clarity | ${e.msaClarity} |`);
    lines.push(`| English-term gloss issues | ${e.englishTermGlossIssues} |`);
    lines.push(`| Metadata/slug issues | ${e.metadataSlugIssues} |`);
    lines.push(`| Assistant boundary issues | ${e.assistantBoundaryIssues} |`);
    lines.push(`| Video-script suitability | ${e.videoScriptSuitability} |`);
    lines.push("");

    if (e.preflightErrors.length) {
      lines.push("**Preflight errors:**");
      for (const err of e.preflightErrors) lines.push(`- ${err}`);
      lines.push("");
    }
    if (e.hardBlockers.length) {
      lines.push("**Hard blockers:**");
      for (const b of e.hardBlockers) lines.push(`- ${b}`);
      lines.push("");
    }
    if (e.softNotes.length) {
      lines.push("**Soft notes:**");
      for (const n of e.softNotes) lines.push(`- ${n}`);
      lines.push("");
    }
    if (e.fixRecommendations.length) {
      lines.push("**Fix recommendations:**");
      for (const f of e.fixRecommendations) lines.push(`- ${f}`);
      lines.push("");
    }
    lines.push(`**Summary:** ${e.summary}`);
    lines.push("");
    lines.push(`- Production: \`${e.productionFile}\``);
    lines.push(`- Canonical: \`${e.canonicalFile}\``);
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  return lines.join("\n");
}

function enforceForeground(all: boolean, allowBackground: boolean) {
  if (all && !allowBackground && !process.stdin.isTTY) {
    console.error(
      "Full audit must run in a foreground terminal. Re-run attached to a terminal, or pass --allow-background explicitly.",
    );
    process.exit(1);
  }
  if (all && !allowBackground) {
    console.log("Foreground mode: do not background this process during --all runs.");
  }
}

async function auditLesson(
  lessonId: string,
  pathsIds: Set<string>,
  dryRun: boolean,
  reviewer: ReturnType<typeof resolveReviewer> | null,
): Promise<LessonAuditEntry> {
  const pre = await preflightLesson(lessonId, pathsIds);
  const canonicalMd = await fs.readFile(pre.canonicalFile, "utf8");
  const local = localCanonicalHeuristics(lessonId, canonicalMd);

  const entry: LessonAuditEntry = {
    lessonId,
    result: "CONTENT FAIL",
    preflightPassed: pre.ok,
    preflightErrors: [...pre.errors],
    apiReviewed: false,
    objectivePreservation: "skipped",
    oneAhaPreservation: "skipped",
    missionRubricPreservation: "skipped",
    quizKeyPreservation: "skipped",
    noHallucinatedConcepts: "skipped",
    msaClarity: "skipped",
    englishTermGlossIssues: "skipped",
    metadataSlugIssues: "skipped",
    assistantBoundaryIssues: "skipped",
    videoScriptSuitability: "skipped",
    hardBlockers: [...pre.errors.map((e) => `preflight: ${e}`), ...local.hardBlockers],
    softNotes: [...local.softNotes],
    fixRecommendations: [],
    summary: "",
    productionFile: pre.productionFile,
    canonicalFile: pre.canonicalFile,
  };

  if (!pre.ok) {
    entry.result = "CONTENT FAIL";
    entry.summary = "Preflight failed — API review skipped.";
    return entry;
  }

  const prodTs = await fs.readFile(pre.productionFile, "utf8");
  const prod = extractProductionText(prodTs);
  const canon = extractCanonicalSections(canonicalMd);

  if (dryRun || !reviewer) {
    entry.result = mergeResult(pre.ok, local.hardBlockers, local.softNotes, null);
    entry.summary =
      entry.result === "CONTENT FAIL"
        ? "Local preflight/heuristic checks failed."
        : "Local preflight/heuristic checks passed (no API review).";
    return entry;
  }

  const timeoutMs = reviewTimeoutMs();
  let attemptCount = 0;

  try {
    const api = await withRetry(
      async () => {
        attemptCount += 1;
        return await withTimeout(
          reviewer.reviewLesson({
            lessonId,
            productionSummary: prod.summary,
            canonicalSummary: canon.summary,
            productionQuizMission: prod.quizMission,
            canonicalQuizMission: canon.quizMission,
            metadataBlock: canon.metadata,
          }),
          timeoutMs,
        );
      },
    );

    entry.attemptCount = attemptCount;
    entry.apiReviewed = true;
    entry.objectivePreservation = api.objectivePreservation;
    entry.oneAhaPreservation = api.oneAhaPreservation;
    entry.missionRubricPreservation = api.missionRubricPreservation;
    entry.quizKeyPreservation = api.quizKeyPreservation;
    entry.noHallucinatedConcepts = api.noHallucinatedConcepts;
    entry.msaClarity = api.msaClarity;
    entry.englishTermGlossIssues = api.englishTermGlossIssues;
    entry.metadataSlugIssues = api.metadataSlugIssues;
    entry.assistantBoundaryIssues = api.assistantBoundaryIssues;
    entry.videoScriptSuitability = api.videoScriptSuitability;
    entry.hardBlockers = [...entry.hardBlockers, ...api.hardBlockers];
    entry.softNotes = [...entry.softNotes, ...api.softNotes];
    entry.fixRecommendations = api.fixRecommendations;
    entry.summary = api.summary;
    entry.result = mergeResult(pre.ok, local.hardBlockers, local.softNotes, api);
  } catch (err) {
    entry.attemptCount = attemptCount || undefined;
    entry.apiError = String(err);
    entry.summary = `API review failed after retries: ${entry.apiError}`;
    entry.result = isRetryableError(err) ? "ERROR_RETRY_REQUIRED" : "CONTENT FAIL";
    if (!isRetryableError(err)) {
      entry.hardBlockers.push(`api: ${entry.apiError}`);
    }
  }

  return entry;
}

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

function printUsage() {
  console.error(`Usage:
  bun scripts/adaptive-canonical/audit-canonical.ts --limit 3
  bun scripts/adaptive-canonical/audit-canonical.ts --all [--resume] [--allow-background]
  bun scripts/adaptive-canonical/audit-canonical.ts --retry-errors
  bun scripts/adaptive-canonical/audit-canonical.ts --retry-content-fails
  bun scripts/adaptive-canonical/audit-canonical.ts --lessons id1,id2
  bun scripts/adaptive-canonical/audit-canonical.ts --force-unlock
  bun scripts/adaptive-canonical/audit-canonical.ts --limit 3 --dry-run`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.forceUnlock) {
    await forceUnlock();
    if (!args.all && args.limit == null && !args.lessons?.length && !args.retryErrors) {
      return;
    }
  }

  if (!args.all && args.limit == null && !args.lessons?.length && !args.retryErrors && !args.retryContentFails) {
    printUsage();
    process.exit(1);
  }

  if (args.retryErrors && args.retryContentFails) {
    console.error("Use either --retry-errors or --retry-content-fails, not both.");
    process.exit(1);
  }

  enforceForeground(args.all, args.allowBackground);

  const command = process.argv.slice(2).join(" ");
  await acquireLock(command);

  try {
    const allIds = await listCanonicalLessonIds();
    const pathsIds = await loadPathsLessonIds();

    let selected: string[];
    if (args.lessons?.length) {
      selected = args.lessons;
    } else if (args.all || args.retryErrors || args.retryContentFails) {
      selected = allIds;
    } else if (args.limit != null) {
      selected = allIds.slice(0, args.limit);
    } else {
      printUsage();
      process.exit(1);
    }

    const unknown = selected.filter((id) => !allIds.includes(id));
    if (unknown.length) {
      console.error(`Unknown canonical lesson IDs: ${unknown.join(", ")}`);
      process.exit(1);
    }

    const prior =
      args.resume || args.retryErrors || args.retryContentFails
        ? await loadPreviousEntries()
        : new Map<string, LessonAuditEntry>();
    const plan = buildRunPlan(selected, prior, {
      resume: args.resume,
      retryErrors: args.retryErrors,
      retryContentFails: args.retryContentFails,
    });

    if (plan.skipped.length) {
      console.log(`Skipping ${plan.skipped.length} previously completed lesson(s).`);
    }
    if (!plan.queue.length) {
      console.log("Nothing to audit in this run.");
      return;
    }

    let reviewer: ReturnType<typeof resolveReviewer> | null = null;
    let providerName = "none";
    let modelName = "";

    if (!args.dryRun) {
      reviewer = resolveReviewer();
      providerName = reviewer.name;
      modelName = reviewer.model;
      console.log(`Using reviewer: ${providerName} (${modelName})`);
      console.log(`Per-lesson timeout: ${reviewTimeoutMs()}ms`);
    } else {
      console.log("Dry-run mode — preflight + local heuristics only");
    }

    const checkpoint = await loadCheckpoint();
    const runStartedAt =
      args.resume && checkpoint?.generatedAt
        ? checkpoint.generatedAt
        : new Date().toISOString();
    const delayMs = Number(process.env.AI_REVIEW_DELAY_MS ?? "1200");
    const touched: LessonAuditEntry[] = [];

    for (let i = 0; i < plan.queue.length; i++) {
      const id = plan.queue[i];
      console.log(`[${i + 1}/${plan.queue.length}] Auditing ${id}...`);
      const entry = await auditLesson(id, pathsIds, args.dryRun, reviewer);
      touched.push(entry);
      console.log(`  → ${entry.result}${entry.apiError ? ` (${entry.apiError.slice(0, 80)})` : ""}`);

      const merged = mergeEntries(plan.prior, touched);
      await writeCheckpoint(merged, {
        provider: providerName,
        model: modelName,
        dryRun: args.dryRun,
        generatedAt: runStartedAt,
        renderReport,
      });

      if (!args.dryRun && i < plan.queue.length - 1) await sleep(delayMs);
    }

    const finalEntries = mergeEntries(plan.prior, touched);
    await fs.mkdir(REPORTS_DIR, { recursive: true });
    const reportPath = path.join(REPORTS_DIR, `API_AUDIT_${todayStamp()}.md`);
    const report = renderReport(finalEntries, {
      provider: providerName,
      model: modelName,
      dryRun: args.dryRun,
      generatedAt: runStartedAt,
    });
    await fs.writeFile(reportPath, report, "utf8");

    const jsonPath = path.join(REPORTS_DIR, `API_AUDIT_${todayStamp()}.json`);
    await fs.writeFile(
      jsonPath,
      JSON.stringify({ generatedAt: runStartedAt, completedAt: new Date().toISOString(), entries: finalEntries }, null, 2),
      "utf8",
    );

    const counts: Record<AuditResultLabel, number> = {
      PASS: 0,
      "PASS WITH NOTES": 0,
      "CONTENT FAIL": 0,
      "ERROR_RETRY_REQUIRED": 0,
    };
    for (const e of finalEntries) counts[e.result]++;

    console.log("\nAudit complete:");
    console.log(`  PASS: ${counts.PASS}`);
    console.log(`  PASS WITH NOTES: ${counts["PASS WITH NOTES"]}`);
    console.log(`  CONTENT FAIL: ${counts["CONTENT FAIL"]}`);
    console.log(`  ERROR_RETRY_REQUIRED: ${counts["ERROR_RETRY_REQUIRED"]}`);
    console.log(`  Report: ${reportPath}`);
    console.log(`  Checkpoint: ${path.join(REPORTS_DIR, "API_AUDIT_checkpoint.json")}`);
  } finally {
    await releaseLock();
  }
}

main().catch(async (err) => {
  console.error(err);
  process.exit(1);
});

#!/usr/bin/env bun
import { writeContactSheet } from "../contactSheets";
import {
  runFailedOnly,
  runFull400,
  runMethodAFourCellPilot,
  runMethodBToCFourCellPilot,
  runMethodBToCRemainingEight,
  runMethodCCanonicalRepair,
  runMethodCRemaining,
  runPilot,
  runPreflight,
  runReportOnly,
} from "../runner";
import type { RunnerMode } from "../types";

function parseArgs(argv: string[]): {
  mode: RunnerMode;
  confirm?: string;
  sourceArtifactRoot?: string;
  stagingRoot?: string;
  priorArtifactRunId?: string;
} {
  const mode = argv[0] as RunnerMode | undefined;
  const validModes: RunnerMode[] = [
    "preflight",
    "pilot",
    "full-400",
    "failed-only",
    "report-only",
    "method-c-remaining",
    "method-c-canonical-repair",
    "method-c-b6l3-four-pilot",
    "method-c-b-to-c-remaining-eight",
    "method-a-m7l1-four-pilot",
  ];
  if (!mode || !validModes.includes(mode)) {
    console.error(
      `usage: cli.ts <${validModes.join("|")}> [--confirm_full_400=<token>] [--source_artifact_root=<path>] [--staging_root=<path>] [--prior_artifact_run_id=<id>]`,
    );
    process.exit(2);
  }

  let confirm: string | undefined = process.env.CONFIRM_FULL_400;
  let sourceArtifactRoot: string | undefined =
    process.env.METHOD_C_CANONICAL_SOURCE_ROOT ?? process.env.SOURCE_ARTIFACT_ROOT;
  let stagingRoot: string | undefined =
    process.env.METHOD_C_CANONICAL_STAGING_ROOT ?? process.env.STAGING_ROOT;
  let priorArtifactRunId: string | undefined =
    process.env.PRIOR_ARTIFACT_RUN_ID ?? process.env.prior_artifact_run_id;

  for (const arg of argv.slice(1)) {
    const confirmMatch = arg.match(/^--confirm_full_400=(.*)$/);
    if (confirmMatch) confirm = confirmMatch[1];
    const sourceMatch = arg.match(/^--source_artifact_root=(.*)$/);
    if (sourceMatch) sourceArtifactRoot = sourceMatch[1];
    const stagingMatch = arg.match(/^--staging_root=(.*)$/);
    if (stagingMatch) stagingRoot = stagingMatch[1];
    const priorMatch = arg.match(/^--prior_artifact_run_id=(.*)$/);
    if (priorMatch) priorArtifactRunId = priorMatch[1];
  }

  return { mode, confirm, sourceArtifactRoot, stagingRoot, priorArtifactRunId };
}

async function main() {
  const { mode, confirm, sourceArtifactRoot, stagingRoot, priorArtifactRunId } = parseArgs(
    process.argv.slice(2),
  );

  // Defense in depth: preflight/report-only/canonical-repair must never launch Chrome.
  if (mode === "preflight" || mode === "report-only" || mode === "method-c-canonical-repair") {
    process.env.CONTROLLED_V1_ZERO_RENDER = "1";
  }

  let result;
  switch (mode) {
    case "preflight":
      result = runPreflight();
      break;
    case "pilot":
      result = runPilot();
      writeContactSheet("pilot", result.receipts);
      break;
    case "full-400":
      result = runFull400(confirm);
      if (result.ok) writeContactSheet("full-400", result.receipts);
      break;
    case "method-c-remaining":
      result = runMethodCRemaining(confirm);
      if (result.ok && result.receipts.length > 0) {
        writeContactSheet("method-c-remaining", result.receipts);
      }
      break;
    case "method-c-b6l3-four-pilot":
      result = runMethodBToCFourCellPilot(confirm);
      if (result.ok && result.receipts.length > 0) {
        writeContactSheet("method-c-b6l3-four-pilot", result.receipts);
      }
      break;
    case "method-c-b-to-c-remaining-eight":
      result = runMethodBToCRemainingEight(confirm);
      if (result.ok && result.receipts.length > 0) {
        writeContactSheet("method-c-b-to-c-remaining-eight", result.receipts);
      }
      break;
    case "method-a-m7l1-four-pilot":
      result = await runMethodAFourCellPilot(confirm);
      if (result.ok && result.receipts.length > 0) {
        writeContactSheet("method-a-m7l1-four-pilot", result.receipts);
      }
      break;
    case "method-c-canonical-repair":
      if (!sourceArtifactRoot) {
        console.error(
          "method-c-canonical-repair requires --source_artifact_root=<path> or METHOD_C_CANONICAL_SOURCE_ROOT",
        );
        process.exit(2);
      }
      result = runMethodCCanonicalRepair({
        confirmToken: confirm,
        sourceArtifactRoot,
        stagingRoot,
        priorArtifactRunId,
        repairExecutionSha: process.env.GITHUB_SHA ?? null,
        sourceExecutionSha:
          process.env.METHOD_C_SOURCE_EXECUTION_SHA ?? "6d01bbe07e0e97a02a84cdd38a7a722daad95d75",
      });
      break;
    case "failed-only":
      result = runFailedOnly();
      writeContactSheet("failed-only", result.receipts);
      break;
    case "report-only":
      result = runReportOnly();
      break;
    default:
      throw new Error(`unreachable mode: ${mode}`);
  }

  console.log(
    JSON.stringify(
      { mode: result.mode, ok: result.ok, summary: result.summary, errors: result.errors },
      null,
      2,
    ),
  );

  if (!result.ok) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

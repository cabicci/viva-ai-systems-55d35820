#!/usr/bin/env bun
import { writeContactSheet } from "../contactSheets";
import { runFailedOnly, runFull400, runPilot, runPreflight, runReportOnly } from "../runner";
import type { RunnerMode } from "../types";

function parseArgs(argv: string[]): { mode: RunnerMode; confirm?: string } {
  const mode = argv[0] as RunnerMode | undefined;
  const validModes: RunnerMode[] = ["preflight", "pilot", "full-400", "failed-only", "report-only"];
  if (!mode || !validModes.includes(mode)) {
    console.error(
      `usage: cli.ts <${validModes.join("|")}> [--confirm_full_400=RUN_AUTHORIZED_400]`,
    );
    process.exit(2);
  }

  let confirm: string | undefined = process.env.CONFIRM_FULL_400;
  for (const arg of argv.slice(1)) {
    const m = arg.match(/^--confirm_full_400=(.*)$/);
    if (m) confirm = m[1];
  }

  return { mode, confirm };
}

async function main() {
  const { mode, confirm } = parseArgs(process.argv.slice(2));

  // Defense in depth: preflight/report-only must never launch Chrome or write PNGs.
  if (mode === "preflight" || mode === "report-only") {
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

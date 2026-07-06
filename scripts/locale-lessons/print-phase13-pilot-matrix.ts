import {
  buildPhase13PilotMatrix,
  parseLessonIdsArg,
  parsePhase13SourceScope,
  parsePhase13TargetLocales,
} from "./lib/resolve-phase13-pilot-lesson-ids.ts";
import {
  clampPhase13PilotCount,
  PHASE13_DEFAULT_PILOT_COUNT,
} from "./lib/phase13-pilot-manifest.ts";

function readArg(name: string): string | null {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
}

function parseCount(): number {
  const raw = readArg("pilot_count") ?? readArg("count");
  if (raw === null) return PHASE13_DEFAULT_PILOT_COUNT;
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid pilot_count: ${raw}`);
  }
  return clampPhase13PilotCount(parsed);
}

async function main() {
  const matrix = await buildPhase13PilotMatrix({
    sourceScope: parsePhase13SourceScope(readArg("source_scope")),
    target: parsePhase13TargetLocales(readArg("target_locales") ?? readArg("target")),
    count: parseCount(),
    lessonIdsOverride: parseLessonIdsArg(
      readArg("lesson_ids") ?? readArg("lesson-ids"),
    ),
  });

  process.stdout.write(JSON.stringify({ include: matrix }));
}

if (import.meta.main) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}

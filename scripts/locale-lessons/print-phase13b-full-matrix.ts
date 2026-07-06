import {
  buildPhase13BFullMatrix,
  localesFromPhase13BTarget,
  parseLessonIdsArg,
  parsePhase13BRetryCellsArg,
  parsePhase13BSourceScope,
  parsePhase13BTargetLocales,
} from "./lib/phase13b-full-matrix.ts";

function readArg(name: string): string | null {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
}

async function main() {
  const sourceScope = parsePhase13BSourceScope(readArg("source_scope"));
  const target = parsePhase13BTargetLocales(
    readArg("target_locales") ?? readArg("target"),
  );
  const retryCells = parsePhase13BRetryCellsArg(
    readArg("retry_cells") ?? readArg("retry-cells"),
  );
  const lessonIdsOverride = parseLessonIdsArg(
    readArg("lesson_ids") ?? readArg("lesson-ids"),
  );

  const matrix = await buildPhase13BFullMatrix({
    sourceScope,
    targetLocales: localesFromPhase13BTarget(target),
    lessonIdsOverride,
    retryCells,
  });

  process.stdout.write(JSON.stringify({ include: matrix }));
}

if (import.meta.main) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}

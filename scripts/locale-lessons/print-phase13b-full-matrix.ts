import {
  buildPhase13BFullMatrix,
  buildPhase13BWorkflowShardMatrix,
  localesFromPhase13BTarget,
  parseLessonIdsArg,
  parsePhase13BRetryCellsArg,
  parsePhase13BSourceScope,
  parsePhase13BTargetLocales,
  serializeGitHubActionsMatrix,
} from "./lib/phase13b-full-matrix.ts";

function readArg(name: string): string | null {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
}

function parseMatrixFormat(): "cells" | "workflow-shard" {
  const raw = readArg("matrix_format") ?? readArg("matrix-format") ?? "workflow-shard";
  if (raw === "cells" || raw === "workflow-shard") return raw;
  throw new Error('matrix_format must be "cells" or "workflow-shard"');
}

async function main() {
  const sourceScope = parsePhase13BSourceScope(readArg("source_scope"));
  const target = parsePhase13BTargetLocales(
    readArg("target_locales") ?? readArg("target"),
  );
  const targetLocales = localesFromPhase13BTarget(target);
  const matrixFormat = parseMatrixFormat();
  const retryCells = parsePhase13BRetryCellsArg(
    readArg("retry_cells") ?? readArg("retry-cells"),
  );
  const lessonIdsOverride = parseLessonIdsArg(
    readArg("lesson_ids") ?? readArg("lesson-ids"),
  );

  if (retryCells?.length) {
    const shards = await buildPhase13BWorkflowShardMatrix({
      sourceScope,
      retryCells,
    });
    process.stdout.write(serializeGitHubActionsMatrix(shards));
    return;
  }

  if (matrixFormat === "cells") {
    const matrix = await buildPhase13BFullMatrix({
      sourceScope,
      targetLocales,
      lessonIdsOverride,
    });
    process.stdout.write(serializeGitHubActionsMatrix(matrix));
    return;
  }

  const shards = await buildPhase13BWorkflowShardMatrix({
    sourceScope,
    targetLocales,
    lessonIdsOverride,
  });
  process.stdout.write(serializeGitHubActionsMatrix(shards));
}

if (import.meta.main) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}

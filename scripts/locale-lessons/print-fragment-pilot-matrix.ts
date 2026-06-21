import type { AdaptationTargetLocale } from "../../src/lib/locale-lessons/types.ts";
import {
  clampPilotLessonCount,
  DEFAULT_PILOT_LESSON_COUNT,
} from "./lib/pilot-lesson-ids.ts";
import {
  buildFragmentPilotMatrix,
  parseLessonIdsArg,
} from "./lib/resolve-fragment-pilot-lesson-ids.ts";

function readArg(name: string): string | null {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
}

function parseTarget(): AdaptationTargetLocale | "all" {
  const target = readArg("target");
  if (!target || target === "all") return "all";
  if (target === "ar-Gulf" || target === "en") return target;
  throw new Error("Usage: --target ar-Gulf|en|all");
}

function parseCount(): number {
  const raw = readArg("count");
  if (raw === null) return DEFAULT_PILOT_LESSON_COUNT;
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid --count value: ${raw}`);
  }
  return clampPilotLessonCount(parsed);
}

async function main() {
  const mode = readArg("mode") ?? "pilot";
  if (mode !== "pilot") {
    throw new Error("Only --mode pilot is supported");
  }

  const matrix = await buildFragmentPilotMatrix({
    target: parseTarget(),
    count: parseCount(),
    lessonIdsOverride: parseLessonIdsArg(readArg("lesson_ids")),
  });

  process.stdout.write(JSON.stringify({ include: matrix }));
}

if (import.meta.main) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}

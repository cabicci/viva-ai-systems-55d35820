import type { AdaptationTargetLocale } from "../../src/lib/locale-lessons/types.ts";
import { selectFullLessonIds } from "./lib/full-lesson-ids.ts";
import { localesForTarget, parseLessonIdsArg } from "./lib/resolve-fragment-pilot-lesson-ids.ts";

function readArg(name: string): string | null {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? null : process.argv[i + 1] ?? null;
}

function parseTarget(): AdaptationTargetLocale | "all" {
  const t = readArg("target");
  if (!t || t === "all") return "all";
  if (t === "ar-Gulf" || t === "en") return t;
  throw new Error("Usage: --target ar-Gulf|en|all");
}

async function main() {
  const lessonIdsOverride = parseLessonIdsArg(readArg("lesson_ids"));
  const lessonIds = lessonIdsOverride?.length ? lessonIdsOverride : await selectFullLessonIds();
  const locales = localesForTarget(parseTarget());
  const include = locales.flatMap((locale) =>
    lessonIds.map((lesson_id) => ({ locale, lesson_id })),
  );
  process.stdout.write(JSON.stringify({ include }));
}

if (import.meta.main) {
  main().catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  });
}

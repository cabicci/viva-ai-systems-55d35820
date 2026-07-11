#!/usr/bin/env bun
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { extractAllScripts } from "../lib/script-extract.ts";
import { detectCrossLocaleContamination, validateScriptDeterminism } from "../lib/script-validate.ts";
import { MANIFEST_PATH, OUTPUT_ROOT } from "../lib/paths.ts";

const args = process.argv.slice(2);
const sampleOnly = args.includes("--sample");

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
const entries = sampleOnly ? manifest.entries.slice(0, 9) : manifest.entries;

const scripts = extractAllScripts(
  entries.map((e) => ({
    locale: e.locale,
    lessonId: e.lessonId,
  })),
);

const contamination = detectCrossLocaleContamination(scripts);
const determinism = entries.slice(0, 3).map((e) => ({
  cellId: `${e.locale}::${e.lessonId}`,
  ...validateScriptDeterminism(e.locale, e.lessonId),
}));

mkdirSync(path.join(OUTPUT_ROOT, "_reports"), { recursive: true });
const reportPath = path.join(OUTPUT_ROOT, "_reports", "script-mapping.json");
writeFileSync(
  reportPath,
  JSON.stringify(
    {
      extracted: scripts.length,
      contamination,
      determinismSample: determinism,
      localeChecksums: Object.fromEntries(
        ["ar-MSA", "ar-Gulf", "en"].map((locale) => [
          locale,
          scripts.filter((s) => s.locale === locale).length,
        ]),
      ),
    },
    null,
    2,
  ) + "\n",
  "utf8",
);

console.log(JSON.stringify({ reportPath, extracted: scripts.length, contamination }, null, 2));
if (!contamination.ok) process.exit(1);

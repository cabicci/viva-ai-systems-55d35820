#!/usr/bin/env bun
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { assertVoiceMappingComplete } from "../lib/voice-map.ts";
import { MANIFEST_PATH, OUTPUT_ROOT } from "../lib/paths.ts";

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
const profiles = assertVoiceMappingComplete(["ar-MSA", "ar-Gulf", "en"]);

const mapping = manifest.entries.map((e) => ({
  cellId: e.cellId,
  locale: e.locale,
  lessonId: e.lessonId,
  voiceProfileId: e.voiceProfileId,
  primaryVoice: profiles[e.locale].primaryVoice,
}));

mkdirSync(path.join(OUTPUT_ROOT, "_reports"), { recursive: true });
const out = path.join(OUTPUT_ROOT, "_reports", "voice-mapping.json");
writeFileSync(
  out,
  JSON.stringify(
    {
      total: mapping.length,
      profiles,
      mappingSample: mapping.slice(0, 5),
      mappingComplete: mapping.length === 300,
    },
    null,
    2,
  ) + "\n",
  "utf8",
);

console.log(JSON.stringify({ out, total: mapping.length, profiles: Object.keys(profiles) }, null, 2));

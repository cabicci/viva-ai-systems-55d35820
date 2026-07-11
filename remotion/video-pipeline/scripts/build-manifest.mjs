#!/usr/bin/env bun
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildVideoManifest, assertManifestInvariants } from "../lib/build-manifest.ts";
import { MANIFEST_PATH } from "../lib/paths.ts";
import { initRegistryFromManifest } from "../lib/status-registry.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const manifest = buildVideoManifest();
assertManifestInvariants(manifest);

mkdirSync(path.dirname(MANIFEST_PATH), { recursive: true });
writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
initRegistryFromManifest(manifest.entries);

console.log(
  JSON.stringify(
    {
      path: MANIFEST_PATH,
      totalVideos: manifest.totalVideos,
      localeTotals: manifest.localeTotals,
      baselineSha: manifest.baselineSha,
    },
    null,
    2,
  ),
);

/**
 * Generate or verify AUTHORIZED_PILOT_12.json.
 * Usage:
 *   bun run src/lib/lesson-visuals/v1/scripts/pilot_manifest.ts --check
 *   bun run src/lib/lesson-visuals/v1/scripts/pilot_manifest.ts --write
 */
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  generatePilotManifestFromRepo,
  verifyCheckedInPilotManifest,
  writePilotManifest,
} from "../production/pilotManifest";

function moduleDir(): string {
  if (typeof import.meta.dirname === "string") return import.meta.dirname;
  return fileURLToPath(new URL(".", import.meta.url));
}

function repoRoot(): string {
  return resolve(moduleDir(), "../../../../..");
}

function main(): void {
  const args = process.argv.slice(2);
  const check = args.includes("--check");
  const write = args.includes("--write");
  if (check === write) {
    console.error(
      JSON.stringify({
        ok: false,
        errors: ["specify exactly one of --check or --write"],
      }),
    );
    process.exit(1);
  }
  const root = repoRoot();
  if (write) {
    const r = writePilotManifest(root);
    console.log(
      JSON.stringify(
        {
          action: "write",
          ok: r.ok,
          errors: r.errors,
          sha256: r.sha256,
          path: r.path,
          cellIds: r.ok
            ? generatePilotManifestFromRepo(root).manifest?.cells.map((c) => c.cellId) ?? []
            : [],
        },
        null,
        2,
      ),
    );
    process.exit(r.ok ? 0 : 1);
  }
  const v = verifyCheckedInPilotManifest(root);
  const again = verifyCheckedInPilotManifest(root);
  console.log(
    JSON.stringify(
      {
        action: "validate",
        ok: v.ok && again.ok && v.sha256 === again.sha256,
        errors: [...v.errors, ...(again.sha256 !== v.sha256 ? ["non-deterministic digest"] : [])],
        sha256: v.sha256,
        sha256SecondRun: again.sha256,
        cellCount: v.cellIds.length,
        cellIds: v.cellIds,
      },
      null,
      2,
    ),
  );
  process.exit(v.ok && again.ok && v.sha256 === again.sha256 ? 0 : 1);
}

main();

/**
 * Fail-closed required artifact presence check before upload.
 */
import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";

function main(): void {
  const cellId = process.env.CELL_ID ?? "";
  const status = process.env.CELL_STATUS ?? "";
  const root = resolve(process.cwd(), "artifacts");
  const required: string[] = [`receipts/${cellId}.receipt.json`];

  if (status === "ACCEPTED") {
    required.push(
      `cells/${cellId}/output.png`,
      `mappings/${cellId}.mapping.json`,
      `rights/${cellId}.rights.json`,
      `validations/${cellId}.validation.json`,
    );
  } else if (status === "SKIPPED") {
    // receipt only
  } else {
    required.push(`cells/${cellId}/failure.json`);
  }

  const missing: string[] = [];
  for (const rel of required) {
    const abs = resolve(root, rel);
    if (!existsSync(abs) || !statSync(abs).isFile() || statSync(abs).size <= 0) {
      missing.push(rel);
    }
  }
  if (missing.length) {
    console.error(JSON.stringify({ ok: false, missing }));
    process.exit(1);
  }
  console.log(JSON.stringify({ ok: true, required }));
}

main();

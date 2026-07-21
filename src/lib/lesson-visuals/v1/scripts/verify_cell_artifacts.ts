/**
 * Fail-closed required artifact presence check before upload.
 */
import { resolve as resolvePath } from "node:path";
import { verifyCellArtifacts } from "../production/verifyCellArtifacts";

function main(): void {
  const cellId = process.env.CELL_ID ?? "";
  const status = process.env.CELL_STATUS ?? "";
  const root = resolvePath(process.cwd(), "artifacts");
  try {
    const result = verifyCellArtifacts({ artifactsRoot: root, cellId, status });
    if (!result.ok) {
      console.error(JSON.stringify({ ok: false, ...result }));
      process.exit(1);
    }
    console.log(JSON.stringify({ ok: true, required: result.required }));
  } catch (e) {
    console.error(JSON.stringify({ ok: false, errors: [e instanceof Error ? e.message : String(e)] }));
    process.exit(1);
  }
}

main();

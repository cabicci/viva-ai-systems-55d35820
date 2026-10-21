/** Read-only intake from any local source folder. Native content approval,
 * commerce registration and publication checks remain mandatory afterwards. */
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { normalizeCourse } from "../../src/lib/course-system/contract";

export function checkCourseFile(input: string) {
  const file = path.resolve(input), stat = fs.statSync(file);
  if (!stat.isFile() || stat.size > 25 * 1024 * 1024) throw new Error("COURSE_INPUT_SIZE");
  const bytes = fs.readFileSync(file);
  if (bytes.length > 25 * 1024 * 1024) throw new Error("COURSE_INPUT_SIZE");
  let input: unknown;
  try { input = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)); }
  catch { throw new Error("COURSE_JSON_INVALID"); }
  const contract = normalizeCourse(input);
  // Never print or copy protected teaching content. The source stays untouched.
  return { schemaVersion: contract.schemaVersion, area: contract.area, cardId: contract.id,
    stations: contract.stations.length, steps: contract.stations.reduce((sum, station) => sum + station.steps.length, 0),
    platform: contract.platform, sourceSha256: createHash("sha256").update(bytes).digest("hex"),
    contentApproved: false, accessGranted: false, published: false };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    if (args.length !== 2 || args[0] !== "--input") throw new Error("Usage: bun run course:check --input <course-data.json>");
    console.log(JSON.stringify(checkCourseFile(args[1]), null, 2));
  } catch (error) { console.error(error instanceof Error ? error.message : "COURSE_INTAKE_FAILED"); process.exitCode = 1; }
}

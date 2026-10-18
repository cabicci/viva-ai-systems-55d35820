import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { renderCurrentAcademicAuditSQL } from "./academic-audit-chain.mjs";

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const sqlArg = process.argv.indexOf("--sql");
  if (!process.argv.includes("--check") && sqlArg < 0)
    throw Error("Use --check or --sql NEW_REVIEW_FILE.sql; this tool never connects to a database");
  const { sql, report } = renderCurrentAcademicAuditSQL();
  if (sqlArg >= 0) {
    if (!process.argv[sqlArg + 1]) throw Error("Provide an explicit new SQL output path");
    writeFileSync(resolve(process.argv[sqlArg + 1]), sql, { encoding: "utf8", flag: "wx" });
  }
  console.log(JSON.stringify({ ...report, sqlRendered: sqlArg >= 0 }));
}

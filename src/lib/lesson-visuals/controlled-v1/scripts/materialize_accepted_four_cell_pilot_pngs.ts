/**
 * CLI: materialize accepted four-cell pilot PNGs into artifacts/controlled-v1/cells.
 * Fail-closed — never regenerates visuals; never contacts providers.
 */
import { materializeAcceptedFourCellPilotPngs } from "../materializeAcceptedFourCellPilotPngs";

const result = materializeAcceptedFourCellPilotPngs();
if (!result.ok) {
  console.error("BLOCKED_ACCEPTED_PNG_MATERIALIZE:");
  for (const err of result.errors) console.error(`  - ${err}`);
  process.exit(1);
}
console.log(
  `materialized ${result.materialized.length} accepted four-cell pilot PNG(s) with verified SHA-256`,
);
for (const path of result.materialized) console.log(`  ${path}`);

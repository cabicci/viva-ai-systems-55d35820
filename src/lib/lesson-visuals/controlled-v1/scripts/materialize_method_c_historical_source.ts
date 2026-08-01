/**
 * CLI: materialize Method C historical source from committed acceptance evidence.
 * Fail-closed — never regenerates JSON/visuals; never contacts the network.
 */
import { materializeMethodCHistoricalSource } from "../materializeMethodCHistoricalSource";

const result = materializeMethodCHistoricalSource();
if (!result.ok) {
  console.error("BLOCKED_METHOD_C_HISTORICAL_SOURCE_MATERIALIZE:");
  for (const err of result.errors) console.error(`  - ${err}`);
  process.exit(1);
}
console.log("materialized Method C historical source with verified SHA-256");
console.log(`  sourceRoot=${result.sourceRoot}`);
console.log(`  selectionPath=${result.selectionPath}`);
console.log(`  selectionSha256=${result.selectionSha256}`);
console.log(`  zipSha256=${result.zipSha256}`);

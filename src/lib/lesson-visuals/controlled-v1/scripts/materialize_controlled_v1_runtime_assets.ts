import { materializeControlledV1RuntimeAssets } from "../materializeControlledV1RuntimeAssets";

const result = materializeControlledV1RuntimeAssets();
if (!result.ok) {
  console.error("BLOCKED_CONTROLLED_V1_RUNTIME_MATERIALIZE:");
  for (const e of result.errors) console.error(` - ${e}`);
  process.exit(1);
}
console.log(
  JSON.stringify(
    {
      ok: true,
      materialized: result.materialized,
      assetRoot: result.assetRoot,
    },
    null,
    2,
  ),
);

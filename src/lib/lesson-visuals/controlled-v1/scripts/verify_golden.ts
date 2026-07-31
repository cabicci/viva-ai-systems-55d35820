#!/usr/bin/env bun
import { allGoldenReferencesOk, loadGoldenReferences, verifyGoldenReferences } from "../goldenRefs";

function main() {
  const refs = loadGoldenReferences();
  const results = verifyGoldenReferences(refs);
  const ok = allGoldenReferencesOk(results);

  for (const r of results) {
    const status = r.ok ? "OK" : "MISMATCH";
    console.log(
      `[${status}] ${r.id} sha256=${r.actualSha256 ?? "MISSING"} expected=${r.expectedSha256}`,
    );
  }

  console.log(JSON.stringify({ ok, count: results.length, results }, null, 2));

  if (!ok) {
    console.error("golden reference verification FAILED");
    process.exit(1);
  }
}

main();

// Regenerates src/lib/support/public-listing.json after curriculum titles/routes change.
// Usage: bun run scripts/support/generate-public-listing.ts
import { writeFileSync } from "node:fs";
import { buildPublicListing } from "./public-listing";

writeFileSync("src/lib/support/public-listing.json", `${JSON.stringify(buildPublicListing(), null, 1)}\n`);
console.log("support public listing written");

// @vitest-environment node
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
it("keeps the deployed legacy indexing algorithms and completed-job identities unchanged", () => {
  const files = [
    "src/lib/assistant-automation/manifest.ts",
    "src/lib/assistant-automation/worker.server.ts",
    "src/lib/card-assistant/corpus.ts",
    "src/lib/card-assistant/assistant.server.ts",
    "src/lib/academic-education/assistant-corpus.ts",
    "src/lib/academic-education/assistant.server.ts",
    "src/lib/rag/current-release/executor.server.ts",
    "src/lib/rag/current-release/corpus.ts",
  ];
  const hash = createHash("sha256");
  for (const file of files)
    hash
      .update(file)
      .update("\0")
      .update(readFileSync(file, "utf8").replace(/\r\n/g, "\n"))
      .update("\0");
  expect(hash.digest("hex")).toBe(
    "7b77862c43ee23e6e8d14c05464eda9225063f71c8b448a9fd91907be4008914",
  );
});

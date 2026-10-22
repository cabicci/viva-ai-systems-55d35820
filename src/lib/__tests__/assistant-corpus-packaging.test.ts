// @vitest-environment node
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { packCorpusJson, verifyEdgeCorpusPackaging } from "../../../scripts/assistant/edge-corpus-packaging";
import { decodePackedCorpus } from "../../../supabase/functions/assistant-runtime/packed-corpus";
const root = path.resolve(import.meta.dirname, "../../..");
describe("deployable immutable assistant corpus", () => {
  it.each([
    ["authoritative-corpus-lookup", "artifacts/rag/authoritative-lookup.json"],
    ["current-corpus-approval", "artifacts/rag/current/approval-snapshot.json"],
  ])("retains all original approved %s data through actual runtime decompression", async (name, artifact) => {
    const pack = JSON.parse(readFileSync(path.join(root, `supabase/functions/assistant-runtime/${name}.packed.json`), "utf8"));
    const original = JSON.parse(readFileSync(path.join(root, artifact), "utf8"));
    expect(await decodePackedCorpus(pack)).toEqual(original);
  });
  it("keeps the entire function source below the observed deployment limit with a margin", () => {
    expect(verifyEdgeCorpusPackaging(root).sourceBytes).toBeLessThanOrEqual(4000000);
  });
  it.each(["digest", "length", "gzip", "format", "oversized"])("fails closed before handler startup for invalid %s", async kind => {
    const pack = packCorpusJson({ concept: "النص المعتمد نفسه — unchanged approved text" });
    if (kind === "digest") pack.sha256 = "0".repeat(64);
    if (kind === "length") pack.byteLength--;
    if (kind === "gzip") pack.gzipBase64 = "AAAA";
    if (kind === "format") (pack as { format: string }).format = "unknown";
    if (kind === "oversized") pack.byteLength = 8000001;
    await expect(decodePackedCorpus(pack)).rejects.toThrow("ASSISTANT_CORPUS_PACK_INVALID");
  });
});

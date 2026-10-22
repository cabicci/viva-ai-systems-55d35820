import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { gzipSync, gunzipSync } from "node:zlib";
import type { PackedCorpus } from "../../supabase/functions/assistant-runtime/packed-corpus";

/** Preserve the exact deterministic UTF-8 artifact representation. */
export function packCorpusJson(value: unknown): PackedCorpus {
  const bytes = Buffer.from(JSON.stringify(value, null, 2) + "\n", "utf8");
  const pack: PackedCorpus = { format: "assistant-corpus-gzip-v1", byteLength: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"), gzipBase64: gzipSync(bytes, { level: 9 }).toString("base64") };
  if (pack.byteLength > 8000000 || pack.gzipBase64.length > 4000000) throw new Error("ASSISTANT_CORPUS_PACK_TOO_LARGE");
  return pack;
}
export function unpackCorpusJson(value: PackedCorpus): unknown {
  if (value.format !== "assistant-corpus-gzip-v1" || !Number.isSafeInteger(value.byteLength) || value.byteLength < 1 ||
    value.byteLength > 8000000 || typeof value.gzipBase64 !== "string" || value.gzipBase64.length > 4000000)
    throw new Error("ASSISTANT_CORPUS_PACK_INVALID");
  const bytes = gunzipSync(Buffer.from(value.gzipBase64, "base64"), { maxOutputLength: value.byteLength });
  if (bytes.length !== value.byteLength || createHash("sha256").update(bytes).digest("hex") !== value.sha256)
    throw new Error("ASSISTANT_CORPUS_PACK_INVALID");
  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
}
/** Runs before publication; extra files count too, not only the import graph. */
export function verifyEdgeCorpusPackaging(root: string): { sourceBytes: number } {
  const dir = path.join(root, "supabase/functions/assistant-runtime");
  const pairs = [["authoritative-corpus-lookup", "artifacts/rag/authoritative-lookup.json"],
    ["current-corpus-approval", "artifacts/rag/current/approval-snapshot.json"]];
  for (const [name, artifact] of pairs) {
    if (fs.existsSync(path.join(dir, name + ".json"))) throw new Error("ASSISTANT_UNPACKED_EDGE_CORPUS");
    const original = fs.readFileSync(path.join(root, artifact), "utf8").replace(/\r\n/g, "\n");
    const pack = JSON.parse(fs.readFileSync(path.join(dir, name + ".packed.json"), "utf8")) as PackedCorpus;
    if (pack.sha256 !== createHash("sha256").update(original).digest("hex") ||
      JSON.stringify(unpackCorpusJson(pack)) !== JSON.stringify(JSON.parse(original))) throw new Error("ASSISTANT_CORPUS_PACK_STALE");
  }
  function bytes(folder: string): number {
    return fs.readdirSync(folder, { withFileTypes: true }).reduce((sum, item) => sum +
      (item.isDirectory() ? bytes(path.join(folder, item.name)) : fs.statSync(path.join(folder, item.name)).size), 0);
  }
  const sourceBytes = bytes(dir);
  // The observed deployment rejects about 4.5 MB. Keep a margin and stop
  // integrations before deployment rather than shipping an oversized function.
  if (sourceBytes > 4000000) throw new Error("ASSISTANT_EDGE_SOURCE_TOO_LARGE");
  return { sourceBytes };
}

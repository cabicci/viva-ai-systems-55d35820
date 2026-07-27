/**
 * Server-private locked RAG corpus for Lovable-native importer.
 * Digests are computed from exact UTF-8 artifact text before JSON parse.
 * Module suffix `.server.ts` keeps this out of the browser bundle.
 */
import packageManifestRaw from "../../../../artifacts/rag/package-manifest.json?raw";
import chunkManifestRaw from "../../../../artifacts/rag/chunk-manifest.json?raw";
import chunksRaw from "../../../../artifacts/rag/chunks.json?raw";
import authoritativeLookupRaw from "../../../../artifacts/rag/authoritative-lookup.json?raw";

import { admitLockedCorpusFromRaw, type LockedCorpus } from "./admission";

let cached: LockedCorpus | null = null;

export async function loadLockedCorpus(): Promise<LockedCorpus> {
  if (cached) return cached;
  cached = await admitLockedCorpusFromRaw({
    packageManifestRaw,
    chunkManifestRaw,
    chunksRaw,
    authoritativeLookupRaw,
  });
  return cached;
}

/** Test-only: clear singleton between digest-mismatch harnesses. */
export function __resetLockedCorpusCacheForTests() {
  cached = null;
}

export { sha256Utf8 } from "./admission";

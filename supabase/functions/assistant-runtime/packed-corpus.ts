/** Decode committed corpus bytes once at module startup. No network, mutable
 * source, learner input or provider call is involved in corpus loading. */
export type PackedCorpus = { format: "assistant-corpus-gzip-v1"; byteLength: number; sha256: string; gzipBase64: string };
export async function decodePackedCorpus(value: unknown): Promise<unknown> {
  try {
    const p = value as PackedCorpus;
    if (!p || p.format !== "assistant-corpus-gzip-v1" || !Number.isSafeInteger(p.byteLength) ||
      p.byteLength < 1 || p.byteLength > 8000000 || !/^[a-f0-9]{64}$/.test(p.sha256) ||
      typeof p.gzipBase64 !== "string" || p.gzipBase64.length > 4000000 || p.gzipBase64.length % 4 !== 0 ||
      !/^[A-Za-z0-9+/]+={0,2}$/.test(p.gzipBase64)) throw new Error();
    const compressed = Uint8Array.from(atob(p.gzipBase64), char => char.charCodeAt(0));
    const stream = new Response(compressed).body!.pipeThrough(new DecompressionStream("gzip"));
    const reader = stream.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      while (true) {
        const next = await reader.read();
        if (next.done) break;
        size += next.value.byteLength;
        if (size > p.byteLength) throw new Error();
        chunks.push(next.value);
      }
    } finally { await reader.cancel().catch(() => {}); }
    if (size !== p.byteLength) throw new Error();
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    const digest = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)), x => x.toString(16).padStart(2, "0")).join("");
    if (digest !== p.sha256) throw new Error();
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch { throw new Error("ASSISTANT_CORPUS_PACK_INVALID"); }
}

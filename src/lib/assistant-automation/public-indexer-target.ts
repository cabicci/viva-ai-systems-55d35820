// Original project 658adce0-747d-4c8e-90e3-d22225070b94 only.
// Public identifiers from the existing main source contract; no credential/config transfer.
export const INDEXER_BACKEND_ORIGIN = "https://abyqqeboyrkkwhjpwmtd.supabase.co";
export const INDEXER_PUBLIC_ENDPOINT = "https://masaarat.ai/api/public/assistant-indexing";
export const PUBLIC_INDEXER_PATH = "/api/public/assistant-indexing";
export function assertIndexerBackend(value: string | undefined) {
  if (!value) throw new Error("AUTOMATION_BACKEND_URL_REQUIRED");
  const parsed = new URL(value);
  if (parsed.origin !== INDEXER_BACKEND_ORIGIN || parsed.username || parsed.password ||
      parsed.pathname !== "/" || parsed.search || parsed.hash) throw new Error("AUTOMATION_BACKEND_TARGET_MISMATCH");
  return INDEXER_BACKEND_ORIGIN;
}
export function assertPublicIndexerTarget(request: Request) {
  if (request.url !== INDEXER_PUBLIC_ENDPOINT) throw new Error("AUTOMATION_PUBLIC_TARGET_MISMATCH");
}

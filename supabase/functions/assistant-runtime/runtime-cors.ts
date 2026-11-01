// Restrict CORS to known origins (preview + published + local dev).
const ALLOWED_ORIGINS = new Set<string>([
  // Current project (viva-ai-systems)
  "https://viva-ai-systems.lovable.app",
  "https://658adce0-747d-4c8e-90e3-d22225070b94.lovableproject.com",
  "https://id-preview--658adce0-747d-4c8e-90e3-d22225070b94.lovable.app",
  "https://project--658adce0-747d-4c8e-90e3-d22225070b94.lovable.app",
  "https://project--658adce0-747d-4c8e-90e3-d22225070b94-dev.lovable.app",
  // Custom domain
  "https://masaarat.ai",
  "https://www.masaarat.ai",
  // Legacy / other previews kept for compatibility
  "https://ai-ecosystem-hub-72.lovable.app",
  "https://id-preview--db3e0659-63cc-4b7e-8985-61692a4adc4a.lovable.app",
  // Local dev
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:8080",
]);

export function corsHeadersFor(req: Request, backendUrl?: string): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  // The independently identified staging preview is admitted only by its own
  // backend. A production deployment never inherits this staging origin.
  const staging = backendUrl?.replace(/\/$/, "") === "https://rifujqqlqtfmopaukghn.supabase.co" &&
    (origin === "https://id-preview--0d675f0a-ecc5-4c62-9217-54973c927902.lovable.app" ||
      origin === "https://0d675f0a-ecc5-4c62-9217-54973c927902.lovableproject.com");
  const allowOrigin = ALLOWED_ORIGINS.has(origin) || staging ? origin : "";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

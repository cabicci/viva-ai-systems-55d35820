// Retired: Academic assistants use the authenticated application server through
// askAcademicAssistant (src/lib/academic-education/assistant.functions.ts).
// Keep a deterministic tombstone so an old deployment/client fails closed.
Deno.serve(() => new Response(JSON.stringify({ error: "ACADEMIC_EDGE_RETIRED" }), {
  status: 410, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
}));

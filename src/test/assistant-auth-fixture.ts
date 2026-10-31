import type { AuthGeneration, useAuth } from "@/lib/auth-context";

/** Explicit local principal fixture, never JWT/session/permission evidence.
 * Matches the real Auth contract and rotates its frozen equality token when
 * the test account changes, so old pending work must still be discarded.
 */
export function assistantAuthFixture(readActor: () => string | null): ReturnType<typeof useAuth> {
  let actor: string | null | undefined;
  let sequence = 0;
  let generation: AuthGeneration = Object.freeze({ value: sequence });
  let user: ReturnType<typeof useAuth>["user"] = null;
  const sync = () => {
    const next = readActor();
    if (next !== actor) {
      actor = next;
      generation = Object.freeze({ value: ++sequence });
      user = next ? { id: next, aud: "authenticated", role: "authenticated",
        app_metadata: {}, user_metadata: {}, created_at: "2026-10-31T00:00:00Z" } : null;
    }
  };
  return {
    get user() { sync(); return user; }, session: null, loading: false,
    get authGeneration() { sync(); return generation; },
    authContinuity: Object.freeze({ continuity: 0 }),
    isAuthGenerationCurrent(captured) { sync(); return captured === generation; },
    signOut: async () => {}, authError: null,
  };
}

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { currentReleaseFailureCode } from "@/lib/rag/current-release/contracts";

type AuthContext = { userId: string; supabase: { rpc(name: "has_role", args: { _user_id: string; _role: "admin" }): PromiseLike<{ data: unknown; error: unknown }> } };
async function authorize(context: AuthContext) {
  const { data, error } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (error || data !== true) throw new Error("FORBIDDEN");
}
async function dependencies() {
  const [{ supabaseAdmin }, { loadCurrentRelease }] = await Promise.all([
    import("@/integrations/supabase/client.server"), import("@/lib/rag/current-release/corpus.server"),
  ]);
  const admin = supabaseAdmin as unknown as { rpc(name: string, args: Record<string, unknown>): Promise<{ data: unknown; error: { message?: string } | null }> };
  return { authorized: async () => true, load: loadCurrentRelease,
    rpc: async (name: string, args: Record<string, unknown>) => {
      const { data, error } = await admin.rpc(name, args);
      if (error) throw new Error(/^CURRENT_[A-Z_]{1,64}$/.test(error.message ?? "") ? error.message : "CURRENT_DATABASE_UNAVAILABLE");
      return data;
    }, embed: async (texts: string[]) => {
      const key = process.env.OPENAI_API_KEY;
      if (!key) throw new Error("CURRENT_PROVIDER_UNAVAILABLE");
      const { createOpenAiEmbeddingFetcher } = await import("@/lib/rag/lovable-native/executor.server");
      return createOpenAiEmbeddingFetcher(key)(texts);
    },
  };
}
// Browser values express operator intent only. The server loads/validates every source and digest.
export const currentRagRequestSchema = z.object({
  operation: z.enum(["status", "initialize", "batch", "activate", "rollback"]),
  releaseId: z.string().regex(/^[a-f0-9]{64}$/), requestId: z.string().uuid(),
  executionId: z.string().uuid().optional(), expectedActiveVersion: z.string().max(250).nullable().optional(),
  confirmation: z.string().max(100).optional(),
}).strict();

export const getCurrentRagRelease = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await authorize(context);
    const d = await dependencies(), release = d.load();
    const status = await d.rpc("rag_current_status", { p_release_id: release.approval.releaseId });
    return { releaseId: release.approval.releaseId, indexVersion: release.approval.indexVersion,
      packages: Object.keys(release.approval.packages).length, chunks: release.chunks.length,
      status: status as { executionId: string | null; state: string | null; completedBatches: number; totalBatches: number;
        providerAttempts: number | null; currentActiveVersion: string | null; previousVersion: string | null } };
  });

export const runCurrentRagRelease = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => currentRagRequestSchema.parse(input))
  .handler(async ({ context, data }) => {
    await authorize(context);
    const { executeCurrentRelease } = await import("@/lib/rag/current-release/executor.server");
    // Errors expose no provider response, source payload or service credentials.
    try {
      const result = await executeCurrentRelease(data, await dependencies());
      return {
        executionId: typeof result.executionId === "string" ? result.executionId : null,
        done: result.done === true, replayed: result.replayed === true,
        committed: result.committed === true, activated: result.activated === true, rolledBack: result.rolledBack === true,
        providerCalls: typeof result.providerCalls === "number" ? result.providerCalls : 0,
        reusedChunks: typeof result.reusedChunks === "number" ? result.reusedChunks : 0,
        errorCode: null,
      };
    } catch (error) {
      // Auth was checked above. A failure never implies zero paid provider work.
      return { executionId: null, done: false, replayed: false, committed: false,
        activated: false, rolledBack: false, providerCalls: null, reusedChunks: null,
        errorCode: currentReleaseFailureCode(error) };
    }
  });

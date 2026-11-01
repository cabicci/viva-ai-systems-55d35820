import type { CurrentExecutorDependencies } from "./contracts";
import { currentDatabaseCall } from "./failure.server";

/** Shared native transport for interactive administrators and the separately
 * authenticated automatic worker. The caller owns authorization. */
export async function currentReleaseDependencies(options: { beforeEmbedding?: () => Promise<void> } = {}): Promise<CurrentExecutorDependencies> {
  const [{ supabaseAdmin }, { loadCurrentRelease }] = await Promise.all([
    import("@/integrations/supabase/client.server"), import("./corpus.server"),
  ]);
  const admin = supabaseAdmin as unknown as { rpc(name: string, args: Record<string, unknown>): Promise<{ data: unknown; error: { message?: string; code?: string } | null; status?: number }> };
  return { authorized: async () => true, load: loadCurrentRelease,
    rpc: (name, args) => currentDatabaseCall(() => admin.rpc(name, args)),
    embed: async texts => {
      const key = process.env.OPENAI_API_KEY;
      if (!key) throw new Error("CURRENT_PROVIDER_UNAVAILABLE");
      await options.beforeEmbedding?.();
      const { createOpenAiEmbeddingFetcher } = await import("../lovable-native/embedding-provider.server");
      return createOpenAiEmbeddingFetcher(key)(texts);
    },
  };
}

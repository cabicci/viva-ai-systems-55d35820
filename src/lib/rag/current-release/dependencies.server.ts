import type { CurrentExecutorDependencies } from "./contracts";

/** Shared native transport for interactive administrators and the separately
 * authenticated automatic worker. The caller owns authorization. */
export async function currentReleaseDependencies(options: { beforeEmbedding?: () => Promise<void> } = {}): Promise<CurrentExecutorDependencies> {
  const [{ supabaseAdmin }, { loadCurrentRelease }] = await Promise.all([
    import("@/integrations/supabase/client.server"), import("./corpus.server"),
  ]);
  const admin = supabaseAdmin as unknown as { rpc(name: string, args: Record<string, unknown>): Promise<{ data: unknown; error: { message?: string; code?: string } | null }> };
  return { authorized: async () => true, load: loadCurrentRelease,
    rpc: async (name, args) => {
      const { data, error } = await admin.rpc(name, args);
      if (error) throw new Error(/^CURRENT_[A-Z0-9_]{1,64}$/.test(error.message ?? "") ? error.message
        : /^[0-9A-Z]{5}$/.test(error.code ?? "") ? `CURRENT_DATABASE_${error.code}` : "CURRENT_DATABASE_UNAVAILABLE");
      return data;
    }, embed: async texts => {
      const key = process.env.OPENAI_API_KEY;
      if (!key) throw new Error("CURRENT_PROVIDER_UNAVAILABLE");
      await options.beforeEmbedding?.();
      const { createOpenAiEmbeddingFetcher } = await import("../lovable-native/executor.server");
      return createOpenAiEmbeddingFetcher(key)(texts);
    },
  };
}

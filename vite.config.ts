// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { loadEnv } from "vite";
import path from "node:path";
import { computeAssistantBuildIdentities } from "./scripts/assistant/indexer-build.mjs";

// Queue receipts track the algorithm; readiness also binds compiled sources and protected routes.
const { indexerBuild: assistantIndexerBuild, deploymentFingerprint: assistantDeploymentFingerprint } =
  computeAssistantBuildIdentities(__dirname);

// Load all env vars into process.env for server routes only (never into envDefine/client bundle).
const serverEnv = loadEnv(process.env.NODE_ENV ?? "production", process.cwd(), "");
Object.assign(process.env, serverEnv);

const SUPABASE_URL_FALLBACK = "https://abyqqeboyrkkwhjpwmtd.supabase.co";
const SUPABASE_PUBLISHABLE_KEY_FALLBACK = "sb_publishable_3MyGQEicwQZylzNYIufi8g_fzNWmwgX";

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
// @cloudflare/vite-plugin builds from this — wrangler.jsonc main alone is insufficient.
export default defineConfig({
  vite: {
    resolve: {
      alias: [
        { find: "entities/lib/decode.js", replacement: path.resolve(__dirname, "node_modules/entities/lib/decode.js") },
        { find: "entities/lib/encode.js", replacement: path.resolve(__dirname, "node_modules/entities/lib/encode.js") },
        // Bind the bare legacy entry only. Modern htmlparser2 must resolve its
        // own entities/decode export instead of being redirected to entities 4.
        { find: /^entities$/, replacement: path.resolve(__dirname, "node_modules/entities") },
      ],
    },
    define: {
      __ASSISTANT_INDEXER_BUILD__: JSON.stringify(assistantIndexerBuild),
      __ASSISTANT_INDEXER_DEPLOYMENT__: JSON.stringify(assistantDeploymentFingerprint),
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(process.env.VITE_SUPABASE_URL || SUPABASE_URL_FALLBACK),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(
        process.env.VITE_SUPABASE_PUBLISHABLE_KEY || SUPABASE_PUBLISHABLE_KEY_FALLBACK,
      ),
    },
  },
  tanstackStart: {
    server: { entry: "server" },
  },
});

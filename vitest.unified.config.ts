import { defineConfig, mergeConfig } from "vitest/config";
import base from "./vitest.config.ts";

// Keep test caches inside this isolated worktree even when dependencies are
// linked from a shared read-only cache. No environment or provider setup here.
export default mergeConfig(base, defineConfig({ cacheDir: ".unified-test-cache" }));

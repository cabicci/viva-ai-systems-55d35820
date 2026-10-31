import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";
export default defineConfig({
  plugins: [react()],
  cacheDir: "../evidence/vite-cache",
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
  test: { environment: "node", include: ["tests/rag-local/*.test.{ts,tsx}"],
    testTimeout: 30000, hookTimeout: 60000, maxWorkers: 1, fileParallelism: false },
});

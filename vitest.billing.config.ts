import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["src/lib/billing/__tests__/stripe-*.test.ts"],
    testTimeout: 15000,
    hookTimeout: 30000,
  },
});

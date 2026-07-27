import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import fs from "node:fs";
import type { Plugin } from "vite";

/** Support Vite `?raw` imports under Vitest (corpus UTF-8 digest locks). */
function rawImportPlugin(): Plugin {
  return {
    name: "vitest-raw-import",
    load(id) {
      if (!id.includes("?raw")) return;
      const filePath = id.split("?")[0]!;
      if (!fs.existsSync(filePath)) return;
      const text = fs.readFileSync(filePath, "utf8");
      return `export default ${JSON.stringify(text)}`;
    },
  };
}

export default defineConfig({
  plugins: [rawImportPlugin(), tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}", "tests/lesson-visuals/v1/**/*.{test,spec}.{ts,tsx}"],
    css: false,
  },
});

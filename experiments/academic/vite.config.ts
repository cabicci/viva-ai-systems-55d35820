import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
export default defineConfig({
  root: path.resolve("experiments/academic"),
  publicDir: path.resolve("public"),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      {
        find: "@/lib/learning-lines",
        replacement: path.resolve("experiments/academic/adapters/lines.ts"),
      },
      {
        find: "@/lib/auth-context",
        replacement: path.resolve("experiments/academic/adapters/account.tsx"),
      },
      {
        find: "@/lib/entitlements",
        replacement: path.resolve("experiments/academic/adapters/account.tsx"),
      },
      { find: "@", replacement: path.resolve("src") },
    ],
  },
  server: { host: "127.0.0.1", port: 4178, strictPort: true },
  build: { outDir: path.resolve("tmp/academic-preview"), emptyOutDir: true },
});

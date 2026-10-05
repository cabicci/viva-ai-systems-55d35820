import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
export default defineConfig({
  root: path.resolve("experiments/academic"),
  publicDir: path.resolve("public"),
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": path.resolve("src") } },
  server: { host: "127.0.0.1", port: 4178, strictPort: true },
  build: { outDir: path.resolve("tmp/academic-preview"), emptyOutDir: true },
});

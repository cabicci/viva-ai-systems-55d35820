import {defineConfig} from 'vite';
import {resolve} from 'node:path';
export default defineConfig({
  base: './',
  server: {
    fs: {allow: [resolve(__dirname, '../../../..')]},
    // Large media files can be locked while being copied on Windows.
    // They are served on request and do not need development file watchers.
    watch: {ignored: (path: string) => /\/public\/media(?:\/|$)/.test(path.replace(/\\/g, '/'))},
  },
  build: {outDir: 'dist', emptyOutDir: true},
});

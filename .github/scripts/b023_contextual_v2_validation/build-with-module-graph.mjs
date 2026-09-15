// DRAFT: normal Vite application build plus a read-only Rollup graph observer.
// This helper writes build output and external receipts, never source/config files.
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { candidate, localBuildEnvironment, requireValue, sha256File } from "./local-guards.mjs";

const ACTIVE_ROOTS = [
  "src/components/intro/IntroLessonRenderer.tsx",
  "src/lib/locale-lessons/adapt-localized-package-to-intro-content.ts",
  "src/components/image-gallery/GalleryGrid.tsx",
];
const RESOLVER = "src/lib/lesson-visuals/contextual-v2/runtime/contextualV2BrowserResolver.ts";
const MANIFEST = "src/lib/lesson-visuals/contextual-v2/runtime/contextualV2BrowserManifest.json";
const normalized = (id) => id.replaceAll("\\", "/").split("?")[0].split("#")[0];

function forbidden(id) {
  const path = `/${normalized(id)}`;
  return /\/src\/components\/intro\/diagrams\/LessonDiagrams\.[cm]?[jt]sx?$/.test(path) ||
    /\/src\/lib\/lesson-visuals\/controlled-v1\/runtime\//.test(path) ||
    /\/src\/lib\/locale-lessons\/(strict-localized-visual-policy|strict-visual-assets)\.[cm]?[jt]sx?$/.test(path) ||
    /\/src\/assets\/(lessons|lesson-visuals\/controlled-v1)\//.test(path);
}

export function createModuleGraphObserver({ repo, receive }) {
  return {
    name: "b023-active-client-module-graph-observer",
    apply: "build",
    enforce: "post",
    generateBundle(_options, bundle) {
      if (this.environment?.name !== "client") return;
      const rows = [...this.getModuleIds()].map((id) => {
        const info = this.getModuleInfo(id);
        return {
          id,
          importedIds: info?.importedIds ?? [],
          dynamicallyImportedIds: info?.dynamicallyImportedIds ?? [],
          external: Boolean(info?.isExternal),
        };
      });
      const byId = new Map(rows.map((row) => [row.id, row]));
      const emitted = new Set(Object.values(bundle)
        .filter((item) => item.type === "chunk")
        .flatMap((chunk) => Object.keys(chunk.modules)));
      const display = (id) => {
        const clean = normalized(id);
        const prefix = `${normalized(repo).replace(/\/$/, "")}/`;
        return clean.startsWith(prefix) ? clean.slice(prefix.length) : clean;
      };
      function traverse(root) {
        const starts = rows.filter((row) => display(row.id) === root).map((row) => row.id);
        if (!starts.length) throw new Error(`Expected client graph root absent: ${root}`);
        if (!starts.some((id) => emitted.has(id))) throw new Error(`Client root not present in emitted chunks: ${root}`);
        const seen = new Set();
        const todo = [...starts];
        while (todo.length) {
          const id = todo.pop();
          if (seen.has(id)) continue;
          seen.add(id);
          const info = byId.get(id);
          if (info) todo.push(...info.importedIds, ...info.dynamicallyImportedIds);
        }
        return { root, ids: [...seen], resolvedDependencies: seen.size, emittedDependencies: [...seen].filter((id) => emitted.has(id)).length };
      }
      const roots = ACTIVE_ROOTS.map(traverse);
      const violations = roots.flatMap((entry) => entry.ids.filter(forbidden).map((id) => ({ root: entry.root, module: display(id) })));
      const resolver = traverse(RESOLVER);
      const imageImports = resolver.ids.filter((id) => /\.(png|jpe?g|webp|svg|gif|avif)$/i.test(normalized(id)));
      if (!resolver.ids.some((id) => display(id) === MANIFEST)) throw new Error("Contextual resolver graph does not contain its browser manifest");
      const graph = {
        result: violations.length || imageImports.length ? "FAIL" : "PASS",
        environment: "client",
        graphKind: "Rollup resolved static and dynamic imports; scoped to three active source roots",
        roots: roots.map(({ ids, ...row }) => ({ ...row, reachableModules: ids.map(display).sort() })),
        violations,
        resolverImageImports: imageImports.map(display),
        resolverUsesManifest: true,
        nodes: rows.map((row) => ({
          id: display(row.id),
          importedIds: row.importedIds.map(display),
          dynamicallyImportedIds: row.dynamicallyImportedIds.map(display),
          external: row.external,
          emitted: emitted.has(row.id),
        })),
      };
      receive(graph);
      if (graph.result !== "PASS") throw new Error("Legacy image dependencies remain reachable from active roots; inspect external graph receipt");
    },
  };
}

async function main() {
  const { repo, head } = candidate();
  const localSupabaseOrigin = localBuildEnvironment();
  const out = resolve(requireValue("B023_BUILD_GRAPH_RECEIPT"));
  const rel = relative(repo, out);
  if (!(rel === ".." || rel.startsWith("../") || rel.startsWith("..\\") || isAbsolute(rel))) {
    throw new Error("Graph receipt must be outside the checkout");
  }
  mkdirSync(dirname(out), { recursive: true });
  const bun = requireValue("B023_BUN_BIN");
  const requireRepo = createRequire(join(repo, "package.json"));
  const packageJson = requireRepo("./package.json");
  const expectedBuild = "bun run roadmap:guard && bun run contextual-visuals:verify && vite build";
  if (packageJson.scripts?.build !== expectedBuild) {
    throw new Error("Build script differs from the reviewed B023 sequence; inspect rather than skipping a build step");
  }
  const receipt = {
    result: "FAIL", head, localSupabaseOrigin,
    browserManifestSha256: sha256File(join(repo, MANIFEST)),
    buildScript: packageJson.scripts.build,
    productConfig: "vite.config.ts",
  };
  try {
    execFileSync(bun, ["run", "roadmap:guard"], { cwd: repo, env: process.env, stdio: "inherit" });
    execFileSync(bun, ["run", "contextual-visuals:verify"], { cwd: repo, env: process.env, stdio: "inherit" });
    const { createBuilder } = await import(pathToFileURL(requireRepo.resolve("vite")).href);
    const plugin = createModuleGraphObserver({ repo, receive: (graph) => {
      receipt.graph = graph;
      writeFileSync(out, `${JSON.stringify(receipt, null, 2)}\n`);
    } });
    const builder = await createBuilder({ root: repo, configFile: join(repo, "vite.config.ts"), plugins: [plugin] });
    await builder.buildApp();
    if (receipt.graph?.result !== "PASS") throw new Error("Client graph observer did not produce a passing receipt");
    candidate();
    receipt.result = "PASS";
  } catch (error) {
    receipt.error = error.message;
    process.exitCode = 1;
  }
  writeFileSync(out, `${JSON.stringify(receipt, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify({ result: receipt.result, head, receipt: out, roots: receipt.graph?.roots.map((x) => x.root), error: receipt.error }, null, 2)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await main();

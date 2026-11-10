// Exercise the actual private transport in workerd with no internet access.
import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import { copyFile, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const workerd = require("workerd");
const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const wrangler = await readFile(join(root, "wrangler.jsonc"), "utf8");
const date = wrangler.match(/"compatibility_date"\s*:\s*"([0-9-]+)"/)?.[1];
const flags = wrangler.match(/"compatibility_flags"\s*:\s*(\[[^\]]*\])/)?.[1];
if (!date || !flags) throw new Error("Worker compatibility settings missing");
const directory = await mkdtemp(join(tmpdir(), "masaarat-phone-worker-"));
try {
  await build({
    entryPoints: [join(root, "scripts/communications/worker-fixture/verify.mjs")],
    bundle: true,
    platform: "neutral",
    format: "esm",
    outfile: join(directory, "worker.bundle.mjs"),
  });
  await copyFile(
    join(root, "scripts/communications/worker-fixture/provider.mjs"),
    join(directory, "provider.mjs"),
  );
  await writeFile(
    join(directory, "test.capnp"),
    `
using Workerd = import "/workerd/workerd.capnp";
const config :Workerd.Config = (
  services = [
    (name = "test", worker = (
      compatibilityDate = "${date}", compatibilityFlags = ${flags},
      modules = [(name = "worker.bundle.mjs", esModule = embed "worker.bundle.mjs")],
      globalOutbound = "provider"
    )),
    (name = "provider", worker = (
      compatibilityDate = "${date}",
      modules = [(name = "provider.mjs", esModule = embed "provider.mjs")],
      globalOutbound = "blocked"
    )),
    (name = "blocked", network = (allow = []))
  ]
);
`,
  );
  console.log(`Phone transport: workerd ${workerd.version}; compatibility ${date}`);
  execFileSync(workerd.default, ["test", join(directory, "test.capnp")], {
    cwd: directory,
    stdio: "inherit",
    timeout: 30_000,
  });
} finally {
  await rm(directory, { recursive: true, force: true });
}

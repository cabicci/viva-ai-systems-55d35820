import assert from "node:assert/strict";
import { test, after } from "node:test";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  copyFileSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { captureLocalRoadmapState } from "../roadmap-state";

const here = dirname(fileURLToPath(import.meta.url));
const guard = process.env.MASAARAT_O06_GUARD_UNDER_TEST
  ? resolve(process.env.MASAARAT_O06_GUARD_UNDER_TEST)
  : resolve(here, "../roadmap-guard.ts");
const selected = process.env.MASAARAT_O06_CASE_PATTERN
  ? new RegExp(process.env.MASAARAT_O06_CASE_PATTERN)
  : /.*/;
const env = Object.fromEntries(
  ["PATH", "Path", "SystemRoot", "SYSTEMROOT", "TEMP", "TMP", "COMSPEC", "PATHEXT"]
    .map((key) => [key, process.env[key]])
    .filter((entry): entry is [string, string] => typeof entry[1] === "string"),
);
Object.assign(env, {
  GIT_CONFIG_NOSYSTEM: "1",
  GIT_CONFIG_GLOBAL: process.platform === "win32" ? "NUL" : "/dev/null",
  GIT_TERMINAL_PROMPT: "0",
});
const fixtureRoot = realpathSync(tmpdir());
const dirs: string[] = [];
after(() => {
  for (const dir of dirs) {
    const owned = realpathSync(dir);
    assert.equal(owned, dir);
    assert.equal(dirname(owned), fixtureRoot);
    rmSync(owned, { recursive: true, force: true });
  }
});
function fixture() {
  const dir = mkdtempSync(resolve(fixtureRoot, "masaarat-o06-"));
  dirs.push(dir);
  return dir;
}
function git(root: string, ...args: string[]) {
  return execFileSync("git", ["-C", root, ...args], {
    encoding: "utf8",
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });
}
function put(root: string, path: string, text: string) {
  const dest = resolve(root, path);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, text);
}
function repo() {
  const dir = fixture();
  git(dir, "init", "--quiet");
  put(dir, "src/example.ts", "export const value=1;\n");
  git(dir, "add", "--", "src/example.ts");
  git(
    dir,
    "-c",
    "user.name=Synthetic local test",
    "-c",
    "user.email=synthetic@example.invalid",
    "commit",
    "--quiet",
    "-m",
    "Synthetic baseline",
  );
  return dir;
}
function run(root: string, ...args: string[]) {
  const child = spawnSync(process.execPath, ["--no-install", guard, ...args], {
    cwd: root,
    encoding: "utf8",
    env,
  });
  assert.equal(child.error, undefined);
  return child;
}
function putBuildGuard(dir: string) {
  mkdirSync(resolve(dir, "scripts"), { recursive: true });
  copyFileSync(guard, resolve(dir, "scripts/roadmap-guard.ts"));
  copyFileSync(resolve(here, "../roadmap-state.ts"), resolve(dir, "scripts/roadmap-state.ts"));
  put(
    dir,
    "package.json",
    JSON.stringify({
      scripts: {
        build: "bun run roadmap:guard --for-build",
        "roadmap:guard": "bun run scripts/roadmap-guard.ts",
      },
    }),
  );
}
function runPackageScript(dir: string, script: string, extraEnv?: NodeJS.ProcessEnv) {
  const result = spawnSync(process.execPath, ["run", script], {
    cwd: dir,
    encoding: "utf8",
    env: { ...env, ...extraEnv },
  });
  assert.equal(result.error, undefined);
  return result;
}
function record(root: string) {
  const state = captureLocalRoadmapState(root);
  put(
    root,
    ".lovable/roadmap-sync.md",
    `[roadmap:synthetic-item]\nbase-head: ${state.baseHead}\nstate-sha256: ${state.stateSha256}\n`,
  );
  return state;
}
const cases: [string, () => void][] = [
  [
    "staged rename from scoped source to unscoped destination retains deletion",
    () => {
      const dir = repo();
      git(dir, "config", "diff.renames", "true");
      git(dir, "mv", "src/example.ts", "notes.txt");
      assert.ok(captureLocalRoadmapState(dir).changedTrackedFiles.includes("src/example.ts"));
      assert.equal(run(dir).status, 1);
    },
  ],
  [
    "actual clean repository passes with an explicit bounded message",
    () => {
      const dir = repo();
      const result = run(dir);
      assert.equal(result.status, 0);
      assert.match(result.stdout, /No uncommitted scoped changes/);
    },
  ],
  [
    "self-marker-only script change must not satisfy the guard",
    () => {
      const dir = repo();
      put(dir, "scripts/roadmap-guard.ts", 'const marker="[roadmap:self]";');
      assert.equal(run(dir).status, 1);
    },
  ],
  [
    "Git failure must not be reported as a passing empty change set",
    () => {
      const dir = fixture();
      const result = run(dir);
      assert.equal(result.status, 1);
      assert.doesNotMatch(result.stdout, /passed/i);
    },
  ],
  [
    "plan text alone is not a change-bound roadmap record",
    () => {
      const dir = repo();
      put(dir, "src/example.ts", "export const value=2;");
      put(dir, ".lovable/plan.md", "[roadmap:synthetic-plan]");
      assert.equal(run(dir).status, 1);
    },
  ],
  [
    "exact local record passes then rejects a subsequent edit",
    () => {
      const dir = repo();
      put(dir, "src/example.ts", "export const value=2;");
      record(dir);
      assert.equal(run(dir).status, 0);
      put(dir, "src/example.ts", "export const value=3;");
      assert.equal(run(dir).status, 1);
    },
  ],
  [
    "staged contents bind even when working contents return to HEAD",
    () => {
      const dir = repo();
      put(dir, "src/example.ts", "export const value=2;");
      git(dir, "add", "--", "src/example.ts");
      put(dir, "src/example.ts", "export const value=1;\n");
      record(dir);
      assert.equal(run(dir).status, 0);
      put(dir, "src/example.ts", "export const value=3;");
      git(dir, "add", "--", "src/example.ts");
      put(dir, "src/example.ts", "export const value=1;\n");
      assert.equal(run(dir).status, 1);
    },
  ],
  [
    "untracked source addition and tracked deletion need their own record",
    () => {
      const dir = repo();
      put(dir, "src/space name.ts", "export const synthetic=true;");
      rmSync(resolve(dir, "src/example.ts"));
      const state = record(dir);
      assert.deepEqual(state.changedTrackedFiles, ["src/example.ts", "src/space name.ts"]);
      assert.equal(run(dir).status, 0);
      put(dir, "src/space name.ts", "export const synthetic=false;");
      assert.equal(run(dir).status, 1);
    },
  ],
  [
    "changed HEAD invalidates a bound record while source remains pending",
    () => {
      const dir = repo();
      put(dir, "src/example.ts", "export const value=2;");
      record(dir);
      put(dir, "documentation.txt", "synthetic checkpoint");
      git(dir, "add", "--", "documentation.txt");
      git(
        dir,
        "-c",
        "user.name=Synthetic local test",
        "-c",
        "user.email=synthetic@example.invalid",
        "commit",
        "--quiet",
        "-m",
        "Synthetic independent checkpoint",
      );
      assert.equal(run(dir).status, 1);
    },
  ],
  [
    "unbound and duplicated digest fields are rejected",
    () => {
      const dir = repo();
      put(dir, "src/example.ts", "export const value=2;");
      record(dir);
      const path = resolve(dir, ".lovable/roadmap-sync.md");
      writeFileSync(path, readFileSync(path, "utf8") + "state-sha256: " + "0".repeat(64) + "\n");
      assert.equal(run(dir).status, 1);
    },
  ],
  [
    "repository subdirectory cannot silently masquerade as a clean checkout",
    () => {
      const dir = repo();
      assert.equal(run(resolve(dir, "src")).status, 1);
    },
  ],
];
for (const [name, fn] of cases) if (selected.test(name)) test(name, fn);

test("an exported package build reports a skip while its direct guard fails", () => {
  const dir = fixture();
  putBuildGuard(dir);
  const build = runPackageScript(dir, "build");
  assert.equal(build.status, 0, build.stderr);
  assert.match(build.stdout, /Roadmap binding skipped for exported source/);
  assert.equal(runPackageScript(dir, "roadmap:guard").status, 1);
});

test("the build guard rejects scoped changes in a Git checkout", () => {
  const dir = repo();
  putBuildGuard(dir);
  put(dir, "src/example.ts", "export const value=2;\n");
  const build = runPackageScript(dir, "build");
  assert.equal(build.status, 1);
  assert.match(build.stderr, /Changed project files require their own changed roadmap record/);
});

test("the build guard rejects invalid or explicitly missing Git metadata", () => {
  const dir = fixture();
  putBuildGuard(dir);
  const declared = runPackageScript(dir, "build", { GIT_DIR: resolve(dir, "missing-git") });
  assert.equal(declared.status, 1);
  assert.doesNotMatch(declared.stdout, /skipped/);
  put(dir, ".git", "invalid synthetic Git metadata\n");
  const corrupt = runPackageScript(dir, "build");
  assert.equal(corrupt.status, 1);
  assert.doesNotMatch(corrupt.stdout, /skipped/);
});

test("the exported build flag cannot skip a different working directory", () => {
  const result = run(fixture(), "--for-build");
  assert.equal(result.status, 1);
  assert.doesNotMatch(result.stdout, /skipped/);
});

test("a filename with Git pattern characters does not bind an unrelated index entry", () => {
  const dir = repo();
  const path = "src/[e]xample.ts";
  const contents = "export const synthetic = true;\n";
  put(dir, path, contents);
  const state = captureLocalRoadmapState(dir);
  assert.deepEqual(state.changedTrackedFiles, [path]);
  const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");
  assert.equal(
    state.stateSha256,
    sha256(
      JSON.stringify({
        version: 1,
        baseHead: state.baseHead,
        entries: [{ path, index: [], worktree: { kind: "file", sha256: sha256(contents) } }],
      }),
    ),
  );
});

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export function requireValue(name) {
  const value = (process.env[name] || "").trim();
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

export function localOrigin(value, name) {
  const url = new URL(value);
  if (
    url.protocol !== "http:" ||
    !["127.0.0.1", "[::1]", "localhost"].includes(url.hostname) ||
    url.username || url.password || url.pathname !== "/" || url.search || url.hash
  ) throw new Error(`${name} must be an HTTP loopback origin without credentials or a path`);
  return url.origin;
}

export function sha256File(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

export function candidate() {
  if (requireValue("B023_DISPOSABLE_LOCAL_ONLY") !== "1") {
    throw new Error("Explicit disposable-local execution marker required");
  }
  const repo = resolve(requireValue("B023_REPO_ROOT"));
  const head = requireValue("B023_EXPECTED_GIT_HEAD").toLowerCase();
  if (!/^[a-f0-9]{40}$/.test(head)) throw new Error("Expected exact 40-hex candidate HEAD");
  const actual = execFileSync("git", ["-C", repo, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  if (actual !== head) throw new Error("Candidate HEAD mismatch");
  const dirty = execFileSync("git", ["-C", repo, "status", "--porcelain=v1", "--untracked-files=all"], { encoding: "utf8" });
  if (dirty.trim()) throw new Error("A clean local atomic image commit is required for exact browser/build provenance");
  return { repo, head };
}

export function localBuildEnvironment() {
  const origin = localOrigin(requireValue("B023_LOCAL_SUPABASE_ORIGIN"), "B023_LOCAL_SUPABASE_ORIGIN");
  for (const name of ["VITE_SUPABASE_URL", "SUPABASE_URL"]) {
    if (localOrigin(requireValue(name), name) !== origin) throw new Error(`${name} differs from local Supabase origin`);
  }
  const key = requireValue("VITE_SUPABASE_PUBLISHABLE_KEY");
  if (requireValue("SUPABASE_PUBLISHABLE_KEY") !== key) throw new Error("Client/SSR local public keys differ");
  return origin;
}

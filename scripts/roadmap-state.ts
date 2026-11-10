/** Local uncommitted-change binding, not evidence of a remote roadmap write. */
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { lstatSync, readFileSync } from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";

const MARKER = ".lovable/roadmap-sync.md";
const PREFIXES = [
  "src/",
  "supabase/migrations/",
  "drizzle/",
  "scripts/",
  "public/",
  "app/",
  "tests/",
  "docs/",
];
const FILES = [
  "START_HERE.md",
  "AGENTS.md",
  "package.json",
  "vite.config.ts",
  "tsconfig.json",
  "tailwind.config.ts",
];
const EXCLUDED = [
  "src/routeTree.gen.ts",
  "src/integrations/supabase/types.ts",
  "bun.lockb",
  "package-lock.json",
];
export const ROADMAP_MARKER_PATH = MARKER;

export type LocalRoadmapState = {
  baseHead: string;
  changedTrackedFiles: string[];
  stateSha256: string;
  markerChanged: boolean;
};
function git(root: string, args: string[]): string {
  try {
    return execFileSync("git", ["-C", root, ...args], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch {
    throw new Error("ROADMAP_GIT_STATE_UNAVAILABLE");
  }
}
function meaningful(file: string): boolean {
  return (
    !EXCLUDED.includes(file) &&
    (FILES.includes(file) || PREFIXES.some((prefix) => file.startsWith(prefix)))
  );
}
export function captureLocalRoadmapState(root = process.cwd()): LocalRoadmapState {
  root = resolve(root);
  if (git(root, ["rev-parse", "--show-prefix"]).trim() !== "")
    throw new Error("ROADMAP_RUN_FROM_REPOSITORY_ROOT");
  const baseHead = git(root, ["rev-parse", "--verify", "HEAD"]).trim();
  if (!/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(baseHead)) throw new Error("ROADMAP_HEAD_INVALID");
  const paths = [
    ...new Set(
      [
        ...git(root, ["diff", "--no-renames", "--name-only", "-z", "HEAD", "--"]).split("\0"),
        ...git(root, ["diff", "--cached", "--no-renames", "--name-only", "-z", "--"]).split("\0"),
        ...git(root, ["ls-files", "--others", "--exclude-standard", "-z"]).split("\0"),
      ].filter(Boolean),
    ),
  ].sort();
  const changedTrackedFiles = paths.filter(meaningful);
  const entries = changedTrackedFiles.map((file) => {
    const absolute = resolve(root, file);
    const rel = relative(root, absolute);
    if (
      isAbsolute(file) ||
      isAbsolute(rel) ||
      rel === ".." ||
      rel.startsWith("../") ||
      rel.startsWith("..\\")
    )
      throw new Error("ROADMAP_PATH_OUTSIDE_REPOSITORY");
    const index = git(root, ["ls-files", "--stage", "-z", "--", file])
      .split("\0")
      .filter(Boolean)
      .map((entry) => {
        const match = /^(\d+) ([a-f0-9]+) ([0-3])\t/.exec(entry);
        if (!match || match[3] !== "0") throw new Error("ROADMAP_UNMERGED_INDEX");
        return { mode: match[1], objectId: match[2] };
      });
    let worktree: { kind: "deleted" } | { kind: "file"; sha256: string };
    try {
      const stat = lstatSync(absolute);
      if (!stat.isFile() || stat.isSymbolicLink())
        throw new Error("ROADMAP_UNSUPPORTED_CHANGED_FILE");
      worktree = {
        kind: "file",
        sha256: createHash("sha256").update(readFileSync(absolute)).digest("hex"),
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      worktree = { kind: "deleted" };
    }
    return { path: file, index, worktree };
  });
  const stateSha256 = createHash("sha256")
    .update(JSON.stringify({ version: 1, baseHead, entries }))
    .digest("hex");
  return { baseHead, changedTrackedFiles, stateSha256, markerChanged: paths.includes(MARKER) };
}

export function inspectRoadmapBinding(
  state: LocalRoadmapState,
  marker: string | null,
): { ok: boolean; reason: string } {
  if (!state.changedTrackedFiles.length)
    return {
      ok: true,
      reason: "No uncommitted scoped changes; remote roadmap status not verified.",
    };
  if (!state.markerChanged || marker === null)
    return { ok: false, reason: "Changed project files require their own changed roadmap record." };
  if (!/^\[roadmap:[a-zA-Z0-9_-]{1,128}\]$/m.test(marker))
    return { ok: false, reason: "Roadmap item reference missing or malformed." };
  const heads = [...marker.matchAll(/^base-head: ([a-f0-9]+)$/gm)];
  const digests = [...marker.matchAll(/^state-sha256: ([a-f0-9]+)$/gm)];
  if (
    heads.length !== 1 ||
    heads[0]?.[1] !== state.baseHead ||
    digests.length !== 1 ||
    digests[0]?.[1] !== state.stateSha256
  )
    return {
      ok: false,
      reason: "Roadmap record does not match the current HEAD, index and working files.",
    };
  return {
    ok: true,
    reason: "Local change binding verified; remote roadmap persistence not verified by this guard.",
  };
}

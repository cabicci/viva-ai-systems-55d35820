import { existsSync, readFileSync } from "node:fs";
import { execSync } from "node:child_process";

type GuardResult = {
  changedTrackedFiles: string[];
  roadmapTouched: boolean;
  hasRoadmapToken: boolean;
};

const ROADMAP_TOKEN = "[roadmap:";
const ROADMAP_FILES = [
  ".lovable/roadmap-sync.md",
  ".lovable/plan.md",
  "scripts/roadmap-log.ts",
  "scripts/roadmap-guard.ts",
];

// Any change inside these paths/files counts as a meaningful project change
// and requires a roadmap sync marker. Mirrors the Core memory rule:
// "EVERY meaningful implementation, edit, fix, or proposal is logged".
const TRACKED_PREFIXES = [
  "src/",
  "supabase/migrations/",
  "scripts/",
  "public/",
  "app/",
];
const TRACKED_FILES = [
  "package.json",
  "vite.config.ts",
  "tsconfig.json",
  "tailwind.config.ts",
  "src/styles.css",
];

// Auto-generated / infra files that should NEVER trigger the guard.
const EXCLUDED_PATHS = [
  "src/routeTree.gen.ts",
  "src/integrations/supabase/types.ts",
  "src/integrations/supabase/client.ts",
  "src/integrations/supabase/client.server.ts",
  "src/integrations/supabase/auth-middleware.ts",
  "src/integrations/supabase/auth-attacher.ts",
  ".lovable/roadmap-sync.md",
  "bun.lockb",
  "package-lock.json",
];
const EXCLUDED_PREFIXES = [
  "mem://",
  ".lovable/",
  ".agents/",
  ".claude/",
  ".workspace/",
];

function isTracked(file: string): boolean {
  if (EXCLUDED_PATHS.includes(file)) return false;
  if (EXCLUDED_PREFIXES.some((p) => file.startsWith(p))) return false;
  if (TRACKED_FILES.includes(file)) return true;
  return TRACKED_PREFIXES.some((p) => file.startsWith(p));
}

function run(command: string): string {
  try {
    return execSync(command, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
}

function changedFiles(): string[] {
  const tracked = run("git diff --name-only --diff-filter=ACMRTUXB HEAD --");
  const staged = run("git diff --cached --name-only --diff-filter=ACMRTUXB --");
  const untracked = run("git ls-files --others --exclude-standard");
  return Array.from(new Set([...tracked.split("\n"), ...staged.split("\n"), ...untracked.split("\n")].filter(Boolean)));
}

function fileContainsToken(path: string): boolean {
  if (!existsSync(path)) return false;
  return readFileSync(path, "utf8").includes(ROADMAP_TOKEN);
}

function inspect(): GuardResult {
  const files = changedFiles();
  const changedTrackedFiles = files.filter(isTracked);
  const roadmapTouched = files.some((file) => ROADMAP_FILES.includes(file));
  const hasRoadmapToken = ROADMAP_FILES.some(fileContainsToken);
  return { changedTrackedFiles, roadmapTouched, hasRoadmapToken };
}

const result = inspect();

if (result.changedTrackedFiles.length > 0 && (!result.roadmapTouched || !result.hasRoadmapToken)) {
  console.error("\nRoadmap guard blocked this build.");
  console.error("Project files changed, but no roadmap sync marker was found.");
  console.error("\nChanged files (sample):");
  for (const file of result.changedTrackedFiles.slice(0, 20)) console.error(`- ${file}`);
  if (result.changedTrackedFiles.length > 20) {
    console.error(`...and ${result.changedTrackedFiles.length - 20} more`);
  }
  console.error("\nRequired action:");
  console.error("1. Update the matching roadmap_items row immediately.");
  console.error('2. Run either: bun run roadmap:auto -- --source user');
  console.error('   or: bun run roadmap:log -- --item <roadmap_item_id> --summary "what changed" [--scope ui|lessons|db|infra|content|other]');
  console.error("3. Re-run the build.\n");
  process.exit(1);
}

console.log("Roadmap guard passed.");
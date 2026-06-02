import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const args = process.argv.slice(2);

function readArg(name: string): string | null {
  const index = args.indexOf(`--${name}`);
  if (index === -1) return null;
  return args[index + 1] ?? null;
}

const auto = args.includes("--auto");
const item = readArg("item");
let title = readArg("title");
let summary = readArg("summary");
const source = readArg("source") ?? "ai";
const status = readArg("status") ?? "in_progress";
let scope = readArg("scope") ?? "other"; // ui | lessons | db | infra | content | other
const markerOnly = args.includes("--marker-only");

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

function inferScope(files: string[]): string {
  if (files.some((file) => file.startsWith("src/components/intro/lessons/") || file.includes("curriculum") || file.includes("lesson"))) return "lessons";
  if (files.some((file) => file.startsWith("supabase/migrations/"))) return "db";
  if (files.some((file) => file.startsWith("src/") || file === "src/styles.css")) return "ui";
  if (files.some((file) => file === "package.json" || file.startsWith("scripts/") || file === "vite.config.ts")) return "infra";
  if (files.some((file) => file.startsWith("public/"))) return "content";
  return "other";
}

function summarizeChanges(files: string[]): string {
  const preview = files.slice(0, 8).join(", ");
  const extra = files.length > 8 ? ` +${files.length - 8} more` : "";
  return files.length > 0 ? `auto roadmap sync for ${files.length} changed files: ${preview}${extra}` : "auto roadmap sync";
}

if (auto) {
  const files = changedFiles().filter((file) => file !== ".lovable/roadmap-sync.md" && !file.startsWith(".lovable/"));
  title ??= `Auto roadmap sync ${new Date().toISOString().slice(0, 10)}`;
  summary ??= summarizeChanges(files);
  if (!readArg("scope")) scope = inferScope(files);
}

if ((!item && !title) || !summary) {
  console.error('Usage: bun run roadmap:log -- --item <roadmap_item_id> --summary "what changed"');
  console.error('   or: bun run roadmap:log -- --title "work title" --summary "what changed" --source user');
  console.error("   or: bun run roadmap:auto -- --source user");
  process.exit(1);
}

const today = new Date().toISOString().slice(0, 10);
const sourceMarker = source === "user" ? "[source:user]" : "[source:ai]";
const editMarker = source === "user" ? "[user-edit" : "[ai-edit";
let roadmapId = item;

async function syncDatabase(): Promise<void> {
  if (markerOnly) return;

  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error("Missing SUPABASE_URL/VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
    console.error("Use --marker-only only after the roadmap_items row was updated through another approved path.");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const scopeTag = `[scope:${scope}]`;
  const note = `${item ? `${editMarker} ${today}]: ${scopeTag} ${summary}` : `${sourceMarker}\n${scopeTag}\n[${source}-edit ${today}]: ${summary}`}`;

  if (item) {
    const { error } = await supabase.rpc("append_roadmap_note", {
      p_item_id: item,
      p_note: note,
      p_status: status,
    });

    if (!error) return;

    const current = await supabase.from("roadmap_items").select("notes").eq("id", item).single();
    if (current.error) throw new Error(current.error.message);
    const updated = await supabase
      .from("roadmap_items")
      .update({
        status,
        completed_at: status === "done" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
        notes: `${current.data?.notes ?? ""}\n${note}`.trim(),
      })
      .eq("id", item);
    if (updated.error) throw new Error(updated.error.message);
    return;
  }

  const created = await supabase
    .from("roadmap_items")
    .insert({
      title,
      description: summary,
      notes: note,
      phase: "inbox",
      status,
      sort_order: Math.floor(Date.now() / 1000) % 100000,
      completed_at: status === "done" ? new Date().toISOString() : null,
    })
    .select("id")
    .single();

  if (created.error) throw new Error(created.error.message);
  roadmapId = created.data.id;
}

await syncDatabase();

if (!roadmapId) {
  console.error("Could not resolve roadmap item id.");
  process.exit(1);
}

const content = [
  `# Roadmap sync marker`,
  ``,
  `[roadmap:${roadmapId}]`,
  `date: ${today}`,
  `scope: ${scope}`,
  `source: ${source}`,
  `summary: ${summary}`,
  ``,
  `This file is updated after the matching roadmap_items row is updated.`,
  `The build's roadmap guard fails on ANY meaningful project change without a fresh marker.`,
  ``,
].join("\n");

mkdirSync(".lovable", { recursive: true });
writeFileSync(".lovable/roadmap-sync.md", content);

console.log(`Roadmap synced and marker written for ${roadmapId}.`);
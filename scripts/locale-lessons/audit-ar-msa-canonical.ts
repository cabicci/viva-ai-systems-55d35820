/**
 * ar-MSA Canonical Audit (pre-flight for the full fragment-generation phase).
 *
 * Read-only audit — never modifies MSA, never calls AI, never generates,
 * never imports runtime. Exits non-zero on any failure. Writes a JSON report.
 *
 * Checks:
 *   - 100 active ar-MSA canonical lessons exist
 *   - IDs match the manifest (no missing / no duplicates)
 *   - valid JSON / schema (locale, lessonId, sections, etc.)
 *   - no Bunny / runtime / video production residue in learner-facing fields
 *   - no internal learner-facing leaks (production reference, ...)
 *   - no broken markdown (** balance)
 *   - quiz integrity (options >= 2, correctIndex in range, question non-empty)
 *   - no Option/Correct answer/خيار/الإجابة الصحيحة prefix leaks
 *   - titles not generic
 *   - no empty learner-facing fields
 *   - no obvious Egyptian dialect residue in ar-MSA canonical
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { REQUIRED_LESSON_COUNT } from "../../src/lib/locale-lessons/types.ts";
import { PRODUCTION_LEAK_SUBSTRINGS } from "./lib/sanitize-final-lesson-package.ts";

/**
 * Canonical ar-MSA intentionally contains internal "Video block (production
 * reference only)" sections. The fragment sanitizer drops these BEFORE
 * adapted lessons are written. The audit therefore skips them — they are
 * never learner-facing and are not part of the structural source of truth
 * for the adapted output.
 */
function isProductionReferenceSection(s: {
  role?: unknown; heading?: unknown; subtitle?: unknown; contentMarkdown?: unknown;
}): boolean {
  const parts = [s.role, s.heading, s.subtitle, s.contentMarkdown]
    .filter((x): x is string => typeof x === "string");
  const hay = parts.join("\n");
  return PRODUCTION_LEAK_SUBSTRINGS.some((needle) => hay.includes(needle));
}

interface Finding {
  lessonId: string;
  fieldPath: string;
  issue: string;
  snippet: string;
  recommendedFix: string;
}

const MSA_DIR = path.resolve("src/lib/locale-lessons/ar-MSA");
const LESSONS_DIR = path.join(MSA_DIR, "lessons");
const MANIFEST_PATH = path.join(MSA_DIR, "manifest.json");
const REPORT_PATH = path.resolve("src/lib/locale-lessons/ar-MSA/reports/canonical-audit.json");

const BANNED_LEARNER_SUBSTRINGS = [
  "Video block (production",
  "production reference only",
  "لا يُعاد توليده",
  "Bunny",
  "bunny.net",
  "remotion",
  "Remotion",
];
const BANNED_OPTION_PREFIXES = [
  "Option 1:", "Option 2:", "Option 3:", "Option 4:",
  "Correct answer (Option",
  "خيار ١:", "خيار ٢:", "خيار ٣:", "خيار ٤:",
  "خيار 1:", "خيار 2:", "خيار 3:", "خيار 4:",
  "الإجابة الصحيحة (خيار",
];
const GENERIC_TITLES = new Set([
  "Lesson", "Untitled", "TBD", "TODO", "درس", "بدون عنوان",
]);
// Egyptian-only markers. "يبقى/يبقي" intentionally EXCLUDED — it is also a
// valid MSA verb ("remains/becomes") and produced too many false positives
// in ar-MSA canonical lessons. (Step-1 suppression: canonical audit only.)
const EGYPTIAN_MARKERS = [
  "إزاي", "ازاي", "ازاى",
  "علشان", "عشان",
  "بقى", "بقي",
  "كده", "كدا",
  "بتاع", "بتاعت", "بتوع",
  "دلوقتي", "دلوقت",
  "أهو", "اهو",
];

const findings: Finding[] = [];
let suppressedQuizPrefixCount = 0;
let suppressedYabqaCount = 0;

function add(f: Finding) { findings.push(f); }
function snip(s: string, max = 120) {
  return s.length <= max ? s : s.slice(0, max) + "…";
}

interface ScanCtx {
  /** True when scanning a string inside a section whose role === "Quiz".
   * Canonical ar-MSA quiz sections intentionally use "خيار ١:" / "Option N:"
   * / "الإجابة الصحيحة (خيار …)" scaffolding prefixes that the fragment
   * sanitizer strips during adaptation. These are NOT learner-facing leaks
   * in canonical source — suppress (count only). */
  inQuizSection?: boolean;
}

function scanString(lessonId: string, fp: string, value: string, ctx: ScanCtx = {}) {
  for (const needle of BANNED_LEARNER_SUBSTRINGS) {
    if (value.includes(needle)) {
      add({ lessonId, fieldPath: fp, issue: `banned learner-facing leak: "${needle}"`,
        snippet: snip(value), recommendedFix: `remove "${needle}" from canonical ar-MSA lesson` });
    }
  }
  for (const pref of BANNED_OPTION_PREFIXES) {
    if (value.includes(pref)) {
      if (ctx.inQuizSection) { suppressedQuizPrefixCount++; continue; }
      add({ lessonId, fieldPath: fp, issue: `banned option/answer prefix: "${pref}"`,
        snippet: snip(value), recommendedFix: `remove explicit "${pref}" prefix; options must not include numbering or answer-key prefixes` });
    }
  }
  const bold = (value.match(/\*\*/g) ?? []).length;
  if (bold % 2 !== 0) {
    add({ lessonId, fieldPath: fp, issue: "unbalanced ** markdown markers",
      snippet: snip(value), recommendedFix: "balance ** pairs or remove the stray marker" });
  }
  // "يبقى/يبقي" suppression: counted but not flagged (valid MSA usage).
  const yabqaRe = /(^|[\s\.,،؛:!\?\(\)«»"'])يبق[ىي]($|[\s\.,،؛:!\?\(\)«»"'])/;
  if (yabqaRe.test(value)) suppressedYabqaCount++;
  for (const marker of EGYPTIAN_MARKERS) {
    const re = new RegExp(`(^|[\\s\\.,،؛:!\\?\\(\\)«»"'])${marker}($|[\\s\\.,،؛:!\\?\\(\\)«»"'])`);
    if (re.test(value)) {
      add({ lessonId, fieldPath: fp, issue: `Egyptian dialect residue: "${marker}"`,
        snippet: snip(value), recommendedFix: `rewrite in Modern Standard Arabic (Fusha); remove dialect marker "${marker}"` });
    }
  }
}

function walk(lessonId: string, node: unknown, fp: string, ctx: ScanCtx = {}) {
  if (typeof node === "string") { scanString(lessonId, fp, node, ctx); return; }
  if (Array.isArray(node)) { node.forEach((v, i) => walk(lessonId, v, `${fp}[${i}]`, ctx)); return; }
  if (node && typeof node === "object") {
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      walk(lessonId, v, fp ? `${fp}.${k}` : k, ctx);
    }
  }
}

async function readJson(p: string): Promise<unknown> {
  return JSON.parse(await fs.readFile(p, "utf8"));
}

async function main() {
  // Manifest
  let manifest: { lessonCount?: number; lessonIds?: string[]; locale?: string };
  try { manifest = (await readJson(MANIFEST_PATH)) as typeof manifest; }
  catch (e) {
    console.error(`Cannot read MSA manifest at ${MANIFEST_PATH}: ${e instanceof Error ? e.message : e}`);
    process.exit(2);
  }

  const manifestIds = manifest.lessonIds ?? [];
  if (manifestIds.length !== REQUIRED_LESSON_COUNT) {
    add({ lessonId: "(manifest)", fieldPath: "lessonIds.length",
      issue: `expected ${REQUIRED_LESSON_COUNT}, got ${manifestIds.length}`,
      snippet: "", recommendedFix: "regenerate ar-MSA canonical manifest from source" });
  }
  if (manifest.lessonCount !== manifestIds.length) {
    add({ lessonId: "(manifest)", fieldPath: "lessonCount",
      issue: `lessonCount (${manifest.lessonCount}) != lessonIds.length (${manifestIds.length})`,
      snippet: "", recommendedFix: "rewrite manifest with correct lessonCount" });
  }
  const dupSet = new Set<string>();
  const dups: string[] = [];
  for (const id of manifestIds) {
    if (dupSet.has(id)) dups.push(id); else dupSet.add(id);
  }
  for (const d of dups) {
    add({ lessonId: d, fieldPath: "manifest.lessonIds", issue: "duplicate id",
      snippet: d, recommendedFix: "remove duplicate from manifest" });
  }

  // Disk files
  const onDisk = (await fs.readdir(LESSONS_DIR)).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, ""));
  const onDiskSet = new Set(onDisk);
  for (const id of manifestIds) {
    if (!onDiskSet.has(id)) add({ lessonId: id, fieldPath: "lessons/", issue: "missing lesson file",
      snippet: `${id}.json`, recommendedFix: "regenerate this canonical lesson JSON" });
  }
  for (const id of onDisk) {
    if (!manifestIds.includes(id)) add({ lessonId: id, fieldPath: "lessons/",
      issue: "extra lesson file not in manifest", snippet: `${id}.json`,
      recommendedFix: "add to manifest or remove file" });
  }

  // Per-lesson schema + content scan
  for (const id of manifestIds) {
    const filePath = path.join(LESSONS_DIR, `${id}.json`);
    let pkg: Record<string, unknown>;
    try { pkg = (await readJson(filePath)) as Record<string, unknown>; }
    catch (e) {
      add({ lessonId: id, fieldPath: "(file)", issue: `invalid JSON: ${e instanceof Error ? e.message : e}`,
        snippet: "", recommendedFix: "regenerate canonical lesson JSON" });
      continue;
    }
    if (pkg.locale !== "ar-MSA")
      add({ lessonId: id, fieldPath: "locale", issue: `expected "ar-MSA", got ${JSON.stringify(pkg.locale)}`,
        snippet: String(pkg.locale ?? ""), recommendedFix: "set locale to ar-MSA" });
    if (pkg.lessonId !== id)
      add({ lessonId: id, fieldPath: "lessonId", issue: `mismatch: file id ${id} vs pkg ${JSON.stringify(pkg.lessonId)}`,
        snippet: String(pkg.lessonId ?? ""), recommendedFix: "set lessonId to match filename" });
    const title = pkg.title;
    if (typeof title !== "string" || title.trim() === "")
      add({ lessonId: id, fieldPath: "title", issue: "empty or missing title", snippet: "",
        recommendedFix: "set a descriptive ar-MSA title" });
    else if (GENERIC_TITLES.has(title.trim()))
      add({ lessonId: id, fieldPath: "title", issue: `generic title "${title}"`,
        snippet: title, recommendedFix: "replace with a lesson-specific descriptive title" });
    const sections = pkg.sections;
    if (!Array.isArray(sections) || sections.length === 0) {
      add({ lessonId: id, fieldPath: "sections", issue: "missing or empty sections", snippet: "",
        recommendedFix: "regenerate lesson with sections" });
    } else {
      sections.forEach((sec, i) => {
        const s = sec as Record<string, unknown>;
        if (isProductionReferenceSection(s as never)) return; // skip internal sections
        if (!s.heading || typeof s.heading !== "string" || (s.heading as string).trim() === "")
          add({ lessonId: id, fieldPath: `sections[${i}].heading`, issue: "empty heading",
            snippet: "", recommendedFix: "supply a section heading" });
        if (typeof s.contentMarkdown !== "string" || (s.contentMarkdown as string).trim() === "")
          add({ lessonId: id, fieldPath: `sections[${i}].contentMarkdown`, issue: "empty contentMarkdown",
            snippet: "", recommendedFix: "supply learner-facing content for this section" });
        const quiz = s.quiz as Record<string, unknown> | undefined;
        if (quiz) {
          const opts = quiz.options as unknown;
          const ci = quiz.correctIndex as unknown;
          const q = quiz.question as unknown;
          if (typeof q !== "string" || (q as string).trim() === "")
            add({ lessonId: id, fieldPath: `sections[${i}].quiz.question`, issue: "empty quiz question",
              snippet: "", recommendedFix: "supply quiz question text" });
          if (!Array.isArray(opts) || (opts as unknown[]).length < 2)
            add({ lessonId: id, fieldPath: `sections[${i}].quiz.options`, issue: "fewer than 2 options",
              snippet: JSON.stringify(opts ?? null).slice(0, 80), recommendedFix: "provide at least 2 options" });
          if (typeof ci !== "number" || !Array.isArray(opts) || ci < 0 || ci >= (opts as unknown[]).length)
            add({ lessonId: id, fieldPath: `sections[${i}].quiz.correctIndex`,
              issue: `correctIndex ${ci} out of range`,
              snippet: String(ci ?? ""), recommendedFix: "set correctIndex to a valid options index" });
        }
        // Walk only learner-facing sections. Pass quiz-section context so the
        // scanner can suppress canonical scaffolding prefixes inside Quiz roles.
        const inQuizSection = typeof s.role === "string" && (s.role as string).trim().toLowerCase() === "quiz";
        walk(id, s, `sections[${i}]`, { inQuizSection });
      });
    }
    // Walk top-level fields excluding sections (already walked per learner-facing section).
    const { sections: _s, ...top } = pkg as Record<string, unknown>;
    walk(id, top, "");
  }

  // Report
  const summary = {
    auditedAt: new Date().toISOString(),
    locale: "ar-MSA",
    expected: REQUIRED_LESSON_COUNT,
    manifestCount: manifestIds.length,
    onDiskCount: onDisk.length,
    totalFindings: findings.length,
    suppressed: {
      quizScaffoldingPrefixes: suppressedQuizPrefixCount,
      yabqaMsaVerb: suppressedYabqaCount,
      total: suppressedQuizPrefixCount + suppressedYabqaCount,
    },
    ok: findings.length === 0,
  };
  await fs.mkdir(path.dirname(REPORT_PATH), { recursive: true });
  await fs.writeFile(REPORT_PATH, JSON.stringify({ summary, findings }, null, 2) + "\n", "utf8");

  console.log(JSON.stringify(summary, null, 2));
  if (findings.length > 0) {
    console.error(`\n${findings.length} finding(s). First 10:`);
    for (const f of findings.slice(0, 10)) {
      console.error(`  - [${f.lessonId}] ${f.fieldPath}: ${f.issue}`);
    }
    console.error(`Full report: ${REPORT_PATH}`);
    process.exit(1);
  }
  console.log(`PASS — full report: ${REPORT_PATH}`);
}

if (import.meta.main) {
  main().catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(2); });
}

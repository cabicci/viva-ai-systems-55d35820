/**
 * Cross-path / sequence-language audit for lesson files.
 *
 * Scans src/components/intro/lessons/*.ts for sentences that assume:
 *  - the learner came from a previous lesson
 *  - the learner is on a single linear journey
 *  - a "we" voice that bundles learner + platform together
 *  - a "next module/phase" continuation
 *  - a cross-path reference (mentioning another path by name)
 *
 * Cross-path references are NOT auto-flagged as broken — they're allowed
 * as informational mentions per the approved policy. They're listed under
 * `cross-path-info` for human review.
 *
 * Output: public/lesson-audit/cross-path-issues.json + .md summary.
 */
import { promises as fs } from "node:fs";
import path from "node:path";

const LESSONS_DIR = path.resolve("src/components/intro/lessons");
const OUT_DIR = path.resolve("public/lesson-audit");

type Category =
  | "prior-lesson-ref"
  | "next-lesson-ref"
  | "single-journey"
  | "we-language"
  | "cross-path-info";

interface Issue {
  file: string;
  pathId: string;
  line: number;
  category: Category;
  match: string;
  snippet: string;
}

// Patterns. Each entry: [category, regex, label]
// Notes:
//  - Arabic patterns target literal phrasing seen in lessons.
//  - We avoid catching neutral words like "بعد" alone.
const PATTERNS: Array<{ cat: Category; re: RegExp; label: string }> = [
  // Prior-lesson references
  { cat: "prior-lesson-ref", re: /الدرس\s+اللي\s+فات/g, label: "الدرس اللي فات" },
  { cat: "prior-lesson-ref", re: /الدرس\s+السابق/g, label: "الدرس السابق" },
  { cat: "prior-lesson-ref", re: /الدرس\s+اللي\s+قبل(?:\s+ده)?/g, label: "الدرس اللي قبل" },
  { cat: "prior-lesson-ref", re: /الموديول\s+اللي\s+فات/g, label: "الموديول اللي فات" },
  { cat: "prior-lesson-ref", re: /المرحلة\s+اللي\s+فات(?:ت)?/g, label: "المرحلة اللي فاتت" },
  { cat: "prior-lesson-ref", re: /Phase\s*[123]\s+اللي\s+فات/gi, label: "Phase N اللي فات" },
  { cat: "prior-lesson-ref", re: /زي\s+ما\s+(?:اتعلمنا|شفنا|قلنا)\s+(?:في|قبل|من)/g, label: "زي ما اتعلمنا/شفنا/قلنا في…" },
  { cat: "prior-lesson-ref", re: /اللي\s+اتعلمناه(?:م)?\s+(?:قبل|في\s+الدروس)/g, label: "اللي اتعلمناه قبل" },

  // Next-lesson / journey-forward references
  { cat: "next-lesson-ref", re: /الدرس\s+الجاي/g, label: "الدرس الجاي" },
  { cat: "next-lesson-ref", re: /الموديول\s+الجاي/g, label: "الموديول الجاي" },
  { cat: "next-lesson-ref", re: /المرحلة\s+الجاي(?:ة)?/g, label: "المرحلة الجاية" },
  { cat: "next-lesson-ref", re: /Phase\s*[123]\s+الجاي/gi, label: "Phase N الجاي" },
  { cat: "next-lesson-ref", re: /هنكمل\s+في\s+الدرس/g, label: "هنكمل في الدرس…" },
  { cat: "next-lesson-ref", re: /في\s+الدرس\s+الجاي\s+هنشوف/g, label: "في الدرس الجاي هنشوف" },
  { cat: "next-lesson-ref", re: /بعد\s+كده\s+هنشوف/g, label: "بعد كده هنشوف" },
  { cat: "next-lesson-ref", re: /هنبدأ\s+فعل[اًا]/g, label: "هنبدأ فعلاً" },

  // Single-journey assumptions
  { cat: "single-journey", re: /أول\s+درس\s+ل(?:يك|ك)\s+في\s+المنصة/g, label: "أول درس ليك في المنصة" },
  { cat: "single-journey", re: /رحلتنا\s+(?:مع\s+بعض|سوا|في\s+المنصة)/g, label: "رحلتنا مع بعض/سوا" },
  { cat: "single-journey", re: /بنينا\s+مع\s+بعض/g, label: "بنينا مع بعض" },
  { cat: "single-journey", re: /من\s+(?:أول|بداية)\s+الكورس/g, label: "من أول الكورس" },
  { cat: "single-journey", re: /لحد\s+دلوقتي\s+في\s+المنصة/g, label: "لحد دلوقتي في المنصة" },

  // "We" language (broader — flag for review, don't auto-fix)
  { cat: "we-language", re: /احنا\s+اتعلمنا/g, label: "احنا اتعلمنا" },
  { cat: "we-language", re: /احنا\s+شفنا/g, label: "احنا شفنا" },
  { cat: "we-language", re: /إحنا\s+اتعلمنا/g, label: "إحنا اتعلمنا" },
];

// Path-name patterns for cross-path informational mentions.
// We only flag when the mention appears in a file belonging to a DIFFERENT path.
const PATH_NAMES: Record<string, RegExp> = {
  builder: /\bBuilder\b|مسار\s+Builder|في\s+Builder/g,
  creator: /\bCreator\b|مسار\s+Creator|في\s+Creator/g,
  automator: /\bAutomator\b|مسار\s+Automator|في\s+Automator/g,
  analyst: /\bAnalyst\b|مسار\s+Analyst|في\s+Analyst/g,
  business: /\bBusiness\b|مسار\s+Business|في\s+Business/g,
};

function detectPath(fileName: string): string {
  const base = fileName.replace(/\.ts$/, "");
  const m = base.match(/^([a-z]+)-/);
  return m ? m[1] : "unknown";
}

function lineOfIndex(src: string, idx: number): number {
  let line = 1;
  for (let i = 0; i < idx && i < src.length; i++) {
    if (src.charCodeAt(i) === 10) line++;
  }
  return line;
}

function snippetAround(src: string, idx: number, len = 120): string {
  const start = Math.max(0, idx - 40);
  const end = Math.min(src.length, idx + len);
  return src.slice(start, end).replace(/\s+/g, " ").trim();
}

async function main() {
  const files = (await fs.readdir(LESSONS_DIR))
    .filter((f) => f.endsWith(".ts") && f !== "index.ts")
    .sort();

  const issues: Issue[] = [];

  for (const file of files) {
    const full = path.join(LESSONS_DIR, file);
    const src = await fs.readFile(full, "utf8");
    const pathId = detectPath(file);

    // Generic patterns
    for (const { cat, re, label } of PATTERNS) {
      re.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = re.exec(src)) !== null) {
        issues.push({
          file,
          pathId,
          line: lineOfIndex(src, m.index),
          category: cat,
          match: label,
          snippet: snippetAround(src, m.index),
        });
      }
    }

    // Cross-path mentions: only flag when path != this file's path
    for (const [otherPath, re] of Object.entries(PATH_NAMES)) {
      if (otherPath === pathId) continue;
      re.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = re.exec(src)) !== null) {
        // Skip import lines and lucide-react / supabase / etc. unrelated mentions.
        const lineNum = lineOfIndex(src, m.index);
        const lineText = src.split("\n")[lineNum - 1] ?? "";
        if (/^\s*import\b/.test(lineText)) continue;
        if (/from\s+["']/.test(lineText)) continue;
        issues.push({
          file,
          pathId,
          line: lineNum,
          category: "cross-path-info",
          match: `mention:${otherPath}`,
          snippet: snippetAround(src, m.index),
        });
      }
    }
  }

  await fs.mkdir(OUT_DIR, { recursive: true });

  // JSON report
  const jsonPath = path.join(OUT_DIR, "cross-path-issues.json");
  await fs.writeFile(jsonPath, JSON.stringify({ generatedAt: new Date().toISOString(), totals: summarize(issues), issues }, null, 2));

  // Markdown summary
  const md = renderMarkdown(issues, files.length);
  const mdPath = path.join(OUT_DIR, "cross-path-issues.md");
  await fs.writeFile(mdPath, md);

  // Console summary
  const totals = summarize(issues);
  console.log("Files scanned:", files.length);
  console.log("Total issues:", issues.length);
  console.log("By category:", totals.byCategory);
  console.log("By path:", totals.byPath);
  console.log("Reports written:");
  console.log(" -", path.relative(process.cwd(), jsonPath));
  console.log(" -", path.relative(process.cwd(), mdPath));
}

function summarize(issues: Issue[]) {
  const byCategory: Record<string, number> = {};
  const byPath: Record<string, number> = {};
  const byFile: Record<string, number> = {};
  for (const it of issues) {
    byCategory[it.category] = (byCategory[it.category] ?? 0) + 1;
    byPath[it.pathId] = (byPath[it.pathId] ?? 0) + 1;
    byFile[it.file] = (byFile[it.file] ?? 0) + 1;
  }
  return { byCategory, byPath, byFile, total: issues.length };
}

function renderMarkdown(issues: Issue[], scanned: number): string {
  const totals = summarize(issues);
  const lines: string[] = [];
  lines.push(`# Cross-path / Sequence Audit`);
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(`Files scanned: ${scanned}`);
  lines.push(`Total issues: ${totals.total}`);
  lines.push("");
  lines.push(`## By category`);
  for (const [k, v] of Object.entries(totals.byCategory).sort((a, b) => b[1] - a[1])) {
    lines.push(`- **${k}**: ${v}`);
  }
  lines.push("");
  lines.push(`## By path`);
  for (const [k, v] of Object.entries(totals.byPath).sort((a, b) => b[1] - a[1])) {
    lines.push(`- **${k}**: ${v}`);
  }
  lines.push("");
  lines.push(`## Top 15 files`);
  const topFiles = Object.entries(totals.byFile).sort((a, b) => b[1] - a[1]).slice(0, 15);
  for (const [file, n] of topFiles) {
    lines.push(`- \`${file}\` — ${n}`);
  }
  lines.push("");
  lines.push(`## Issues (grouped by file)`);
  const byFile = new Map<string, Issue[]>();
  for (const it of issues) {
    if (!byFile.has(it.file)) byFile.set(it.file, []);
    byFile.get(it.file)!.push(it);
  }
  for (const [file, list] of Array.from(byFile.entries()).sort()) {
    lines.push("");
    lines.push(`### ${file}  (${list.length})`);
    for (const it of list) {
      lines.push(`- L${it.line} · \`${it.category}\` · **${it.match}**`);
      lines.push(`  > ${it.snippet}`);
    }
  }
  return lines.join("\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

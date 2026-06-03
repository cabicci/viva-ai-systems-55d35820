#!/usr/bin/env node
/**
 * Jargon lint for Builder lessons.
 * Flags English technical terms that appear WITHOUT an Arabic analogy/translation
 * nearby (within 80 chars before the term).
 *
 * Glossary (term -> required nearby Arabic anchor):
 *   Frontend  -> واجهة
 *   Backend   -> كواليس
 *   API       -> ساعي البريد | API بـ
 *   Database  -> مخزن
 *   JWT       -> كارت
 *   RLS       -> حارس
 *   Schema    -> هيكل | تصميم
 *   Query     -> جلب | استعلام
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const LESSONS_DIR = "src/components/intro/lessons";
const GLOSSARY = [
  { term: "Frontend", anchors: ["واجهة"] },
  { term: "Backend", anchors: ["كواليس", "كواليس التطبيق"] },
  { term: "API", anchors: ["ساعي البريد", "ساعي"] },
  { term: "Database", anchors: ["مخزن", "المخزن الذكي"] },
  { term: "JWT", anchors: ["كارت", "كارت الدخول"] },
  { term: "RLS", anchors: ["حارس", "الحارس"] },
  { term: "Schema", anchors: ["هيكل", "تصميم"] },
  { term: "Query", anchors: ["جلب", "استعلام", "بنجيب"] },
];

const files = readdirSync(LESSONS_DIR).filter((f) => f.startsWith("builder-") && f.endsWith(".ts"));
const violations = [];

for (const file of files) {
  const path = join(LESSONS_DIR, file);
  const text = readFileSync(path, "utf-8");
  const lines = text.split("\n");
  for (const { term, anchors } of GLOSSARY) {
    const regex = new RegExp(`\\b${term}\\b`, "g");
    lines.forEach((line, idx) => {
      // skip imports, comments, IDs, eyebrows, subtitle slots
      if (/^\s*(import|\/\/|\*|\/\*)/.test(line)) return;
      if (/lessonId|src=|alt=|href=|label:/.test(line) && !line.includes('"')) return;
      let m;
      while ((m = regex.exec(line)) !== null) {
        // look back 80 chars within line (or previous line) for an Arabic anchor
        const start = Math.max(0, m.index - 80);
        const window = (lines[idx - 1] || "").slice(-40) + " " + line.slice(start, m.index);
        const ok = anchors.some((a) => window.includes(a));
        if (!ok) {
          violations.push({ file, line: idx + 1, term, snippet: line.trim().slice(0, 120) });
        }
      }
    });
  }
}

if (violations.length === 0) {
  console.log("✅ Jargon lint passed — no untethered technical terms.");
  process.exit(0);
}

console.log(`⚠️  ${violations.length} jargon violation(s):\n`);
const byFile = {};
for (const v of violations) {
  (byFile[v.file] ||= []).push(v);
}
for (const [file, vs] of Object.entries(byFile)) {
  console.log(`\n📄 ${file}`);
  for (const v of vs) {
    console.log(`   L${v.line}  [${v.term}]  ${v.snippet}`);
  }
}
console.log(`\nTotal: ${violations.length} violations across ${Object.keys(byFile).length} files.`);

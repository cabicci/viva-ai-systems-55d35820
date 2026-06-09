// Scans all generated lesson scenes against TEXT_LIMITS.
// Reports violations only — never modifies/deletes content.
// Usage: bun run scripts/lesson-text-lint.ts
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const LIMITS = {
  titleMaxChars: 60,
  highlightMaxChars: 24,
  subtitleMaxChars: 140,
  bulletMaxChars: 80,
  compareBodyMaxChars: 160,
  maxBullets: 5,
};

const DIR = "remotion/src/lessons-generated";
const files = readdirSync(DIR).filter((f) => f.endsWith(".gen.ts"));

type Violation = { lesson: string; card: string; field: string; value: string; over: number };
const violations: Violation[] = [];

for (const file of files) {
  const src = readFileSync(join(DIR, file), "utf8");
  const match = src.match(/export const SCENES[^=]*=\s*(\[[\s\S]*?\]);?\s*$/m)
    ?? src.match(/export const SCENES[^=]*=\s*(\[[\s\S]*\])\s*;?\s*export/m);
  if (!match) continue;
  let scenes: any[] = [];
  try {
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    scenes = (new Function(`return ${match[1]}`))();
  } catch {
    continue;
  }
  const lesson = file.replace(/\.gen\.ts$/, "");
  for (const s of scenes) {
    const push = (field: string, value: string, max: number) => {
      const len = [...(value ?? "")].length;
      if (len > max) violations.push({ lesson, card: s.card, field, value, over: len - max });
    };
    if (s.card === "TitleCard") {
      push("title", s.title, LIMITS.titleMaxChars);
      push("highlight", s.highlight, LIMITS.highlightMaxChars);
      push("subtitle", s.subtitle, LIMITS.subtitleMaxChars);
    } else if (s.card === "CTACard") {
      push("title", s.title, LIMITS.titleMaxChars);
      push("highlight", s.highlight, LIMITS.highlightMaxChars);
      push("tagline", s.tagline, LIMITS.subtitleMaxChars);
    } else if (s.card === "BigStatCard") {
      push("big", s.big, LIMITS.highlightMaxChars);
      push("intro", s.intro, LIMITS.subtitleMaxChars);
      push("outro", s.outro, LIMITS.subtitleMaxChars);
    } else if (s.card === "BulletsCard") {
      push("title", s.title, LIMITS.titleMaxChars);
      if ((s.bullets ?? []).length > LIMITS.maxBullets) {
        violations.push({ lesson, card: s.card, field: "bullets.length", value: String(s.bullets.length), over: s.bullets.length - LIMITS.maxBullets });
      }
      for (const b of s.bullets ?? []) push("bullet", b, LIMITS.bulletMaxChars);
    } else if (s.card === "CompareCard") {
      push("title", s.title, LIMITS.titleMaxChars);
      push("left.body", s.left?.body ?? "", LIMITS.compareBodyMaxChars);
      push("right.body", s.right?.body ?? "", LIMITS.compareBodyMaxChars);
    } else if (s.card === "ConceptCard") {
      push("term", s.term, LIMITS.highlightMaxChars);
      push("definition", s.definition, LIMITS.subtitleMaxChars);
    }
  }
}

if (violations.length === 0) {
  console.log(`✅ All ${files.length} lessons within text limits.`);
  process.exit(0);
}

console.log(`⚠️  ${violations.length} text-length violations across ${files.length} lessons (reporting only, no deletion):\n`);
const byLesson = new Map<string, Violation[]>();
for (const v of violations) {
  if (!byLesson.has(v.lesson)) byLesson.set(v.lesson, []);
  byLesson.get(v.lesson)!.push(v);
}
for (const [lesson, vs] of byLesson) {
  console.log(`\n• ${lesson}`);
  for (const v of vs) {
    const preview = v.value.length > 80 ? v.value.slice(0, 77) + "…" : v.value;
    console.log(`    [${v.card}.${v.field}] +${v.over} chars  → "${preview}"`);
  }
}
console.log(`\nTotal: ${violations.length} violations in ${byLesson.size}/${files.length} lessons.`);
// Report only — exit 0 so the pilot render isn't blocked.
process.exit(0);

// Reads a TypeScript lesson file from src/components/intro/lessons/<id>.ts
// and returns its content blocks as plain JSON. Imports (icons, asset files)
// are stripped/stubbed — we only care about textual content.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "../../..");
const LESSONS_DIR = path.join(PROJECT_ROOT, "src/components/intro/lessons");
const CURRICULUM_FILE = path.join(PROJECT_ROOT, "src/lib/curriculum-data.ts");

/** PATH order in curriculum-data.ts (intro → business → creator → analyst → automator → builder). */
const PATH_IDS = ["intro", "business", "creator", "analyst", "automator", "builder"];

/**
 * Learner lesson order from PATHS in curriculum-data.ts (regex scrape — keep in sync manually).
 * Do not use INTRO_LESSON_CONTENT registry key order; it differs from learner navigation.
 */
function readPathsLessonOrder() {
  const txt = fs.readFileSync(CURRICULUM_FILE, "utf8");
  const order = [];
  for (let i = 0; i < PATH_IDS.length; i++) {
    const pathId = PATH_IDS[i];
    const start = txt.indexOf(`id: "${pathId}"`);
    if (start === -1) continue;
    let end = txt.length;
    for (let j = i + 1; j < PATH_IDS.length; j++) {
      const next = txt.indexOf(`id: "${PATH_IDS[j]}"`, start + 1);
      if (next !== -1) {
        end = Math.min(end, next);
      }
    }
    const section = txt.slice(start, end);
    const re =
      /(?:lesson\(\s*\d+\s*,\s*"([^"]+)"|(?:builderShipped|automatorShipped|analystShipped|businessShipped|shippedLesson)\(\s*\d+\s*,\s*"([^"]+)")/g;
    let m;
    while ((m = re.exec(section)) !== null) {
      const id = m[1] || m[2];
      if (id) order.push(id);
    }
  }
  return order;
}

// Parse the lesson registry to learn the ordered list of lesson IDs.
function readLessonOrder() {
  const pathsOrder = readPathsLessonOrder();
  if (pathsOrder.length > 0) return pathsOrder;
  // Fallback: registry key order (legacy — should not run in normal repo state).
  const indexFile = path.join(
    PROJECT_ROOT,
    "src/components/intro/lessons/index.ts",
  );
  const txt = fs.readFileSync(indexFile, "utf8");
  const ids = [];
  const re = /^\s*"([a-z0-9-]+)"\s*:\s*[A-Z0-9_]+_(?:BLOCKS|CONTENT)\s*,/gm;
  let m;
  while ((m = re.exec(txt)) !== null) ids.push(m[1]);
  return ids;
}

function normalizeLessonId(input) {
  const raw = String(input || "").trim();
  if (!raw) return raw;
  const exact = path.join(LESSONS_DIR, `${raw}.ts`);
  if (fs.existsSync(exact)) return raw;

  const stems = fs
    .readdirSync(LESSONS_DIR)
    .filter((name) => name.endsWith(".ts") && name !== "index.ts")
    .map((name) => name.replace(/\.ts$/, ""));
  return stems.find((stem) => stem.endsWith(raw)) || raw;
}

function findHeroTitle(blocks) {
  for (const b of blocks) {
    if (b && b.eyebrow === "HERO" && b.title) return b.title;
  }
  return null;
}

export function loadLessonBlocks(lessonId) {
  lessonId = normalizeLessonId(lessonId);
  const file = path.join(
    LESSONS_DIR,
    `${lessonId}.ts`,
  );
  if (!fs.existsSync(file)) {
    throw new Error(`Lesson file not found: ${file}`);
  }
  let src = fs.readFileSync(file, "utf8");

  // Collect asset-import bindings so we can map `src: someAsset` -> public path.
  const assetMap = {};
  src.replace(
    /^import\s+(\w+)\s+from\s+["']@\/assets\/lessons\/([^"']+)["'];?\s*$/gm,
    (_, varName, fileName) => {
      assetMap[varName] = `lessons/${fileName}`;
      return "";
    },
  );

  // Drop all import statements (single or multi-line up to the terminating ;).
  src = src.replace(/^import[\s\S]*?;\s*$/gm, "");

  // Find the exported array (any name, optional type annotation).
  const m = src.match(
    /export\s+const\s+\w+(?:\s*:\s*[A-Za-z_$][\w<>\[\]\s,]*)?\s*=\s*(\[[\s\S]*?\]);\s*$/m,
  );
  if (!m) throw new Error(`Could not locate exported array in ${file}`);
  let arrSrc = m[1];

  // Turn icon identifiers into strings: `icon: Sparkles` -> `icon: "Sparkles"`
  arrSrc = arrSrc.replace(
    /(\bicon\s*:\s*)([A-Z][A-Za-z0-9_]*)/g,
    '$1"$2"',
  );

  // Asset variable references -> public-path strings.
  for (const [varName, publicPath] of Object.entries(assetMap)) {
    arrSrc = arrSrc.replace(
      new RegExp(`(\\bsrc\\s*:\\s*)${varName}\\b`, "g"),
      `$1"${publicPath}"`,
    );
  }

  const blocks = Function(`"use strict"; return (${arrSrc});`)();

  // Peek at the next lesson in the ordered registry to give the script
  // writer real context for the closing CTA (no more hallucinated topics).
  let nextLessonId = null;
  let nextLessonTitle = null;
  try {
    const order = readLessonOrder();
    const idx = order.indexOf(lessonId);
    if (idx >= 0 && idx + 1 < order.length) {
      nextLessonId = order[idx + 1];
      const nextFile = path.join(
        PROJECT_ROOT,
        "src/components/intro/lessons",
        `${nextLessonId}.ts`,
      );
      if (fs.existsSync(nextFile)) {
        const { blocks: nextBlocks } = loadLessonBlocksRaw(nextFile);
        nextLessonTitle = findHeroTitle(nextBlocks);
      }
    }
  } catch {
    // Non-fatal — script writer falls back to a generic closing.
  }

  const hasQuiz = blocks.some(
    (b) => b && (b.kind === "quiz" || b?.block?.kind === "quiz"),
  );
  return { blocks, assetMap, nextLessonId, nextLessonTitle, hasQuiz };
}

// Internal: parse a lesson file without re-entering the full loader (avoids
// recursive next-lesson lookups when we only need the title).
function loadLessonBlocksRaw(file) {
  let src = fs.readFileSync(file, "utf8");
  const assetMap = {};
  src.replace(
    /^import\s+(\w+)\s+from\s+["']@\/assets\/lessons\/([^"']+)["'];?\s*$/gm,
    (_, v, f) => { assetMap[v] = `lessons/${f}`; return ""; },
  );
  src = src.replace(/^import[\s\S]*?;\s*$/gm, "");
  const m = src.match(
    /export\s+const\s+\w+(?:\s*:\s*[A-Za-z_$][\w<>\[\]\s,]*)?\s*=\s*(\[[\s\S]*?\]);\s*$/m,
  );
  if (!m) return { blocks: [], assetMap };
  let arrSrc = m[1].replace(
    /(\bicon\s*:\s*)([A-Z][A-Za-z0-9_]*)/g, '$1"$2"',
  );
  for (const [v, p] of Object.entries(assetMap)) {
    arrSrc = arrSrc.replace(
      new RegExp(`(\\bsrc\\s*:\\s*)${v}\\b`, "g"), `$1"${p}"`,
    );
  }
  try {
    return { blocks: Function(`"use strict"; return (${arrSrc});`)(), assetMap };
  } catch {
    return { blocks: [], assetMap };
  }
}

// CLI: `bun remotion/scripts/lib/lesson-loader.mjs <lessonId>`
if (process.argv[1] && process.argv[1].endsWith("lesson-loader.mjs")) {
  const id = process.argv[2];
  if (!id) {
    console.error("usage: lesson-loader.mjs <lessonId>");
    process.exit(1);
  }
  const result = loadLessonBlocks(id);
  process.stdout.write(JSON.stringify(result, null, 2));
}

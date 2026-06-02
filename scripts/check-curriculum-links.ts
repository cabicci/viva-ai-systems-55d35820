/**
 * Curriculum integrity check
 * --------------------------
 * Verifies that:
 *  - module orders within each path are consecutive integers starting at the
 *    path's first order (no fractions, no gaps).
 *  - every available lesson has a route.
 *  - every `/intro/*` and `/automator/*` and `/creator/*` route has lesson
 *    content registered in INTRO_LESSON_CONTENT.
 *  - lesson ids are unique across PATHS.
 *  - every `path.route` resolves to a real route file under src/routes/.
 *
 * Run with:  bun run scripts/check-curriculum-links.ts
 */
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { PATHS } from "../src/lib/curriculum-data";
import { INTRO_LESSON_CONTENT } from "../src/components/intro/lessons";

const errors: string[] = [];
const warn = (m: string) => errors.push(m);

const routesDir = join(process.cwd(), "src/routes");
const routeFiles = readdirSync(routesDir);

function hasRouteFile(routePath: string): boolean {
  // e.g. /paths/builder -> paths.builder.index.tsx OR paths.builder.tsx
  const norm = routePath.replace(/^\//, "").replace(/\//g, ".");
  return (
    routeFiles.includes(`${norm}.tsx`) ||
    routeFiles.includes(`${norm}.index.tsx`) ||
    routeFiles.some((f) => f.startsWith(`${norm}.`) || f === `${norm}.tsx`)
  );
}

const seenLessonIds = new Map<string, string>();
const contentKeys = new Set(Object.keys(INTRO_LESSON_CONTENT));

for (const p of PATHS) {
  // Module order check — consecutive integers (no fractions, no gaps).
  const orders = p.modules.map((m) => m.order);
  for (const o of orders) {
    if (!Number.isInteger(o)) {
      warn(`[${p.id}] module order is not an integer: ${o}`);
    }
  }
  const sorted = [...orders].sort((a, b) => a - b);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] !== sorted[i - 1] + 1) {
      warn(
        `[${p.id}] non-consecutive module orders: ${sorted[i - 1]} -> ${sorted[i]}`,
      );
    }
  }

  // Path overview route presence
  if (p.route && p.status === "open" && !hasRouteFile(p.route)) {
    warn(`[${p.id}] path.route "${p.route}" has no matching file in src/routes/`);
  }

  for (const m of p.modules) {
    for (const l of m.lessons) {
      // Lesson id uniqueness
      if (seenLessonIds.has(l.id)) {
        warn(
          `duplicate lesson id "${l.id}" in [${p.id}/${m.id}] and [${seenLessonIds.get(l.id)}]`,
        );
      } else {
        seenLessonIds.set(l.id, `${p.id}/${m.id}`);
      }

      // Available lessons must have a route
      if (l.state === "available" && !l.route) {
        warn(`[${p.id}/${m.id}/${l.id}] available lesson without route`);
      }

      // intro/automator/creator routes must have content registered
      if (l.route) {
        const introPrefixes = [
          "/intro/",
          "/automator/",
          "/creator/",
          "/analyst/",
          "/business/",
        ];
        for (const prefix of introPrefixes) {
          if (l.route.startsWith(prefix)) {
            const slug = l.route.slice(prefix.length);
            if (!contentKeys.has(slug)) {
              warn(
                `[${p.id}/${m.id}/${l.id}] route "${l.route}" has no entry in INTRO_LESSON_CONTENT (key="${slug}")`,
              );
            }
          }
        }
      }
    }
  }
}

if (errors.length === 0) {
  console.log("✓ curriculum integrity check passed");
  process.exit(0);
}

console.error(`✗ curriculum integrity check failed (${errors.length} issue${errors.length === 1 ? "" : "s"}):`);
for (const e of errors) console.error(`  - ${e}`);
process.exit(1);
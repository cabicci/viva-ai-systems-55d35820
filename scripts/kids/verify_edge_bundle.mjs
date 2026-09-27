import { readFileSync } from "node:fs";
import { resolve, relative, dirname } from "node:path";

const functions = ["kids-lesson-content", "kids-lesson-help", "kids-playback"];
const root = resolve("supabase/functions");
const canonical = readFileSync(resolve(root, "kids-playback/token.ts"), "utf8");

for (const name of functions) {
  const dir = resolve(root, name);
  const pending = [resolve(dir, "index.ts")];
  const visited = new Set();
  while (pending.length) {
    const file = pending.pop();
    if (visited.has(file)) continue;
    visited.add(file);
    const code = readFileSync(file, "utf8");
    for (const match of code.matchAll(
      /\b(?:import|export)\s+(?:[^;]*?\s+from\s+)?["'](\.[^"']+)["']/g,
    )) {
      const dependency = resolve(dirname(file), match[1]);
      const path = relative(dir, dependency);
      if (path.startsWith("..") || path.startsWith("/"))
        throw new Error(`${name} imports outside its deployment folder: ${match[1]}`);
      pending.push(dependency);
    }
  }
  if (name !== "kids-playback" && readFileSync(resolve(dir, "token.ts"), "utf8") !== canonical)
    throw new Error(`${name}/token.ts differs from the canonical playback request parser`);
}

console.log("PASS: Kids Edge Functions bundle their own imports and matching request parser");

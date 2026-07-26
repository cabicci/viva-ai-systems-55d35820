import fs from "node:fs";
import path from "node:path";

const needles = [
  'chunkId":"ar-EG/analyst-m1-l1-from-automation-to-insight/s0/c0',
  "SUPABASE_SERVICE_ROLE_KEY",
  "sk-proj-",
  "BEGIN PRIVATE KEY",
  '"displayText":"بياناتك جاهزة',
];

/** Full digests must not be statically embedded in client chunks (admin gets them via server status). */
const digestNeedles = [
  "0ca5afee1c9e7ade676553cc51e3a0dd55515508a54f046dde098826b5fb510e",
  "24a7ae7af60db811fab63b52604d79bc18fb5d82dd14e99e687e90a6dea216ca",
  "3bfb0d1a04053adc6da5580283dd14d54ade85e079dcac12ceddf5ed1ef1faca",
  "6f3bad994c0d0bb8b2a92fcc3d1e729cd98bab685d68e882dab7d69c7c910f8b",
];

const roots = ["dist", ".output", "build"];
const files: string[] = [];

function walk(dir: string) {
  if (!fs.existsSync(dir)) return;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p);
    else if (/\.(js|mjs|css|map|html)$/.test(ent.name)) files.push(p);
  }
}

for (const r of roots) walk(r);

const hits: Array<{ file: string; needle: string }> = [];
for (const f of files) {
  const norm = f.replace(/\\/g, "/");
  if (norm.includes("/server/") || /\/ssr\//.test(norm) || norm.includes("server-")) continue;
  const text = fs.readFileSync(f, "utf8");
  for (const needle of [...needles, ...digestNeedles]) {
    if (text.includes(needle)) hits.push({ file: norm, needle: needle.slice(0, 48) });
  }
  if (text.includes('"displayText"') && text.includes('"chunkId":"ar-EG/')) {
    hits.push({ file: norm, needle: "corpus_chunk_payload" });
  }
}

console.log(
  JSON.stringify(
    {
      scannedFiles: files.length,
      clientHits: hits,
      ok: hits.length === 0,
    },
    null,
    2,
  ),
);
process.exit(hits.length === 0 ? 0 : 1);

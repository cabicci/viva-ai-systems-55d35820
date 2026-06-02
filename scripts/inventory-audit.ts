import { PATHS } from "@/lib/curriculum-data";
import { INTRO_LESSON_CONTENT } from "@/components/intro/lessons";
import { existsSync, statSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

type Row = {
  pathId: string;
  pathTitle: string;
  moduleOrder: number;
  moduleTitle: string;
  lessonOrder: number;
  lessonId: string;
  lessonTitle: string;
  state: string;
  hasBlocks: boolean;
  hasLessonVideoBlock: boolean;
  videoUrlOverride: string;
  mp4Path: string;
  mp4Exists: boolean;
  mp4SizeKB: number;
  status: string;
};

const rows: Row[] = [];
for (const p of PATHS) {
  for (const m of p.modules) {
    for (const l of m.lessons) {
      const blockKey = l.id;
      const blocksResolved = INTRO_LESSON_CONTENT[blockKey];
      let hasLV = false;
      let urlOv = "";
      if (blocksResolved) {
        for (const s of blocksResolved) {
          if (s.block.kind === "lessonVideo") {
            hasLV = true;
            urlOv = s.block.url ?? "";
          }
        }
      }
      // Resolve actual MP4 path: prefer the url override if it's a local /lessons/... path.
      let mp4Rel = `public/lessons/intro/${blockKey}.mp4`;
      if (urlOv && urlOv.startsWith("/")) {
        mp4Rel = `public${urlOv}`;
      }
      const abs = resolve(process.cwd(), mp4Rel);
      const exists = existsSync(abs);
      const size = exists ? Math.round(statSync(abs).size / 1024) : 0;
      let status = "OK";
      if (l.state === "coming-soon") status = "COMING_SOON";
      else if (!blocksResolved) status = "NO_BLOCKS";
      else if (!hasLV) status = "NO_VIDEO_BLOCK";
      else if (urlOv && !urlOv.startsWith("/")) status = "EXTERNAL_URL";
      else if (!exists) status = "MISSING_MP4";
      else if (size < 50) status = "MP4_TOO_SMALL";

      rows.push({
        pathId: p.id, pathTitle: p.title,
        moduleOrder: m.order, moduleTitle: m.title,
        lessonOrder: l.order, lessonId: l.id, lessonTitle: l.title,
        state: l.state,
        hasBlocks: !!blocksResolved,
        hasLessonVideoBlock: hasLV,
        videoUrlOverride: urlOv,
        mp4Path: mp4Rel,
        mp4Exists: exists,
        mp4SizeKB: size,
        status,
      });
    }
  }
}

writeFileSync("/tmp/audit/inventory.json", JSON.stringify(rows, null, 2));

// CSV
const headers = Object.keys(rows[0]) as (keyof Row)[];
const esc = (v: any) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const csv = [headers.join(","), ...rows.map(r => headers.map(h => esc(r[h])).join(","))].join("\n");
writeFileSync("/mnt/documents/lessons-inventory.csv", csv);

// summary
const by = (k: string) => rows.filter(r => r.status === k).length;
console.log(JSON.stringify({
  total: rows.length,
  OK: by("OK"),
  COMING_SOON: by("COMING_SOON"),
  NO_BLOCKS: by("NO_BLOCKS"),
  NO_VIDEO_BLOCK: by("NO_VIDEO_BLOCK"),
  EXTERNAL_URL: by("EXTERNAL_URL"),
  MISSING_MP4: by("MISSING_MP4"),
  MP4_TOO_SMALL: by("MP4_TOO_SMALL"),
}, null, 2));

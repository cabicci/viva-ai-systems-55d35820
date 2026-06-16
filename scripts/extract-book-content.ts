/**
 * Extracts all curriculum content (paths → modules → lessons → blocks)
 * into a single JSON file consumable by scripts/generate-book.py.
 *
 * Run: bun run scripts/extract-book-content.ts > /tmp/book-content.json
 */
import { PATHS } from "../src/lib/curriculum-data";
import { INTRO_LESSON_CONTENT } from "../src/components/intro/lessons";
import { BUNNY_LIBRARY_ID, BUNNY_VIDEO_GUIDS } from "../src/lib/bunny-videos";

type Block = Record<string, unknown> & { kind: string };

function serializeBlock(block: any): Block {
  // strip non-serializable (icons are React components on sections, not blocks)
  return JSON.parse(JSON.stringify(block));
}

const out: any = {
  generatedAt: new Date().toISOString(),
  paths: [],
};

const PATH_ORDER: Record<string, number> = {
  intro: 0,
  builder: 1,
  creator: 2,
  automator: 3,
  analyst: 4,
  business: 5,
};

const sortedPaths = [...PATHS].sort(
  (a, b) => (PATH_ORDER[a.id] ?? 99) - (PATH_ORDER[b.id] ?? 99),
);

for (const path of sortedPaths) {
  const pathOut: any = {
    id: path.id,
    title: path.title,
    tagline: path.tagline,
    accent: path.accent,
    modules: [],
  };
  for (const mod of path.modules) {
    const modOut: any = {
      id: mod.id,
      order: mod.order,
      title: mod.title,
      subtitle: mod.subtitle ?? "",
      lessons: [],
    };
    for (const lsn of mod.lessons) {
      const blocks = INTRO_LESSON_CONTENT[lsn.id];
      if (!blocks) continue;
      const guid = BUNNY_VIDEO_GUIDS[lsn.id];
      const videoUrl = guid
        ? `https://iframe.mediadelivery.net/play/${BUNNY_LIBRARY_ID}/${guid}`
        : null;
      modOut.lessons.push({
        id: lsn.id,
        order: lsn.order,
        title: lsn.title,
        videoUrl,
        sections: blocks.map((s: any) => ({
          eyebrow: s.eyebrow,
          title: s.title,
          tone: s.tone ?? null,
          block: serializeBlock(s.block),
        })),
      });
    }
    if (modOut.lessons.length) pathOut.modules.push(modOut);
  }
  if (pathOut.modules.length) out.paths.push(pathOut);
}

process.stdout.write(JSON.stringify(out, null, 2));

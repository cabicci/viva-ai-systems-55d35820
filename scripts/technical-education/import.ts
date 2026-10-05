import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { createHash } from "node:crypto";
import { getPilotCopy } from "./source/furniture-pilot/content";
import catalog from "../../src/lib/technical-education/catalog.json";
import revisions from "../../docs/experiments/technical-education/pdf-revisions.json";

const source = "87728437970170a0cb28bda536fddcaf6c1340ee";
const locales = ["ar-EG", "ar-MSA", "ar-Gulf", "en"] as const;
const canonical = (value: unknown): string =>
  JSON.stringify(value, (_key, child) =>
    child && typeof child === "object" && !Array.isArray(child)
      ? Object.fromEntries(Object.entries(child).sort(([a], [b]) => a.localeCompare(b, "en")))
      : child,
  );
const sha = (bytes: string | Uint8Array) => createHash("sha256").update(bytes).digest("hex");
const registry = readFileSync("scripts/technical-education/source/bunny-videos.txt", "utf8");
const guids = Object.fromEntries(
  [...registry.matchAll(/"([^"]+)":\s*"([^"]+)"/g)].map((m) => [m[1], m[2]]),
);
const lessons = catalog.lessons.flatMap((item) =>
  locales.map((locale) => {
    const payload =
      item.id === "M04-L02"
        ? getPilotCopy(locale)
        : JSON.parse(
            readFileSync(
              `scripts/technical-education/source/technical-education/lessons/${item.id}__${locale}.json`,
              "utf8",
            ),
          );
    if (item.id === "M04-L02") {
      payload.draft = locale === "en" ? "Carpentry and furniture making" : "النجارة وصناعة الأثاث";
      payload.labels.progressNote =
        locale === "en"
          ? "Progress is saved to your account."
          : locale === "ar-EG"
            ? "تقدمك بيتحفظ في حسابك."
            : locale === "ar-Gulf"
              ? "تقدمك ينحفظ في حسابك."
              : "يُحفظ تقدمك في حسابك.";
      payload.labels.assistant = locale === "en" ? "Lesson questions" : "أسئلة الدرس";
      payload.labels.guideNote =
        locale === "en"
          ? "Reference answers to common questions about this lesson."
          : locale === "ar-EG"
            ? "إجابات على أسئلة شائعة عن الدرس."
            : locale === "ar-Gulf"
              ? "إجابات على أسئلة متكررة عن هالدرس."
              : "إجابات مرجعية عن الأسئلة الشائعة في هذا الدرس.";
      payload.labels.videoNote =
        locale === "en"
          ? "Watch how the panels fit together and check the calculated dimensions. This is a schematic demonstration; joints, fixings and machining allowances require workshop review."
          : locale === "ar-EG"
            ? "شوف الألواح بتتركب إزاي وراجع المقاسات المحسوبة. ده توضيح للحركة؛ لازم تراجع الوصلات والتثبيت وسماحات التصنيع في الورشة."
            : locale === "ar-Gulf"
              ? "شوف ترتيب الألواح وراجع المقاسات المحسوبة. هالتوضيح للحركة؛ لازم تراجع الوصلات والتثبيت وسماحات التصنيع في الورشة."
              : "شاهد ترتيب الألواح وراجع الأبعاد المحسوبة. هذا توضيح للحركة؛ يجب مراجعة الوصلات والتثبيت وسماحات التصنيع في الورشة.";
    }
    const video_guid = guids[`${item.runtimeId}__${locale}`];
    if (!video_guid) throw new Error(`Missing video ${item.id}/${locale}`);
    return {
      lesson_id: item.id,
      locale,
      kind: item.id === "M04-L02" ? "cabinet" : "lesson",
      payload,
      video_guid,
      source_sha256: sha(canonical(payload)),
    };
  }),
);
function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)],
  );
}
const assets = walk("scripts/technical-education/assets")
  .filter((p) => p.endsWith(".pdf"))
  .map((local) => {
    const original = "public/experiments/" + relative("scripts/technical-education/assets", local);
    const parts = original.split("/");
    const locale = parts[3];
    const lesson_id = parts[2] === "furniture-pilot" ? "M04-L02" : parts[4];
    const file = parts.at(-1)!;
    const bytes = readFileSync(local),
      digest = sha(bytes);
    if (digest !== (revisions as Record<string, { output: string }>)[original]?.output)
      throw new Error(`PDF hash mismatch: ${original}`);
    return {
      local,
      bytes,
      manifest: {
        path: `${lesson_id}/${locale}/${file}`,
        lesson_id,
        locale,
        kind: file.replace(".pdf", ""),
        sha256: digest,
      },
    };
  });
if (
  lessons.length !== 320 ||
  assets.length !== 644 ||
  new Set(lessons.map((l) => l.video_guid)).size !== 320
)
  throw new Error("Incomplete handoff");
if (process.argv.includes("--prepare")) {
  writeFileSync(
    "scripts/technical-education/delivery.json",
    JSON.stringify({
      source,
      lessons,
      assets: assets.map((a) => ({ ...a.manifest, local: a.local })),
    }),
  );
  console.log(
    JSON.stringify({
      source,
      lessons: 80,
      packages: lessons.length,
      pdfs: assets.length,
      videos: 320,
    }),
  );
} else {
  const url = process.env.SUPABASE_URL,
    key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Server-side Supabase credentials required");
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const bucket = await db.storage.getBucket("technical-downloads");
  const options = { public: false, fileSizeLimit: 10485760, allowedMimeTypes: ["application/pdf"] };
  if (bucket.error) {
    if (
      bucket.error.message !== "Bucket not found" &&
      ("status" in bucket.error ? String(bucket.error.status) : "") !== "404"
    )
      throw new Error("Bucket lookup failed");
    const created = await db.storage.createBucket("technical-downloads", options);
    if (created.error) throw new Error("Private bucket creation failed");
  } else {
    const secured = await db.storage.updateBucket("technical-downloads", options);
    if (secured.error) throw new Error("Private bucket configuration failed");
  }
  const privateBucket = await db.storage.getBucket("technical-downloads");
  if (privateBucket.error || privateBucket.data?.public !== false)
    throw new Error("Bucket must remain private");

  for (let i = 0; i < lessons.length; i += 20) {
    const { error } = await db.from("technical_lesson_content").upsert(lessons.slice(i, i + 20));
    if (error) throw new Error(`Content import failed: ${error.code}`);
  }
  for (let i = 0; i < lessons.length; i += 20) {
    const expected = lessons.slice(i, i + 20);
    const rows = await db
      .from("technical_lesson_content")
      .select("lesson_id,locale,payload,video_guid,source_sha256")
      .in(
        "lesson_id",
        expected.map((l) => l.lesson_id),
      );
    if (rows.error || !rows.data) throw new Error("Cloud content verification failed");
    for (const lesson of expected) {
      const saved = rows.data.find(
        (r) => r.lesson_id === lesson.lesson_id && r.locale === lesson.locale,
      );
      if (
        !saved ||
        saved.video_guid !== lesson.video_guid ||
        saved.source_sha256 !== lesson.source_sha256 ||
        sha(canonical(saved.payload)) !== lesson.source_sha256
      )
        throw new Error("Cloud lesson hash mismatch");
    }
  }
  let uploaded = 0;
  for (let i = 0; i < assets.length; i += 8)
    await Promise.all(
      assets.slice(i, i + 8).map(async (asset) => {
        const { error } = await db.storage
          .from("technical-downloads")
          .upload(asset.manifest.path, asset.bytes, {
            contentType: "application/pdf",
            upsert: true,
          });
        if (error) throw new Error(`PDF upload failed: ${asset.manifest.path}`);
        const check = await db.storage.from("technical-downloads").download(asset.manifest.path);
        if (
          check.error ||
          !check.data ||
          sha(new Uint8Array(await check.data.arrayBuffer())) !== asset.manifest.sha256
        )
          throw new Error(`Cloud hash check failed: ${asset.manifest.path}`);
        uploaded++;
      }),
    );
  const manifest = await db.from("technical_asset_manifest").upsert(assets.map((a) => a.manifest));
  if (manifest.error) throw new Error("Manifest import failed");
  const [contentCount, assetCount] = await Promise.all([
    db.from("technical_lesson_content").select("lesson_id", { count: "exact", head: true }),
    db.from("technical_asset_manifest").select("path", { count: "exact", head: true }),
  ]);
  if (contentCount.count !== 320 || assetCount.count !== 644)
    throw new Error("Cloud count mismatch");
  const release = await db
    .from("technical_release_control")
    .update({ enabled: true })
    .eq("singleton", true);
  if (release.error) throw new Error("Release gate failed");
  console.log(
    JSON.stringify({
      source,
      imported: 320,
      uploaded,
      verified_cloud_pdf_hashes: 644,
      verified_cloud_content_hashes: 320,
      release_enabled: true,
      pronunciation: "owner review pending",
    }),
  );
}

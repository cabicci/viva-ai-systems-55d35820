/** Private review staging or accepted import; neither operation publishes content. */
import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
const base = "scripts/academic-integration/";
const raw = readFileSync(base + "manifest.json", "utf8");
const delivery = JSON.parse(raw);
const rootArg = process.argv.indexOf("--pdf-root");
const pdfRoot = rootArg >= 0 ? process.argv[rootArg + 1] : "tmp/academic-pdfs";
const sourceOnly = process.argv.includes("--check-source");
const contentOnly = process.argv.includes("--stage-content");
for (const locale of ["ar-EG", "ar-MSA", "ar-Gulf", "en"]) {
  const packages = [
    JSON.parse(readFileSync(`experiments/academic/content/${locale}.json`, "utf8")),
    ...JSON.parse(readFileSync(`experiments/academic/course/expanded/${locale}.json`, "utf8")),
  ];
  for (const row of delivery.lessons.filter((r: { locale: string }) => r.locale === locale))
    row.payload = packages.find((p) => p.id === row.lesson_id);
}
for (const asset of delivery.assets)
  asset.local = `${pdfRoot}/Lesson_Workbook_${asset.lesson_id}_${asset.locale}.pdf`;
const sha = (v: string | Uint8Array) => createHash("sha256").update(v).digest("hex");
const canonical = (v: unknown): string =>
  JSON.stringify(v, (_k, c) =>
    c && typeof c === "object" && !Array.isArray(c)
      ? Object.fromEntries(
          Object.keys(c)
            .sort()
            .map((k) => [k, c[k]]),
        )
      : c,
  );
const identity = (v: { lesson_id: string; locale: string }) => `${v.lesson_id}/${v.locale}`;
if (delivery.lessons.length !== 160 || delivery.assets.length !== 160)
  throw Error("Incomplete delivery");
const ids = new Set<string>();
for (const row of delivery.lessons) {
  if (
    ids.has(identity(row)) ||
    row.course_id !== "AC-BUS" ||
    !["ar-EG", "ar-MSA", "ar-Gulf", "en"].includes(row.locale) ||
    row.payload.id !== row.lesson_id ||
    row.payload.locale !== row.locale ||
    sha(canonical(row.payload)) !== row.source_sha256 ||
    row.approved ||
    row.video_guid !== null ||
    row.video_ready
  )
    throw Error("Invalid pinned content: " + identity(row));
  ids.add(identity(row));
}
const assets = new Set<string>();
for (const asset of delivery.assets) {
  if (
    !ids.has(identity(asset)) ||
    assets.has(identity(asset)) ||
    asset.path !== `AC-BUS/${asset.lesson_id}/${asset.locale}/workbook.pdf`
  )
    throw Error("Invalid workbook identity");
  const bytes = sourceOnly || contentOnly ? null : readFileSync(asset.local);
  if (bytes && (sha(bytes) !== asset.sha256 || bytes.subarray(0, 5).toString() !== "%PDF-"))
    throw Error("Workbook mismatch");
  assets.add(identity(asset));
}
console.log(
  JSON.stringify({
    source: delivery.source,
    packages: ids.size,
    pdfs: sourceOnly || contentOnly ? "not checked" : assets.size,
    deliverySha256: sha(raw),
    videoMappings: 0,
    approved: false,
  }),
);
if (!process.argv.includes("--check") && !sourceOnly) {
  const review = process.argv.includes("--stage-review") || contentOnly;
  const index = process.argv.indexOf("--acceptance");
  if (
    (!review && (!process.argv.includes("--apply") || index < 0 || !process.argv[index + 1])) ||
    (review && process.argv.includes("--apply"))
  )
    throw Error(
      "Use --check, --stage-review for private administrator review, or --apply --acceptance REVIEW.json after independent acceptance",
    );
  if (!review) {
    const acceptance = JSON.parse(readFileSync(process.argv[index + 1], "utf8"));
    if (
      acceptance.source !== delivery.source ||
      acceptance.deliverySha256 !== sha(raw) ||
      acceptance.academicAccepted !== true ||
      acceptance.contextualAccepted !== true ||
      !acceptance.reviewReference ||
      !acceptance.reviewer ||
      !acceptance.acceptedAt ||
      !Number.isFinite(Date.parse(acceptance.acceptedAt))
    )
      throw Error("Independent acceptance missing or does not match exact delivery");
  }
  const url = process.env.SUPABASE_URL,
    key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw Error("Server credentials required");
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const release = await db
    .from("academic_courses")
    .select("enabled,assistant_enabled")
    .eq("id", "AC-BUS")
    .single();
  if (release.error || release.data.enabled || release.data.assistant_enabled)
    throw Error("Import requires an existing inactive course and disabled assistant");
  if (!contentOnly) {
    const bucket = await db.storage.getBucket("academic-downloads");
    if (bucket.error) {
      if (
        bucket.error.message !== "Bucket not found" &&
        String((bucket.error as { status?: number }).status) !== "404"
      )
        throw Error("Private storage lookup failed");
      const made = await db.storage.createBucket("academic-downloads", {
        public: false,
        allowedMimeTypes: ["application/pdf"],
        fileSizeLimit: 10485760,
      });
      if (made.error) throw Error("Private bucket creation failed");
    } else if (bucket.data.public) throw Error("Academic bucket unexpectedly public");
  }
  for (const row of delivery.lessons) {
    const existing = await db
      .from("academic_lesson_content")
      .select("source_sha256,payload")
      .eq("course_id", row.course_id)
      .eq("lesson_id", row.lesson_id)
      .eq("locale", row.locale)
      .maybeSingle();
    if (existing.error) throw Error("Content lookup failed");
    if (existing.data) {
      if (
        existing.data.source_sha256 !== row.source_sha256 ||
        sha(canonical(existing.data.payload)) !== row.source_sha256
      )
        throw Error("Existing content differs; explicit revision required");
    } else {
      const inserted = await db.from("academic_lesson_content").insert({ ...row, approved: false });
      if (inserted.error) throw Error("Content import failed");
    }
  }
  for (const asset of contentOnly ? [] : delivery.assets) {
    const bytes = readFileSync(asset.local);
    const uploaded = await db.storage
      .from("academic-downloads")
      .upload(asset.path, bytes, { contentType: "application/pdf", upsert: false });
    if (uploaded.error && !/already exists|Duplicate/i.test(uploaded.error.message))
      throw Error("Workbook upload failed");
    const check = await db.storage.from("academic-downloads").download(asset.path);
    if (check.error || sha(new Uint8Array(await check.data.arrayBuffer())) !== asset.sha256)
      throw Error("Cloud workbook verification failed");
    const { local, ...manifest } = asset;
    void local;
    const saved = await db.from("academic_asset_manifest").upsert(manifest);
    if (saved.error) throw Error("Asset manifest import failed");
  }
  for (const row of delivery.lessons) {
    const check = await db
      .from("academic_lesson_content")
      .select("payload,source_sha256")
      .eq("course_id", row.course_id)
      .eq("lesson_id", row.lesson_id)
      .eq("locale", row.locale)
      .single();
    if (
      check.error ||
      check.data.source_sha256 !== row.source_sha256 ||
      sha(canonical(check.data.payload)) !== row.source_sha256
    )
      throw Error("Cloud content verification failed");
  }
  if (review) {
    const reviewed = await db
      .from("academic_courses")
      .update({ review_enabled: true })
      .eq("id", "AC-BUS")
      .eq("enabled", false)
      .eq("assistant_enabled", false)
      .select("id")
      .single();
    if (reviewed.error) throw Error("Private review activation failed");
  }
  // Never enables public course release, approves content or activates video mappings.
  console.log(
    JSON.stringify({
      reviewOnly: review,
      imported: 160,
      verifiedCloudContent: 160,
      verifiedCloudPdfs: contentOnly ? 0 : 160,
      pdfImportPending: contentOnly,
      enabled: false,
      approved: false,
      assistant: false,
      videoMappingsChanged: false,
    }),
  );
}

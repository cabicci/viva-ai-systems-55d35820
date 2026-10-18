import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const base = "scripts/academic-integration/";
const revision = JSON.parse(readFileSync(base + "audit-revision-8-9-10-40.json", "utf8"));
const manifest = JSON.parse(readFileSync(base + "manifest.json", "utf8"));
const canonical = value => JSON.stringify(value, (_key, child) =>
  child && typeof child === "object" && !Array.isArray(child)
    ? Object.fromEntries(Object.keys(child).sort().map(key => [key, child[key]])) : child);
const sha = value => createHash("sha256").update(canonical(value)).digest("hex");
const same = (left, right) => canonical(left) === canonical(right);
const assert = (condition, message) => { if (!condition) throw Error(message); };
assert(revision.role === "academic-audit-source-revision" && revision.state === "source-only-not-applied-to-database", "Wrong revision role/state");
assert(revision.changes.length === 4 && new Set(revision.changes.map(row => row.item)).size === 4, "Unexpected revision scope");
const statements = ["BEGIN;", "LOCK TABLE public.academic_lesson_content IN SHARE ROW EXCLUSIVE MODE;", "DO $audit_revision$", "DECLARE course_enabled boolean; assistant_enabled boolean; row_count integer;", "BEGIN",
 "SELECT enabled, academic_courses.assistant_enabled INTO course_enabled, assistant_enabled FROM public.academic_courses WHERE id = 'AC-BUS' FOR UPDATE;",
 "IF course_enabled IS DISTINCT FROM false OR assistant_enabled IS DISTINCT FROM false THEN RAISE EXCEPTION 'Academic revision requires the existing inactive course and disabled assistant'; END IF;"];
const literal = value => "'" + String(value).replaceAll("'", "''") + "'";
for (const change of revision.changes) {
 assert(change.courseId === "AC-BUS" && [8,9,10,40].includes(change.item) && ["ar-EG","ar-Gulf"].includes(change.locale), "Unexpected revision identity");
 const source = JSON.parse(readFileSync(`experiments/academic/course/expanded/${change.locale}.json`, "utf8"));
 const after = source.find(lesson => lesson.id === change.lessonId);
 assert(after && after.locale === change.locale && sha(after) === change.afterSha256, "Revised source fingerprint differs");
 const entry = manifest.lessons.find(row => row.lesson_id === change.lessonId && row.locale === change.locale);
 assert(entry?.source_sha256 === change.afterSha256 && entry.approved === false && entry.video_guid === null && entry.video_ready === false, "Delivery source or release/media state differs");
 const before = structuredClone(after);
 for (const field of [...change.changedFields].reverse()) {
  const keys = field.path.split(".");
  let parent = before;
  for (const key of keys.slice(0,-1)) parent = parent[key];
  const key = keys.at(-1);
  assert(same(parent[key], field.after), "Changed field differs: " + field.path);
  parent[key] = field.before;
 }
 assert(sha(before) === change.beforeSha256, "Original source cannot be reconstructed exactly");
 const where = `course_id = 'AC-BUS' AND lesson_id = ${literal(change.lessonId)} AND locale = ${literal(change.locale)}`;
 // Exact whole-payload comparison detects unrecorded edits even if a stale fingerprint was retained.
 statements.push(
 `IF EXISTS (SELECT 1 FROM public.academic_lesson_content WHERE ${where} AND source_sha256 = ${literal(change.afterSha256)} AND payload = ${literal(canonical(after))}::jsonb AND approved = false) THEN NULL;`,
 "ELSE",
 `UPDATE public.academic_lesson_content SET payload = ${literal(canonical(after))}::jsonb, source_sha256 = ${literal(change.afterSha256)} WHERE ${where} AND source_sha256 = ${literal(change.beforeSha256)} AND payload = ${literal(canonical(before))}::jsonb AND approved = false;`,
 "GET DIAGNOSTICS row_count = ROW_COUNT;",
 `IF row_count <> 1 THEN RAISE EXCEPTION 'Original unapproved payload differs for ${change.lessonId}/${change.locale}'; END IF;`,
 "END IF;");
}
// Independent arithmetic acceptance for the four reviewed source corrections.
assert((8-2)/2*100 === 300 && 8-2 === 6, "Rework percentage");
const profit=(price,variable,fixed,quantity)=>(price-variable)*quantity-fixed;
assert(profit(50,50,100,1) === profit(50,50,100,10), "Zero contribution remains constant");
assert(profit(50,60,100,10) < profit(50,60,100,1), "Negative contribution worsens loss");
assert(500-(200+50) === 250 && Math.ceil(1500/250) === 6, "Logo baseline");
assert(500*0.9-250 === 200 && Math.ceil(5*250/200) === 7 && 7-5 === 2, "Discount replacement volume");
const week1=800+5*150-600-400;
const week2=week1+7*150+900-500-200;
assert(week1===550 && week2===1800, "Cash closing balances");
statements.push("END;", "$audit_revision$;", "COMMIT;");
const sqlArg=process.argv.indexOf("--sql");
if (sqlArg >= 0) {
 assert(process.argv[sqlArg+1], "Provide an explicit new SQL output path");
 writeFileSync(resolve(process.argv[sqlArg+1]), statements.join("\n")+"\n", {encoding:"utf8",flag:"wx"});
}
assert(process.argv.includes("--check") || sqlArg >= 0, "Use --check or --sql NEW_REVIEW_FILE.sql; this tool never connects to a database");
console.log(JSON.stringify({items:revision.items,sourceLessons:4,exactBeforeAfter:true,arithmetic:{relativeIncreasePercent:300,percentagePoints:6,logoContribution:250,logoBreakeven:6,discountContribution:200,replacementLogos:7,additionalLogos:2,week1,week2},databaseChanged:false,sqlRendered:sqlArg>=0}));


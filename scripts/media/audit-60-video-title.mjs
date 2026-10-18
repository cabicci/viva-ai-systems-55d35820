import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const WEEKLY_REVIEW_VIDEO = Object.freeze({
  libraryId: 670679,
  videoId: "f8236eba-21ec-41c4-aac2-0adbd7e32d09",
  oldTitle: "Review أسبوعي = ١٥ دقيقة",
  newTitle: "Review أسبوعي = ٣٠ دقيقة (مدة الجلسة)",
});
const endpoint = `https://video.bunnycdn.com/library/${WEEKLY_REVIEW_VIDEO.libraryId}/videos/${WEEKLY_REVIEW_VIDEO.videoId}`;
const preserved = [
  "videoLibraryId",
  "guid",
  "dateUploaded",
  "length",
  "status",
  "width",
  "height",
  "framerate",
  "outputCodecs",
  "availableResolutions",
  "thumbnailFileName",
  "collectionId",
  "captions",
  "chapters",
  "moments",
  "metaTags",
];
/** Exact metadata-only proposal. No upload, encode, thumbnail, chapter or playback request. */
export async function reviseWeeklyReviewVideoTitle({
  apiKey,
  apply = false,
  fetchImpl = fetch,
} = {}) {
  if (!apiKey)
    throw Error(
      "Use the existing approved server BUNNY_STREAM_API_KEY; no credential is created or read from files.",
    );
  async function request(method, body) {
    const response = await fetchImpl(endpoint, {
      method,
      headers: { AccessKey: apiKey, ...(body ? { "Content-Type": "application/json" } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw Error(`Bunny metadata ${method} failed with HTTP ${response.status}`);
    return response.json();
  }
  const before = await request("GET");
  if (
    before.videoLibraryId !== WEEKLY_REVIEW_VIDEO.libraryId ||
    before.guid !== WEEKLY_REVIEW_VIDEO.videoId
  )
    throw Error("Bunny video identity differs");
  if (
    before.title !== WEEKLY_REVIEW_VIDEO.oldTitle &&
    before.title !== WEEKLY_REVIEW_VIDEO.newTitle
  )
    throw Error("Bunny title changed since review; refusing to overwrite it");
  const report = {
    auditItem: 60,
    libraryId: WEEKLY_REVIEW_VIDEO.libraryId,
    videoId: WEEKLY_REVIEW_VIDEO.videoId,
    beforeTitle: before.title,
    proposedTitle: WEEKLY_REVIEW_VIDEO.newTitle,
    durationSeconds: before.length,
    applied: false,
    alreadyCorrect: before.title === WEEKLY_REVIEW_VIDEO.newTitle,
  };
  if (!apply || report.alreadyCorrect) return report;
  const result = await request("POST", { title: WEEKLY_REVIEW_VIDEO.newTitle });
  if (result.success !== true)
    throw Error("Bunny did not confirm metadata update; inspect current metadata before retrying");
  const after = await request("GET");
  if (after.title !== WEEKLY_REVIEW_VIDEO.newTitle) throw Error("Bunny title verification failed");
  for (const field of preserved) {
    if (JSON.stringify(after[field]) !== JSON.stringify(before[field]))
      throw Error(`Bunny non-title field changed: ${field}; inspect before further action`);
  }
  return { ...report, applied: true, afterTitle: after.title, nonTitleMetadataPreserved: true };
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const check = process.argv.includes("--check"),
    apply = process.argv.includes("--apply");
  if (check === apply)
    throw Error(
      "Choose exactly --check or --apply; --apply is a separate reviewed provider-metadata delivery step.",
    );
  const result = await reviseWeeklyReviewVideoTitle({
    apiKey: process.env.BUNNY_STREAM_API_KEY,
    apply,
  });
  console.log(JSON.stringify(result));
}

export type ApprovedLesson = { course_id: string; lesson_id: string; locale: string;
  approved: boolean; source_sha256: string; payload: Record<string, unknown> };
export type AcademicChunk = { course_id: string; lesson_id: string; locale: string;
  section_id: string; content_version: string; source_sha256: string;
  content_sha256: string; content: string };
export const ACADEMIC_EMBEDDING_MODEL = "text-embedding-3-small";
export const ACADEMIC_EMBEDDING_DIMENSIONS = 1536;
export type IndexedAcademicChunk = AcademicChunk & {
  embedding: unknown; embedding_model?: string | null; embedding_dimensions?: number | null;
};

// Same canonical UTF-8 JSON contract as the existing Python corpus builder.
export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return "[" + value.map(canonicalJson).join(",") + "]";
  if (value && typeof value === "object") return "{" + Object.entries(value)
    .sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
    .map(([key, item]) => JSON.stringify(key) + ":" + canonicalJson(item)).join(",") + "}";
  const encoded = JSON.stringify(value);
  if (encoded === undefined) throw new Error("ACADEMIC_NON_JSON_SOURCE");
  return encoded;
}
export async function sha256(text: string): Promise<string> {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(bytes), x => x.toString(16).padStart(2, "0")).join("");
}
export async function approvedChunks(lesson: ApprovedLesson): Promise<AcademicChunk[]> {
  const p = lesson.payload;
  if (!lesson.approved || !/^AC-[A-Z0-9]+$/.test(lesson.course_id) ||
    !/^AC-[A-Z0-9]+-M\d{2}-L\d{2}$/.test(lesson.lesson_id) ||
    !lesson.lesson_id.startsWith(`${lesson.course_id}-`) || p.id !== lesson.lesson_id || p.locale !== lesson.locale ||
    !["ar-EG", "ar-MSA", "ar-Gulf", "en"].includes(lesson.locale) ||
    await sha256(canonicalJson(p)) !== lesson.source_sha256 || !Array.isArray(p.sections))
    throw new Error("ACADEMIC_SOURCE_MISMATCH");
  const seen = new Set<string>();
  return Promise.all(p.sections.map(async (raw: unknown) => {
    if (!raw || typeof raw !== "object") throw new Error("ACADEMIC_SECTION_INVALID");
    const s = raw as Record<string, unknown>;
    if (typeof s.id !== "string" || !/^[A-Za-z0-9_-]+$/.test(s.id) || seen.has(s.id) ||
      typeof s.title !== "string" || typeof s.text !== "string") throw new Error("ACADEMIC_SECTION_INVALID");
    seen.add(s.id);
    const content = s.title + "\n" + s.text;
    if (!content.trim() || content.length > 12000) throw new Error("ACADEMIC_SECTION_INVALID");
    return { course_id: lesson.course_id, lesson_id: lesson.lesson_id, locale: lesson.locale,
      section_id: s.id, content_version: typeof p.version === "string" ? p.version : "1.0.0-pilot",
      source_sha256: lesson.source_sha256, content_sha256: await sha256(content), content };
  }));
}

/** The registered rows must describe the same complete card in every locale.
 * A new card may have a different number of steps; no course-specific count is used.
 * Approval and canonical source hashes are still checked by approvedChunks.
 */
export function validateAcademicCorpus(lessons: ApprovedLesson[], courseId: string, requireApproval = true): void {
  const locales = ["ar-EG", "ar-MSA", "ar-Gulf", "en"];
  if (!/^AC-[A-Z0-9]+$/.test(courseId) || lessons.length === 0 ||
    lessons.some(row => row.course_id !== courseId || (requireApproval && !row.approved) || !locales.includes(row.locale)))
    throw new Error("ACADEMIC_CORPUS_INCOMPLETE");
  let expected: string | undefined;
  for (const locale of locales) {
    const ids = lessons.filter(row => row.locale === locale).map(row => row.lesson_id).sort();
    if (ids.length === 0 || new Set(ids).size !== ids.length)
      throw new Error("ACADEMIC_CORPUS_INCOMPLETE");
    const identity = JSON.stringify(ids);
    if (expected !== undefined && identity !== expected)
      throw new Error("ACADEMIC_CORPUS_INCOMPLETE");
    expected = identity;
  }
}

function compatibleEmbedding(row: IndexedAcademicChunk): number[] | null {
  if (row.embedding_model !== ACADEMIC_EMBEDDING_MODEL ||
    row.embedding_dimensions !== ACADEMIC_EMBEDDING_DIMENSIONS) return null;
  let values: unknown = row.embedding;
  if (typeof values === "string") {
    if (values.length > 100000) return null;
    try { values = JSON.parse(values); } catch { return null; }
  }
  return Array.isArray(values) && values.length === ACADEMIC_EMBEDDING_DIMENSIONS &&
    values.every(value => typeof value === "number" && Number.isFinite(value)) ? values : null;
}

/** Reuse a vector only for the exact same section text and embedding contract.
 * Source/version changes still produce a metadata update, without another embed.
 */
export function planAcademicChunkUpdates(expected: AcademicChunk[], existing: IndexedAcademicChunk[]) {
  let skipped = 0;
  const pending: { chunk: AcademicChunk; embedding: number[] | null }[] = [];
  for (const chunk of expected) {
    const candidates = existing.filter(row => row.course_id === chunk.course_id &&
      row.lesson_id === chunk.lesson_id && row.locale === chunk.locale && row.section_id === chunk.section_id &&
      row.content_sha256 === chunk.content_sha256 && row.content === chunk.content);
    const exact = candidates.find(row => row.source_sha256 === chunk.source_sha256 &&
      row.content_version === chunk.content_version && compatibleEmbedding(row));
    if (exact) { skipped++; continue; }
    const reusable = candidates.map(compatibleEmbedding).find(vector => vector !== null) ?? null;
    pending.push({ chunk, embedding: reusable });
  }
  return { pending, skipped };
}

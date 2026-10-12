export type ApprovedLesson = { course_id: string; lesson_id: string; locale: string;
  approved: boolean; source_sha256: string; payload: Record<string, unknown> };
export type AcademicChunk = { course_id: string; lesson_id: string; locale: string;
  section_id: string; content_version: string; source_sha256: string;
  content_sha256: string; content: string };

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
  if (!lesson.approved || lesson.course_id !== "AC-BUS" ||
    !/^AC-BUS-M\d{2}-L\d{2}$/.test(lesson.lesson_id) || p.id !== lesson.lesson_id || p.locale !== lesson.locale ||
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

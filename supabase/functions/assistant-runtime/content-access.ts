export interface CardContentAccess {
  adminReview: boolean;
  entitledLessonIds: readonly string[];
}

/** Decode the existing server gateway response at every access boundary. */
export function decodeCardContentAccess(
  result: unknown,
  expectedCardId: string,
): CardContentAccess | null {
  if (!result || typeof result !== "object" || Array.isArray(result)) return null;
  const response = result as Record<string, unknown>;
  const data = response.data;
  if (response.ok !== true || !data || typeof data !== "object" || Array.isArray(data)) return null;
  const access = data as Record<string, unknown>;
  if (access.card_id !== expectedCardId || typeof access.admin_review !== "boolean") return null;

  if (access.admin_review) return { adminReview: true, entitledLessonIds: [] };
  const lessons = access.lessons;
  if (!lessons || typeof lessons !== "object" || Array.isArray(lessons)) return null;
  const ids = (lessons as Record<string, unknown>).entitled_lesson_ids;
  if (!Array.isArray(ids) || !ids.every((id) => typeof id === "string" && id.trim().length > 0)) return null;
  return { adminReview: false, entitledLessonIds: ids.slice() };
}

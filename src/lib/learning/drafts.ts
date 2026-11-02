export type NoteDraft = { content: string; revision: number; requestId?: string };
export function noteDraftKey(
  user: string,
  subject: string,
  area: string,
  course: string,
  lesson: string,
) {
  return `learning-note:v1:${JSON.stringify([user, subject, area, course, lesson])}`;
}
export function readNoteDraft(key: string): NoteDraft | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const value = JSON.parse(raw);
    if (
      typeof value.content !== "string" ||
      value.content.length > 5000 ||
      !Number.isSafeInteger(value.revision) ||
      value.revision < 0
    )
      return null;
    return {
      content: value.content,
      revision: value.revision,
      requestId: typeof value.requestId === "string" ? value.requestId : undefined,
    };
  } catch {
    return null;
  }
}
export function storeNoteDraft(key: string, value: NoteDraft | null): boolean {
  try {
    if (value) localStorage.setItem(key, JSON.stringify(value));
    else localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export type ReviewMedia = {
  lessonId: string;
  locale: string;
  embedUrl: string;
  durationSeconds: number;
  playbackReady: boolean;
};

/** Exact review lookup; no other-lesson or other-locale fallback. */
export function resolveReviewMedia(
  registry: Record<string, ReviewMedia>, lessonId: string, locale: string,
): ReviewMedia | null {
  const entry = registry[`${lessonId}__${locale}`];
  if (!entry || entry.lessonId !== lessonId || entry.locale !== locale ||
      !entry.playbackReady || !(entry.durationSeconds > 0) ||
      !/^https:\/\/iframe\.mediadelivery\.net\/embed\/\d+\/[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}\?autoplay=false&preload=false$/.test(entry.embedUrl)) return null;
  return entry;
}

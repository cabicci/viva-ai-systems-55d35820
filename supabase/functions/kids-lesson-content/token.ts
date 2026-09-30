export const KIDS_LIBRARY_ID = 761387;
export const KIDS_LEVEL_IDS = ["level-1", "level-2", "level-3"] as const;
export const KIDS_LOCALES = ["ar-EG", "ar-MSA", "ar-Gulf", "en"] as const;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type KidsPlaybackRequest = {
  profileId: string;
  levelId: (typeof KIDS_LEVEL_IDS)[number];
  lessonNumber: number;
  locale: (typeof KIDS_LOCALES)[number];
};

export function parseKidsPlaybackRequest(value: unknown): KidsPlaybackRequest | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const request = value as Record<string, unknown>;
  if (
    typeof request.profileId !== "string" ||
    !UUID.test(request.profileId) ||
    !KIDS_LEVEL_IDS.includes(request.levelId as KidsPlaybackRequest["levelId"]) ||
    !Number.isInteger(request.lessonNumber) ||
    (request.lessonNumber as number) < 1 ||
    (request.lessonNumber as number) > 12 ||
    !KIDS_LOCALES.includes(request.locale as KidsPlaybackRequest["locale"])
  )
    return null;
  return request as KidsPlaybackRequest;
}

export async function signedKidsEmbedUrl(
  videoId: string,
  tokenKey: string,
  expires: number,
): Promise<string> {
  if (!UUID.test(videoId) || !tokenKey || !Number.isSafeInteger(expires) || expires <= 0) {
    throw new Error("Invalid Kids playback signing input");
  }
  const bytes = new TextEncoder().encode(tokenKey + videoId + expires);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const token = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  return `https://player.mediadelivery.net/embed/${KIDS_LIBRARY_ID}/${videoId}?token=${token}&expires=${expires}`;
}

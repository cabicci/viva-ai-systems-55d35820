import type { SupportedLocale } from "@/lib/locale/types";

/** Search for intake presentation links: always carries the effective locale and the
 * child profile actually in use, so moving between views never switches the child. */
export function scopedSearch(
  locale: SupportedLocale,
  profileId: string | undefined,
  extra: { lesson?: string; view?: "contents" } = {},
) {
  return { locale, ...(profileId ? { profileId } : {}), ...extra };
}

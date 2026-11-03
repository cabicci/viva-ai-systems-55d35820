import { getLocalizedBunnyEmbedUrl } from "@/lib/bunny-videos";
import type { SupportedLocale } from "@/lib/locale/types";

/**
 * Page-level QA markers for live non–ar-EG localized lessons.
 * Visible markers also exist on video, assistant, and mission UI; these ensure
 * automation can find attributes even when a block is absent or gated.
 */
export function LocaleLiveSafetyMarkers({
  locale,
  lessonId,
}: {
  locale: SupportedLocale;
  lessonId?: string;
}) {
  if (locale === "ar-EG") return null;

  const hasVideo = Boolean(
    lessonId && getLocalizedBunnyEmbedUrl(lessonId, locale),
  );

  return (
    <div className="sr-only" aria-hidden>
      <span data-locale-video={hasVideo ? "player" : "placeholder"} />
      <span data-locale-assistant="unavailable" />
      <span data-locale-mission="readonly" />
    </div>
  );
}

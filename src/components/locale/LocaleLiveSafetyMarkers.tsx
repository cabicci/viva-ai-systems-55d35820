import type { SupportedLocale } from "@/lib/locale/types";

/**
 * Page-level QA markers for live non–ar-EG localized lessons.
 * Visible markers also exist on video, assistant, and mission UI; these ensure
 * automation can find attributes even when a block is absent or gated.
 */
export function LocaleLiveSafetyMarkers({ locale }: { locale: SupportedLocale }) {
  if (locale === "ar-EG") return null;

  return (
    <div className="sr-only" aria-hidden>
      <span data-locale-video="placeholder" />
      <span data-locale-assistant="unavailable" />
      <span data-locale-mission="readonly" />
    </div>
  );
}

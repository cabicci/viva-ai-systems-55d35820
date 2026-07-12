import { getLocalizedBunnyEmbedUrl } from "@/lib/bunny-videos";
import { getUiString } from "@/lib/locale/ui-strings";
import type { SupportedLocale } from "@/lib/locale/types";

export function LocaleVideoPlaceholder({ locale }: { locale: SupportedLocale }) {
  return (
    <div
      className="rounded-2xl border border-border/50 bg-muted/20 p-5 text-center space-y-2"
      data-locale-video="placeholder"
    >
      <p className="text-sm font-semibold text-foreground">
        {getUiString(locale, "safety.video.title")}
      </p>
      <p className="text-xs text-muted-foreground">
        {getUiString(locale, "safety.video.body")}
      </p>
    </div>
  );
}

/**
 * Locale-aware lesson video slot for localized package pages.
 * Resolves Bunny via `${lessonId}__${locale}` only — no legacy fallback.
 */
export function LocaleLessonVideo({
  lessonId,
  locale,
}: {
  lessonId: string;
  locale: SupportedLocale;
}) {
  const embed = getLocalizedBunnyEmbedUrl(lessonId, locale);
  if (!embed) {
    return <LocaleVideoPlaceholder locale={locale} />;
  }

  return (
    <figure className="space-y-2" data-locale-video="player">
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-accent/20 bg-surface-scrim shadow-lg shadow-accent/5">
        <iframe
          src={embed}
          loading="lazy"
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
          title={getUiString(locale, "safety.video.title")}
        />
      </div>
    </figure>
  );
}

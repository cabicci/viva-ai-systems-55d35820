import { getUiString } from "@/lib/locale/ui-strings";
import type { SupportedLocale } from "@/lib/locale/types";

export function LocaleAssistantUnavailable({
  locale,
}: {
  locale: SupportedLocale;
}) {
  const title = getUiString(locale, "safety.assistant.title");
  const body = getUiString(locale, "safety.assistant.body");
  if (!title) return null;

  return (
    <div
      className="rounded-xl border border-border/60 bg-muted/20 p-4 text-sm leading-relaxed"
      data-locale-assistant="unavailable"
    >
      <p className="font-semibold text-foreground mb-1">{title}</p>
      <p className="text-muted-foreground">{body}</p>
    </div>
  );
}

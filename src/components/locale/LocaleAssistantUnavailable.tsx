import type { SupportedLocale } from "@/lib/locale/types";

const COPY: Record<SupportedLocale, { title: string; body: string }> = {
  "ar-EG": { title: "", body: "" },
  "ar-MSA": {
    title: "المساعد لهذه اللغة قريبًا",
    body: "محتوى الدرس متاح الآن. المساعد الذكي سيتوفر لاحقًا بالعربية الفصحى.",
  },
  "ar-Gulf": {
    title: "المساعد لهذه اللغة قريبًا",
    body: "محتوى الدرس متاح الآن. المساعد الذكي سيتوفر لاحقًا باللهجة الخليجية.",
  },
  en: {
    title: "Assistant coming for this language",
    body: "Lesson content is available now. The AI assistant will be enabled for English later.",
  },
};

export function LocaleAssistantUnavailable({
  locale,
}: {
  locale: SupportedLocale;
}) {
  const copy = COPY[locale];
  if (!copy.title) return null;

  return (
    <div
      className="rounded-xl border border-border/60 bg-muted/20 p-4 text-sm leading-relaxed"
      data-locale-assistant="unavailable"
    >
      <p className="font-semibold text-foreground mb-1">{copy.title}</p>
      <p className="text-muted-foreground">{copy.body}</p>
    </div>
  );
}

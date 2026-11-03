import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { ImageOff, Maximize2 } from "lucide-react";
import { getGalleryPath, type GalleryItem } from "@/lib/image-gallery-registry";
import { useLocale } from "@/lib/locale/locale-context";
import {
  resolveContextualV2Visual,
  type ContextualV2Locale,
} from "@/lib/lesson-visuals/contextual-v2/runtime/contextualV2BrowserResolver";

const GALLERY_COPY: Record<
  ContextualV2Locale,
  {
    close: string;
    enlarge: string;
    openLesson: (title: string) => string;
    openLessonCta: string;
  }
> = {
  "ar-EG": {
    close: "إغلاق",
    enlarge: "كبّر الصورة",
    openLesson: (title) => `افتح درس ${title}`,
    openLessonCta: "افتح الدرس ←",
  },
  "ar-MSA": {
    close: "إغلاق",
    enlarge: "تكبير الصورة",
    openLesson: (title) => `افتح درس ${title}`,
    openLessonCta: "افتح الدرس ←",
  },
  "ar-Gulf": {
    close: "إغلاق",
    enlarge: "كبّر الصورة",
    openLesson: (title) => `افتح درس ${title}`,
    openLessonCta: "افتح الدرس ←",
  },
  en: {
    close: "Close",
    enlarge: "Enlarge image",
    openLesson: (title) => `Open lesson ${title}`,
    openLessonCta: "Open lesson →",
  },
};

export function GalleryGrid({ items }: { items: GalleryItem[] }) {
  const { locale } = useLocale();
  const selectedLocale = locale as ContextualV2Locale;
  const copy = GALLERY_COPY[selectedLocale];
  const [preview, setPreview] = useState<null | {
    image: string;
    number: number;
    title: string;
  }>(null);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {items.map((item, index) => {
          const displayNumber = index + 1;
          const targetSlug = item.lessonSlug;
          const path = getGalleryPath(item);
          const title = item.titles[selectedLocale];
          const visual = resolveContextualV2Visual({
            lessonId: targetSlug,
            locale: selectedLocale,
          });
          return (
            <article
              key={item.number}
              id={`image-${item.number}`}
              className="group relative flex scroll-mt-24 flex-col overflow-hidden rounded-xl border border-border/40 glass transition hover:border-primary/50 hover:shadow-lg"
            >
              <Link
                to="/learn/$pathId/$lessonId"
                params={{ pathId: path, lessonId: targetSlug }}
                aria-label={copy.openLesson(title)}
                className="absolute inset-0 z-10"
              />
              <div className="relative">
                {visual.ok ? (
                  <img
                    src={visual.url}
                    alt={title}
                    loading="lazy"
                    decoding="async"
                    data-contextual-v2-img="gallery"
                    data-contextual-v2-cell={visual.cellId}
                    className="aspect-[16/10] w-full bg-muted/30 object-cover transition group-hover:opacity-90"
                  />
                ) : (
                  <div
                    className="grid aspect-[16/10] w-full place-items-center bg-muted/30"
                    data-contextual-v2-error={visual.reason}
                  >
                    <ImageOff className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="pointer-events-none absolute right-2 top-2 z-20 grid h-9 min-w-9 place-items-center rounded-full bg-primary px-2 text-sm font-bold text-primary-foreground shadow-lg">
                  {displayNumber}
                </div>
                {visual.ok ? (
                  <button
                    type="button"
                    onClick={() =>
                      setPreview({ image: visual.url, number: displayNumber, title })
                    }
                    className="absolute left-2 top-2 z-20 grid h-9 w-9 place-items-center rounded-full border border-border/40 bg-background/80 text-foreground opacity-0 backdrop-blur transition hover:bg-background focus:opacity-100 group-hover:opacity-100"
                    aria-label={copy.enlarge}
                  >
                    <Maximize2 className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
              <div className="pointer-events-none relative flex flex-1 flex-col gap-1.5 p-3">
                <p className="text-[10px] text-muted-foreground">{item.group}</p>
                <h2 className="line-clamp-2 text-sm font-semibold leading-snug">{title}</h2>
                <p className="mt-auto pt-2 text-xs text-primary group-hover:underline">
                  {copy.openLessonCta}
                </p>
              </div>
            </article>
          );
        })}
      </div>

      {preview ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in"
          onClick={() => setPreview(null)}
        >
          <div className="relative w-full max-w-5xl" onClick={(event) => event.stopPropagation()}>
            <img
              src={preview.image}
              alt={preview.title}
              className="max-h-[85vh] w-full rounded-xl object-contain shadow-2xl"
            />
            <div className="absolute right-3 top-3 grid h-11 min-w-11 place-items-center rounded-full bg-primary px-3 font-bold text-primary-foreground shadow-lg">
              {preview.number}
            </div>
            <button
              onClick={() => setPreview(null)}
              className="absolute left-3 top-3 rounded-full border border-border/50 bg-background/90 px-3 py-1.5 text-sm text-foreground hover:bg-background"
            >
              {copy.close} ✕
            </button>
            <p className="mt-3 text-center text-sm text-white">{preview.title}</p>
          </div>
        </div>
      ) : null}
    </>
  );
}

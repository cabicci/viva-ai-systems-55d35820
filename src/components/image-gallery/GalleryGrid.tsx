import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Maximize2 } from "lucide-react";
import { getGalleryPath, type GalleryItem } from "@/lib/image-gallery-registry";
import { LESSON_DIAGRAMS } from "@/components/intro/diagrams/LessonDiagrams";

export function GalleryGrid({ items }: { items: GalleryItem[] }) {
  const [preview, setPreview] = useState<
    null | { image?: string; diagramId?: GalleryItem["diagramId"]; number: number; title: string }
  >(null);

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {items.map((item, index) => {
          const displayNumber = index + 1;
          const targetSlug = item.lessonSlug ?? item.slug;
          const path = getGalleryPath(item);
          const linkProps = {
            to: "/learn/$pathId/$lessonId" as const,
            params: { pathId: path ?? "intro", lessonId: targetSlug },
          };
          const DiagramComp = item.diagramId ? LESSON_DIAGRAMS[item.diagramId] : null;
          return (
            <article
              key={item.number}
              id={`image-${item.number}`}
              className="relative glass rounded-xl overflow-hidden border border-border/40 flex flex-col scroll-mt-24 hover:border-primary/50 hover:shadow-lg transition group"
            >
              <Link
                {...linkProps}
                aria-label={`افتح درس ${item.title}`}
                className="absolute inset-0 z-10"
              />
              <div className="relative">
                {DiagramComp ? (
                  <div className="w-full aspect-[16/10] bg-[#FAFCFE] flex items-center justify-center overflow-hidden transition group-hover:opacity-90">
                    <DiagramComp />
                  </div>
                ) : (
                  <img
                    src={item.image}
                    alt={`صورة ${displayNumber} — ${item.title}`}
                    loading="lazy"
                    className="w-full aspect-[16/10] object-cover bg-muted/30 transition group-hover:opacity-90"
                  />
                )}
                <div className="absolute top-2 right-2 z-20 grid place-items-center min-w-9 h-9 px-2 rounded-full bg-primary text-primary-foreground font-bold text-sm shadow-lg pointer-events-none">
                  {displayNumber}
                </div>
                <button
                  type="button"
                  onClick={() => setPreview({ image: item.image, diagramId: item.diagramId, number: displayNumber, title: item.title })}
                  className="absolute top-2 left-2 z-20 grid place-items-center w-9 h-9 rounded-full bg-background/80 backdrop-blur text-foreground border border-border/40 hover:bg-background opacity-0 group-hover:opacity-100 focus:opacity-100 transition"
                  aria-label="تكبير الصورة"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
              <div className="relative p-3 flex-1 flex flex-col gap-1.5 pointer-events-none">
                <p className="text-[10px] text-muted-foreground">{item.group}</p>
                <h2 className="text-sm font-semibold leading-snug line-clamp-2">{item.title}</h2>
                <p className="mt-auto pt-2 text-xs text-primary group-hover:underline">افتح الدرس ←</p>
              </div>
            </article>
          );
        })}
      </div>

      {preview && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setPreview(null)}
        >
          <div className="relative max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
            {preview.diagramId ? (
              <div className="w-full max-h-[85vh] bg-[#FAFCFE] rounded-xl shadow-2xl p-4 overflow-auto">
                {(() => {
                  const D = LESSON_DIAGRAMS[preview.diagramId];
                  return <D />;
                })()}
              </div>
            ) : (
              <img
                src={preview.image}
                alt={preview.title}
                className="w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
              />
            )}
            <div className="absolute top-3 right-3 grid place-items-center min-w-11 h-11 px-3 rounded-full bg-primary text-primary-foreground font-bold shadow-lg">
              {preview.number}
            </div>
            <button
              onClick={() => setPreview(null)}
              className="absolute top-3 left-3 rounded-full bg-background/90 text-foreground px-3 py-1.5 text-sm border border-border/50 hover:bg-background"
            >
              إغلاق ✕
            </button>
            <p className="mt-3 text-center text-white text-sm">{preview.title}</p>
          </div>
        </div>
      )}
    </>
  );
}

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useLocale } from "@/lib/locale/locale-context";

const COPY = {
  en: {
    open: "Expand Systems View diagram",
    close: "Close",
    title: "Systems View — original diagram",
    instructions:
      "Use the zoom buttons, then scroll the image with touch or the arrow keys after focusing the image area. Press Escape to close.",
    zoomIn: "Zoom in",
    zoomOut: "Zoom out",
    reset: "Original size",
    area: "Scrollable original diagram",
    text: "Diagram in text",
    cards: [
      ["Trigger", "A WhatsApp inquiry arrives"],
      ["Process", "Understand the request and find the price"],
      ["Output", "Reply to the customer and log it"],
    ],
  },
  "ar-Gulf": {
    open: "كبّر مخطط نظرة على الأنظمة",
    close: "إغلاق",
    title: "نظرة على الأنظمة — المخطط الأصلي",
    instructions:
      "استخدم أزرار التكبير، وبعدها حرّك الصورة باللمس أو بأسهم لوحة المفاتيح بعد تحديد منطقة الصورة. اضغط Escape للإغلاق.",
    zoomIn: "تكبير",
    zoomOut: "تصغير",
    reset: "الحجم الأصلي",
    area: "المخطط الأصلي القابل للتمرير",
    text: "المخطط بالنص",
    cards: [
      ["المُشغّل", "وصل استفسار واتساب"],
      ["العملية", "افهم الطلب وطلّع السعر"],
      ["الناتج", "رد على العميل وسجّل الطلب"],
    ],
  },
} as const;

/** Narrow reading aid transcribed from the two reviewed originals; no image/source rewrites. */
export function SystemsViewReadingAid({ cellId, url }: { cellId: string; url: string }) {
  const { locale } = useLocale();
  const [zoom, setZoom] = useState(1);
  if (
    (locale !== "en" && locale !== "ar-Gulf") ||
    cellId !== `automator-m2-l1-systems-view__${locale}`
  )
    return null;
  const c = COPY[locale];
  return (
    <div
      className="space-y-4 border-t border-border/40 p-4"
      dir={locale === "en" ? "ltr" : "rtl"}
      data-systems-view-reading-aid={locale}
    >
      <Dialog
        onOpenChange={(open) => {
          if (open) setZoom(1);
        }}
      >
        <DialogTrigger asChild>
          <button
            type="button"
            className="min-h-11 rounded-lg border px-4 py-2 font-semibold text-primary underline"
          >
            {c.open}
          </button>
        </DialogTrigger>
        <DialogContent
          closeLabel={c.close}
          className="max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] overflow-y-auto p-4 pt-12"
          dir={locale === "en" ? "ltr" : "rtl"}
        >
          <DialogTitle>{c.title}</DialogTitle>
          <DialogDescription>{c.instructions}</DialogDescription>
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <button
              type="button"
              className="min-h-11 rounded border px-3"
              disabled={zoom <= 0.5}
              onClick={() => setZoom((value) => Math.max(0.5, value - 0.25))}
            >
              {c.zoomOut}
            </button>
            <output aria-live="polite">{Math.round(zoom * 100)}%</output>
            <button
              type="button"
              className="min-h-11 rounded border px-3"
              disabled={zoom >= 2}
              onClick={() => setZoom((value) => Math.min(2, value + 0.25))}
            >
              {c.zoomIn}
            </button>
            <button
              type="button"
              className="min-h-11 rounded border px-3"
              onClick={() => setZoom(1)}
            >
              {c.reset}
            </button>
          </div>
          <div
            tabIndex={0}
            role="region"
            aria-label={c.area}
            className="max-h-[60dvh] min-w-0 overflow-auto rounded border focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            <img
              src={url}
              alt={c.title}
              className="block h-auto max-w-none"
              style={{ width: 1900 * zoom }}
            />
          </div>
        </DialogContent>
      </Dialog>
      <section aria-label={c.text}>
        <h3 className="mb-3 font-semibold">{c.text}</h3>
        <ol className="grid min-w-0 list-none gap-3 sm:grid-cols-3" role="list">
          {c.cards.map(([title, example], i) => (
            <li key={title} className="min-w-0 break-words rounded-lg border p-3">
              <h4 className="font-bold">
                {i + 1}. {title}
              </h4>
              <p className="mt-2 leading-7">{example}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

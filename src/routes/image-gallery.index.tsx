import { createFileRoute, Link } from "@tanstack/react-router";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { GALLERY_PATHS, getGalleryItemsByPath } from "@/lib/image-gallery-registry";

export const Route = createFileRoute("/image-gallery/")({
  head: () => ({
    meta: [
      { title: "معرض الصور — اختر مسار" },
      { name: "description", content: "معرض صور الدروس مقسّم على المسارات: إنترو، بليدر، كرييتور، أوتوميتور." },
    ],
  }),
  component: ImageGalleryPage,
});

function ImageGalleryPage() {
  return (
    <div className="flex min-h-dvh w-full" dir="rtl">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8">
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gradient mb-2">معرض الصور</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            اختر المسار اللي عايز تتفرّج على صوره. كل مسار له صفحة لوحده عشان التحميل أسرع والترتيب أوضح.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {GALLERY_PATHS.map((p) => {
            const count = getGalleryItemsByPath(p.id).length;
            const disabled = count === 0;
            const cardClass = `glass rounded-2xl p-5 border border-border/40 flex items-center gap-4 transition ${
              disabled ? "opacity-50 pointer-events-none" : "hover:border-primary/40 hover:bg-primary/5"
            }`;
            const inner = (
              <>
                <div className="grid place-items-center min-w-14 h-14 rounded-full bg-primary/15 text-primary font-bold text-lg">
                  {count || "—"}
                </div>
                <div className="flex-1">
                  <h2 className="text-base md:text-lg font-semibold">{p.label}</h2>
                  <p className="text-xs md:text-sm text-muted-foreground mt-1">{p.description}</p>
                </div>
                <span className="text-muted-foreground text-lg">‹</span>
              </>
            );
            return disabled ? (
              <div key={p.id} className={cardClass} aria-disabled="true">
                {inner}
              </div>
            ) : (
              <Link
                key={p.id}
                to="/image-gallery/$path"
                params={{ path: p.id }}
                className={cardClass}
              >
                {inner}
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
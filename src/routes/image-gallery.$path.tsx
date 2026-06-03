import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { GalleryGrid } from "@/components/image-gallery/GalleryGrid";
import {
  GALLERY_PATHS,
  getGalleryItemsByPath,
  type GalleryPath,
} from "@/lib/image-gallery-registry";

const VALID: GalleryPath[] = ["intro", "business", "creator", "analyst", "automator", "builder"];

export const Route = createFileRoute("/image-gallery/$path")({
  beforeLoad: ({ params }) => {
    if (!VALID.includes(params.path as GalleryPath)) throw notFound();
  },
  head: ({ params }) => {
    const meta = GALLERY_PATHS.find((p) => p.id === params.path);
    const title = meta ? `معرض صور — ${meta.label}` : "معرض الصور";
    return {
      meta: [
        { title },
        { name: "description", content: meta?.description ?? "معرض صور الدروس." },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="p-8 text-center" dir="rtl">
      <h1 className="text-2xl font-bold mb-3">المسار ده مش موجود</h1>
      <Link to="/image-gallery" className="text-primary underline">
        ارجع لمعرض الصور
      </Link>
    </div>
  ),
  component: PathGalleryPage,
});

function PathGalleryPage() {
  const { path } = Route.useParams();
  const meta = GALLERY_PATHS.find((p) => p.id === (path as GalleryPath))!;
  const items = getGalleryItemsByPath(path as GalleryPath);

  return (
    <div className="flex min-h-screen w-full" dir="rtl">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8">
        <header className="mb-6">
          <Link
            to="/image-gallery"
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-3"
          >
            › معرض الصور
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-gradient mb-2">
            صور {meta.label}
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            {items.length > 0
              ? `${items.length} صورة مرقّمة. قول رقم الصورة وأنا أعرف الدرس.`
              : "لسه مفيش صور في المسار ده — قريبًا."}
          </p>
        </header>

        {items.length > 0 && <GalleryGrid items={items} />}
      </main>
    </div>
  );
}
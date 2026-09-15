import {
  getContextualV2BrowserManifestEntries,
  type ContextualV2Locale,
} from "@/lib/lesson-visuals/contextual-v2/runtime/contextualV2BrowserResolver";

export type GalleryPath =
  | "intro"
  | "business"
  | "creator"
  | "analyst"
  | "automator"
  | "builder";

export type GalleryItem = {
  number: number;
  slug: string;
  lessonSlug: string;
  path: GalleryPath;
  moduleId: string;
  group: string;
  titles: Record<ContextualV2Locale, string>;
};

export const GALLERY_PATHS: {
  id: GalleryPath;
  label: string;
  description: string;
}[] = [
  { id: "intro", label: "الإنترو", description: "دروس تأسيسية للبداية مع الـ AI." },
  { id: "business", label: "البيزنس", description: "دروس الـ AI للبيزنس — قيادة، عملاء، تفويض، توسع." },
  { id: "creator", label: "الكرييتور", description: "دروس صناعة المحتوى — Hook, Script, CTA, تصوير ومونتاج، Brand." },
  { id: "analyst", label: "الأناليست", description: "دروس تحليل البيانات بالـ AI." },
  { id: "automator", label: "الأوتوميتور", description: "دروس الأتمتة — n8n, Triggers/Actions, Webhooks, LLM في الـ Flow، Agents، Lead Capture و WhatsApp." },
  { id: "builder", label: "البليدر", description: "دروس بناء أول تطبيق بـ Lovable." },
];

const entries = getContextualV2BrowserManifestEntries();
const titlesByLesson = new Map<string, Partial<Record<ContextualV2Locale, string>>>();
for (const entry of entries) {
  const titles = titlesByLesson.get(entry.lessonId) ?? {};
  titles[entry.locale] = entry.title;
  titlesByLesson.set(entry.lessonId, titles);
}

export const IMAGE_GALLERY: GalleryItem[] = entries
  .filter((entry) => entry.locale === "ar-EG")
  .sort((left, right) => left.lessonOrder - right.lessonOrder)
  .map((entry) => ({
    number: entry.lessonOrder,
    slug: entry.lessonId,
    lessonSlug: entry.lessonId,
    path: entry.pathId as GalleryPath,
    moduleId: entry.moduleId,
    group: entry.moduleId,
    titles: titlesByLesson.get(entry.lessonId) as Record<ContextualV2Locale, string>,
  }));

export function getGalleryPath(item: GalleryItem): GalleryPath {
  return item.path;
}

export function getGalleryItemsByPath(path: GalleryPath): GalleryItem[] {
  return IMAGE_GALLERY.filter((item) => item.path === path);
}

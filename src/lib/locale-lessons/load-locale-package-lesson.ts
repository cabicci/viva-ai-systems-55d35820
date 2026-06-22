import type { LessonPackageLocale, LocalizedLessonPackage } from "./types";

const PACKAGE_LOADERS = {
  "ar-MSA": import.meta.glob("./ar-MSA/lessons/*.json"),
  "ar-Gulf": import.meta.glob("./ar-Gulf/lessons/*.json"),
  en: import.meta.glob("./en/lessons/*.json"),
};

type PackageModule = LocalizedLessonPackage | { default: LocalizedLessonPackage };

function unwrapPackageModule(mod: PackageModule): LocalizedLessonPackage {
  if (
    mod &&
    typeof mod === "object" &&
    "default" in mod &&
    mod.default &&
    typeof mod.default === "object"
  ) {
    return mod.default;
  }
  return mod as LocalizedLessonPackage;
}

export async function loadLocalePackageLesson(
  locale: LessonPackageLocale,
  lessonId: string,
): Promise<LocalizedLessonPackage | null> {
  const modulePath = `./${locale}/lessons/${lessonId}.json`;
  const loaders = PACKAGE_LOADERS[locale] as Record<
    string,
    () => Promise<PackageModule>
  >;
  const loader = loaders[modulePath];
  if (!loader) return null;
  return unwrapPackageModule(await loader());
}

import { useEffect, useMemo, useState } from "react";
import { IntroLessonRenderer } from "@/components/intro/IntroLessonRenderer";
import type { IntroLessonContent } from "@/components/intro/intro-lesson-types";
import { hasIntroLessonContent, loadIntroLessonContent } from "@/components/intro/lessons";
import { adaptLocalizedPackageToIntroContent } from "@/lib/locale-lessons/adapt-localized-package-to-intro-content";
import type { LocalizedLessonPackage } from "@/lib/locale-lessons/types";
import { LocaleProvider, useLocale } from "@/lib/locale/locale-context";
import { getUiString } from "@/lib/locale/ui-strings";

type PackageInput = Pick<LocalizedLessonPackage, "locale" | "lessonId" | "title" | "sections">;

/**
 * Live localized learner renderer — same IntroLessonRenderer stack as ar-EG
 * with package text and strict composite Bunny lookup for video.
 */
export function LocalePackageLessonRenderer({ pkg }: { pkg: PackageInput }) {
  const { locale: uiLocale } = useLocale();
  const [canonicalResult, setCanonicalResult] = useState<
    { lessonId: string; content: IntroLessonContent | null } | undefined
  >(undefined);
  const canonical =
    canonicalResult?.lessonId === pkg.lessonId ? canonicalResult.content : undefined;

  useEffect(() => {
    const lessonId = pkg.lessonId;
    if (!hasIntroLessonContent(lessonId)) {
      setCanonicalResult({ lessonId, content: null });
      return;
    }
    let cancelled = false;
    void loadIntroLessonContent(lessonId).then((loaded) => {
      if (!cancelled) setCanonicalResult({ lessonId, content: loaded ?? null });
    });
    return () => {
      cancelled = true;
    };
  }, [pkg.lessonId]);

  const content = useMemo(() => {
    if (canonical === undefined) return undefined;
    return adaptLocalizedPackageToIntroContent(pkg, canonical, uiLocale);
  }, [pkg, canonical, uiLocale]);

  if (content === undefined) {
    return (
      <div className="rounded-2xl border border-border/40 bg-muted/20 p-8 text-center text-sm text-muted-foreground">
        {getUiString(uiLocale, "learn.loading.access")}
      </div>
    );
  }

  return (
    <LocaleProvider effectiveLocale={uiLocale}>
      <IntroLessonRenderer
        content={content}
        lessonId={pkg.lessonId}
        lessonTitle={pkg.title}
        videoLocale={pkg.locale}
      />
    </LocaleProvider>
  );
}

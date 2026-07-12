import { useEffect, useMemo, useState } from "react";
import { IntroLessonRenderer } from "@/components/intro/IntroLessonRenderer";
import type { IntroLessonContent } from "@/components/intro/intro-lesson-types";
import {
  hasIntroLessonContent,
  loadIntroLessonContent,
} from "@/components/intro/lessons";
import { adaptLocalizedPackageToIntroContent } from "@/lib/locale-lessons/adapt-localized-package-to-intro-content";
import type { LocalizedLessonPackage } from "@/lib/locale-lessons/types";
import { LocaleProvider } from "@/lib/locale/locale-context";
import { getUiString } from "@/lib/locale/ui-strings";

type PackageInput = Pick<
  LocalizedLessonPackage,
  "locale" | "lessonId" | "title" | "sections"
>;

/**
 * Live localized learner renderer — same IntroLessonRenderer stack as ar-EG
 * with package text and strict composite Bunny lookup for video.
 */
export function LocalePackageLessonRenderer({ pkg }: { pkg: PackageInput }) {
  const [canonical, setCanonical] = useState<
    IntroLessonContent | null | undefined
  >(undefined);

  useEffect(() => {
    if (!hasIntroLessonContent(pkg.lessonId)) {
      setCanonical(null);
      return;
    }
    let cancelled = false;
    void loadIntroLessonContent(pkg.lessonId).then((loaded) => {
      if (!cancelled) setCanonical(loaded ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [pkg.lessonId]);

  const content = useMemo(() => {
    if (canonical === undefined) return undefined;
    return adaptLocalizedPackageToIntroContent(pkg, canonical);
  }, [pkg, canonical]);

  if (content === undefined) {
    return (
      <div className="rounded-2xl border border-border/40 bg-muted/20 p-8 text-center text-sm text-muted-foreground">
        {getUiString(pkg.locale, "learn.loading.access")}
      </div>
    );
  }

  return (
    <LocaleProvider effectiveLocale={pkg.locale}>
      <IntroLessonRenderer
        content={content}
        lessonId={pkg.lessonId}
        lessonTitle={pkg.title}
        videoLocale={pkg.locale}
      />
    </LocaleProvider>
  );
}

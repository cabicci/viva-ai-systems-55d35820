import { useEffect, useMemo, useRef, useState } from "react";
import { IntroLessonRenderer } from "@/components/intro/IntroLessonRenderer";
import type { IntroLessonContent } from "@/components/intro/intro-lesson-types";
import { hasIntroLessonContent, loadIntroLessonContent } from "@/components/intro/lessons";
import { adaptLocalizedPackageToIntroContent } from "@/lib/locale-lessons/adapt-localized-package-to-intro-content";
import type { LocalizedLessonPackage } from "@/lib/locale-lessons/types";
import { LocaleProvider, useLocale } from "@/lib/locale/locale-context";
import { useAuth } from "@/lib/auth-context";
import { LessonContentError } from "@/components/learn/LessonContentError";
import { getUiString } from "@/lib/locale/ui-strings";

type PackageInput = Pick<LocalizedLessonPackage, "locale" | "lessonId" | "title" | "sections">;

/**
 * Live localized learner renderer — same IntroLessonRenderer stack as ar-EG
 * with package text and strict composite Bunny lookup for video.
 */
export function LocalePackageLessonRenderer({ pkg }: { pkg: PackageInput }) {
  const { locale: uiLocale } = useLocale();
  const { user, authGeneration, isAuthGenerationCurrent } = useAuth();
  const generation = user ? authGeneration : null;
  const [attempt, setAttempt] = useState(0);
  const scope = useMemo(() => ({}), [pkg.lessonId, user?.id, generation, attempt]);
  const currentScope = useRef(scope);
  currentScope.current = scope;
  const [canonicalResult, setCanonicalResult] = useState<
    { scope: object; content: IntroLessonContent | null; failed: boolean } | undefined
  >(undefined);
  const currentResult = canonicalResult?.scope === scope ? canonicalResult : undefined;
  const canonical = currentResult?.failed ? undefined : currentResult?.content;

  useEffect(() => {
    const lessonId = pkg.lessonId;
    let cancelled = false;
    const current = () =>
      !cancelled &&
      currentScope.current === scope &&
      (generation === null || isAuthGenerationCurrent(generation));
    if (!hasIntroLessonContent(lessonId)) {
      setCanonicalResult({ scope, content: null, failed: false });
      return;
    }
    void loadIntroLessonContent(lessonId).then(
      (loaded) => {
        if (current()) setCanonicalResult({ scope, content: loaded ?? null, failed: false });
      },
      () => {
        if (current()) setCanonicalResult({ scope, content: null, failed: true });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [scope]);

  const content = useMemo(() => {
    if (canonical === undefined) return undefined;
    return adaptLocalizedPackageToIntroContent(pkg, canonical, uiLocale);
  }, [pkg, canonical, uiLocale]);

  if (currentResult?.failed) {
    return <LessonContentError retry={() => setAttempt((value) => value + 1)} />;
  }

  if (content === undefined) {
    return (
      <div role="status" className="rounded-2xl border border-border/40 bg-muted/20 p-8 text-center text-sm text-muted-foreground">
        {getUiString(uiLocale, "learn.content.loading")}
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

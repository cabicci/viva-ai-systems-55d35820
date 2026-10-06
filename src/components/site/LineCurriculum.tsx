import { getPathDefinition, getPathStoryCopy } from "@/lib/path-story";
import { getCourseCatalogueCopy } from "@/lib/course-catalogue-copy";
import { useAuth } from "@/lib/auth-context";
import { useEntitlement } from "@/lib/entitlements";
import { useTechnicalProgress } from "@/lib/technical-education/client";

import { Lock } from "lucide-react";
import {
  CurriculumLayout,
  CurriculumSectionHeader,
  CURRICULUM_MODULE_CLASS,
  CURRICULUM_ROW_CLASS,
} from "./CurriculumLayout";
import { getLineCopy } from "@/lib/learning-lines";
import {
  getTechnicalCurriculumPreview,
  TECHNICAL_TRACK_PREVIEWS,
} from "@/lib/technical-track-preview";
import { useLocale } from "@/lib/locale/locale-context";

import { KIDS_LEVELS } from "@/lib/kids/catalogue";

import { CourseCatalogue } from "./CourseCatalogue";

const pastels = ["var(--pastel-lavender)", "var(--pastel-pink)", "var(--pastel-blue)"];

export function KidsCurriculum() {
  const { locale } = useLocale();
  return (
    <CurriculumLayout line="kids" subtitle={getLineCopy(locale).kidsIntro}>
      <CourseCatalogue
        line="kids"
        courses={KIDS_LEVELS.map((level) => {
          const d = getPathDefinition("kids", locale, level.ages);
          return {
            id: level.id,
            title: d.title,
            description: d.intro,
            lessonCount: level.lessonCount,
            moduleCount: 0,
            href: `/kids/${level.id}?locale=${locale}`,
          };
        })}
      />
    </CurriculumLayout>
  );
}

export function TechnicalCatalogue() {
  const { locale } = useLocale();
  return (
    <CurriculumLayout line="technical" subtitle={getCourseCatalogueCopy(locale).intro}>
      <CourseCatalogue
        line="technical"
        courses={TECHNICAL_TRACK_PREVIEWS.map((track) => ({
          id: track.id,
          title: getPathDefinition("technical", locale).title,
          description: getPathDefinition("technical", locale).intro,
          lessonCount: track.lessonCount,
          moduleCount: track.moduleCount,
          href: `/technical/courses/${track.id}?locale=${locale}`,
        }))}
      />
    </CurriculumLayout>
  );
}

export function TechnicalCurriculum() {
  const { locale } = useLocale();
  const { user } = useAuth();
  const { isAdmin } = useEntitlement();
  const { paid, progress } = useTechnicalProgress();
  const c = getLineCopy(locale);
  const numbers = new Intl.NumberFormat(
    locale === "en" ? "en" : locale === "ar-EG" ? "ar-EG" : "ar",
  );
  const track = TECHNICAL_TRACK_PREVIEWS[0];
  return (
    <CurriculumLayout
      line="technical"
      title={getPathStoryCopy(locale).contents}
      subtitle={getPathDefinition("technical", locale).intro}
      summary={
        <div className="flex flex-wrap gap-3 text-sm font-semibold">
          <span>
            {numbers.format(track.lessonCount)} {c.lessonLabel}
          </span>
          <span>
            · {numbers.format(track.moduleCount)} {c.moduleLabel}
          </span>
        </div>
      }
    >
      <a
        href={`/technical/courses/furniture?locale=${locale}`}
        className="mb-6 inline-block font-bold text-primary"
      >
        {getPathStoryCopy(locale).backPath}
      </a>
      <div className="space-y-16">
        {getTechnicalCurriculumPreview(locale).map((section, index) => (
          <section key={section.id}>
            <CurriculumSectionHeader title={section.title} />
            <div
              className="rounded-3xl border border-border/60 p-6 md:p-8"
              style={{ background: pastels[index % pastels.length] }}
            >
              <div className="grid gap-4 md:grid-cols-2">
                {section.modules.map((module) => (
                  <article
                    key={module.id}
                    id={`module-${module.id}`}
                    className={CURRICULUM_MODULE_CLASS}
                  >
                    <header className="flex items-start gap-3">
                      <span
                        dir="ltr"
                        className="grid h-9 min-w-11 shrink-0 place-items-center rounded-md bg-[image:var(--gradient-primary)] px-2 text-xs font-black text-primary-foreground"
                      >
                        {module.id}
                      </span>
                      <h3 className="min-w-0 flex-1 text-lg font-bold leading-tight">
                        {getPathStoryCopy(locale).station} — {module.title}
                      </h3>
                    </header>
                    <ul className="space-y-1.5">
                      {module.lessons.map((lesson, i) => {
                        const allowed = !!user && (isAdmin || paid || lesson.id === "M01-L01");
                        return (
                          <li key={lesson.id} id={`lesson-${lesson.id}`}>
                            <a
                              href={`/technical/learn/${lesson.id}?locale=${locale}`}
                              className={`${CURRICULUM_ROW_CLASS} hover:border-primary/20 hover:bg-foreground/5`}
                            >
                              <span className="grid h-6 min-w-7 shrink-0 place-items-center rounded-md bg-foreground/5 px-1.5 text-[11px] tabular-nums">
                                {numbers.format(i + 1)}
                              </span>
                              <span className="min-w-0 flex-1 break-words">{lesson.title}</span>
                              {allowed ? (
                                <span aria-hidden>
                                  {progress[lesson.id]?.quizPassed &&
                                  progress[lesson.id]?.read &&
                                  progress[lesson.id]?.practiceReviewed
                                    ? "✓"
                                    : "→"}
                                </span>
                              ) : (
                                <Lock aria-label={c.plans} className="h-3.5 w-3.5 shrink-0" />
                              )}
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  </article>
                ))}
              </div>
            </div>
          </section>
        ))}
      </div>
    </CurriculumLayout>
  );
}

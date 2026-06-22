import type {
  LocalizedLessonPackage,
  LocalizedLessonSection,
} from "@/lib/locale-lessons/types";

type PreviewPackage = Pick<
  LocalizedLessonPackage,
  "locale" | "lessonId" | "title" | "sections"
>;

function SectionBody({ section }: { section: LocalizedLessonSection }) {
  if (section.role.toLowerCase().includes("video")) {
    return (
      <p className="text-xs text-muted-foreground font-mono">
        [Video omitted in locale package preview]
      </p>
    );
  }

  return (
    <>
      {section.contentMarkdown ? (
        <div className="whitespace-pre-wrap text-[15px] leading-[1.9] text-foreground/90">
          {section.contentMarkdown}
        </div>
      ) : null}
      {section.bullets.length > 0 ? (
        <ul className="mt-3 space-y-2 text-[15px] leading-[1.9] list-disc ps-5">
          {section.bullets.map((bullet, index) => (
            <li key={index}>{bullet}</li>
          ))}
        </ul>
      ) : null}
      {section.quiz ? (
        <div className="mt-4 rounded-xl border border-border/50 bg-muted/20 p-4 space-y-2">
          <p className="font-semibold text-sm">{section.quiz.question}</p>
          <ol className="list-decimal ps-5 space-y-1 text-sm">
            {section.quiz.options.map((option, index) => (
              <li
                key={index}
                className={
                  index === section.quiz?.correctIndex
                    ? "text-primary font-medium"
                    : undefined
                }
              >
                {option}
              </li>
            ))}
          </ol>
          {section.quiz.explanation ? (
            <p className="text-xs text-muted-foreground pt-1">
              {section.quiz.explanation}
            </p>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

/**
 * Internal locale package preview — markdown sections only.
 * Does not wire missions, assistant, Bunny video, or quiz persistence.
 */
export function LocalePackagePreviewRenderer({
  pkg,
}: {
  pkg: PreviewPackage;
}) {
  const dir = pkg.locale === "en" ? "ltr" : "rtl";

  return (
    <div
      dir={dir}
      className="space-y-10"
      data-locale-preview={pkg.locale}
      data-lesson-id={pkg.lessonId}
    >
      {pkg.sections.map((section, index) => (
        <section
          key={`${section.role}-${index}`}
          className="rounded-2xl border border-border/40 bg-card/30 p-5 space-y-3"
        >
          <div>
            <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
              {section.role}
            </p>
            <h2 className="text-lg font-bold mt-1">{section.heading}</h2>
            {section.subtitle ? (
              <p className="text-sm text-muted-foreground mt-1">
                {section.subtitle}
              </p>
            ) : null}
          </div>
          <SectionBody section={section} />
        </section>
      ))}
    </div>
  );
}

import { useLocale } from "@/lib/locale/locale-context";
import { getPathDefinition, getPathStoryCopy } from "@/lib/path-story";
import { LINE_PRICING, LINE_ROUTES, type LearningLine } from "@/lib/learning-lines";
import { CurriculumLayout } from "./CurriculumLayout";
import { PathStory } from "./PathStory";

export function PathIntroduction({
  line,
  ages,
  title,
  contentsHref,
}: {
  line: LearningLine;
  ages?: string;
  title?: string;
  contentsHref: string;
}) {
  const { locale } = useLocale();
  const c = getPathStoryCopy(locale);
  const d = getPathDefinition(line, locale, ages);
  return (
    <CurriculumLayout line={line} title={title ? `${c.path} ${title}` : d.title} subtitle={d.intro}>
      <a href={`${LINE_ROUTES[line]}?locale=${locale}`} className="font-bold text-primary">
        {c.back}
      </a>
      <section className="mt-6 grid gap-5 md:grid-cols-3" aria-label={c.aboutPath}>
        {[
          [c.goals, d.goals],
          [c.audience, d.audience],
          [c.requirements, d.requirements],
        ].map(([heading, body]) => (
          <article key={heading} className="rounded-3xl border border-border bg-card p-6">
            <h2 className="text-xl font-bold">{heading}</h2>
            <p className="mt-4 leading-8 text-muted-foreground">{body}</p>
          </article>
        ))}
      </section>
      <div className="mt-8 flex flex-wrap gap-4">
        <a
          href={`${contentsHref}?locale=${locale}`}
          className="inline-flex min-h-11 items-center rounded-full bg-primary px-6 py-3 font-bold text-primary-foreground"
        >
          {c.content}
        </a>
        <a
          href={`${LINE_PRICING[line]}?locale=${locale}`}
          className="inline-flex min-h-11 items-center rounded-full border border-primary px-6 py-3 font-bold text-primary"
        >
          {locale === "en" ? "Plans" : "الباقات"}
        </a>
      </div>
      <PathStory />
    </CurriculumLayout>
  );
}

import { useLocale } from "@/lib/locale/locale-context";
import { getPathStoryCopy } from "@/lib/path-story";

export function PathStory({ full = false }: { full?: boolean }) {
  const { locale } = useLocale();
  const c = getPathStoryCopy(locale);
  return (
    <section className="my-12 space-y-6" aria-label={c.title}>
      <div className="rounded-3xl border border-primary/20 bg-primary/5 p-6 md:p-10">
        <h2 className="text-2xl font-black md:text-3xl">{c.title}</h2>
        <p className="mt-4 max-w-4xl leading-8 text-muted-foreground">{c.body}</p>
      </div>
      {full && (
        <div className="grid gap-5 md:grid-cols-3">
          {[
            [c.visionTitle, c.vision],
            [c.missionTitle, c.mission],
            [c.valuesTitle, c.values],
          ].map(([title, body]) => (
            <article key={title} className="rounded-3xl border border-border bg-card p-6">
              <h3 className="text-xl font-bold">{title}</h3>
              <p className="mt-4 leading-8 text-muted-foreground">{body}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

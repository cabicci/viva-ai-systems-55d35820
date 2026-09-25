import { Link } from "@tanstack/react-router";
import { KidsBrand } from "./KidsBrand";
import { getKidsCopy } from "@/lib/kids/copy";
import { useLocale } from "@/lib/locale/locale-context";
import { useLocaleLinkSearch } from "@/lib/locale/use-locale-link-search";

export function KidsPathCard() {
  const { locale } = useLocale();
  const localeSearch = useLocaleLinkSearch();
  const copy = getKidsCopy(locale);

  return (
    <article className="rounded-3xl border border-border/60 bg-[var(--pastel-lavender)] p-6 md:p-8 transition hover:shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-center gap-4">
        <span className="rounded-2xl bg-background/80 px-4 py-3">
          <KidsBrand />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-primary">{copy.pathLabel}</p>
          <h3 className="text-xl font-black text-foreground">{copy.title}</h3>
        </div>
      </div>
      <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
        {copy.cardDescription}
      </p>
      <Link
        to="/kids"
        search={localeSearch()}
        className="mt-5 inline-flex min-h-11 items-center rounded-full border border-primary/40 px-5 text-sm font-semibold text-primary hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        {copy.details}
      </Link>
    </article>
  );
}

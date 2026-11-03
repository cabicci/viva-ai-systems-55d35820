import { useId } from "react";
import { useLocale } from "@/lib/locale/locale-context";

const copy = {
  en: {
    title: "Official license and plan references",
    note: "Plans and limits can change. Review current terms before choosing.",
    license: "license",
    plans: "plans",
    tasks: "tasks",
    credits: "credits",
    opens: "opens in a new tab",
  },
  "ar-EG": {
    title: "راجع الترخيص والخطط من المصدر",
    note: "الخطط والحدود ممكن تتغير. راجع الشروط الحالية قبل الاختيار.",
    license: "الترخيص",
    plans: "الخطط",
    tasks: "تعريف tasks",
    credits: "تعريف credits",
    opens: "يفتح في علامة تبويب جديدة",
  },
  "ar-MSA": {
    title: "مراجع الترخيص والخطط الرسمية",
    note: "قد تتغير الخطط والحدود. راجع الشروط الحالية قبل الاختيار.",
    license: "الترخيص",
    plans: "الخطط",
    tasks: "تعريف tasks",
    credits: "تعريف credits",
    opens: "يفتح في علامة تبويب جديدة",
  },
  "ar-Gulf": {
    title: "راجع الترخيص والخطط من المصدر",
    note: "الخطط والحدود ممكن تتغير. راجع الشروط الحالية قبل الاختيار.",
    license: "الترخيص",
    plans: "الخطط",
    tasks: "تعريف tasks",
    credits: "تعريف credits",
    opens: "يفتح في علامة تبويب جديدة",
  },
} as const;

export function ToolsVendorReferences({ lessonId }: { lessonId?: string }) {
  const { locale } = useLocale();
  const titleId = useId();
  if (lessonId !== "automator-m3-l1-tools-landscape") return null;
  const t = copy[locale];
  const links = [
    [
      "n8n",
      t.license,
      "https://github.com/n8n-io/n8n-docs/blob/main/docs/n8n-community-license/README.md",
    ],
    ["Zapier", t.plans, "https://zapier.com/pricing"],
    ["Make", t.plans, "https://www.make.com/pricing"],
    ["Zapier", t.tasks, "https://zapier.com/pricing/rates"],
    ["Make", t.credits, "https://help.make.com/credits"],
  ] as const;
  return (
    <aside
      aria-labelledby={titleId}
      className="rounded-2xl border border-border/50 p-4 space-y-2"
    >
      <h3 id={titleId} className="text-sm font-semibold">
        {t.title}
      </h3>
      <p className="text-sm text-muted-foreground">{t.note}</p>
      <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
        {links.map(([vendor, label, href]) => (
          <li key={href}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-4"
            >
              <bdi>{vendor}</bdi> — {label}
              <span className="sr-only"> ({t.opens})</span>
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}

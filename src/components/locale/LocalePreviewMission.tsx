import { Flag, Lock } from "lucide-react";
import { getUiString } from "@/lib/locale/ui-strings";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/lib/locale/types";
import { PackageLearnerMarkdown } from "./PackageLearnerMarkdown";

export function LocalePreviewMission({
  intro,
  delivery,
  rubric,
  locale = DEFAULT_LOCALE,
}: {
  intro: string;
  delivery: readonly string[];
  rubric: readonly {
    label: string;
    weight: number;
    criteria: readonly string[];
  }[];
  locale?: SupportedLocale;
}) {
  const t = (key: Parameters<typeof getUiString>[1]) => getUiString(locale, key);

  return (
    <div
      id="mission"
      className="space-y-4 scroll-mt-24"
      data-locale-mission="readonly"
    >
      <div className="rounded-xl border border-amber-400/30 bg-amber-400/[0.08] px-4 py-3 text-sm text-amber-100/90 flex items-start gap-2">
        <Lock className="h-4 w-4 shrink-0 mt-0.5" />
        <span>{t("safety.mission.banner")}</span>
      </div>

      {intro ? <PackageLearnerMarkdown text={intro} /> : null}

      {delivery.length > 0 ? (
        <ol className="space-y-2 ps-1">
          {delivery.map((item, index) => (
            <li key={index} className="flex items-start gap-2.5 text-sm leading-relaxed">
              <span className="grid h-6 w-6 place-items-center rounded-md bg-primary/15 text-primary text-[11px] font-mono shrink-0 mt-0.5">
                {index + 1}
              </span>
              <PackageLearnerMarkdown text={item} />
            </li>
          ))}
        </ol>
      ) : null}

      {rubric.length > 0 ? (
        <div className="rounded-xl border border-border/50 overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border/50 bg-muted/20 px-4 py-2 text-[11px] font-mono text-muted-foreground">
            <Flag className="h-3.5 w-3.5" />
            <span>{t("safety.mission.rubric")}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[20rem] text-sm">
              <thead>
                <tr className="border-b border-border/40 text-left">
                  <th className="px-4 py-2 font-medium">{t("safety.mission.dimension")}</th>
                  <th className="px-4 py-2 font-medium">{t("safety.mission.weight")}</th>
                  <th className="px-4 py-2 font-medium">{t("safety.mission.criteria")}</th>
                </tr>
              </thead>
              <tbody>
                {rubric.map((row) => (
                  <tr key={row.label} className="border-b border-border/30 align-top">
                    <td className="px-4 py-3 font-medium">{row.label}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{row.weight}%</td>
                    <td className="px-4 py-3 text-foreground/90">
                      {row.criteria.join(" ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}

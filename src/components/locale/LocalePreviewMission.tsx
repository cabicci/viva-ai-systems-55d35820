import { Flag, Lock } from "lucide-react";
import { PackageLearnerMarkdown } from "./PackageLearnerMarkdown";

export function LocalePreviewMission({
  intro,
  delivery,
  rubric,
}: {
  intro: string;
  delivery: readonly string[];
  rubric: readonly {
    label: string;
    weight: number;
    criteria: readonly string[];
  }[];
}) {
  return (
    <div
      id="mission"
      className="space-y-4 scroll-mt-24"
      data-preview-mission="read-only"
    >
      <div className="rounded-xl border border-amber-400/30 bg-amber-400/[0.08] px-4 py-3 text-sm text-amber-100/90 flex items-start gap-2">
        <Lock className="h-4 w-4 shrink-0 mt-0.5" />
        <span>Internal preview only — mission submission is disabled.</span>
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
            <span>Evaluation rubric (read-only)</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[20rem] text-sm">
              <thead>
                <tr className="border-b border-border/40 text-left">
                  <th className="px-4 py-2 font-medium">Dimension</th>
                  <th className="px-4 py-2 font-medium">Weight</th>
                  <th className="px-4 py-2 font-medium">Criteria</th>
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

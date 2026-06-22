import { CircleHelp } from "lucide-react";
import { PackageLearnerMarkdown } from "./PackageLearnerMarkdown";

export function LocalePreviewQuiz({
  question,
  options,
}: {
  question: string;
  options: readonly string[];
}) {
  return (
    <div className="space-y-3" data-preview-quiz="read-only">
      <div className="flex items-center gap-2 text-[11px] font-mono text-accent">
        <CircleHelp className="h-3.5 w-3.5" />
        <span>Preview quiz — answers hidden</span>
      </div>
      <p className="font-semibold text-[15px] leading-relaxed">{question}</p>
      <ul className="space-y-2">
        {options.map((option, index) => (
          <li key={index}>
            <button
              type="button"
              disabled
              aria-disabled="true"
              className="w-full rounded-xl border border-border/60 bg-muted/20 px-4 py-3 text-start text-sm leading-relaxed opacity-90 cursor-not-allowed"
            >
              {option}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

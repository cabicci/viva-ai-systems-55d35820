import { Fragment } from "react";

/** Tiny presentational subset: emphasis and paragraph breaks, never raw HTML or links. */
export function LessonText({ text, className = "" }: { text: string; className?: string }) {
  return (
    <div className={`space-y-4 leading-8 ${className}`}>
      {text.split(/\n\s*\n/).map((paragraph, i) => (
        <p key={i} className="whitespace-pre-line">
          {paragraph
            .split(/(\*\*[^*]+\*\*)/g)
            .map((part, j) =>
              part.startsWith("**") && part.endsWith("**") ? (
                <strong key={j}>{part.slice(2, -2)}</strong>
              ) : (
                <Fragment key={j}>{part}</Fragment>
              ),
            )}
        </p>
      ))}
    </div>
  );
}

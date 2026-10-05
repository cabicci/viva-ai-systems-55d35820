import { Fragment } from "react";

// Isolate arithmetic from surrounding RTL prose without interpreting HTML or URLs.
const arithmetic = /([-−]?[0-9][0-9,.]*(?:\s*[%٪]?\s*[+\-−×÷*/=]\s*[-−]?[0-9][0-9,.]*[%٪]?)+)/g;
function MathText({ text }: { text: string }) {
  return text.split(arithmetic).map((part, i) =>
    i % 2 ? (
      <bdi dir="ltr" key={i}>
        {part}
      </bdi>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}
/** Safe inline emphasis and arithmetic; never raw HTML or links. */
export function LessonInlineText({ text }: { text: string }) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i}>
        <MathText text={part.slice(2, -2)} />
      </strong>
    ) : (
      <MathText key={i} text={part} />
    ),
  );
}
export function LessonText({ text, className = "" }: { text: string; className?: string }) {
  return (
    <div className={`space-y-4 leading-8 ${className}`}>
      {text.split(/\n\s*\n/).map((paragraph, i) => (
        <p key={i} className="whitespace-pre-line">
          <LessonInlineText text={paragraph} />
        </p>
      ))}
    </div>
  );
}

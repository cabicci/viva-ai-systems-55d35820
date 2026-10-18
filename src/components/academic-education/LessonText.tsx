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
    i % 2 === 1 ? (
      <strong key={i}>
        <MathText text={part.slice(2, -2)} />
      </strong>
    ) : (
      <MathText key={i} text={part} />
    ),
  );
}
export function LessonText({ text, className = "" }: { text: string; className?: string }) {
  const blocks: Array<{ kind: "paragraph" | "list"; lines: string[] }> = [];
  let current: (typeof blocks)[number] | null = null;
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) {
      current = null;
      continue;
    }
    const bullet = line.match(/^\s*[*-]\s+(.+)$/);
    const kind = bullet ? "list" : "paragraph";
    if (!current || current.kind !== kind) {
      current = { kind, lines: [] };
      blocks.push(current);
    }
    current.lines.push(bullet ? bullet[1] : line);
  }
  return (
    <div className={`space-y-4 leading-8 ${className}`}>
      {blocks.map((block, i) =>
        block.kind === "list" ? (
          <ul key={i} className="list-disc space-y-2 ps-6">
            {block.lines.map((line, index) => (
              <li key={index}>
                <LessonInlineText text={line} />
              </li>
            ))}
          </ul>
        ) : (
          <p key={i} className="whitespace-pre-line">
            <LessonInlineText text={block.lines.join("\n")} />
          </p>
        ),
      )}
    </div>
  );
}

import type { ReactNode } from "react";

/** Render the small Markdown subset used by assistant replies as React text nodes. */
export function AssistantAnswer({ text }: { text: string }) {
  const lines = text.split(/\r?\n/);
  const blocks: ReactNode[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];
  let listType: "ol" | "ul" | null = null;

  function flushParagraph() {
    if (!paragraph.length) return;
    blocks.push(
      <p key={blocks.length} className="leading-relaxed">
        {paragraph.map((line, index) => (
          <span key={index}>
            {index > 0 && <br />}
            {renderInline(line)}
          </span>
        ))}
      </p>,
    );
    paragraph = [];
  }

  function flushList() {
    if (!listType) return;
    const items = list.map((item, index) => <li key={index}>{renderInline(item)}</li>);
    blocks.push(
      listType === "ol" ? (
        <ol key={blocks.length} className="list-decimal space-y-1 ps-6 leading-relaxed">
          {items}
        </ol>
      ) : (
        <ul key={blocks.length} className="list-disc space-y-1 ps-6 leading-relaxed">
          {items}
        </ul>
      ),
    );
    list = [];
    listType = null;
  }

  for (const line of lines) {
    const ordered = line.match(/^\s*\d+[.)]\s+(.+)$/);
    const unordered = line.match(/^\s*[-*]\s+(.+)$/);
    const heading = line.match(/^\s*#{1,3}\s+(.+)$/);
    if (ordered || unordered) {
      flushParagraph();
      const nextType = ordered ? "ol" : "ul";
      if (listType !== nextType) flushList();
      listType = nextType;
      list.push((ordered ?? unordered)![1]);
    } else if (heading) {
      flushParagraph();
      flushList();
      blocks.push(
        <h3 key={blocks.length} className="font-semibold">
          {renderInline(heading[1])}
        </h3>,
      );
    } else if (!line.trim()) {
      flushParagraph();
      flushList();
    } else {
      flushList();
      paragraph.push(line);
    }
  }
  flushParagraph();
  flushList();

  return <div className="space-y-3 text-sm text-foreground">{blocks}</div>;
}

export function AssistantInline({ text }: { text: string }) {
  return <>{renderInline(text)}</>;
}

function renderInline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={index} className="rounded bg-muted px-1">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

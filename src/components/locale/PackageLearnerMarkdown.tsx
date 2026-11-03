import * as React from "react";

function linkify(text: string): React.ReactNode[] {
  const regex =
    /(https?:\/\/[^\s)]+|\b(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s)]*)?)/gi;
  const parts: React.ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const raw = match[0];
    const href = raw.startsWith("http") ? raw : `https://${raw}`;
    parts.push(
      <a
        key={`lnk-${key++}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline underline-offset-2 hover:opacity-80"
      >
        {raw}
      </a>,
    );
    last = match.index + raw.length;
  }

  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const pattern = /\*\*([^*]+)\*\*/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push(
        ...linkify(text.slice(last, match.index)).map((node, i) => (
          <React.Fragment key={`${keyPrefix}-t-${index++}-${i}`}>
            {node}
          </React.Fragment>
        )),
      );
    }
    nodes.push(
      <strong key={`${keyPrefix}-b-${index++}`} className="font-semibold">
        {linkify(match[1])}
      </strong>,
    );
    last = match.index + match[0].length;
  }

  if (last < text.length) {
    nodes.push(
      ...linkify(text.slice(last)).map((node, i) => (
        <React.Fragment key={`${keyPrefix}-tail-${index++}-${i}`}>
          {node}
        </React.Fragment>
      )),
    );
  }

  return nodes;
}

export function PackageLearnerMarkdown({
  text,
}: {
  text: string;
}) {
  const lines = text.split("\n");

  return (
    <div className="space-y-2 text-[15px] leading-[1.9] text-foreground/90">
      {lines.map((line, lineIndex) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={lineIndex} className="h-2" />;

        if (/^[-*]\s+/.test(trimmed)) {
          return (
            <p key={lineIndex} className="ps-1">
              <span className="text-muted-foreground me-2">•</span>
              {renderInline(trimmed.replace(/^[-*]\s+/, ""), `line-${lineIndex}`)}
            </p>
          );
        }

        return (
          <p key={lineIndex}>{renderInline(trimmed, `line-${lineIndex}`)}</p>
        );
      })}
    </div>
  );
}

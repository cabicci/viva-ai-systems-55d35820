export type ReadingVisualSpec = {
  id: string;
  title: string;
  kind: "flow" | "comparison" | "table";
  columns: string[];
  rows: string[][];
  caption: string;
};
/** Semantic, accessible reading visual. Never used as a video scene. */
export function ReadingVisual({ visual }: { visual: ReadingVisualSpec }) {
  return (
    <figure
      data-visual-role="reading"
      data-visual-id={visual.id}
      className="my-5 min-w-0 rounded-2xl border border-primary/25 bg-accent/10 p-4"
    >
      <figcaption className="mb-4 text-lg font-bold text-primary">{visual.title}</figcaption>
      {visual.kind === "flow" ? (
        <ol className="space-y-3">
          {visual.rows.map((row, i) => (
            <li key={i} className="flex gap-3 rounded-xl border bg-background p-3">
              <span className="font-bold text-primary">{i + 1}</span>
              <div className="min-w-0 space-y-2">
                {row.map((cell, j) => (
                  <p className="break-words leading-7" key={j}>
                    <strong>{visual.columns[j]}: </strong>
                    {cell}
                  </p>
                ))}
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-start text-sm">
            <thead>
              <tr>
                {visual.columns.map((column, i) => (
                  <th key={i} className="border-b p-3 text-start">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visual.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j} className="border-b p-3 align-top leading-7">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-4 text-sm leading-7 text-muted-foreground">{visual.caption}</p>
    </figure>
  );
}

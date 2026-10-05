import definitions from "../../lib/technical-education/new-diagrams.json";
import type { SupportedLocale } from "../../lib/locale/types";

type Node = {
  type: "rect" | "line" | "circle" | "path" | "text";
  value?: { ar: string; en: string };
  [key: string]: unknown;
};
const colors: Record<string, string> = {
  ink: "#203f45",
  teal: "#387b83",
  mint: "#9be3c4",
  pale: "#e7f1fa",
  purple: "#c2acda",
  danger: "#bb3842",
  white: "#ffffff",
  none: "none",
};
/** Reviewed concept geometry; no inference of construction dimensions or load capacity. */
export function AdditionalTechnicalDiagram({
  kind,
  locale,
  title,
}: {
  kind: keyof typeof definitions;
  locale: SupportedLocale;
  title: string;
}) {
  const en = locale === "en";
  const nodes = definitions[kind] as Node[];
  if (!nodes) throw new Error(`Missing technical illustration: ${kind}`);
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 400 270"
      role="img"
      aria-label={title}
      data-diagram={kind}
      style={{ fontFamily: "Cairo, sans-serif" }}
    >
      <rect width="400" height="270" rx="18" fill="#f6faf8" />
      {nodes.map(({ type, value, ...attributes }, index) => {
        const props = Object.fromEntries(
          Object.entries(attributes).map(([key, val]) => [
            key,
            (key === "fill" || key === "stroke") && typeof val === "string"
              ? (colors[val] ?? val)
              : val,
          ]),
        );
        switch (type) {
          case "text":
            return (
              <text
                key={index}
                {...props}
                fill={colors.ink}
                textAnchor="middle"
                direction={en ? "ltr" : "rtl"}
              >
                {value?.[en ? "en" : "ar"]}
              </text>
            );
          case "rect":
            return <rect key={index} {...props} />;
          case "line":
            return <line key={index} {...props} />;
          case "circle":
            return <circle key={index} {...props} />;
          case "path":
            return <path key={index} {...props} />;
          default:
            throw new Error(`Unsupported technical illustration primitive: ${type}`);
        }
      })}
    </svg>
  );
}

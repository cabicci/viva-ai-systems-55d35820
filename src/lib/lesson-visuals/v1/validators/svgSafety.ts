import type { ValidationIssue } from "./shared";

const FORBIDDEN_SVG = [
  /<script[\s>]/i,
  /\bon\w+\s*=/i,
  /javascript:/i,
  /<foreignObject[\s>][^>]*src\s*=/i,
  /xlink:href\s*=\s*["']https?:/i,
];

export function validateSvgSafety(svg: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!svg.includes("<svg")) {
    issues.push({ gate: "svgSafety", message: "not an SVG document" });
    return issues;
  }
  for (const re of FORBIDDEN_SVG) {
    if (re.test(svg)) {
      issues.push({
        gate: "svgSafety",
        message: `forbidden SVG pattern: ${re}`,
      });
    }
  }
  return issues;
}

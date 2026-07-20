import type { AdapterContext, AdapterResult } from "../types";
import { renderDeterministicSvg } from "./deterministic";

/**
 * Hybrid adapter — illustration base + deterministic labels.
 * Locally reuses deterministic SVG with label emphasis; no paid AI.
 */
export function renderHybrid(ctx: AdapterContext): AdapterResult {
  if (!ctx.fixtureMode) {
    return {
      ok: false,
      error:
        "hybrid adapter: production batch disabled locally; set fixtureMode for synthetic renders",
    };
  }

  const base = renderDeterministicSvg(ctx);
  if (!base.ok || !base.svg) return base;

  const locale = ctx.locale;
  const labels = ctx.master.labelPacks[locale];
  const extra = labels
    .slice(0, 3)
    .map(
      (l, i) =>
        `<text x="40" y="${40 + i * 18}" font-family="Tajawal, sans-serif" font-size="12" fill="#0d47a1">${l.text
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;")
          .slice(0, 80)}</text>`,
    )
    .join("\n  ");

  const svg = base.svg.replace(
    "</svg>",
    `  <!-- hybrid label overlay -->\n  ${extra}\n</svg>`,
  );
  return { ok: true, svg };
}

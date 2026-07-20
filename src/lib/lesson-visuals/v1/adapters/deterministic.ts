import type { AdapterContext, AdapterResult, Locale } from "../types";

function escapeXml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function dirFor(locale: Locale): "rtl" | "ltr" {
  return locale === "en" ? "ltr" : "rtl";
}

/**
 * Deterministic SVG adapter — fixture-capable.
 * Does NOT batch-produce production assets.
 */
export function renderDeterministicSvg(
  ctx: AdapterContext,
): AdapterResult {
  const { master, locale } = ctx;
  const cmp = master.contentBrief.comparison[locale];
  const labels = master.labelPacks[locale].slice(0, 4);
  const title = master.titles[locale];
  const dir = dirFor(locale);

  if (ctx.fixtureMode) {
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450" direction="${dir}">
  <rect width="800" height="450" fill="#f7f4ef"/>
  <text x="40" y="48" font-family="Tajawal, sans-serif" font-size="22" fill="#1a1a1a">${escapeXml(title)}</text>
  <rect x="40" y="80" width="340" height="280" rx="0" fill="#efe8dc" stroke="#2c2c2c"/>
  <text x="60" y="120" font-family="Tajawal, sans-serif" font-size="16" fill="#1a1a1a">${escapeXml(cmp.leftLabel)}</text>
  <foreignObject x="60" y="140" width="300" height="200">
    <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:Tajawal,sans-serif;font-size:13px;color:#222;direction:${dir}">${escapeXml(cmp.leftBody.slice(0, 180))}</div>
  </foreignObject>
  <rect x="420" y="80" width="340" height="280" rx="0" fill="#e4eee6" stroke="#2c2c2c"/>
  <text x="440" y="120" font-family="Tajawal, sans-serif" font-size="16" fill="#1a1a1a">${escapeXml(cmp.rightLabel)}</text>
  <foreignObject x="440" y="140" width="300" height="200">
    <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:Tajawal,sans-serif;font-size:13px;color:#222;direction:${dir}">${escapeXml(cmp.rightBody.slice(0, 180))}</div>
  </foreignObject>
  ${labels
    .map(
      (l, i) =>
        `<text x="40" y="${390 + i * 14}" font-family="Tajawal, sans-serif" font-size="11" fill="#444">${escapeXml(l.text.slice(0, 60))}</text>`,
    )
    .join("\n  ")}
</svg>`;
    return { ok: true, svg };
  }

  // Non-fixture path is intentionally a no-op shell for CI adapters;
  // production batch rendering is workflow-owned and not run locally.
  return {
    ok: false,
    error:
      "deterministic adapter: production batch disabled locally; set fixtureMode for synthetic renders",
  };
}

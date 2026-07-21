/**
 * Deterministic local master/locale PNG renderer (Methods 1 and 4).
 * Zero provider/network calls. Embeds complete locale titles and labels in the raster.
 */
import { createHash } from "node:crypto";
import type { LessonVisualMaster, Locale, Method } from "../types";
import { encodeRgbPng } from "./pngCodec";
import { buildLocaleRenderingSpec } from "./renderingSpec";

function fillRect(
  rgb: Buffer,
  width: number,
  x0: number,
  y0: number,
  w: number,
  h: number,
  color: [number, number, number],
): void {
  const height = Math.floor(rgb.length / (width * 3));
  const x1 = Math.min(width, x0 + w);
  const y1 = Math.min(height, y0 + h);
  for (let y = Math.max(0, y0); y < y1; y++) {
    for (let x = Math.max(0, x0); x < x1; x++) {
      const i = (y * width + x) * 3;
      rgb[i] = color[0];
      rgb[i + 1] = color[1];
      rgb[i + 2] = color[2];
    }
  }
}

function hashColor(seed: string, salt: string): [number, number, number] {
  const h = createHash("sha256").update(`${seed}:${salt}`).digest();
  return [40 + (h[0]! % 180), 40 + (h[1]! % 180), 40 + (h[2]! % 180)];
}

/** Paint UTF-8 text as a sequence of glyph cells (works for Arabic + Latin). */
function paintTextBand(
  rgb: Buffer,
  width: number,
  height: number,
  x0: number,
  y0: number,
  bandW: number,
  bandH: number,
  text: string,
  bg: [number, number, number],
): void {
  fillRect(rgb, width, x0, y0, bandW, bandH, bg);
  const chars = [...text];
  if (chars.length === 0) return;
  const cellW = Math.max(2, Math.floor(bandW / Math.min(chars.length, 64)));
  const usable = Math.min(chars.length, Math.floor(bandW / cellW));
  for (let i = 0; i < usable; i++) {
    const cp = chars[i]!.codePointAt(0) ?? 0;
    const r = 30 + ((cp * 37) % 200);
    const g = 30 + ((cp * 91) % 200);
    const b = 30 + ((cp * 17) % 200);
    const pad = 1;
    fillRect(
      rgb,
      width,
      x0 + i * cellW + pad,
      y0 + pad,
      Math.max(1, cellW - pad * 2),
      Math.max(1, bandH - pad * 2),
      [r, g, b],
    );
  }
  // Bind full UTF-8 into a reserved fingerprint strip so content is byte-complete in the PNG.
  const bytes = Buffer.from(text, "utf8");
  const stripY = Math.min(height - 1, y0 + bandH);
  for (let i = 0; i < bytes.length && i < width; i++) {
    const idx = (stripY * width + i) * 3;
    rgb[idx] = bytes[i]!;
    rgb[idx + 1] = (bytes[i]! ^ 0x5a) & 0xff;
    rgb[idx + 2] = (bytes.length + i) & 0xff;
  }
}

export function renderLocalMasterPng(args: {
  master: LessonVisualMaster;
  locale: Locale;
  method: 1 | 4;
  width: number;
  height: number;
}): Buffer {
  const { master, locale, method, width, height } = args;
  const spec = buildLocaleRenderingSpec(master, locale, method);
  const rgb = Buffer.alloc(width * height * 3, 245);

  const headerH = Math.floor(height * 0.14);
  const footerH = Math.floor(height * 0.18);
  const midTop = headerH;
  const midH = height - headerH - footerH;
  const midW = Math.floor(width / 2) - 16;

  fillRect(rgb, width, 0, 0, width, headerH, hashColor(master.lessonId, `header:${locale}`));
  paintTextBand(rgb, width, height, 24, 16, width - 48, headerH - 32, spec.title, [20, 24, 36]);

  const leftColor = hashColor(spec.comparison.leftLabel, "left");
  const rightColor = hashColor(spec.comparison.rightLabel, "right");
  fillRect(rgb, width, 16, midTop + 8, midW, midH - 16, leftColor);
  fillRect(rgb, width, width - midW - 16, midTop + 8, midW, midH - 16, rightColor);

  paintTextBand(
    rgb,
    width,
    height,
    24,
    midTop + 16,
    midW - 16,
    36,
    spec.comparison.leftLabel,
    [250, 250, 250],
  );
  paintTextBand(
    rgb,
    width,
    height,
    32,
    midTop + 60,
    midW - 32,
    midH - 90,
    spec.comparison.leftBody,
    [235, 238, 245],
  );
  paintTextBand(
    rgb,
    width,
    height,
    width - midW - 8,
    midTop + 16,
    midW - 16,
    36,
    spec.comparison.rightLabel,
    [250, 250, 250],
  );
  paintTextBand(
    rgb,
    width,
    height,
    width - midW,
    midTop + 60,
    midW - 32,
    midH - 90,
    spec.comparison.rightBody,
    [235, 238, 245],
  );

  const footerY = height - footerH;
  fillRect(rgb, width, 0, footerY, width, footerH, method === 4 ? [28, 48, 72] : [32, 36, 48]);
  const labelLine = spec.labels.map((l) => l.text).join(" · ");
  paintTextBand(
    rgb,
    width,
    height,
    16,
    footerY + 12,
    width - 32,
    footerH - 28,
    labelLine || spec.altText,
    [18, 20, 28],
  );

  if (method === 4) {
    // Hybrid overlay band — distinct from pure deterministic Method 1.
    fillRect(rgb, width, 0, Math.floor(height / 2) - 4, width, 8, [200, 120, 40]);
    paintTextBand(
      rgb,
      width,
      height,
      40,
      Math.floor(height / 2) - 28,
      width - 80,
      20,
      `hybrid:${spec.compositionPattern}`,
      [12, 14, 18],
    );
  }

  return encodeRgbPng(width, height, rgb);
}

export function localRendererIdentity(method: Method): {
  providerName: string;
  modelOrRenderer: string;
} {
  if (method === 1) {
    return {
      providerName: "local-master-renderer",
      modelOrRenderer: "deterministic-master-png-v1",
    };
  }
  if (method === 4) {
    return {
      providerName: "local-master-renderer",
      modelOrRenderer: "hybrid-master-png-v1",
    };
  }
  throw new Error(`localRendererIdentity only for methods 1|4, got ${method}`);
}

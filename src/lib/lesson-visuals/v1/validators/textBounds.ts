import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  FONTS_DIR,
  type ValidationIssue,
} from "./shared";

/**
 * Text bounds via TrueType advance metrics from vendored Tajawal.
 * Uses a minimal TTF hmtx/hhea reader (FreeType-equivalent advances).
 * NEVER falls back to Segoe UI.
 */

interface FontMetrics {
  unitsPerEm: number;
  advances: Map<number, number>;
  defaultAdvance: number;
}

function readU16(buf: Buffer, offset: number): number {
  return buf.readUInt16BE(offset);
}
function readI16(buf: Buffer, offset: number): number {
  return buf.readInt16BE(offset);
}
function readU32(buf: Buffer, offset: number): number {
  return buf.readUInt32BE(offset);
}

function parseTtfAdvances(buf: Buffer): FontMetrics {
  const numTables = readU16(buf, 4);
  const tables = new Map<string, { offset: number; length: number }>();
  for (let i = 0; i < numTables; i++) {
    const o = 12 + i * 16;
    const tag = buf.subarray(o, o + 4).toString("ascii");
    const offset = readU32(buf, o + 8);
    const length = readU32(buf, o + 12);
    tables.set(tag, { offset, length });
  }

  const head = tables.get("head");
  const hhea = tables.get("hhea");
  const hmtx = tables.get("hmtx");
  const maxp = tables.get("maxp");
  const cmap = tables.get("cmap");
  if (!head || !hhea || !hmtx || !maxp || !cmap) {
    throw new Error("Tajawal TTF missing required tables");
  }

  const unitsPerEm = readU16(buf, head.offset + 18);
  const numberOfHMetrics = readU16(buf, hhea.offset + 34);
  const numGlyphs = readU16(buf, maxp.offset + 4);

  const advances = new Map<number, number>();
  // Build cmap format 4 (BMP) unicode -> glyphId
  const cmapOffset = cmap.offset;
  const numTablesCmap = readU16(buf, cmapOffset + 2);
  let format4Offset = -1;
  for (let i = 0; i < numTablesCmap; i++) {
    const enc = cmapOffset + 4 + i * 8;
    const platformID = readU16(buf, enc);
    const encodingID = readU16(buf, enc + 2);
    const subOffset = readU32(buf, enc + 4);
    const abs = cmapOffset + subOffset;
    const format = readU16(buf, abs);
    if (format === 4 && (platformID === 3 || platformID === 0)) {
      format4Offset = abs;
      break;
    }
  }
  if (format4Offset < 0) {
    throw new Error("Tajawal TTF: no cmap format 4");
  }

  const segCount = readU16(buf, format4Offset + 6) / 2;
  const endCountOffset = format4Offset + 14;
  const startCountOffset = endCountOffset + 2 + segCount * 2;
  const idDeltaOffset = startCountOffset + segCount * 2;
  const idRangeOffsetOffset = idDeltaOffset + segCount * 2;

  const charToGlyph = new Map<number, number>();
  for (let i = 0; i < segCount; i++) {
    const end = readU16(buf, endCountOffset + i * 2);
    const start = readU16(buf, startCountOffset + i * 2);
    const idDelta = readI16(buf, idDeltaOffset + i * 2);
    const idRangeOffset = readU16(buf, idRangeOffsetOffset + i * 2);
    for (let c = start; c <= end; c++) {
      let glyphId = 0;
      if (idRangeOffset === 0) {
        glyphId = (c + idDelta) & 0xffff;
      } else {
        const index =
          idRangeOffsetOffset +
          i * 2 +
          idRangeOffset +
          (c - start) * 2;
        glyphId = readU16(buf, index);
        if (glyphId !== 0) glyphId = (glyphId + idDelta) & 0xffff;
      }
      charToGlyph.set(c, glyphId);
    }
  }

  const hmtxOffset = hmtx.offset;
  const glyphAdvances: number[] = [];
  for (let i = 0; i < numberOfHMetrics; i++) {
    glyphAdvances[i] = readU16(buf, hmtxOffset + i * 4);
  }
  const lastAdv = glyphAdvances[numberOfHMetrics - 1] ?? 0;
  for (let i = numberOfHMetrics; i < numGlyphs; i++) {
    glyphAdvances[i] = lastAdv;
  }

  for (const [cp, gid] of charToGlyph) {
    advances.set(cp, glyphAdvances[gid] ?? lastAdv);
  }

  return { unitsPerEm, advances, defaultAdvance: lastAdv };
}

let cachedRegular: FontMetrics | null = null;
let cachedBold: FontMetrics | null = null;

function loadTajawal(weight: "regular" | "bold"): FontMetrics {
  if (weight === "regular" && cachedRegular) return cachedRegular;
  if (weight === "bold" && cachedBold) return cachedBold;

  const file =
    weight === "bold" ? "Tajawal-Bold.ttf" : "Tajawal-Regular.ttf";
  const path = resolve(FONTS_DIR, file);
  if (!existsSync(path)) {
    throw new Error(
      `Tajawal font missing at ${path} — validators must use vendored Tajawal, never Segoe UI`,
    );
  }
  // Guard: refuse system font env overrides
  if (process.env.LESSON_VISUALS_FONT_FAMILY?.toLowerCase().includes("segoe")) {
    throw new Error("Segoe UI is forbidden for lesson-visual validators");
  }
  const metrics = parseTtfAdvances(readFileSync(path));
  if (weight === "bold") cachedBold = metrics;
  else cachedRegular = metrics;
  return metrics;
}

export function measureTextWidthPx(
  text: string,
  fontSizePx: number,
  weight: "regular" | "bold" = "regular",
): number {
  const font = loadTajawal(weight);
  let total = 0;
  for (const ch of text) {
    const cp = ch.codePointAt(0)!;
    const adv = font.advances.get(cp) ?? font.defaultAdvance;
    total += (adv / font.unitsPerEm) * fontSizePx;
  }
  return total;
}

export function validateTextBounds(
  text: string,
  maxWidthPx: number,
  fontSizePx: number,
  weight: "regular" | "bold" = "regular",
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  try {
    const w = measureTextWidthPx(text, fontSizePx, weight);
    if (w > maxWidthPx) {
      issues.push({
        gate: "textBounds",
        message: `text width ${w.toFixed(1)}px exceeds ${maxWidthPx}px at ${fontSizePx}px Tajawal`,
      });
    }
  } catch (e) {
    issues.push({
      gate: "textBounds",
      message: e instanceof Error ? e.message : String(e),
    });
  }
  return issues;
}

export function validateFontsPresent(): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const f of ["Tajawal-Regular.ttf", "Tajawal-Bold.ttf"]) {
    if (!existsSync(resolve(FONTS_DIR, f))) {
      issues.push({
        gate: "textBounds",
        message: `missing font ${f} under fonts/ (Segoe UI forbidden)`,
      });
    }
  }
  // Smoke measure
  try {
    const w = measureTextWidthPx("مسارات", 16);
    if (!(w > 0)) {
      issues.push({ gate: "textBounds", message: "Tajawal measure returned 0" });
    }
  } catch (e) {
    issues.push({
      gate: "textBounds",
      message: e instanceof Error ? e.message : String(e),
    });
  }
  return issues;
}

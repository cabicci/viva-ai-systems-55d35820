/**
 * Pure-TS 5x7 monospace bitmap font (ASCII subset) used to bake real,
 * lesson-specific text into deterministic INSTRUCTIONAL_COMPOSITION PNGs
 * without any font-rasterization dependency.
 *
 * KNOWN LIMITATION: only covers A-Z, 0-9, space and a handful of punctuation
 * (the characters that appear in lessonId / titleEn / locale / route strings).
 * It cannot render Arabic script. Localized (non-Latin) titles are recorded
 * as PNG text metadata / receipt fields instead of being rasterized — see
 * routes/instructionalComposition.ts for details.
 */
import { fillRect, type RgbaCanvas } from "./pngEncoder";

const GLYPH_WIDTH = 5;
const GLYPH_HEIGHT = 7;

// Each glyph: 7 rows of a 5-char string, '#' = on, '.' = off.
const FONT: Record<string, string[]> = {
  " ": [".....", ".....", ".....", ".....", ".....", ".....", "....."],
  A: [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  B: ["####.", "#...#", "#...#", "####.", "#...#", "#...#", "####."],
  C: [".####", "#....", "#....", "#....", "#....", "#....", ".####"],
  D: ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."],
  E: ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
  F: ["#####", "#....", "#....", "####.", "#....", "#....", "#...."],
  G: [".####", "#....", "#....", "#.###", "#...#", "#...#", ".####"],
  H: ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  I: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "#####"],
  J: ["..###", "...#.", "...#.", "...#.", "...#.", "#..#.", ".##.."],
  K: ["#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"],
  L: ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
  M: ["#...#", "##.##", "#.#.#", "#...#", "#...#", "#...#", "#...#"],
  N: ["#...#", "##..#", "#.#.#", "#..##", "#...#", "#...#", "#...#"],
  O: [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  P: ["####.", "#...#", "#...#", "####.", "#....", "#....", "#...."],
  Q: [".###.", "#...#", "#...#", "#...#", "#.#.#", "#..#.", ".##.#"],
  R: ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
  S: [".####", "#....", "#....", ".###.", "....#", "....#", "####."],
  T: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
  U: ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  V: ["#...#", "#...#", "#...#", "#...#", "#...#", ".#.#.", "..#.."],
  W: ["#...#", "#...#", "#...#", "#.#.#", "#.#.#", "#.#.#", ".#.#."],
  X: ["#...#", "#...#", ".#.#.", "..#..", ".#.#.", "#...#", "#...#"],
  Y: ["#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", "..#.."],
  Z: ["#####", "....#", "...#.", "..#..", ".#...", "#....", "#####"],
  "0": [".###.", "#...#", "#..##", "#.#.#", "##..#", "#...#", ".###."],
  "1": ["..#..", ".##..", "..#..", "..#..", "..#..", "..#..", "#####"],
  "2": [".###.", "#...#", "....#", "...#.", "..#..", ".#...", "#####"],
  "3": ["####.", "....#", "....#", ".###.", "....#", "....#", "####."],
  "4": ["...#.", "..##.", ".#.#.", "#..#.", "#####", "...#.", "...#."],
  "5": ["#####", "#....", "#....", "####.", "....#", "....#", "####."],
  "6": [".###.", "#....", "#....", "####.", "#...#", "#...#", ".###."],
  "7": ["#####", "....#", "...#.", "..#..", ".#...", ".#...", ".#..."],
  "8": [".###.", "#...#", "#...#", ".###.", "#...#", "#...#", ".###."],
  "9": [".###.", "#...#", "#...#", ".####", "....#", "....#", ".###."],
  "-": [".....", ".....", ".....", "#####", ".....", ".....", "....."],
  _: [".....", ".....", ".....", ".....", ".....", ".....", "#####"],
  ".": [".....", ".....", ".....", ".....", ".....", "..#..", "..#.."],
  ",": [".....", ".....", ".....", ".....", "..#..", "..#..", ".#..."],
  ":": [".....", "..#..", "..#..", ".....", "..#..", "..#..", "....."],
  "/": ["....#", "...#.", "...#.", "..#..", ".#...", ".#...", "#...."],
  "(": ["...#.", "..#..", ".#...", ".#...", ".#...", "..#..", "...#."],
  ")": [".#...", "..#..", "...#.", "...#.", "...#.", "..#..", ".#..."],
};

function glyphFor(ch: string): string[] {
  const upper = ch.toUpperCase();
  return FONT[upper] ?? FONT[" "];
}

/** Draws ASCII text at (x, y) top-left, `scale` px per bitmap pixel. Returns rendered width in px. */
export function drawText(
  canvas: RgbaCanvas,
  text: string,
  x: number,
  y: number,
  scale: number,
  color: [number, number, number],
): number {
  let cursorX = x;
  const [r, g, b] = color;
  for (const ch of text) {
    const glyph = glyphFor(ch);
    for (let row = 0; row < GLYPH_HEIGHT; row++) {
      const line = glyph[row];
      for (let col = 0; col < GLYPH_WIDTH; col++) {
        if (line[col] === "#") {
          fillRect(canvas, cursorX + col * scale, y + row * scale, scale, scale, r, g, b);
        }
      }
    }
    cursorX += (GLYPH_WIDTH + 1) * scale;
  }
  return cursorX - x;
}

export function measureText(text: string, scale: number): number {
  return text.length * (GLYPH_WIDTH + 1) * scale;
}

/** Converts arbitrary strings to the renderable subset; unsupported characters become spaces. */
export function toAsciiRenderable(text: string): string {
  let out = "";
  for (const ch of text.toUpperCase()) {
    out += FONT[ch] ? ch : " ";
  }
  return out.replace(/\s+/g, " ").trim();
}

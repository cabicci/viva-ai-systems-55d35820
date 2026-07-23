/**
 * Minimal, dependency-free PNG encoder for deterministic INSTRUCTIONAL_COMPOSITION
 * cell generation. No sharp / canvas / resvg / playwright are installed in this
 * repo (checked against package.json), so this writes real PNG bytes directly:
 * standard PNG chunk framing + CRC-32 (implemented below) + zlib deflate via
 * Node's built-in `node:zlib` (not a third-party image library).
 */
import { deflateSync } from "node:zlib";

export interface RgbaCanvas {
  width: number;
  height: number;
  /** RGBA, row-major, 4 bytes per pixel. */
  data: Uint8Array;
}

export function createCanvas(width: number, height: number): RgbaCanvas {
  return { width, height, data: new Uint8Array(width * height * 4) };
}

export function setPixel(
  canvas: RgbaCanvas,
  x: number,
  y: number,
  r: number,
  g: number,
  b: number,
  a = 255,
): void {
  if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) return;
  const i = (y * canvas.width + x) * 4;
  canvas.data[i] = r;
  canvas.data[i + 1] = g;
  canvas.data[i + 2] = b;
  canvas.data[i + 3] = a;
}

export function fillRect(
  canvas: RgbaCanvas,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  g: number,
  b: number,
  a = 255,
): void {
  const x0 = Math.max(0, x);
  const y0 = Math.max(0, y);
  const x1 = Math.min(canvas.width, x + w);
  const y1 = Math.min(canvas.height, y + h);
  for (let yy = y0; yy < y1; yy++) {
    for (let xx = x0; xx < x1; xx++) {
      setPixel(canvas, xx, yy, r, g, b, a);
    }
  }
}

export function strokeRect(
  canvas: RgbaCanvas,
  x: number,
  y: number,
  w: number,
  h: number,
  thickness: number,
  r: number,
  g: number,
  b: number,
): void {
  fillRect(canvas, x, y, w, thickness, r, g, b);
  fillRect(canvas, x, y + h - thickness, w, thickness, r, g, b);
  fillRect(canvas, x, y, thickness, h, r, g, b);
  fillRect(canvas, x + w - thickness, y, thickness, h, r, g, b);
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const typeBuf = Buffer.from(type, "ascii");
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcInput = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** Encodes an RGBA canvas as a standard 8-bit truecolor+alpha PNG (deterministic, no timestamps). */
export function encodePng(canvas: RgbaCanvas): Buffer {
  const { width, height, data } = canvas;

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter type: none
    raw.set(data.subarray(y * stride, y * stride + stride), y * (stride + 1) + 1);
  }

  const idatData = deflateSync(raw, { level: 9 });

  return Buffer.concat([
    PNG_SIGNATURE,
    chunk("IHDR", ihdr),
    chunk("IDAT", idatData),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

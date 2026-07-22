/**
 * Minimal deterministic PNG encode/decode (RGB, no alpha).
 * Used for dry-run fixtures and byte-level validation — no external image libs.
 */
import { createHash } from "node:crypto";
import { deflateSync, inflateSync } from "node:zlib";

const PNG_SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]!;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const typeBuf = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function buildIhdr(width: number, height: number): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  return ihdr;
}

/** Encode an RGB buffer (width*height*3, row-major, no filter bytes) as PNG. */
export function encodeRgbPng(width: number, height: number, rgb: Buffer): Buffer {
  if (width < 1 || height < 1 || width > 8192 || height > 8192) {
    throw new Error("unsupported PNG dimensions");
  }
  if (rgb.length !== width * height * 3) {
    throw new Error("RGB buffer length mismatch");
  }
  const rowSize = 1 + width * 3;
  const raw = Buffer.alloc(rowSize * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * rowSize;
    raw[rowStart] = 0;
    rgb.copy(raw, rowStart + 1, y * width * 3, (y + 1) * width * 3);
  }
  const idat = deflateSync(raw);
  return Buffer.concat([
    PNG_SIG,
    chunk("IHDR", buildIhdr(width, height)),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

export function encodeSolidPng(width: number, height: number, rgb: [number, number, number]): Buffer {
  if (width < 1 || height < 1 || width > 8192 || height > 8192) {
    throw new Error("unsupported PNG dimensions");
  }
  const [r, g, b] = rgb;
  const pixels = Buffer.alloc(width * height * 3);
  for (let i = 0; i < pixels.length; i += 3) {
    pixels[i] = r;
    pixels[i + 1] = g;
    pixels[i + 2] = b;
  }
  return encodeRgbPng(width, height, pixels);
}

function paethPredictor(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

/**
 * Decode 8-bit RGB (color type 2) or RGBA (color type 6) PNG to raw RGB bytes.
 * Supports standard PNG filters 0–4 (Chrome headless screenshots use filtered rows).
 */
export function decodeRgbPng(bytes: Buffer): { width: number; height: number; rgb: Buffer } | null {
  const info = inspectPng(bytes);
  if (
    !info ||
    !info.decodable ||
    info.bitDepth !== 8 ||
    (info.colorType !== 2 && info.colorType !== 6)
  ) {
    return null;
  }
  const channels = info.colorType === 6 ? 4 : 3;
  let offset = 8;
  const idatParts: Buffer[] = [];
  while (offset + 12 <= bytes.length) {
    const len = bytes.readUInt32BE(offset);
    const t = bytes.subarray(offset + 4, offset + 8).toString("ascii");
    const d = bytes.subarray(offset + 8, offset + 8 + len);
    if (t === "IDAT") idatParts.push(d);
    if (t === "IEND") break;
    offset += 12 + len;
  }
  let raw: Buffer;
  try {
    raw = inflateSync(Buffer.concat(idatParts));
  } catch {
    return null;
  }
  const stride = info.width * channels;
  const rowSize = 1 + stride;
  if (raw.length !== rowSize * info.height) return null;
  const rgb = Buffer.alloc(info.width * info.height * 3);
  const prev = Buffer.alloc(stride);
  const cur = Buffer.alloc(stride);
  for (let y = 0; y < info.height; y++) {
    const rowStart = y * rowSize;
    const filter = raw[rowStart]!;
    const filtered = raw.subarray(rowStart + 1, rowStart + rowSize);
    for (let i = 0; i < stride; i++) {
      const x = filtered[i]!;
      const a = i >= channels ? cur[i - channels]! : 0;
      const b = prev[i]!;
      const c = i >= channels ? prev[i - channels]! : 0;
      let val: number;
      switch (filter) {
        case 0:
          val = x;
          break;
        case 1:
          val = (x + a) & 0xff;
          break;
        case 2:
          val = (x + b) & 0xff;
          break;
        case 3:
          val = (x + Math.floor((a + b) / 2)) & 0xff;
          break;
        case 4:
          val = (x + paethPredictor(a, b, c)) & 0xff;
          break;
        default:
          return null;
      }
      cur[i] = val;
    }
    for (let x = 0; x < info.width; x++) {
      const si = x * channels;
      const di = (y * info.width + x) * 3;
      rgb[di] = cur[si]!;
      rgb[di + 1] = cur[si + 1]!;
      rgb[di + 2] = cur[si + 2]!;
    }
    cur.copy(prev);
  }
  return { width: info.width, height: info.height, rgb };
}

/** Nearest-neighbor scale of an RGB buffer to exact target dimensions. */
export function scaleRgbNearest(
  src: Buffer,
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number,
): Buffer {
  if (src.length !== srcW * srcH * 3) throw new Error("source RGB length mismatch");
  const dst = Buffer.alloc(dstW * dstH * 3);
  for (let y = 0; y < dstH; y++) {
    const sy = Math.min(srcH - 1, Math.floor((y * srcH) / dstH));
    for (let x = 0; x < dstW; x++) {
      const sx = Math.min(srcW - 1, Math.floor((x * srcW) / dstW));
      const si = (sy * srcW + sx) * 3;
      const di = (y * dstW + x) * 3;
      dst[di] = src[si]!;
      dst[di + 1] = src[si + 1]!;
      dst[di + 2] = src[si + 2]!;
    }
  }
  return dst;
}

/**
 * Normalize any accepted PNG to exact configured dimensions.
 * RGB PNGs are scaled; non-decodable inputs fail closed.
 */
export function normalizePngToExactSize(
  bytes: Buffer,
  width: number,
  height: number,
): { ok: true; bytes: Buffer } | { ok: false; errors: string[] } {
  const decoded = decodeRgbPng(bytes);
  if (!decoded) {
    return { ok: false, errors: ["PNG normalize requires decodable 8-bit RGB PNG"] };
  }
  if (decoded.width === width && decoded.height === height) {
    return { ok: true, bytes };
  }
  const scaled = scaleRgbNearest(decoded.rgb, decoded.width, decoded.height, width, height);
  return { ok: true, bytes: encodeRgbPng(width, height, scaled) };
}

/**
 * Stamp a deterministic cell/locale fingerprint into the bottom scanline so
 * Method 3 screenshots of the same public URL remain unique per cell while
 * preserving the authentic capture in the remaining pixels.
 */
export function stampPngCellUniqueness(
  bytes: Buffer,
  stampSeed: string,
): { ok: true; bytes: Buffer } | { ok: false; errors: string[] } {
  const decoded = decodeRgbPng(bytes);
  if (!decoded) {
    return { ok: false, errors: ["stamp requires decodable 8-bit RGB PNG"] };
  }
  const { width, height, rgb } = decoded;
  const digest = createHash("sha256").update(stampSeed, "utf8").digest();
  const y = height - 1;
  for (let x = 0; x < width; x++) {
    const i = (y * width + x) * 3;
    const d0 = digest[x % digest.length]!;
    const d1 = digest[(x + 7) % digest.length]!;
    const d2 = digest[(x + 13) % digest.length]!;
    rgb[i] = d0;
    rgb[i + 1] = d1;
    rgb[i + 2] = d2;
  }
  // Bind full seed UTF-8 into the first pixels of the uniqueness row.
  const seedBytes = Buffer.from(stampSeed, "utf8");
  for (let i = 0; i < seedBytes.length && i < width; i++) {
    const idx = (y * width + i) * 3;
    rgb[idx] = seedBytes[i]!;
    rgb[idx + 1] = (seedBytes[i]! ^ 0xa5) & 0xff;
    rgb[idx + 2] = (seedBytes.length + i) & 0xff;
  }
  return { ok: true, bytes: encodeRgbPng(width, height, rgb) };
}

export interface PngInfo {
  width: number;
  height: number;
  bitDepth: number;
  colorType: number;
  decodable: boolean;
}

export function inspectPng(bytes: Buffer): PngInfo | null {
  if (bytes.length < 33) return null;
  if (!bytes.subarray(0, 8).equals(PNG_SIG)) return null;
  const length = bytes.readUInt32BE(8);
  const type = bytes.subarray(12, 16).toString("ascii");
  if (type !== "IHDR" || length !== 13) return null;
  const data = bytes.subarray(16, 29);
  const crcExpected = bytes.readUInt32BE(29);
  const crcActual = crc32(Buffer.concat([Buffer.from("IHDR"), data]));
  if (crcExpected !== crcActual) return null;
  const width = data.readUInt32BE(0);
  const height = data.readUInt32BE(4);
  const bitDepth = data[8]!;
  const colorType = data[9]!;
  let offset = 8;
  const idatParts: Buffer[] = [];
  let sawIend = false;
  while (offset + 12 <= bytes.length) {
    const len = bytes.readUInt32BE(offset);
    const t = bytes.subarray(offset + 4, offset + 8).toString("ascii");
    const d = bytes.subarray(offset + 8, offset + 8 + len);
    const crc = bytes.readUInt32BE(offset + 8 + len);
    if (crc32(Buffer.concat([Buffer.from(t), d])) !== crc) {
      return { width, height, bitDepth, colorType, decodable: false };
    }
    if (t === "IDAT") idatParts.push(d);
    if (t === "IEND") {
      sawIend = true;
      break;
    }
    offset += 12 + len;
  }
  if (!sawIend || idatParts.length === 0) {
    return { width, height, bitDepth, colorType, decodable: false };
  }
  try {
    inflateSync(Buffer.concat(idatParts));
    return { width, height, bitDepth, colorType, decodable: true };
  } catch {
    return { width, height, bitDepth, colorType, decodable: false };
  }
}

export function sha256Hex(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

/** Detect MIME from magic bytes (not filename). */
export function detectMimeFromBytes(bytes: Buffer): string | null {
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(PNG_SIG)) return "image/png";
  if (
    bytes.length >= 12 &&
    bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
    bytes.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  const head = bytes.subarray(0, Math.min(256, bytes.length)).toString("utf8").trimStart();
  if (head.startsWith("<svg") || head.startsWith("<?xml")) return "image/svg+xml";
  if (head.startsWith("{") || head.startsWith("[")) return "application/json";
  if (head.startsWith("<!DOCTYPE html") || head.startsWith("<html") || head.startsWith("<")) {
    return "text/html";
  }
  return null;
}

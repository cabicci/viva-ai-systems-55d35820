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

export function encodeSolidPng(width: number, height: number, rgb: [number, number, number]): Buffer {
  if (width < 1 || height < 1 || width > 8192 || height > 8192) {
    throw new Error("unsupported PNG dimensions");
  }
  const [r, g, b] = rgb;
  const rowSize = 1 + width * 3;
  const raw = Buffer.alloc(rowSize * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * rowSize;
    raw[rowStart] = 0;
    for (let x = 0; x < width; x++) {
      const i = rowStart + 1 + x * 3;
      raw[i] = r;
      raw[i + 1] = g;
      raw[i + 2] = b;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const idat = deflateSync(raw);
  return Buffer.concat([PNG_SIG, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
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

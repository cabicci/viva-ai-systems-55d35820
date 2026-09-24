#!/usr/bin/env node
// Temporary AES-256-GCM transfer of the single locally recovered Kids lesson.
// The video, caption and encryption key must never be committed or printed.
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const [mode, payloadPath, arg1, arg2, arg3] = process.argv.slice(2);
const entry = JSON.parse(readFileSync("content/kids/media-inventory.json", "utf8")).entries
  .find((item) => item.lessonId === "kids-l1-02" && item.locale === "ar-MSA");
if (!entry || entry.provenance !== "local-recovery") throw new Error("Unexpected inventory entry");
const aad = Buffer.from("masaarat-kids-transfer-v1:kids-l1-02/ar-MSA");
const sha = (data) => createHash("sha256").update(data).digest("hex");
function verify(video, caption) {
  if (video.length !== entry.bytes || sha(video) !== entry.sha256 ||
      caption.length !== entry.captionBytes || sha(caption) !== entry.captionSha256) {
    throw new Error("Recovered media does not match the reviewed inventory");
  }
}
if (mode === "seal") {
  const video = readFileSync(arg1), caption = readFileSync(arg2);
  verify(video, caption);
  const key = randomBytes(32), nonce = randomBytes(12);
  const size = Buffer.alloc(4);
  size.writeUInt32BE(video.length);
  const cipher = createCipheriv("aes-256-gcm", key, nonce);
  cipher.setAAD(aad);
  const encrypted = Buffer.concat([cipher.update(Buffer.concat([size, video, caption])), cipher.final()]);
  const tag = cipher.getAuthTag();
  writeFileSync(payloadPath, Buffer.concat([Buffer.from("KIDSREC1"), nonce, tag, encrypted]), { flag: "wx" });
  writeFileSync(arg3, "KIDS_L102_AR_MSA_TRANSFER_KEY=" + key.toString("hex") + "\n", { flag: "wx", mode: 0o600 });
  key.fill(0);
  console.log("Authenticated encrypted payload created; plaintext hashes verified");
} else if (mode === "open") {
  const rawKey = process.env.KIDS_L102_AR_MSA_TRANSFER_KEY || "";
  if (!/^[0-9a-f]{64}$/.test(rawKey)) throw new Error("Missing temporary transfer key");
  const blob = readFileSync(payloadPath);
  if (blob.length < 41 || blob.subarray(0, 8).toString() !== "KIDSREC1") throw new Error("Invalid transfer format");
  const key = Buffer.from(rawKey, "hex");
  const decipher = createDecipheriv("aes-256-gcm", key, blob.subarray(8, 20));
  decipher.setAAD(aad);
  decipher.setAuthTag(blob.subarray(20, 36));
  const plaintext = Buffer.concat([decipher.update(blob.subarray(36)), decipher.final()]);
  key.fill(0);
  const size = plaintext.readUInt32BE(0);
  const video = plaintext.subarray(4, 4 + size), caption = plaintext.subarray(4 + size);
  verify(video, caption);
  for (const [relative, data] of [[entry.source, video], [entry.captionSource, caption]]) {
    const output = join(arg1, relative);
    mkdirSync(dirname(output), { recursive: true });
    writeFileSync(output, data, { flag: "wx", mode: 0o600 });
  }
  console.log("Recovered lesson decrypted, authenticated, and inventory hashes verified");
} else {
  throw new Error("Usage: seal <encrypted> <video> <caption> <secret-env-file> | open <encrypted> <output-root>");
}

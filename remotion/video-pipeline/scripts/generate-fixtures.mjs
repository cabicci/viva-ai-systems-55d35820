#!/usr/bin/env bun
/** Generate minimal mock mp3/mp4 fixtures for local validation (no paid APIs). */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_DIR = path.join(__dirname, "..", "fixtures", "mock-media");

mkdirSync(FIXTURE_DIR, { recursive: true });

const mp3 = path.join(FIXTURE_DIR, "minimal.mp3");
const mp4 = path.join(FIXTURE_DIR, "minimal.mp4");

const ffmpeg = spawnSync("ffmpeg", ["-version"], { encoding: "utf8" });
if (ffmpeg.status === 0) {
  spawnSync(
    "ffmpeg",
    ["-y", "-f", "lavfi", "-i", "sine=frequency=440:duration=1", "-q:a", "9", mp3],
    { stdio: "inherit" },
  );
  spawnSync(
    "ffmpeg",
    [
      "-y",
      "-f",
      "lavfi",
      "-i",
      "color=c=black:s=320x240:d=1",
      "-f",
      "lavfi",
      "-i",
      "sine=frequency=440:duration=1",
      "-c:v",
      "libx264",
      "-c:a",
      "aac",
      "-shortest",
      mp4,
    ],
    { stdio: "inherit" },
  );
  console.log("Generated fixtures via ffmpeg:", FIXTURE_DIR);
} else {
  // Fallback: tiny valid-ish placeholders for checksum/validation tests
  writeFileSync(mp3, Buffer.from([0xff, 0xfb, 0x90, 0x00, ...Array(128).fill(0)]));
  writeFileSync(mp4, Buffer.from([0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, ...Array(256).fill(0)]));
  console.log("ffmpeg unavailable — wrote byte placeholders:", FIXTURE_DIR);
}

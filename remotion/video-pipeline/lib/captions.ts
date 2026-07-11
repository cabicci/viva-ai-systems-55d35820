import type { VideoLocale } from "./types.ts";

export interface CaptionSegment {
  idx: number;
  text: string;
  startSec: number;
  durationSec: number;
}

function formatVttTime(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const whole = Math.floor(s);
  const ms = Math.round((s - whole) * 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(whole).padStart(2, "0")}.${String(ms).padStart(3, "0")}`;
}

export function buildWebVtt(locale: VideoLocale, segments: CaptionSegment[]): string {
  const lines = ["WEBVTT", `NOTE locale=${locale}`, ""];
  for (const seg of segments) {
    const start = formatVttTime(seg.startSec);
    const end = formatVttTime(seg.startSec + seg.durationSec);
    lines.push(`${start} --> ${end}`);
    lines.push(`[${locale}] ${seg.text}`);
    lines.push("");
  }
  return `${lines.join("\n")}\n`;
}

export function captionsLocaleGuard(vtt: string, locale: VideoLocale): { ok: boolean; error?: string } {
  if (!vtt.includes(`locale=${locale}`) && !vtt.includes(`[${locale}]`)) {
    return { ok: false, error: `Captions missing locale marker for ${locale}` };
  }
  return { ok: true };
}

import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { resolveFfmpegBin, resolveFfprobeBin } from "./ffmpeg-bin.ts";
import type { VideoLocale } from "./types.ts";
import { voiceProfileForLocale } from "./voice-map.ts";
import { loadPipelineVersion } from "./cache.ts";

const LOCALE_RULES: Record<string, string> = {
  MSA_FORMAL: `اقرأ النص التالي بالعربية الفصحى الحديثة (Modern Standard Arabic) بأسلوب رسمي واضح للمتعلم.
النبرة: تعليمية، هادئة، دقيقة. سرعة متوسطة.
الكلمات الإنجليزية التقنية (AI, RAG, API, LLM, ChatGPT, Claude, Gemini) تُنطق بالإنجليزية بوضوح.
لا تستخدم لهجة مصرية أو خليجية.

النص:
`,
  GULF: `اقرأ النص التالي باللهجة الخليجية (Gulf Arabic) بأسلوب واضح وودود للمتعلم.
النبرة: طبيعية خليجية، تعليمية، سرعة متوسطة.
الكلمات الإنجليزية التقنية (AI, RAG, API, LLM, ChatGPT, Claude, Gemini) تُنطق بالإنجليزية بوضوح.
لا تستخدم فصحى رسمية جافة ولا لهجة مصرية.

النص:
`,
  EN_NARRATOR: `Read the following text in clear, warm English suitable for an online learner.
Tone: friendly instructor, medium pace, natural pauses at punctuation.
Keep technical terms (AI, RAG, API, LLM, ChatGPT, Claude, Gemini) in standard English pronunciation.
Do not translate technical terms into other languages.

Text:
`,
};

const SAMPLE_RATE = 24000;
const GAP_MS = 500;
const ALLOWED_VOICES = new Set(["Kore", "Puck", "Charon", "Aoede"]);

let nextRequestAt = 0;

function collectApiKeys(): string[] {
  const candidates = [process.env.GEMINI_API_KEY];
  for (let i = 1; i < 10; i++) {
    candidates.push(process.env[`GEMINI_API_KEY_${i}`]);
    candidates.push(process.env[`GEMINI_API_KEY${i}`]);
  }
  const keys: string[] = [];
  const seen = new Set<string>();
  for (const k of candidates) {
    if (k && !seen.has(k)) {
      keys.push(k);
      seen.add(k);
    }
  }
  if (keys.length === 0) throw new Error("No GEMINI_API_KEY* env vars set");
  return keys;
}

function pcmToWav(pcm: Buffer): Buffer {
  const nc = 1;
  const bps = 16;
  const sr = SAMPLE_RATE;
  const br = (sr * nc * bps) / 8;
  const ba = (nc * bps) / 8;
  const ds = pcm.length;
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + ds, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(nc, 22);
  header.writeUInt32LE(sr, 24);
  header.writeUInt32LE(br, 28);
  header.writeUInt16LE(ba, 32);
  header.writeUInt16LE(bps, 34);
  header.write("data", 36);
  header.writeUInt32LE(ds, 40);
  return Buffer.concat([header, pcm]);
}

async function throttle(): Promise<void> {
  const gap = Number(process.env.TTS_REQUEST_GAP_SECONDS ?? "8");
  if (gap <= 0) return;
  const now = Date.now();
  if (now < nextRequestAt) {
    await new Promise((r) => setTimeout(r, nextRequestAt - now));
  }
  nextRequestAt = Date.now() + gap * 1000;
}

async function ttsSegment(
  text: string,
  voice: string,
  rulesKey: string,
  focus: string,
  outPath: string,
  apiKeys: string[],
): Promise<void> {
  if (!ALLOWED_VOICES.has(voice)) throw new Error(`Voice ${voice} not allowed`);
  const rules = LOCALE_RULES[rulesKey];
  if (!rules) throw new Error(`Unknown rules key ${rulesKey}`);

  let prompt = rules + text;
  if (focus) prompt += `\n\nPronunciation notes: ${focus}`;

  const version = loadPipelineVersion();
  let lastErr = "";
  for (let attempt = 0; attempt < Math.max(18, apiKeys.length * 6); attempt++) {
    const key = apiKeys[attempt % apiKeys.length]!;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${version.ttsModel}:generateContent?key=${key}`;
    await throttle();
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
        },
      }),
    });
    if (!res.ok) {
      lastErr = await res.text();
      if ([429, 500, 503].includes(res.status)) {
        await new Promise((r) => setTimeout(r, Math.min(60000, 5000 * (attempt + 1))));
        continue;
      }
      throw new Error(`TTS HTTP ${res.status}: ${lastErr.slice(0, 400)}`);
    }
    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { data?: string } }> } }>;
    };
    const b64 = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!b64) throw new Error(`TTS bad response: ${JSON.stringify(data).slice(0, 400)}`);
    const pcm = Buffer.from(b64, "base64");
    writeFileSync(outPath, pcmToWav(pcm));
    return;
  }
  throw new Error(`TTS exhausted retries: ${lastErr}`);
}

function durationSec(ffprobe: string, wavPath: string): number {
  const r = spawnSync(
    ffprobe,
    ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", wavPath],
    { encoding: "utf8" },
  );
  if (r.status !== 0) throw new Error(`ffprobe failed for ${wavPath}: ${r.stderr}`);
  return Number(r.stdout.trim());
}

export interface TtsSegmentInput {
  idx: number;
  voice: string;
  text: string;
  focus?: string;
}

export interface TtsTimingSegment {
  idx: number;
  voice: string;
  text: string;
  startSec: number;
  durationSec: number;
}

export interface TtsSynthesisResult {
  locale: VideoLocale;
  model: string;
  apiCalls: number;
  segments: TtsTimingSegment[];
  masterPath: string;
  elapsedMs: number;
}

export async function synthesizeFixtureSegments(input: {
  locale: VideoLocale;
  segments: TtsSegmentInput[];
  cacheAudioDir: string;
  masterPath: string;
}): Promise<TtsSynthesisResult> {
  const started = Date.now();
  const ffmpeg = resolveFfmpegBin();
  const ffprobe = resolveFfprobeBin();
  const version = loadPipelineVersion();
  mkdirSync(input.cacheAudioDir, { recursive: true });

  const timings: TtsTimingSegment[] = [];
  const wavPaths: string[] = [];
  let cursor = 0;

  for (const seg of input.segments) {
    const wavPath = path.join(input.cacheAudioDir, `s${seg.idx}_${seg.voice.toLowerCase()}.wav`);
    const durSec = Math.max(2, Math.min(8, Math.ceil(seg.text.length / 40)));
    spawnSync(
      ffmpeg,
      ["-y", "-f", "lavfi", "-i", `sine=frequency=440:duration=${durSec}`, wavPath],
      { stdio: "pipe" },
    );
    timings.push({ idx: seg.idx, voice: seg.voice, text: seg.text, startSec: cursor, durationSec: durSec });
    wavPaths.push(wavPath);
    cursor += durSec + GAP_MS / 1000;
  }

  const silence = path.join(input.cacheAudioDir, "silence.wav");
  spawnSync(
    ffmpeg,
    ["-y", "-f", "lavfi", "-i", `anullsrc=r=${SAMPLE_RATE}:cl=mono`, "-t", String(GAP_MS / 1000), silence],
    { stdio: "pipe" },
  );
  const concat = path.join(input.cacheAudioDir, "concat.txt");
  const lines: string[] = [];
  for (let i = 0; i < wavPaths.length; i++) {
    lines.push(`file '${wavPaths[i]!.replace(/\\/g, "/")}'`);
    if (i < wavPaths.length - 1) lines.push(`file '${silence.replace(/\\/g, "/")}'`);
  }
  writeFileSync(concat, lines.join("\n"), "utf8");
  mkdirSync(path.dirname(input.masterPath), { recursive: true });
  spawnSync(
    ffmpeg,
    ["-y", "-f", "concat", "-safe", "0", "-i", concat, "-b:a", "192k", input.masterPath],
    { stdio: "pipe" },
  );

  return {
    locale: input.locale,
    model: "fixture-lavfi",
    apiCalls: 0,
    segments: timings,
    masterPath: input.masterPath,
    elapsedMs: Date.now() - started,
  };
}

export async function synthesizeLocaleSegments(input: {
  locale: VideoLocale;
  segments: TtsSegmentInput[];
  cacheAudioDir: string;
  masterPath: string;
}): Promise<TtsSynthesisResult> {
  const started = Date.now();
  const profile = voiceProfileForLocale(input.locale);
  const allowed = new Set([profile.primaryVoice, profile.secondaryVoice]);
  const apiKeys = collectApiKeys();
  const ffmpeg = resolveFfmpegBin();
  const ffprobe = resolveFfprobeBin();
  const version = loadPipelineVersion();

  mkdirSync(input.cacheAudioDir, { recursive: true });
  let apiCalls = 0;

  const wavPaths: string[] = [];
  const timings: TtsTimingSegment[] = [];
  let cursor = 0;

  for (const seg of input.segments) {
    if (!allowed.has(seg.voice)) {
      throw new Error(`Voice ${seg.voice} forbidden for locale ${input.locale}`);
    }
    const wavPath = path.join(input.cacheAudioDir, `s${seg.idx}_${seg.voice.toLowerCase()}.wav`);
    const cached = existsSync(wavPath) && readFileSync(wavPath).length > 1000;
    if (!cached) {
      await ttsSegment(seg.text, seg.voice, profile.ttsRulesKey, seg.focus ?? "", wavPath, apiKeys);
      apiCalls++;
    }
    const dur = durationSec(ffprobe, wavPath);
    timings.push({
      idx: seg.idx,
      voice: seg.voice,
      text: seg.text,
      startSec: cursor,
      durationSec: dur,
    });
    wavPaths.push(wavPath);
    cursor += dur + GAP_MS / 1000;
  }

  const silence = path.join(input.cacheAudioDir, "silence.wav");
  spawnSync(
    ffmpeg,
    ["-y", "-f", "lavfi", "-i", `anullsrc=r=${SAMPLE_RATE}:cl=mono`, "-t", String(GAP_MS / 1000), silence],
    { stdio: "pipe" },
  );

  const concat = path.join(input.cacheAudioDir, "concat.txt");
  const lines: string[] = [];
  for (let i = 0; i < wavPaths.length; i++) {
    lines.push(`file '${wavPaths[i]!.replace(/\\/g, "/")}'`);
    if (i < wavPaths.length - 1) lines.push(`file '${silence.replace(/\\/g, "/")}'`);
  }
  writeFileSync(concat, lines.join("\n"), "utf8");

  mkdirSync(path.dirname(input.masterPath), { recursive: true });
  const mux = spawnSync(
    ffmpeg,
    ["-y", "-f", "concat", "-safe", "0", "-i", concat, "-b:a", "192k", input.masterPath],
    { encoding: "utf8" },
  );
  if (mux.status !== 0) throw new Error(`ffmpeg concat failed: ${mux.stderr}`);

  return {
    locale: input.locale,
    model: version.ttsModel,
    apiCalls,
    segments: timings,
    masterPath: input.masterPath,
    elapsedMs: Date.now() - started,
  };
}

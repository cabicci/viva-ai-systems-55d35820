"""Locale-aware Gemini TTS for the video production pipeline.

Each locale uses isolated pronunciation rules and voice allowlists.
Cache paths are caller-provided and must include locale-scoped keys.
"""
from __future__ import annotations

import base64
import json
import os
import struct
import subprocess
import sys
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from threading import Lock

MODEL = os.environ.get("TTS_MODEL", "gemini-2.5-flash-preview-tts")
SAMPLE_RATE = 24000
GAP_MS = 500
_REQUEST_LOCK = Lock()
_NEXT_REQUEST_AT = 0.0

LOCALE_RULES = {
    "MSA_FORMAL": """اقرأ النص التالي بالعربية الفصحى الحديثة (Modern Standard Arabic) بأسلوب رسمي واضح للمتعلم.
النبرة: تعليمية، هادئة، دقيقة. سرعة متوسطة.
الكلمات الإنجليزية التقنية (AI, RAG, API, LLM, ChatGPT, Claude, Gemini) تُنطق بالإنجليزية بوضوح.
لا تستخدم لهجة مصرية أو خليجية.

النص:
""",
    "GULF": """اقرأ النص التالي باللهجة الخليجية (Gulf Arabic) بأسلوب واضح وودود للمتعلم.
النبرة: طبيعية خليجية، تعليمية، سرعة متوسطة.
الكلمات الإنجليزية التقنية (AI, RAG, API, LLM, ChatGPT, Claude, Gemini) تُنطق بالإنجليزية بوضوح.
لا تستخدم فصحى رسمية جافة ولا لهجة مصرية.

النtext:
""".replace("النtext:", "النص:"),
    "EN_NARRATOR": """Read the following text in clear, warm English suitable for an online learner.
Tone: friendly instructor, medium pace, natural pauses at punctuation.
Keep technical terms (AI, RAG, API, LLM, ChatGPT, Claude, Gemini) in standard English pronunciation.
Do not translate technical terms into other languages.

Text:
""",
}

LOCALE_VOICES = {
    "ar-MSA": {"primary": "Kore", "secondary": "Aoede", "rules": "MSA_FORMAL"},
    "ar-Gulf": {"primary": "Puck", "secondary": "Aoede", "rules": "GULF"},
    "en": {"primary": "Charon", "secondary": "Aoede", "rules": "EN_NARRATOR"},
}


def _collect_api_keys() -> list[str]:
    candidates = [os.environ.get("GEMINI_API_KEY")]
    for i in range(1, 10):
        candidates.append(os.environ.get(f"GEMINI_API_KEY_{i}"))
        candidates.append(os.environ.get(f"GEMINI_API_KEY{i}"))
    keys: list[str] = []
    seen: set[str] = set()
    for k in candidates:
        if k and k not in seen:
            keys.append(k)
            seen.add(k)
    if not keys:
        raise RuntimeError("No GEMINI_API_KEY* env vars set")
    return keys


def _pcm_to_wav(pcm: bytes, sr: int = SAMPLE_RATE) -> bytes:
    nc, bps = 1, 16
    br = sr * nc * bps // 8
    ba = nc * bps // 8
    ds = len(pcm)
    h = b"RIFF" + struct.pack("<I", 36 + ds) + b"WAVE"
    h += b"fmt " + struct.pack("<IHHIIHH", 16, 1, nc, sr, br, ba, bps)
    h += b"data" + struct.pack("<I", ds)
    return h + pcm


def _throttle() -> None:
    gap = float(os.environ.get("TTS_REQUEST_GAP_SECONDS", "8"))
    if gap <= 0:
        return
    global _NEXT_REQUEST_AT
    with _REQUEST_LOCK:
        now = time.time()
        if now < _NEXT_REQUEST_AT:
            time.sleep(_NEXT_REQUEST_AT - now)
        _NEXT_REQUEST_AT = time.time() + gap


def _tts(text: str, voice: str, rules_key: str, focus: str, out_path: str, api_keys: list[str]) -> None:
    allowed = {"Kore", "Puck", "Charon", "Aoede"}
    if voice not in allowed:
        raise ValueError(f"Voice {voice} not in locale allowlist")
    rules = LOCALE_RULES[rules_key]
    prompt = rules + text
    if focus:
        prompt += f"\n\nPronunciation notes: {focus}"

    last_err = None
    d = None
    for attempt in range(max(18, len(api_keys) * 6)):
        body = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "responseModalities": ["AUDIO"],
                "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": voice}}},
            },
        }
        key = api_keys[attempt % len(api_keys)]
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={key}"
        req = urllib.request.Request(
            url,
            data=json.dumps(body).encode(),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            _throttle()
            with urllib.request.urlopen(req, timeout=180) as r:
                d = json.loads(r.read())
            break
        except urllib.error.HTTPError as e:
            last_err = e.read().decode(errors="replace")[:400]
            if e.code in (429, 500, 503):
                time.sleep(min(60, 5 * (attempt + 1)))
                continue
            raise RuntimeError(f"TTS HTTP {e.code}: {last_err}")
    if d is None:
        raise RuntimeError(f"TTS exhausted retries: {last_err}")

    b64 = d["candidates"][0]["content"]["parts"][0]["inlineData"]["data"]
    pcm = base64.b64decode(b64)
    with open(out_path, "wb") as f:
        f.write(_pcm_to_wav(pcm))


def _duration_s(ffprobe: str, wav_path: str) -> float:
    out = subprocess.run(
        [ffprobe, "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", wav_path],
        check=True, capture_output=True, text=True,
    ).stdout.strip()
    return float(out)


def synthesize_locale_segments(
    locale: str,
    segments: list[dict],
    out_dir: str,
    master_path: str,
    ffprobe: str,
    ffmpeg: str,
) -> list[dict]:
    """Generate TTS for locale-scoped segments.

    segments: [{idx, voice, text, focus}]
    Returns: [{idx, voice, text, startSec, durationSec}]
    """
    if locale not in LOCALE_VOICES:
        raise ValueError(f"Unknown locale {locale}")
    cfg = LOCALE_VOICES[locale]
    rules_key = cfg["rules"]
    allowed = {cfg["primary"], cfg["secondary"]}

    api_keys = _collect_api_keys()
    os.makedirs(out_dir, exist_ok=True)

    plan = []
    for seg in segments:
        voice = seg["voice"]
        if voice not in allowed:
            raise ValueError(f"Voice {voice} forbidden for locale {locale}")
        idx = seg["idx"]
        p = os.path.join(out_dir, f"s{idx}_{voice.lower()}.wav")
        cached = os.path.exists(p) and os.path.getsize(p) > 1000
        plan.append((idx, voice, seg["text"], seg.get("focus", ""), p, cached))

    to_gen = [(a, b, c, d, e) for (a, b, c, d, e, cached) in plan if not cached]
    if to_gen:
        with ThreadPoolExecutor(max_workers=1) as ex:
            futs = {
                ex.submit(_tts, text, voice, rules_key, focus, p, api_keys): (idx, voice)
                for (idx, voice, text, focus, p) in to_gen
            }
            for fut in as_completed(futs):
                fut.result()

    timings: list[dict] = []
    parts: list[str] = []
    cursor = 0.0
    for (idx, voice, text, _focus, p, _cached) in plan:
        dur = _duration_s(ffprobe, p)
        timings.append({
            "idx": idx,
            "voice": voice,
            "text": text,
            "startSec": cursor,
            "durationSec": dur,
        })
        parts.append(p)
        cursor += dur + (GAP_MS / 1000.0)

    silence = os.path.join(out_dir, "silence.wav")
    subprocess.run(
        [ffmpeg, "-y", "-f", "lavfi", "-i", f"anullsrc=r={SAMPLE_RATE}:cl=mono",
         "-t", str(GAP_MS / 1000.0), silence],
        check=True, capture_output=True,
    )
    concat = os.path.join(out_dir, "concat.txt")
    with open(concat, "w", encoding="utf8") as f:
        for i, p in enumerate(parts):
            f.write(f"file '{p.replace(chr(92), '/')}'\n")
            if i < len(parts) - 1:
                f.write(f"file '{silence.replace(chr(92), '/')}'\n")

    subprocess.run(
        [ffmpeg, "-y", "-f", "concat", "-safe", "0", "-i", concat, "-b:a", "192k", master_path],
        check=True, capture_output=True,
    )
    return timings


def main() -> int:
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("--locale", required=True)
    ap.add_argument("--segments-json", required=True)
    ap.add_argument("--out-dir", required=True)
    ap.add_argument("--master", required=True)
    ap.add_argument("--ffmpeg", required=True)
    ap.add_argument("--ffprobe", required=True)
    ap.add_argument("--timings-out", required=True)
    args = ap.parse_args()

    segments = json.load(open(args.segments_json, encoding="utf8"))
    timings = synthesize_locale_segments(
        args.locale, segments, args.out_dir, args.master,
        args.ffprobe, args.ffmpeg,
    )
    json.dump({"locale": args.locale, "model": MODEL, "segments": timings},
              open(args.timings_out, "w", encoding="utf8"), ensure_ascii=False, indent=2)
    print(json.dumps({"ok": True, "segments": len(timings), "master": args.master}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

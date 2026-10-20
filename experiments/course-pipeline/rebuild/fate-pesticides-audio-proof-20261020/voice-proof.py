"""One bounded, two-call Gemini listening proof. Run in the authorized Actions job only."""
from __future__ import annotations

import array
import base64
import datetime as dt
import hashlib
import io
import json
import math
import os
from pathlib import Path
import sys
import urllib.error
import urllib.request
import wave

ROOT = Path(__file__).resolve().parent
REQUEST = ROOT / "request.json"
OUT = ROOT / "output"
STATE = OUT / "attempts.json"
MODEL = "gemini-2.5-flash-preview-tts"
VOICES = {"A": "Charon", "B": "Kore"}


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def stamp() -> str:
    return dt.datetime.now(dt.timezone.utc).isoformat()


def save_state(value: dict) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    tmp = STATE.with_suffix(".tmp")
    tmp.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    tmp.replace(STATE)


def call(url: str, key: str, payload: dict | None = None) -> dict:
    data = None if payload is None else json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"x-goog-api-key": key, "Content-Type": "application/json"})
    # One transport attempt only. An ambiguous outcome must be reviewed, not retried.
    try:
        with urllib.request.urlopen(req, timeout=180) as response:
            return json.load(response)
    except urllib.error.HTTPError as exc:
        raise RuntimeError(f"Provider HTTP {exc.code}") from None
    except Exception as exc:
        raise RuntimeError(f"Provider transport/result error: {type(exc).__name__}") from None


def wav_bytes(original: bytes, mime: str) -> bytes:
    if original.startswith(b"RIFF") and original[8:12] == b"WAVE":
        return original
    if not mime.lower().startswith("audio/l16") or "rate=24000" not in mime.lower():
        raise ValueError("Unsupported provider audio format")
    if len(original) % 2:
        raise ValueError("Truncated raw PCM")
    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as audio:
        audio.setparams((1, 2, 24000, 0, "NONE", "not compressed"))
        audio.writeframes(original)
    return buffer.getvalue()


def inspect_audio(data: bytes) -> dict:
    with wave.open(io.BytesIO(data), "rb") as audio:
        channels = audio.getnchannels()
        width = audio.getsampwidth()
        rate = audio.getframerate()
        frames = audio.getnframes()
        samples = array.array("h", audio.readframes(frames))
    if (channels, width, rate) != (1, 2, 24000) or frames < 24000:
        raise ValueError("Unexpected WAV parameters or empty clip")
    if sys.byteorder != "little":
        samples.byteswap()
    peak = max(abs(x) for x in samples)
    rms = math.sqrt(sum(x * x for x in samples) / len(samples))
    clipped = sum(abs(x) >= 32767 for x in samples) / len(samples)
    return {"durationSeconds": frames / rate, "sampleRate": rate, "channels": channels,
            "sampleWidthBytes": width, "peak": peak,
            "rmsDBFS": round(20 * math.log10(max(rms, 1) / 32768), 2),
            "clippedSampleFraction": clipped}


def main() -> None:
    raw_request = REQUEST.read_bytes()
    request = json.loads(raw_request)
    if os.environ.get("EXPECTED_REQUEST_SHA256") != sha(raw_request):
        raise ValueError("Request hash mismatch")
    if request["model"] != MODEL or request["voiceA"] != VOICES["A"] or request["voiceB"] != VOICES["B"]:
        raise ValueError("Unapproved model or voice change")
    segments = request["segments"]
    if len(segments) != 2 or [s["speaker"] for s in segments] != ["A", "B"]:
        raise ValueError("This job requires exactly two separate voices")
    if sum(len(s["spokenText"].split()) for s in segments) not in range(40, 61):
        raise ValueError("Listening proof must total 40 to 60 words")
    if request["maxGenerationCalls"] != 2 or request["automaticRetries"] != 0:
        raise ValueError("Generation budget changed")
    if STATE.exists():
        raise ValueError("Existing attempt state: no automatic rerun")
    state = {"requestSHA256": sha(raw_request), "model": MODEL, "voices": VOICES,
             "createdUTC": stamp(), "modelAvailability": "unchecked", "attempts": [],
             "ownerListeningApproved": False, "fullLessonGenerated": False}
    save_state(state)
    key = os.environ.get("GEMINI_API_KEY", "")
    if not key:
        raise ValueError("Authorized Actions Gemini secret unavailable")
    base = "https://generativelanguage.googleapis.com/v1beta/models/" + MODEL
    model = call(base, key)
    if "generateContent" not in model.get("supportedGenerationMethods", []):
        raise ValueError("Approved model unavailable on this server connection")
    state["modelAvailability"] = "generateContent supported on configured connection"
    save_state(state)
    for segment in segments:
        speaker = segment["speaker"]
        if segment["voice"] != VOICES[speaker]:
            raise ValueError("Voice mismatch")
        attempt = {"speaker": speaker, "voice": VOICES[speaker], "model": MODEL,
                   "textSHA256": sha(segment["spokenText"].encode()),
                   "deliverySHA256": sha(request["deliveryInstruction"].encode()),
                   "startedUTC": stamp(), "status": "REQUEST_STARTED_OUTCOME_UNKNOWN"}
        state["attempts"].append(attempt)
        save_state(state)  # Durable attempt record before the provider request.
        try:
            payload = {"contents": [{"parts": [{"text": request["deliveryInstruction"] + "\n\n" + segment["spokenText"]}]}],
                       "generationConfig": {"responseModalities": ["AUDIO"],
                                            "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": VOICES[speaker]}}}}}
            response = call(base + ":generateContent", key, payload)
            parts = ((response.get("candidates") or [{}])[0].get("content") or {}).get("parts") or []
            inline = next((p["inlineData"] for p in parts if "inlineData" in p), None)
            if inline is None:
                raise ValueError("No audio returned")
            original = base64.b64decode(inline["data"], validate=True)
            mime = inline.get("mimeType", "")
            wav = wav_bytes(original, mime)
            signal = inspect_audio(wav)
            original_path = OUT / f"voice-{speaker}.provider.bin"
            wav_path = OUT / f"voice-{speaker}.wav"
            original_path.write_bytes(original)
            wav_path.write_bytes(wav)
            attempt.update(status="GENERATED_AWAITING_OWNER_LISTENING", finishedUTC=stamp(),
                           providerMimeType=mime, originalSHA256=sha(original), wavSHA256=sha(wav),
                           originalFile=original_path.name, wavFile=wav_path.name, **signal)
            save_state(state)
        except Exception as exc:
            attempt.update(status="FAILED_OR_AMBIGUOUS_NO_AUTOMATIC_RETRY", finishedUTC=stamp(),
                           errorType=type(exc).__name__, errorSummary=str(exc)[:120])
            save_state(state)
            raise
    state["status"] = "TWO_CLIPS_AWAITING_OWNER_LISTENING"
    save_state(state)
    print("Two bounded audio clips created; owner listening required.")


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Bounded proof stopped: {type(error).__name__}: {str(error)[:120]}", file=sys.stderr)
        raise SystemExit(1)

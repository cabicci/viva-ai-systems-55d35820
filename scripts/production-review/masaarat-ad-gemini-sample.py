"""Bounded Masaarat ad audition, adapted from the existing Egyptian review worker.

Run only on GitHub Actions. Keys stay in GitHub Secrets. No retries/publication.
Source worker: b3c5e43bf454be3d85f57e064b51c5f51867c6ef,
scripts/production-review/egyptian-voice-sample.py.
"""
import argparse
import base64
import hashlib
import io
import json
import os
from pathlib import Path
import urllib.error
import urllib.request
import wave

MODEL = "gemini-3.8-flash-tts"
TEXT = "مقابلة شغل في المحاسبة قَرّبت؟ استعدّ مع مسارات. كورسات تعليمية وتفاعلية للخريجين والمحاسبين، تساعدك تجهّز للمقابلات. ادخل على مسارات، وسجّل دلوقتي."
STYLE = "Native Cairo Egyptian Arabic (ar-EG). Warm, confident and encouraging advertising voice speaking naturally to accounting graduates and working accountants. Moderate pace, connected speech and clear natural pauses. Egyptian G in geem and everyday Cairene pronunciation, without exaggeration. Pronounce the platform name Masaarat as ma-SAA-raat. Speak the supplied transcript exactly, with no added words. No formal Arabic or newsreader style. No music."
OUT = Path("masaarat-ad-output")
OUT.mkdir(exist_ok=True)

def save(name, data):
    (OUT / name).write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--voice", choices=["Charon", "Kore"])
    parser.add_argument("--probe", action="store_true")
    args = parser.parse_args()
    key = next((os.getenv(n) for n in ("GEMINI_API_KEY", "GEMINI_API_KEY_2", "GEMINI_API_KEY_3", "GEMINI_API_KEY_4") if os.getenv(n)), None)
    if not key:
        raise SystemExit("No configured Gemini key; no request sent.")
    if args.probe:
        req = urllib.request.Request(f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}", headers={"x-goog-api-key": key})
        try:
            with urllib.request.urlopen(req, timeout=45) as response:
                model_info = json.load(response)
        except urllib.error.HTTPError as exc:
            save("model-availability.json", {"model": MODEL, "httpStatus": exc.code, "error": exc.read().decode("utf-8", "replace").replace(key, "[REDACTED]"), "generationCalls": 0})
            raise SystemExit(f"Model availability check failed: HTTP {exc.code}. No fallback or generation.")
        save("model-availability.json", model_info)
        print(f"Configured service confirms {MODEL}.")
        return
    if not args.voice:
        parser.error("--voice or --probe is required")
    voice = args.voice
    payload = {"model": MODEL, "input": [{"type": "user_input", "content": [{"type": "text", "text": TEXT, "annotations": [{"type": "speech_metadata", "style": STYLE}]}]}], "response_format": {"type": "audio"}, "generation_config": {"speech_config": [{"voice": voice}]}}
    request_hash = hashlib.sha256(json.dumps(payload, ensure_ascii=False, sort_keys=True).encode()).hexdigest()
    if (OUT / f"attempt-{voice}.json").exists():
        raise SystemExit("An attempt record already exists. No duplicate request.")
    save(f"request-{voice}.json", payload)
    save(f"attempt-{voice}.json", {"status": "started", "model": MODEL, "voice": voice, "requestSha256": request_hash, "generationCallBudget": 1, "retryBudget": 0, "publication": False})
    req = urllib.request.Request("https://generativelanguage.googleapis.com/v1beta/interactions", data=json.dumps(payload, ensure_ascii=False).encode(), headers={"Content-Type": "application/json", "x-goog-api-key": key}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=180) as response:
            result = json.load(response)
    except urllib.error.HTTPError as exc:
        save(f"failure-{voice}.json", {"model": MODEL, "httpStatus": exc.code, "error": exc.read().decode("utf-8", "replace").replace(key, "[REDACTED]"), "requestCount": 1, "retryBudget": 0})
        raise SystemExit(f"Generation rejected: HTTP {exc.code}. No retry.")
    except Exception as exc:
        save(f"failure-{voice}.json", {"model": MODEL, "errorType": type(exc).__name__, "outcome": "uncertain; do not retry", "requestCount": 1})
        raise SystemExit("Generation outcome uncertain. No retry.")
    audio = [content for step in result.get("steps", []) if step.get("type") == "model_output" for content in step.get("content", []) if content.get("type") == "audio" and content.get("data")]
    if not audio:
        save(f"response-{voice}.json", result)
        raise SystemExit("Response contains no audio. No retry.")
    raw = base64.b64decode(audio[-1]["data"], validate=True)
    original = raw
    if not raw.startswith(b"RIFF"):
        mime = audio[-1].get("mime_type", "")
        if not any(value in mime for value in ("pcm", "l16")):
            raise SystemExit("Unexpected audio type. No conversion or retry.")
        (OUT / f"original-{voice}.pcm").write_bytes(raw)
        buffer = io.BytesIO()
        with wave.open(buffer, "wb") as wav:
            wav.setnchannels(1)
            wav.setsampwidth(2)
            wav.setframerate(24000)
            wav.writeframes(raw)
        raw = buffer.getvalue()
    file = OUT / f"Masaarat-accounting-ad-{voice}.wav"
    file.write_bytes(raw)
    with wave.open(str(file), "rb") as wav:
        duration = wav.getnframes() / wav.getframerate()
        pcm = wav.readframes(wav.getnframes())
        format_info = {"channels": wav.getnchannels(), "sampleRate": wav.getframerate(), "sampleWidthBytes": wav.getsampwidth()}
    if not 3 < duration < 90:
        raise SystemExit("Unexpected duration; preserve recording for inspection, no retry.")
    for step in result.get("steps", []):
        for content in step.get("content", []):
            if content.get("type") == "audio":
                content.pop("data", None)
    save(f"response-metadata-{voice}.json", result)
    receipt = {"model": MODEL, "voice": voice, "locale": "ar-EG", "spokenText": TEXT, "speechStyle": STYLE, "requestSha256": request_hash, "audioSha256": hashlib.sha256(raw).hexdigest(), "originalProviderBytesSha256": hashlib.sha256(original).hexdigest(), "pcmSha256": hashlib.sha256(pcm).hexdigest(), "durationSeconds": duration, "format": format_info, "generationRequests": 1, "interactionId": result.get("id"), "usage": result.get("usage"), "ownerListeningApproval": "pending", "publication": False}
    save(f"receipt-{voice}.json", receipt)
    print(json.dumps({k: receipt[k] for k in ("model", "voice", "durationSeconds", "audioSha256", "generationRequests", "publication")}))

if __name__ == "__main__":
    main()

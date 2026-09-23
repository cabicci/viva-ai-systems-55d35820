"""Generate approved local pilot narration; never send learner input."""
import argparse, base64, hashlib, json, math, os, time, urllib.request, urllib.error, wave
from pathlib import Path
BASE = Path(__file__).resolve().parents[1]
LOCALES = ("ar-EG", "ar-MSA", "ar-Gulf", "en")
DIRECTIONS = {
"ar-EG": "اقرأ باللهجة المصرية القاهرية الطبيعية، بنبرة ودودة واضحة لعمر عشر إلى اثنتي عشرة سنة. لا تضف أي كلام.",
"ar-MSA": "اقرأ بالعربية الفصحى الحديثة، بنبرة ودودة واضحة لعمر عشر إلى اثنتي عشرة سنة، دون لهجة عامية. لا تضف أي كلام.",
"ar-Gulf": "اقرأ باللهجة الخليجية المحايدة الطبيعية، بنبرة ودودة واضحة لعمر عشر إلى اثنتي عشرة سنة، دون نطق مصري. لا تضف أي كلام.",
"en": "Read in clear warm English for ages ten to twelve. Use a measured teaching pace. Read only the supplied narration."
}
def run(locale):
    key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not key:
        raise SystemExit("BLOCKED: Gemini TTS credential unavailable. No narration generated.")
    lesson = json.loads((BASE / "content" / (locale + ".json")).read_text(encoding="utf-8-sig"))
    out = BASE / "public" / "generated" / "audio" / locale
    out.mkdir(parents=True, exist_ok=True)
    timings = []
    model = "gemini-2.5-flash-preview-tts"
    for index, scene in enumerate(lesson["scenes"]):
        digest = hashlib.sha256((model + DIRECTIONS[locale] + scene["narration"]).encode()).hexdigest()
        audio = out / (str(index).zfill(2) + ".wav")
        receipt = audio.with_suffix(".json")
        cached = audio.exists() and receipt.exists() and json.loads(receipt.read_text())["sourceSha256"] == digest
        if not cached:
            body = {"contents":[{"parts":[{"text":DIRECTIONS[locale] + "\n\n" + scene["narration"]}]}],
                    "generationConfig":{"responseModalities":["AUDIO"],"speechConfig":{"voiceConfig":{"prebuiltVoiceConfig":{"voiceName":"Charon"}}}}}
            request = urllib.request.Request("https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent",
                        data=json.dumps(body).encode(), headers={"Content-Type":"application/json","x-goog-api-key":key})
            try:
                with urllib.request.urlopen(request, timeout=120) as response:
                    data = json.load(response)
            except urllib.error.HTTPError as error:
                raise SystemExit("TTS stopped: HTTP " + str(error.code) + ". No credential or response body logged.")
            except urllib.error.URLError:
                raise SystemExit("TTS stopped: network error.")
            candidate = (data.get("candidates") or [{}])[0]
            if candidate.get("finishReason") not in (None, "STOP"):
                raise SystemExit("TTS stopped: provider did not approve this segment. Review required; no automatic rewriting.")
            parts = candidate.get("content", {}).get("parts", [])
            inline = next((p["inlineData"] for p in parts if "inlineData" in p), None)
            if not inline or "audio" not in inline.get("mimeType",""):
                raise SystemExit("TTS stopped: no audio returned.")
            if not inline.get("mimeType", "").startswith("audio/L16") or "rate=24000" not in inline.get("mimeType", ""):
                raise SystemExit("TTS stopped: unexpected audio encoding; review before decoding.")
            pcm = base64.b64decode(inline["data"])
            if len(pcm) < 1000:
                raise SystemExit("TTS stopped: empty audio.")
            with wave.open(str(audio), "wb") as wav:
                wav.setnchannels(1); wav.setsampwidth(2); wav.setframerate(24000); wav.writeframes(pcm)
            receipt.write_text(json.dumps({"sourceSha256":digest,"model":model,"voice":"Charon","locale":locale,"scene":scene["id"]}), encoding="utf-8")
        with wave.open(str(audio), "rb") as wav:
            seconds = wav.getnframes() / wav.getframerate()
        timings.append({"frames":math.ceil((seconds + 0.5)*24),"audio":"generated/audio/" + locale + "/" + audio.name,"textSha256":hashlib.sha256(scene["narration"].encode()).hexdigest()})
        if not cached:
            time.sleep(8)
        print(locale + " scene " + str(index+1) + "/12 audio ready", flush=True)
    (out / "timings.json").write_text(json.dumps(timings), encoding="utf-8")
if __name__ == "__main__":
    parser = argparse.ArgumentParser(); parser.add_argument("--locale", choices=LOCALES)
    args = parser.parse_args()
    for locale in ([args.locale] if args.locale else LOCALES): run(locale)

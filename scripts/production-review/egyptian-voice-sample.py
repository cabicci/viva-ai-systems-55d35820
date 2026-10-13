"""One authorized review-only Egyptian Arabic TTS sample. No retries or publication."""
import base64, hashlib, json, os, pathlib, urllib.request, urllib.error, wave, io
OUT=pathlib.Path("audio-review-output")
OUT.mkdir(exist_ok=True)
TEXT="بُصّ، عندنا وحدة عرضها ستّمية ملّي، وارتفاعها ستّمية، وعمقها النهائي تلتمية ملّي.\nالجانبين سُمك كل واحد فيهم تمنتاشر ملّي.\nالقاع بيركب بين الجانبين، عشان كده بنطرح سُمكهم من العرض: ستّمية ناقص تمنتاشر ناقص تمنتاشر، يساوي خمسمية أربعة وستّين ملّي.\nوالرف بيتحط في النص، عشان يبقى عندنا فتحتين قد بعض."
MODEL="gemini-3.8-flash-tts"
STYLE="Native Cairo Egyptian Arabic (ar-EG), warm patient workshop instructor explaining cabinet assembly. Natural conversational connected speech and moderate pace, with short pauses at sentence boundaries. Maintain authentic Egyptian pronunciation, including Egyptian numbers and furniture terms. Preserve every word and number. Read only the supplied transcript; no introduction or added words."
key=next((os.getenv(n) for n in ("GEMINI_API_KEY","GEMINI_API_KEY_1","GEMINI_API_KEY_2","GEMINI_API_KEY_3") if os.getenv(n)),None)
if not key: raise SystemExit("No configured Gemini key available; no request sent.")
payload={"model":MODEL,"input":[{"type":"user_input","content":[{"type":"text","text":TEXT,"annotations":[{"type":"speech_metadata","style":STYLE}]}]}],"response_format":{"type":"audio"},"generation_config":{"speech_config":[{"voice":"Charon"}]}}
request=urllib.request.Request("https://generativelanguage.googleapis.com/v1beta/interactions",data=json.dumps(payload).encode(),headers={"Content-Type":"application/json","x-goog-api-key":key},method="POST")
try:
    with urllib.request.urlopen(request,timeout=180) as response: result=json.load(response)
except urllib.error.HTTPError as e:
    body=e.read().decode("utf-8","replace").replace(key,"[REDACTED]")
    (OUT/"failure.json").write_text(json.dumps({"model":MODEL,"requestCount":1,"httpStatus":e.code,"error":body,"publication":False},ensure_ascii=False,indent=2))
    raise SystemExit(f"Gemini request rejected: HTTP {e.code}; no retry.")
except Exception as e:
    (OUT/"failure.json").write_text(json.dumps({"model":MODEL,"requestCount":1,"errorType":type(e).__name__,"outcome":"unknown; no retry","publication":False}))
    raise SystemExit("Gemini request failed or timed out; no retry.")
audio=[c for step in result.get("steps",[]) if step.get("type")=="model_output" for c in step.get("content",[]) if c.get("type")=="audio" and c.get("data")]
if not audio: raise SystemExit("Completed response contained no audio; no retry.")
a=audio[-1]; raw=base64.b64decode(a["data"],validate=True)
if not raw.startswith(b"RIFF"):
    if "pcm" not in a.get("mime_type",""): raise SystemExit("Unexpected non-WAV audio type; no retry.")
    buf=io.BytesIO()
    with wave.open(buf,"wb") as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(24000); w.writeframes(raw)
    raw=buf.getvalue()
path=OUT/"Masaarat_Egyptian_Gemini_Review.wav"
path.write_bytes(raw)
with wave.open(str(path),"rb") as w: duration=w.getnframes()/w.getframerate()
assert 5<duration<180
receipt={"model":MODEL,"voice":"Charon","transcript":TEXT,"speechStyle":STYLE,"transcriptSha256":hashlib.sha256(TEXT.encode()).hexdigest(),"audioSha256":hashlib.sha256(raw).hexdigest(),"durationSeconds":duration,"requestCount":1,"publication":False,"mappingChanges":0,"ownerListeningAcceptance":"pending","interactionId":result.get("id"),"usage":result.get("usage")}
(OUT/"receipt.json").write_text(json.dumps(receipt,ensure_ascii=False,indent=2))
print(json.dumps({k:receipt[k] for k in ("model","voice","durationSeconds","audioSha256","requestCount","publication")}))

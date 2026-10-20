"""One audio-grounded timing analysis of the owner-accepted B recording. No TTS."""
from pathlib import Path
import json,hashlib,base64,os,urllib.request,datetime
ROOT=Path(__file__).parent;OUT=ROOT/"output";OUT.mkdir(exist_ok=True)
audio=ROOT/"input.wav";request=json.loads((ROOT/"request.json").read_text())
assert hashlib.sha256(audio.read_bytes()).hexdigest()==request["audioSHA256"]
assert not (OUT/"attempt.json").exists(),"Do not repeat an ambiguous analysis"
def save(name,data):(OUT/name).write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
def call(url,payload=None):
 req=urllib.request.Request(url,data=None if payload is None else json.dumps(payload).encode(),headers={"x-goog-api-key":os.environ["GEMINI_API_KEY"],"Content-Type":"application/json"})
 with urllib.request.urlopen(req,timeout=180) as response:return json.load(response)
base="https://generativelanguage.googleapis.com/v1beta/models/"+request["model"]
state={"status":"MODEL_LOOKUP","audioSHA256":request["audioSHA256"],"model":request["model"],"generationCalls":0}
save("attempt.json",state)
try:
 model=call(base);save("model-availability.json",model)
 assert "generateContent" in model.get("supportedGenerationMethods",[])
 payload={"contents":[{"parts":[{"text":request["instruction"]},{"inlineData":{"mimeType":"audio/wav","data":base64.b64encode(audio.read_bytes()).decode()}}]}],"generationConfig":{"responseMimeType":"application/json","temperature":0.0}}
 state.update(status="ANALYSIS_STARTED_OUTCOME_UNKNOWN",generationCalls=1,startedUTC=datetime.datetime.now(datetime.timezone.utc).isoformat());save("attempt.json",state)
 response=call(base+":generateContent",payload);save("response.json",response)
 text="".join(p.get("text","") for p in response["candidates"][0]["content"]["parts"])
 result=json.loads(text);save("timing.json",result)
 state.update(status="ANALYZED_ESTIMATES_REQUIRE_REVIEW",returnedModelVersion=response.get("modelVersion"));save("attempt.json",state)
except Exception as exc:
 state.update(status="FAILED_NO_AUTOMATIC_RETRY",errorType=type(exc).__name__);save("attempt.json",state)
 raise SystemExit(type(exc).__name__)

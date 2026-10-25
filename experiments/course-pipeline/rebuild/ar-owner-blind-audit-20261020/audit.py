"""Bounded, blind actual-audio review. No generation or automatic replacement."""
import os,sys,json,hashlib,subprocess,wave,base64,urllib.request,datetime
from pathlib import Path
P=Path(__file__).resolve().parent
def read(p):return json.loads(Path(p).read_text("utf8"))
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def write(p,v):
 p.parent.mkdir(parents=True,exist_ok=True)
 p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+"\n","utf8")
def now():return datetime.datetime.now(datetime.timezone.utc).isoformat()
def pcm(p):
 with wave.open(str(p),"rb") as w:
  assert(w.getnchannels(),w.getsampwidth(),w.getframerate())==(1,2,24000)
  return w.readframes(w.getnframes())
def exact(folder,digest):
 matches=[p for p in folder.rglob("*.wav") if sha(p)==digest]
 assert len(matches)==1,(folder,digest,len(matches))
 return matches[0]
def validate(req):
 assert req["maximumCalls"]==36 and req["retries"]==0
 assert len(req["clips"])==36 and len({c["id"] for c in req["clips"]})==36
 assert req["ttsCalls"]==0 and req["blindReview"] is True
 if os.environ.get("GITHUB_ACTIONS"):
  assert os.environ["GITHUB_RUN_ATTEMPT"]=="1"
  assert sha(P/"request.json")==os.environ["REQUEST_SHA"]
  assert sha(P/"audit.py")==os.environ["SCRIPT_SHA"]
def prepare(req,local=False):
 validate(req)
 out=P/("offline-output" if local else "output")
 inputs=P/("offline-inputs" if local else "inputs")
 inputs.mkdir(exist_ok=True)
 root=P.parents[4] if local else None
 paths={}
 if not local:
  for source in req["sources"]:
   run=json.loads(subprocess.check_output(["gh","run","view",str(source["run"]),"--repo",req["repo"],"--json","headSha,status,conclusion"],text=True))
   assert run["headSha"]==source["commit"] and run["status"]=="completed"
   cache=P/"source-cache"/source["key"]
   assert not cache.exists(),"Refuse ambiguous cached/repeated download"
   subprocess.run(["gh","run","download",str(source["run"]),"--repo",req["repo"],"--name",source["artifact"],"--dir",str(cache)],check=True)
   paths[source["key"]]=cache
   write(out/(source["key"]+"-provenance.json"),run)
 verified=[]
 for c in req["clips"]:
  if local:
   src=root/c["localPath"]
  elif c.get("composite"):
   pre=exact(paths["prefix"],c["composite"]["prefixSHA"])
   tail=exact(paths["tail"],c["composite"]["tailSHA"])
   src=inputs/(c["id"]+".wav")
   with wave.open(str(src),"wb") as w:
    w.setparams((1,2,24000,0,"NONE","not compressed"))
    w.writeframes(pcm(pre)[:177600*2]+pcm(tail))
  else:src=exact(paths[c["sourceKey"]],c["sha256"])
  assert sha(src)==c["sha256"],c["id"]
  data=pcm(src)
  assert len(data)==c["samples"]*2 and len(data)<20000000
  verified.append({"id":c["id"],"path":str(src.resolve()),"sha256":sha(src),"samples":len(data)//2})
 write(out/"input-verification.json",{"atUTC":now(),"inputs":verified,"count":len(verified),"providerCalls":0})
 return out,verified
def audit(req):
 validate(req)
 out=P/"output"
 verified=read(out/"input-verification.json")["inputs"]
 assert [x["id"] for x in verified]==[x["id"] for x in req["clips"]]
 key=next((os.environ.get(k) for k in ["GEMINI_API_KEY","GEMINI_API_KEY_1","GEMINI_API_KEY_2","GEMINI_API_KEY_3"] if os.environ.get(k)),None)
 assert key,"Missing server-side credential; no provider request"
 for item in verified:
  attempt=out/(item["id"]+"-attempt.json")
  assert not attempt.exists(),"Refuse retry or duplicate request"
  audio=Path(item["path"]); assert sha(audio)==item["sha256"]
  prompt="""Review ALL of the attached audio acoustically. No reference transcript is supplied. Target: clear natural educated Egyptian/Cairo speech for agricultural vocational students. Transcribe what you actually hear, including uncertain words. Do not reconstruct what a technical lesson ought to say. Report word-level consonant/vowel/stress/gemination issues, non-Egyptian/formal delivery, awkward prosody, rushed phrases, clipping and uncertain evidence. Technical Arabic is not itself an accent error. Avoid generic praise or automatic pass. Give approximate onset/end and what was heard for every alleged defect. Do not invent defects or confidence scores. Distinguish pronunciation, script naturalness and recording issues. Return JSON with transcript, uncertainWords, findings [{startSeconds,endSeconds,heard,issueType,observation,certainty,proposedEgyptianRealization}], pacingAndVoiceContinuity, overall (needs_review/uncertain/no_defect_detected), limitations. Do not claim human certification. Do not generate audio."""
  write(attempt,{"atUTC":now(),"state":"RESERVED_NO_RETRY","audioSHA256":item["sha256"],"calls":1,"ttsCalls":0})
  write(out/(item["id"]+"-prompt.json"),{"text":prompt,"referenceTranscriptSupplied":False})
  payload={"contents":[{"role":"user","parts":[{"text":prompt},{"inlineData":{"mimeType":"audio/wav","data":base64.b64encode(audio.read_bytes()).decode()}}]}],"generationConfig":{"temperature":0,"maxOutputTokens":10000,"responseMimeType":"application/json"}}
  try:
   call=urllib.request.Request("https://generativelanguage.googleapis.com/v1beta/models/"+req["model"]+":generateContent",data=json.dumps(payload).encode(),headers={"x-goog-api-key":key,"Content-Type":"application/json"},method="POST")
   with urllib.request.urlopen(call,timeout=180) as r:raw=json.loads(r.read())
   write(out/(item["id"]+"-raw.json"),raw)
   text="\n".join(p.get("text","") for x in raw.get("candidates",[]) for p in x.get("content",{}).get("parts",[]) if not p.get("thought"))
   result=json.loads(text)
   write(out/(item["id"]+"-review.json"),result)
   write(attempt,{"atUTC":now(),"state":"MODEL_DIAGNOSTIC_ONLY","audioSHA256":item["sha256"],"calls":1,"ttsCalls":0,"modelVersion":raw.get("modelVersion"),"usage":raw.get("usageMetadata")})
  except Exception as e:
   write(attempt,{"atUTC":now(),"state":"FAILED_OR_UNKNOWN_NO_RETRY","errorType":type(e).__name__,"httpStatus":getattr(e,"code",None),"calls":1,"ttsCalls":0})
 write(out/"completion.json",{"atUTC":now(),"reviewed":len(list(out.glob("*-review.json"))),"planned":36,"humanCertified":False,"newAudio":False})
if __name__=="__main__":
 req=read(P/"request.json")
 if sys.argv[1]=="offline":prepare(req,True)
 elif sys.argv[1]=="prepare":prepare(req)
 elif sys.argv[1]=="audit":audit(req)
 else:raise SystemExit("Expected offline/prepare/audit")

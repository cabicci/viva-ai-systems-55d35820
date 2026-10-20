"""Bounded Gemini image reference job. Preserve original bytes; no speech or render."""
from pathlib import Path
import json, os, hashlib, base64, datetime, urllib.request, urllib.error

ROOT=Path(__file__).resolve().parent
OUT=ROOT/"output"
MODEL="gemini-nano-banana-2.1"
def sha(b): return hashlib.sha256(b).hexdigest()
def now(): return datetime.datetime.now(datetime.timezone.utc).isoformat()
def write(p,v): p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
def call(url,key,payload=None):
    body=None if payload is None else json.dumps(payload,ensure_ascii=False).encode("utf-8")
    req=urllib.request.Request(url,data=body,headers={"x-goog-api-key":key,"Content-Type":"application/json"})
    try:
        with urllib.request.urlopen(req,timeout=240) as r: return json.load(r)
    except urllib.error.HTTPError as e: raise RuntimeError(f"Gemini HTTP {e.code}; no retry or provider fallback") from None
    except Exception as e: raise RuntimeError(f"Gemini transport/result {type(e).__name__}; outcome must be reviewed") from None
def main():
    raw=(ROOT/"request.json").read_bytes(); request=json.loads(raw)
    assert sha(raw)==os.environ["EXPECTED_REQUEST_SHA256"]
    assert request["provider"]=="gemini" and request["model"]==MODEL
    assert len(request["assets"])==2 and request["maxGenerationCalls"]==2 and request["automaticRetries"]==0
    OUT.mkdir(exist_ok=True)
    assert not (OUT/"attempts.json").exists(),"Existing attempt state; no automatic rerun"
    state={"requestSHA256":sha(raw),"model":MODEL,"provider":"gemini","createdUTC":now(),"generationCalls":0,"attempts":[],"ownerAccepted":False}
    write(OUT/"attempts.json",state)
    key=os.environ.get("GEMINI_API_KEY","")
    assert key,"Configured Actions Gemini secret unavailable"
    base=f'https://generativelanguage.googleapis.com/v1beta/models/{MODEL}'
    try:
        model=call(base,key)
        write(OUT/"model-availability.json",{k:model.get(k) for k in ["name","version","displayName","supportedGenerationMethods"]})
        assert "generateContent" in model.get("supportedGenerationMethods",[])
        state["availability"]="verified_on_execution_service"
        for asset in request["assets"]:
            prompt=request["style"]+"\n\nSUBJECT:\n"+asset["subject"]
            body={"contents":[{"role":"user","parts":[{"text":prompt}]}],"generationConfig":{"responseModalities":["TEXT","IMAGE"],"imageConfig":{"aspectRatio":request["aspectRatio"],"imageSize":request["imageSize"]}}}
            write(OUT/(asset["id"]+".request.json"),body)
            attempt={"id":asset["id"],"model":MODEL,"promptSHA256":sha(prompt.encode()),"startedUTC":now(),"status":"started_outcome_unknown"}
            state["attempts"].append(attempt);state["generationCalls"]+=1
            write(OUT/"attempts.json",state)
            response=call(base+":generateContent",key,body)
            parts=((response.get("candidates") or [{}])[0].get("content") or {}).get("parts",[])
            image=next((p["inlineData"] for p in parts if "inlineData" in p and p["inlineData"].get("mimeType","").startswith("image/") and not p.get("thought")),None)
            assert image,"No final image; no substitute generator"
            raw_image=base64.b64decode(image["data"],validate=True)
            mime=image["mimeType"];ext={"image/png":".png","image/jpeg":".jpg","image/webp":".webp"}.get(mime)
            assert ext,"Unexpected image format"
            filename=asset["id"]+ext
            (OUT/filename).write_bytes(raw_image)
            attempt.update({"status":"generated_unreviewed","finishedUTC":now(),"file":filename,"sha256":sha(raw_image),"bytes":len(raw_image),"mime":mime,"responseId":response.get("responseId"),"modelVersion":response.get("modelVersion"),"usageMetadata":response.get("usageMetadata")})
            write(OUT/(asset["id"]+".response-metadata.json"),{"textParts":[p["text"] for p in parts if "text" in p and not p.get("thought")],"responseId":response.get("responseId"),"modelVersion":response.get("modelVersion"),"usageMetadata":response.get("usageMetadata")})
            write(OUT/"attempts.json",state)
            print(asset["id"]+": generated; owner review pending",flush=True)
        state["status"]="two_reference_images_generated"
    except Exception as e:
        state["status"]="blocked_or_failed";state["error"]=str(e)[:300]
        raise
    finally: write(OUT/"attempts.json",state)
if __name__=="__main__": main()

"""Authorized technical-only production. Durable backup precedes each mapping CAS."""
from __future__ import annotations
import argparse,base64,hashlib,json,math,os,re,statistics,subprocess,time,urllib.request,urllib.error,urllib.parse,wave
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
BATCH="technical-motion-v2-20261011"
LIBRARY="670679"
ENDPOINT="https://abyqqeboyrkkwhjpwmtd.supabase.co/functions/v1/technical-video-replacement"
AUDIENCE="masaarat-technical-motion-v2-20261011"
MODEL="gemini-3.8-flash-tts"
STYLE="Native Cairo Egyptian Arabic (ar-EG), warm patient workshop instructor explaining cabinet assembly. Natural conversational connected speech and moderate pace, with short pauses at sentence boundaries. Maintain authentic Egyptian pronunciation, including Egyptian numbers and furniture terms. Preserve every word and number. Read only the supplied transcript; no introduction or added words."
LOCALES=("ar-EG","ar-MSA","ar-Gulf","en")
def digest(path):return hashlib.sha256(Path(path).read_bytes()).hexdigest()
def dump(path,data):Path(path).write_text(json.dumps(data,ensure_ascii=False,indent=2))
def run(args,**kw):return subprocess.run(args,check=True,**kw)
def probe(path):return json.loads(subprocess.check_output(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(path)]))
def duration(path):return float(probe(path)["format"]["duration"])
def baseline():return json.loads((ROOT/"docs/production/technical-v2/baseline.json").read_text())["rows"]
def cell(lesson,locale):
 if locale not in LOCALES or not re.fullmatch(r"M\d{2}-L\d{2}",lesson):raise ValueError("Invalid cell")
 return next(r for r in baseline() if r["lesson_id"]==lesson and r["locale"]==locale)
def bunny(method,path,body=None):
 if os.environ.get("BUNNY_STREAM_LIBRARY_ID")!=LIBRARY:raise RuntimeError("Wrong Bunny library")
 req=urllib.request.Request("https://video.bunnycdn.com/library/"+LIBRARY+"/videos"+path,data=body,method=method,
  headers={"AccessKey":os.environ["BUNNY_STREAM_API_KEY"],"Content-Type":"application/json" if method=="POST" else "application/octet-stream"})
 with urllib.request.urlopen(req,timeout=600) as response:
  data=response.read();return json.loads(data) if data else {}
def playback(guid):
 req=urllib.request.Request(f"https://video.bunnycdn.com/library/{LIBRARY}/videos/{guid}/play",headers={"Referer":"https://masaarat.ai/"})
 with urllib.request.urlopen(req,timeout=30) as r:return json.load(r)
def identity():
 url=os.environ["ACTIONS_ID_TOKEN_REQUEST_URL"]+"&audience="+urllib.parse.quote(AUDIENCE)
 req=urllib.request.Request(url,headers={"Authorization":"Bearer "+os.environ["ACTIONS_ID_TOKEN_REQUEST_TOKEN"]})
 with urllib.request.urlopen(req,timeout=30) as r:return json.load(r)["value"]
def bridge(body):
 req=urllib.request.Request(ENDPOINT,data=json.dumps({"batchId":BATCH,**body}).encode(),method="POST",headers={"Content-Type":"application/json","x-github-oidc":identity()})
 with urllib.request.urlopen(req,timeout=60) as r:return json.load(r)

_small=["صفر","واحد","اتنين","تلاتة","أربعة","خمسة","ستة","سبعة","تمانية","تسعة","عشرة","حداشر","اتناشر","تلتاشر","أربعتاشر","خمستاشر","ستاشر","سبعتاشر","تمنتاشر","تسعتاشر"]
_tens=["","","عشرين","تلاتين","أربعين","خمسين","ستين","سبعين","تمانين","تسعين"]
_hundreds=["","مية","ميتين","تلتمية","أربعمية","خمسمية","ستّمية","سبعمية","تمنمية","تسعمية"]
def egyptian_number(n):
 if n<20:return _small[n]
 if n<100:return (_small[n%10]+" و" if n%10 else "")+_tens[n//10]
 if n<1000:return _hundreds[n//100]+(" و"+egyptian_number(n%100) if n%100 else "")
 if n<1000000:
  k=n//1000;prefix="ألف" if k==1 else "ألفين" if k==2 else egyptian_number(k)+(" آلاف" if k<11 else " ألف")
  return prefix+(" و"+egyptian_number(n%1000) if n%1000 else "")
 return " ".join(_small[int(c)] for c in str(n))
def spoken_egyptian(text):
 text=text.translate(str.maketrans("٠١٢٣٤٥٦٧٨٩","0123456789"))
 text=re.sub(r"[\u2066-\u2069\u200e\u200f]","",text)
 text=re.sub(r"(?<![A-Za-z])\bmm\b|مم", "ملّي",text,flags=re.I)
 text=text.replace("×"," في ").replace("÷"," مقسوم على ").replace("−"," ناقص ").replace("="," يساوي ").replace("%"," في المية ")
 def replace(m):
  n=m.group();whole,_,fraction=n.partition(".")
  return egyptian_number(int(whole))+(" فاصلة "+" ".join(_small[int(c)] for c in fraction) if fraction else "")
 # Keep identifiers such as M04 and A1 unchanged; only numeric quantities speak.
 return re.sub(r"(?<![A-Za-z0-9])\d+(?:\.\d+)?(?![A-Za-z0-9])",replace,text)
def scenes_for(lesson,locale):
 if lesson=="M04-L02":
  data=json.loads((ROOT/"scripts/technical-v2/pilot-script.json").read_text())[locale]
  formulas=["600 × 600 × 300 mm","600 × 294 × 18 mm","600 − (2 × 18) = 564 mm","564 × 294 × 18 mm","(600 − 3 × 18) ÷ 2 = 273 mm","294 + 6 = 300 mm","6 panels · 2 openings · 273 mm"]
  return data[0]["title"],[{**s,"diagram":"cabinet","formula":formulas[i]} for i,s in enumerate(data)]
 p=ROOT/f"scripts/technical-education/source/technical-education/lessons/{lesson}__{locale}.json"
 l=json.loads(p.read_text());assert l["id"]==lesson and l["locale"]==locale
 first=l["sections"][0]["diagram"]
 scenes=[{"title":l["title"],"detail":l["goals"][0],"spoken":l["intro"],"diagram":first}]
 scenes.extend({"title":s["title"],"detail":s["caption"],"spoken":s["text"],"diagram":s["diagram"]} for s in l["sections"])
 scenes.append({"title":l["example"]["title"],"detail":l["example"]["decision"],"spoken":l["example"]["text"]+" "+l["example"]["decision"],"diagram":first})
 return l["title"],scenes
def tts(text,path,key):
 fingerprint=hashlib.sha256((MODEL+STYLE+text).encode()).hexdigest();receipt=path.with_suffix(".json");unknown=path.with_suffix(".unknown")
 if path.exists() and receipt.exists() and json.loads(receipt.read_text()).get("fingerprint")==fingerprint:
  assert digest(path)==json.loads(receipt.read_text())["sha256"];return
 if unknown.exists():raise RuntimeError("Earlier TTS outcome unknown; operator reconciliation required")
 payload={"model":MODEL,"input":[{"type":"user_input","content":[{"type":"text","text":text,"annotations":[{"type":"speech_metadata","style":STYLE}]}]}],"response_format":{"type":"audio"},"generation_config":{"speech_config":[{"voice":"Charon"}]}}
 for attempt in range(3):
  req=urllib.request.Request("https://generativelanguage.googleapis.com/v1beta/interactions",data=json.dumps(payload).encode(),method="POST",headers={"Content-Type":"application/json","x-goog-api-key":key})
  try:
   with urllib.request.urlopen(req,timeout=180) as r:result=json.load(r)
  except urllib.error.HTTPError as e:
   if e.code==429 and attempt<2:time.sleep(35);continue
   if e.code>=500:unknown.write_text("Provider error; paid request outcome unverified")
   raise RuntimeError(f"TTS HTTP {e.code}; no automatic new generation") from None
  except Exception:
   unknown.write_text("Unknown request outcome; do not replay automatically");raise RuntimeError("TTS outcome unknown") from None
  blocks=[c for s in result.get("steps",[]) if s.get("type")=="model_output" for c in s.get("content",[]) if c.get("type")=="audio" and c.get("data")]
  if not blocks:raise RuntimeError("TTS response contained no audio")
  raw=base64.b64decode(blocks[-1]["data"],validate=True)
  if raw[:4]!=b"RIFF":raise RuntimeError("Unexpected audio format")
  path.write_bytes(raw)
  with wave.open(str(path),"rb") as w:
   if w.getnframes()/w.getframerate()<1:raise RuntimeError("Audio too short")
  dump(receipt,{"fingerprint":fingerprint,"sha256":digest(path),"interactionId":result.get("id"),"model":MODEL,"voice":"Charon"})
  time.sleep(5);return

def backup_original(old,work):
 path=work/"previous.mp4"
 meta=bunny("GET","/"+old["video_guid"])
 if meta.get("guid")!=old["video_guid"] or meta.get("status")!=4 or meta.get("collectionId")!="4972720c-4dd7-48e6-b341-34e3b4875b26":raise RuntimeError("Original video identity/collection mismatch")
 if not path.exists():
  play=playback(old["video_guid"])
  if not play.get("isPlayable") or play.get("enableDRM"):raise RuntimeError("Original video unavailable")
  url=play.get("originalUrl") or play.get("videoPlaylistUrl")
  if not url or urllib.parse.urlparse(url).scheme!="https" or not urllib.parse.urlparse(url).hostname.endswith(".b-cdn.net"):raise RuntimeError("Unexpected playback host")
  run(["ffmpeg","-hide_banner","-loglevel","error","-y","-headers","Referer: https://masaarat.ai/\r\n","-i",url,"-map","0:v:0","-map","0:a:0","-c","copy",str(path)])
 info=probe(path)
 if not any(s["codec_type"]=="audio" for s in info["streams"]):raise RuntimeError("Original has no audio")
 dump(work/"previous.json",{"oldGuid":old["video_guid"],"backupSha256":digest(path),"metadata":{k:meta.get(k) for k in ["guid","title","collectionId","length","status"]}})
 return path
def detect_scene_frames(video,count,cabinet=False):
 # Recover the original authored scene boundaries from its stationary heading.
 # No narration guessing, word-weight allocation, or regeneration of other locales.
 import numpy as np
 crop="530:112:1210:326" if cabinet else "680:112:995:330"
 raw=subprocess.check_output(["ffmpeg","-hide_banner","-loglevel","error","-i",str(video),"-vf",f"fps=30,crop={crop},scale=136:24,format=gray","-f","rawvideo","-"])
 a=np.frombuffer(raw,dtype=np.uint8).reshape(-1,24*136).astype(np.int16)
 differences=np.abs(a[1:]-a[:-1]).mean(axis=1)
 for threshold in (1.3,1.0,.7,1.7,2.3,3.0):
  candidates=(np.flatnonzero(differences>threshold)+1).tolist();groups=[]
  for x in candidates:
   if not groups or x-groups[-1][-1]>26:groups.append([x])
   else:groups[-1].append(x)
  starts=[0]+[g[0] for g in groups if g[0]>30]
  if len(starts)==count and all(b-a>60 for a,b in zip(starts,starts[1:])):
   frames=[b-a for a,b in zip(starts,starts[1:]+[len(a)])]
   return frames,{"method":"original-heading-transition","threshold":threshold,"starts":starts}
 raise RuntimeError(f"Original scene boundaries unresolved: expected {count}; do not use estimated alignment")

def build(lesson,locale):
 old=cell(lesson,locale);work=ROOT/f"technical-v2-output/{lesson}__{locale}";work.mkdir(parents=True,exist_ok=True)
 title,scenes=scenes_for(lesson,locale);previous=backup_original(old,work);audio=work/"audio.m4a"
 if locale=="ar-EG":
  cache=ROOT/f"technical-v2-audio/{lesson}";cache.mkdir(parents=True,exist_ok=True)
  keys=[os.getenv(n) for n in ["GEMINI_API_KEY","GEMINI_API_KEY_1","GEMINI_API_KEY_2","GEMINI_API_KEY_3"] if os.getenv(n)]
  if not keys:raise RuntimeError("Gemini key unavailable")
  index=[r["lesson_id"] for r in baseline() if r["locale"]=="ar-EG"].index(lesson);key=keys[index%len(keys)]
  parts=[];frames=[]
  for i,s in enumerate(scenes):
   p=cache/f"segment-{i}.wav";spoken=spoken_egyptian(s["spoken"]);tts(spoken,p,key)
   frame_count=math.ceil(duration(p)*30)+18;frames.append(frame_count)
   padded=work/f"segment-{i}.wav"
   run(["ffmpeg","-hide_banner","-loglevel","error","-y","-i",str(p),"-af","apad","-t",str(frame_count/30),str(padded)])
   parts.append(padded)
  listing=work/"concat.txt";listing.write_text("".join(f"file '{p.resolve()}'\n" for p in parts))
  run(["ffmpeg","-hide_banner","-loglevel","error","-y","-f","concat","-safe","0","-i",str(listing),"-c:a","aac","-b:a","192k",str(audio)])
  timing={"method":"new-TTS-exact-segment-duration","starts":[sum(frames[:i]) for i in range(len(frames))]}
 else:
  frames,timing=detect_scene_frames(previous,len(scenes),lesson=="M04-L02")
  run(["ffmpeg","-hide_banner","-loglevel","error","-y","-i",str(previous),"-map","0:a:0","-c:a","copy",str(audio)])
 props=work/"props.json";dump(props,{"lessonId":lesson,"locale":locale,"title":title,"scenes":scenes,"sceneFrames":frames})
 silent=work/"silent.mp4";video=work/"replacement.mp4"
 run(["bunx","--no-install","remotion","render","src/technical-v2/index.tsx","technical-motion-v2",str(silent.resolve()),"--props",str(props.resolve()),"--codec=h264","--crf=18","--concurrency=2"],cwd=ROOT/"remotion")
 run(["ffmpeg","-hide_banner","-loglevel","error","-y","-i",str(silent),"-i",str(audio),"-map","0:v:0","-map","1:a:0","-c","copy","-t",str(sum(frames)/30),"-movflags","+faststart",str(video)])
 meta=probe(video);v=next(s for s in meta["streams"] if s["codec_type"]=="video")
 assert v["width"]==1920 and v["height"]==1080 and v["r_frame_rate"]=="30/1"
 assert any(s["codec_type"]=="audio" for s in meta["streams"])
 assert abs(float(meta["format"]["duration"])-sum(frames)/30)<.2
 run(["ffmpeg","-hide_banner","-loglevel","error","-i",str(video),"-f","null","-"])
 receipt={"batchId":BATCH,"lessonId":lesson,"locale":locale,"oldGuid":old["video_guid"],"sourceHash":old["source_sha256"],
  "durationSeconds":float(meta["format"]["duration"]),"videoSha256":digest(video),"audioSha256":digest(audio),"backupSha256":digest(previous),
  "newTts":locale=="ar-EG","timing":timing,"status":"rendered","oldVideoRetained":True,"backupRunId":str(os.environ.get("GITHUB_RUN_ID","local"))}
 dump(work/"receipt.json",receipt)
 print(json.dumps({"cell":lesson+"__"+locale,"status":"rendered","duration":receipt["durationSeconds"]}))

def publish(lesson,locale):
 work=ROOT/f"technical-v2-output/{lesson}__{locale}";r=json.loads((work/"receipt.json").read_text());video=work/"replacement.mp4"
 assert digest(video)==r["videoSha256"] and digest(work/"previous.mp4")==r["backupSha256"]
 artifact=os.environ.get("BACKUP_ARTIFACT_ID","")
 if not artifact.isdigit():raise RuntimeError("Durable backup artifact receipt required before publication")
 r["backupArtifactId"]=artifact
 title=f"{BATCH}:{lesson}__{locale}"
 # Locate deterministic provider identity before any create; retries never
 # blindly duplicate a paid render or replace the existing learner mapping.
 results=bunny("GET","?"+urllib.parse.urlencode({"search":title,"itemsPerPage":100}))
 matches=[v for v in results.get("items",[]) if v.get("title")==title]
 if len(matches)>1:raise RuntimeError("Ambiguous Bunny replacement identity")
 if matches:new=matches[0]
 else:
  new=bunny("POST","",json.dumps({"title":title,"collectionId":"4972720c-4dd7-48e6-b341-34e3b4875b26"}).encode())
  r["newGuid"]=new["guid"];r["status"]="created";dump(work/"receipt.json",r)
 if new.get("status")==4 and r.get("newGuid")!=new["guid"]:raise RuntimeError("Existing replacement requires receipt reconciliation")
 r["newGuid"]=new["guid"];dump(work/"receipt.json",r)
 if new.get("status")!=4:
  bunny("PUT","/"+new["guid"],video.read_bytes())
  for attempt in range(30):
   status=bunny("GET","/"+new["guid"])
   if status.get("status")==4:break
   if status.get("status") in (5,6):raise RuntimeError("Bunny encoding failed")
   time.sleep(10)
  else:raise RuntimeError("Bunny encoding pending; old mapping retained")
 r["status"]="ready";dump(work/"receipt.json",r)
 linked=bridge(r)
 if not linked.get("linked"):raise RuntimeError("Mapping not confirmed; old video retained")
 r["status"]="linked";r["mappingReceipt"]=linked;dump(work/"receipt.json",r)
 # Old deletion is intentionally deferred to batch closure, after all 320
 # mappings and durable backup artifacts are verified. No deletion on failure.
 print(json.dumps({"cell":lesson+"__"+locale,"newGuid":r["newGuid"],"status":"linked","oldVideoRetained":True}))

def prepare():
 rows=baseline();assert len(rows)==320 and len({(r["lesson_id"],r["locale"]) for r in rows})==320
 assert len({r["video_guid"] for r in rows})==320
 for r in rows:scenes_for(r["lesson_id"],r["locale"])
 if os.environ.get("GITHUB_OUTPUT"):
  ids=sorted({r["lesson_id"] for r in rows})
  with open(os.environ["GITHUB_OUTPUT"],"a") as f:f.write("matrix="+json.dumps(ids)+"\n")
 print(json.dumps({"lessons":80,"cells":320,"newEgyptianAudio":80,"otherAudioReused":240}))
def cloud_preflight():
 for i in range(10):
  try:
   r=bridge({"operation":"preflight"})
   if r.get("ready") and r.get("cells")==320:return
  except urllib.error.HTTPError as e:
   if e.code not in (403,404,503):raise
  if i<9:time.sleep(30)
 raise RuntimeError("Mapping endpoint not ready; production not launched")
if __name__=="__main__":
 p=argparse.ArgumentParser();p.add_argument("mode",choices=["prepare","cloud-preflight","build","publish","probe-timing"]);p.add_argument("--lesson");p.add_argument("--locale",choices=LOCALES);a=p.parse_args()
 if a.mode=="prepare":prepare()
 elif a.mode=="cloud-preflight":cloud_preflight()
 elif a.mode=="build":build(a.lesson,a.locale)
 elif a.mode=="publish":publish(a.lesson,a.locale)
 else:
  old=cell(a.lesson,a.locale);w=ROOT/f"technical-v2-probes/{a.lesson}__{a.locale}";w.mkdir(parents=True,exist_ok=True)
  original=backup_original(old,w);title,scenes=scenes_for(a.lesson,a.locale)
  frames,evidence=detect_scene_frames(original,len(scenes),a.lesson=="M04-L02")
  dump(w/"timing.json",{"sceneFrames":frames,**evidence});print(json.dumps({"cell":a.lesson+"__"+a.locale,"timing":evidence}))

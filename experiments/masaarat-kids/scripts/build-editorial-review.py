"""Build an offline, read-only editorial review surface from all 48 packages."""
import hashlib,json,subprocess
from pathlib import Path
BASE=Path(__file__).resolve().parents[1]
OUT=BASE/"editorial-review"
LOCALES=("ar-EG","ar-MSA","ar-Gulf","en")
OUT.mkdir(exist_ok=True)
lessons=[]
one={"number":1,"status":"pilot-media-ready","locales":{}}
for locale in LOCALES:
 d=json.loads((BASE/"content"/(locale+".json")).read_text(encoding="utf-8"))
 i=d["pageIllustration"]
 one["locales"][locale]={**d,"reading":[{"id":s["id"],"title":s["title"],"text":s["narration"]} for s in d["scenes"][1:10]],"materials":[{"title":d["labels"]["model"],"text":d["prompt"]["mismatch"]}],"promptExamples":{"initial":d["prompt"]["bad"],"improved":d["prompt"]["combined"],"followup":d["prompt"]["followup"]},"imageBrief":{"title":i["title"],"scenario":i["subtitle"],"composition":i["after"],"labels":i["heads"],"altText":i["footer"]}}
lessons.append(one)
two=json.loads((BASE/"curriculum/lesson-02-editorial.json").read_text(encoding="utf-8"))
lessons.append({"number":2,"status":"editorial-draft","locales":{k:{**v,"imageBrief":v.get("imageBrief",two["imageBrief"])} for k,v in two["locales"].items()}})
for n in range(3,13):
 folder=BASE/"curriculum/level-1"/f"lesson-{n:02}"
 m=json.loads((folder/"manifest.json").read_text())
 package={}
 for locale in LOCALES:
  p=folder/(locale+".json")
  assert hashlib.sha256(p.read_bytes()).hexdigest()==m["locales"][locale]["sha256"],f"Stale manifest {n}/{locale}"
  package[locale]=json.loads(p.read_text(encoding="utf-8"))
 lessons.append({"number":n,"status":m["status"],"locales":package})
assert len(lessons)==12 and all(set(x["locales"])==set(LOCALES) for x in lessons)
payload=json.dumps(lessons,ensure_ascii=False).replace("<","\\u003c").replace("\u2028","\\u2028").replace("\u2029","\\u2029")
(OUT/"content.json").write_bytes((json.dumps(lessons,ensure_ascii=False,indent=2)+"\n").encode())
counts={"lessons":12,"locales":4,"packages":48,"scenes":sum(len(d["scenes"]) for l in lessons for d in l["locales"].values()),"quizItems":sum(len(d["quiz"]) for l in lessons for d in l["locales"].values()),"mediaProducedLessons":1,"newMediaProduced":0}
(OUT/"manifest.json").write_bytes((json.dumps(counts,indent=2)+"\n").encode())
for locale in LOCALES:
 lines=["# Masaarat Kids | Level 1 | "+locale,"","Editorial content; new lesson media and human language review are pending.",""]
 for item in lessons:
  d=item["locales"][locale]
  lines+=["## "+str(item["number"])+". "+d["title"],"",d["subtitle"],"","### Objectives",""]+["- "+x for x in d["objectives"]]
  lines+=["","### Reading",""]
  for x in d.get("reading",[]): lines+=["#### "+x["title"],"",x["text"],""]
  lines+=["### Narration and scenes",""]
  for s in d["scenes"]: lines+=["#### "+s["title"],"",s["narration"],"",s.get("visualAction",""),""]
  lines+=["### Source materials / teaching examples",""]
  for m in d.get("materials",[]): lines+=[m["title"],"",m["text"],""]
  if d.get("promptExamples"): lines+=["### Prompt examples",""]+[k+": "+v for k,v in d["promptExamples"].items()]+[""]
  if d.get("activity"): lines+=["### Activity",""]+[str(v) for v in d["activity"].values()]+[""]
  lines+=["### Independent image brief","",json.dumps(d.get("imageBrief",{}),ensure_ascii=False,indent=2),"","### Quiz and explanations",""]
  for q in d["quiz"]:
   lines+=[q["question"]]+[str(j+1)+". "+o for j,o in enumerate(q["options"])]
   lines+=["Answer: "+str(q["answer"]+1)+". "+q["explanation"],""]
  lines+=["### Mission","",d["mission"]["title"],"",d["mission"]["instructions"],""]+["- "+x for x in d["mission"]["rubric"]]
  lines+=["","### Lesson hints",""]
  for h in d["hints"]:lines+=[h["question"],h["answer"],""]
  if d.get("educatorNotes"):lines+=["### Educator notes","",json.dumps(d["educatorNotes"],ensure_ascii=False,indent=2),""]
 (OUT/(locale+".md")).write_bytes(("\n".join(lines)+"\n").encode())
print(json.dumps(counts))

subprocess.run(["bun","scripts/build-platform-review.ts"],cwd=BASE,check=True)

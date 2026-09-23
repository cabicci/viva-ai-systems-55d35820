"""Import only complete hash-verified editorial artifacts; preserve existing pilot."""
import argparse,hashlib,importlib.util,json,shutil
from pathlib import Path
BASE=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument("artifacts",type=Path);p.add_argument("--run-id",required=True);p.add_argument("--source-sha",required=True);a=p.parse_args()
spec=importlib.util.spec_from_file_location("generator",BASE/"scripts/generate-editorial.py")
mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
staged=[];counts=[]
for n in range(3,13):
 name=f"lesson-{n:02}"
 matches=[p for p in a.artifacts.glob("**/manifest.json") if json.loads(p.read_text()).get("lessonId")=="kids-l1-"+str(n).zfill(2)]
 assert len(matches)==1,f"Expected one completed {name}, got {len(matches)}"
 folder=matches[0].parent;m=json.loads(matches[0].read_text())
 review=json.loads((folder/"automated-review.json").read_text())
 assert review["passed"] and not review["issues"],f"Open automated issues for {name}"
 assert set(m["locales"])==set(mod.LOCALES)
 for locale,entry in m["locales"].items():
  file=folder/(locale+".json")
  assert entry["path"]==file.name
  assert hashlib.sha256(file.read_bytes()).hexdigest()==entry["sha256"]
  d=json.loads(file.read_text(encoding="utf-8"));words=mod.validate(d,locale)
  counts.append({"lesson":n,"locale":locale,"narrationWords":words,"quiz":len(d["quiz"]),"materials":len(d["materials"])})
 staged.append((name,folder))
for name,folder in staged: shutil.copytree(folder,BASE/"curriculum/level-1"/name,dirs_exist_ok=True)
report={"status":"imported-validated-editorial-drafts","runId":a.run_id,"sourceSha":a.source_sha,"newLessons":10,"newLocalePackages":40,"existingLocalePackages":8,"totalLevel1LocalePackages":48,"checks":counts,"automatedReview":"passed on all ten new bundles","humanNativeSpeakerAndEducationReview":"pending","newMedia":"not-produced"}
(BASE/"evidence/editorial-import.json").write_bytes((json.dumps(report,indent=2)+"\n").encode())
print("Imported ten completed editorial lessons in four locales; original two lessons preserved.")

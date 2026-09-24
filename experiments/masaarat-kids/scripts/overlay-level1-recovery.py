"""Overlay an individually verified Dell render onto its failed Actions artifact."""
import argparse, json, shutil
from pathlib import Path
BASE=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser()
parser.add_argument("artifacts",type=Path)
parser.add_argument("--run-id",required=True)
parser.add_argument("--lesson",type=int,required=True,choices=range(2,13))
parser.add_argument("--locale",required=True,choices=("ar-EG","ar-MSA","ar-Gulf","en"))
args=parser.parse_args()
slug=f"lesson-{args.lesson:02}"
artifact=args.artifacts/f"kids-level1-{args.lesson}-{args.locale}-{args.run_id}-1"
if not artifact.is_dir(): raise SystemExit("Original artifact missing")
audio=BASE/"public/generated/audio/level1"/slug/args.locale
video=BASE/"public/generated/videos/level1"/slug
report_path=BASE/"evidence"/f"narrated-{slug}-{args.locale}.json"
trim_path=BASE/"evidence"/f"trim-{slug}-{args.locale}.json"
report=json.loads(report_path.read_text(encoding="utf-8"))
if report["status"]!="technical-pass" or report["lesson"]!=args.lesson or report["locale"]!=args.locale: raise SystemExit("Recovery has no technical pass")
target_audio=artifact/"public/generated/audio/level1"/slug/args.locale
target_video=artifact/"public/generated/videos/level1"/slug
target_evidence=artifact/"evidence"
for dest in (target_audio,target_video,target_evidence): dest.mkdir(parents=True,exist_ok=True)
for item in audio.iterdir():
    if item.is_file(): shutil.copy2(item,target_audio/item.name)
for suffix in (".mp4",".json",".vtt"):
    item=video/(args.locale+suffix)
    if not item.is_file(): raise SystemExit("Recovery video asset missing: "+str(item))
    shutil.copy2(item,target_video/item.name)
report["recovery"]={"type":"trailing-silence-trim","sourceRunId":args.run_id,"verifiedOn":"Dell pilot"}
(target_evidence/report_path.name).write_text(json.dumps(report,indent=2)+"\n",encoding="utf-8")
if trim_path.is_file(): shutil.copy2(trim_path,target_evidence/trim_path.name)
print(f"Overlaid verified local recovery for {slug}/{args.locale}")

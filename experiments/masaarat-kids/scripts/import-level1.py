"""Validate and import a complete GitHub Actions Level 1 media run."""
import argparse, hashlib, json, shutil
from pathlib import Path
BASE=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser()
parser.add_argument("artifacts",type=Path)
parser.add_argument("--run-id",required=True)
parser.add_argument("--source-sha",required=True)
args=parser.parse_args()
root=args.artifacts.resolve()
if not args.run_id.isdigit() or len(args.source_sha)!=40 or any(x not in "0123456789abcdef" for x in args.source_sha.lower()): raise SystemExit("Invalid run identity")
if not root.is_dir(): raise SystemExit("Artifact directory missing")
source=json.loads((BASE/"content/level1-video.json").read_text(encoding="utf-8"))
jobs=[]
def unique(paths,label):
    hits=list(paths)
    if len(hits)!=1: raise SystemExit(f"Expected one {label}; found {len(hits)}")
    return hits[0]
for number in range(2,13):
    slug=f"lesson-{number:02}"
    for locale in ("ar-EG","ar-MSA","ar-Gulf","en"):
        ev=unique(root.rglob(f"narrated-{slug}-{locale}.json"),f"evidence {slug}/{locale}")
        report=json.loads(ev.read_text(encoding="utf-8"))
        if report["status"]!="technical-pass" or report["lesson"]!=number or report["locale"]!=locale or len(report["audioSegments"])!=7: raise SystemExit("Invalid evidence "+str(ev))
        video=unique((p for p in root.rglob(locale+".mp4") if p.parent.name==slug),f"video {slug}/{locale}")
        if hashlib.sha256(video.read_bytes()).hexdigest()!=report["videoSha256"]: raise SystemExit("Video checksum mismatch "+str(video))
        captions=unique((p for p in root.rglob(locale+".vtt") if p.parent.name==slug),f"captions {slug}/{locale}")
        metadata=unique((p for p in root.rglob(locale+".json") if p.parent.name==slug),f"metadata {slug}/{locale}")
        meta=json.loads(metadata.read_text(encoding="utf-8"))
        if meta["kind"]!="narrated" or meta["lesson"]!=number or meta["locale"]!=locale: raise SystemExit("Wrong media manifest")
        audio_dir=unique((p.parent for p in root.rglob("timings.json") if p.parent.name==locale and p.parent.parent.name==slug),f"audio {slug}/{locale}")
        timings=json.loads((audio_dir/"timings.json").read_text(encoding="utf-8"))
        scenes=source[f"{number:02}/{locale}"]["scenes"]
        if len(timings)!=7: raise SystemExit("Audio segment count")
        for index,(timing,scene,segment) in enumerate(zip(timings,scenes,report["audioSegments"])):
            sha=hashlib.sha256(scene["narration"].encode()).hexdigest()
            if timing["textSha256"]!=sha or segment["textSha256"]!=sha or not (audio_dir/f"{index:02}.wav").is_file(): raise SystemExit(f"Stale narration {slug}/{locale}/{index}")
            if not (audio_dir/f"{index:02}.json").is_file(): raise SystemExit("Missing TTS receipt")
        jobs.append((number,locale,slug,video,captions,metadata,audio_dir,report))
if len(jobs)!=44: raise SystemExit("Incomplete lesson set")
manifest={}
for number,locale,slug,video,captions,metadata,audio_dir,report in jobs:
    dest_video=BASE/"public/generated/videos/level1"/slug
    dest_audio=BASE/"public/generated/audio/level1"/slug/locale
    dest_video.mkdir(parents=True,exist_ok=True)
    dest_audio.mkdir(parents=True,exist_ok=True)
    for item in audio_dir.iterdir():
        if item.is_file(): shutil.copy2(item,dest_audio/item.name)
    for item in (video,captions,metadata): shutil.copy2(item,dest_video/item.name)
    manifest.setdefault(str(number),{})[locale]={
      "url":f"generated/videos/level1/{slug}/{locale}.mp4",
      "captions":f"generated/videos/level1/{slug}/{locale}.vtt",
      "durationSeconds":report["durationSeconds"],
      "sha256":report["videoSha256"],"runId":args.run_id,"provenance":"local-recovery" if report.get("recovery") else "github-run"}
(BASE/"content/media-level1.json").write_bytes((json.dumps(manifest,ensure_ascii=False,indent=2)+"\n").encode("utf-8"))
receipt={"runId":args.run_id,"sourceSha":args.source_sha,"lessons":11,"locales":4,"narratedVideos":44,"allTechnicalChecksPassed":True,"localRecoveries":[f"{number:02}/{locale}" for number,locale,slug,video,captions,metadata,audio_dir,report in jobs if report.get("recovery")],"spokenAccuracyReview":"pending human listening"}
(BASE/"evidence/level1-production-import.json").write_bytes((json.dumps(receipt,indent=2)+"\n").encode("utf-8"))
print("Imported 44 verified narrated videos with audio and captions.")

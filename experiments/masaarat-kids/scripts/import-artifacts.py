"""Import verified pilot artifacts downloaded with gh run download."""
import argparse, hashlib, json, shutil
from pathlib import Path
BASE=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser()
p.add_argument("artifact_root",type=Path)
p.add_argument("--run-id",required=True)
p.add_argument("--source-sha",required=True)
p.add_argument("--recovery-run-id")
p.add_argument("--recovery-source-sha")
args=p.parse_args()
media=json.loads((BASE/"content/media.json").read_text(encoding="utf-8"))
staged=[]
for locale in ("ar-EG","ar-MSA","ar-Gulf","en"):
    reports=list(args.artifact_root.glob(f"**/evidence/narrated-{locale}.json"))
    assert len(reports)==1, f"Expected one verified artifact for {locale}"
    report=reports[0]
    root=report.parent.parent
    result=json.loads(report.read_text())
    assert result["status"]=="technical-pass" and result["locale"]==locale
    lesson=json.loads((BASE/"content"/(locale+".json")).read_text(encoding="utf-8"))
    assert len(result["audioSegments"])==len(lesson["scenes"])==12
    for scene,segment in zip(lesson["scenes"],result["audioSegments"]):
        assert hashlib.sha256(scene["narration"].encode()).hexdigest()==segment["textSha256"]
    video=root/"public/generated/videos"/(locale+".mp4")
    assert hashlib.sha256(video.read_bytes()).hexdigest()==result["videoSha256"]
    entry=json.loads((root/"content/media.json").read_text())[locale]
    assert entry["kind"]=="narrated"
    staged.append((locale,root,report,entry))
for locale,root,report,entry in staged:
    for kind in ("audio","stills"):
        shutil.copytree(root/"public/generated"/kind/locale,BASE/"public/generated"/kind/locale,dirs_exist_ok=True)
    dest=BASE/"public/generated/videos"
    dest.mkdir(parents=True,exist_ok=True)
    for extension in (".mp4",".vtt"):
        shutil.copy2(root/"public/generated/videos"/(locale+extension),dest/(locale+extension))
    shutil.copy2(report,BASE/"evidence"/report.name)
    media[locale]=entry
(BASE/"content/media.json").write_bytes((json.dumps(media,indent=2)+"\n").encode())
productions=[{"runId":args.run_id,"sourceSha":args.source_sha,"locales":["ar-EG","ar-MSA","ar-Gulf"] if args.recovery_run_id else list(media)}]
if args.recovery_run_id:
    assert args.recovery_source_sha, "Recovery source SHA required"
    productions.append({"runId":args.recovery_run_id,"sourceSha":args.recovery_source_sha,"locales":["en"]})
receipt={"productions":productions,"status":"downloaded-and-hashes-verified"}
(BASE/"evidence/production-import.json").write_bytes((json.dumps(receipt,indent=2)+"\n").encode())
print("Imported four verified narrated videos, audio segments, captions, and stills.")

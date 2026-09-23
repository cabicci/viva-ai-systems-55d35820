"""Create a self-contained offline review package from verified existing media."""
import hashlib,json,shutil
from pathlib import Path
BASE=Path(__file__).resolve().parents[1]
out=BASE/"review-package"
assert not out.exists(),"Use a fresh package output directory"
out.mkdir()
for name in ("index.html","app.js","style.css"): shutil.copy2(BASE/"dist"/name,out/name)
for name in ("brand","fonts"): shutil.copytree(BASE/"dist"/name,out/name)
shutil.copytree(BASE/"public/generated/illustrations",out/"generated/illustrations")
(out/"generated/videos").mkdir(parents=True)
media=json.loads((BASE/"content/media.json").read_text())
files=[]
for locale in ("ar-EG","ar-MSA","ar-Gulf","en"):
    evidence=json.loads((BASE/"evidence"/("narrated-"+locale+".json")).read_text())
    video=BASE/"public"/media[locale]["url"]
    assert media[locale]["kind"]=="narrated"
    assert hashlib.sha256(video.read_bytes()).hexdigest()==evidence["videoSha256"]
    for suffix in (".mp4",".vtt"):
        source=video.with_suffix(suffix)
        shutil.copy2(source,out/"generated/videos"/source.name)
    files.append({"locale":locale,"video":media[locale]["url"],"sha256":evidence["videoSha256"]})
shutil.copytree(BASE/"content",out/"lesson-content")
if (BASE/"curriculum").exists(): shutil.copytree(BASE/"curriculum",out/"curriculum-editorial")
shutil.copytree(BASE/"evidence",out/"review-evidence",ignore=shutil.ignore_patterns("*.png","*.log","audio-review-*.json"))
(out/"START_HERE.txt").write_text("MASAARAT KIDS - FIRST LESSON REVIEW\n\nExtract the entire ZIP, then open index.html. Keep the folders beside it.\nSelect Egyptian Arabic, Modern Standard Arabic, Gulf Arabic, or English in the page.\nThe package contains four narrated videos, four independent lesson illustrations, quizzes, a prompt-building activity and sourced lesson hints.\nEverything in this review page works locally. The helper uses curated lesson answers; a generative RAG service is not connected.\nRevision 2: human pronunciation/dialect and educational approval are still pending.\nNo production release is included.\n",encoding="utf-8")
(out/"package-manifest.json").write_text(json.dumps({"sourceSha":__import__("os").environ.get("GITHUB_SHA"),"files":files,"images":4,"status":"owner-review"},indent=2)+"\n",encoding="utf-8")
assert len(list((out/"generated/illustrations").glob("*.png")))==4
print("Offline package ready: 4 videos, 4 independent illustrations, lesson interface and review evidence.")

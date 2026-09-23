"""Validate and reuse completed audio reviews; no provider requests."""
import hashlib,json
from pathlib import Path
BASE=Path(__file__).resolve().parents[1]
for locale in ("ar-EG","ar-MSA","ar-Gulf","en"):
    path=BASE/"evidence"/("audio-review-"+locale+".json")
    text=path.read_text(encoding="utf-8")
    if text.endswith(chr(92)+"n"): text=text[:-2]
    report=json.loads(text)
    lesson=json.loads((BASE/"content"/(locale+".json")).read_text(encoding="utf-8"))
    assert report["status"]=="automated-review-complete" and report["locale"]==locale
    assert report["expectedText"]==" ".join(s["narration"] for s in lesson["scenes"])
    assert set(report["audioSegmentSha256"])=={s["id"] for s in lesson["scenes"]}
    for i,scene in enumerate(lesson["scenes"]):
        audio=BASE/"public/generated/audio"/locale/f"{i:02}.wav"
        assert hashlib.sha256(audio.read_bytes()).hexdigest()==report["audioSegmentSha256"][scene["id"]]
    path.write_bytes((json.dumps(report,ensure_ascii=False,indent=2)+chr(10)).encode())
    print(locale+": preserved independent review matches the exact script and audio.")
summary=json.loads((BASE/"evidence/audio-review-summary.json").read_text())
assert summary["completed"] and {r["locale"] for r in summary["results"]}=={"ar-EG","ar-MSA","ar-Gulf","en"}

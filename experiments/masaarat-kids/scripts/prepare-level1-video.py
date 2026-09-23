"""Build the localized seven-scene video source for lessons 2–12."""
import json
from pathlib import Path
BASE=Path(__file__).resolve().parents[1]
LOCALES=("ar-EG","ar-MSA","ar-Gulf","en")
source={}
two=json.loads((BASE/"curriculum/lesson-02-editorial.json").read_text(encoding="utf-8"))
for n in range(2,13):
    packages=two["locales"] if n==2 else {locale:json.loads((BASE/"curriculum/level-1"/f"lesson-{n:02}"/f"{locale}.json").read_text(encoding="utf-8")) for locale in LOCALES}
    assert set(packages)==set(LOCALES)
    for locale,d in packages.items():
        assert len(d["scenes"])==7 and all(x["narration"].strip() and x["display"].strip() for x in d["scenes"])
        source[f"{n:02}/{locale}"]={"lesson":n,"locale":locale,"title":d["title"],"scenes":[{"id":x["id"],"title":x["title"],"display":x["display"],"narration":x["narration"]} for x in d["scenes"]]}
(BASE/"content/level1-video.json").write_text(json.dumps(source,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(f"Prepared {len(source)} seven-scene localized video scripts.")

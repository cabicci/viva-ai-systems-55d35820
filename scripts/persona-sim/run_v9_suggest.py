#!/usr/bin/env python3
"""v9 step 1 — Generate suggested block re-orderings for v8 lessons."""
from __future__ import annotations
import json, os, re, sys, time, itertools, threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from pathlib import Path
import requests

ROOT = Path(__file__).resolve().parents[2]
LESSONS_DIR = ROOT / "remotion/src/lessons-generated"
OUT_DIR = Path("/mnt/documents")

GEMINI_KEYS = [k for k in [
    os.environ.get("GEMINI_API_KEY"),
    os.environ.get("GEMINI_API_KEY_2"),
    os.environ.get("GEMINI_API_KEY_3"),
    os.environ.get("GEMINI_API_KEY_4"),
] if k]
assert GEMINI_KEYS, "No GEMINI_API_KEY* env vars found"
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"
_cycle = itertools.cycle(GEMINI_KEYS); _lock = threading.Lock()
def next_key():
    with _lock: return next(_cycle)

def _all_lessons():
    return sorted(p.stem.replace(".gen", "") for p in LESSONS_DIR.glob("*.gen.ts"))

SAMPLE = _all_lessons()

SCENE_RE = re.compile(r"export const SCENES:[^=]*=\s*(\[[\s\S]*?\])\s+as SceneData\[\];", re.M)

def extract_scenes(lesson_id: str):
    p = LESSONS_DIR / f"{lesson_id}.gen.ts"
    if not p.exists(): return None
    m = SCENE_RE.search(p.read_text(encoding="utf-8"))
    if not m: return None
    try: scenes = json.loads(m.group(1))
    except Exception: return None
    return [{"i": i, "card": s.get("card"), "accent": s.get("accent")} for i, s in enumerate(scenes)]

SYSTEM = """أنت مصمم UI لتنسيق صفحات دروس.
مهمتك: تقترح ترتيب جديد لبلوكات الدرس بناءً على قواعد بصرية، بدون أي تغيير في المحتوى.
القواعد:
1. ابدأ بـ TitleCard، اختم بـ CTACard.
2. ما تخليش 3 ConceptCard متتالية — وزّع BulletsCard/CompareCard/BigStatCard بينهم.
3. ما تخليش accent يتكرر مرتين متتاليتين.
4. CompareCard أفضل قبل CTACard مباشرة لو موجود.
ترد JSON فقط."""

def build_prompt(lesson_id, scenes):
    return f"""[Lesson: {lesson_id}]
الترتيب الحالي ({len(scenes)} بلوك):
{json.dumps(scenes, ensure_ascii=False)}

اقترح ترتيب جديد (نفس البلوكات بس بترتيب مختلف لو محتاج). ارجع JSON:
{{
  "suggested_order": [قائمة من الـ i بالترتيب الجديد],
  "changes": ["تغيير 1 بالعربي", "تغيير 2"],
  "rationale": "جملة قصيرة عربي ليه الترتيب ده أحسن بصرياً",
  "needs_change": true | false
}}"""

def call_ai(prompt, retries=3):
    for i in range(retries):
        try:
            r = requests.post(
                f"{GEMINI_URL}?key={next_key()}",
                json={
                    "system_instruction": {"parts": [{"text": SYSTEM}]},
                    "contents": [{"role": "user", "parts": [{"text": prompt}]}],
                    "generationConfig": {"responseMimeType": "application/json"},
                },
                timeout=60,
            )
            if r.status_code == 429: time.sleep(3*(i+1)); continue
            r.raise_for_status()
            txt = r.json()["candidates"][0]["content"]["parts"][0]["text"]
            return json.loads(txt)
        except Exception as e:
            if i == retries-1: return {"error": str(e)[:200]}
            time.sleep(2)

def main():
    out = {}
    with ThreadPoolExecutor(max_workers=8) as ex:
        futs = {}
        for lid in SAMPLE:
            sc = extract_scenes(lid)
            if sc is None:
                print(f"skip {lid}", file=sys.stderr); continue
            futs[ex.submit(call_ai, build_prompt(lid, sc))] = (lid, sc)
        for f in as_completed(futs):
            lid, sc = futs[f]
            res = f.result()
            out[lid] = {"current": sc, "suggestion": res}
            print(f"✓ {lid}", file=sys.stderr)

    ts = datetime.now().strftime("%Y%m%d-%H%M%S")
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    p = OUT_DIR / f"persona-sim-v9-suggestions-{ts}.json"
    p.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"✅ {p}")
    # also write a stable pointer
    (OUT_DIR / "persona-sim-v9-suggestions-latest.json").write_text(
        json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    print(str(p))

if __name__ == "__main__":
    main()
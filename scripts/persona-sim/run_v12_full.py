#!/usr/bin/env python3
"""
Persona Sim v12 — 100 personas × ALL paths (intro+builder+creator+automator+analyst+business).

Uses Google Gemini API DIRECTLY (4 rotating keys) — NO Lovable credits consumed.

Each persona walks ~95 lessons in order, gives per-lesson scores + a final verdict.

Output:
  /mnt/documents/persona-sim-v12-{stamp}.md
  /mnt/documents/persona-sim-v12-{stamp}-raw.json
"""
from __future__ import annotations
import json, os, re, time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from pathlib import Path
from itertools import cycle
import threading
import requests

ROOT = Path(__file__).resolve().parents[2]
LESSONS_DIR = ROOT / "src/components/intro/lessons"
OUT_DIR = Path("/mnt/documents")
OUT_DIR.mkdir(parents=True, exist_ok=True)

KEYS = [k for k in [
    os.environ.get("GEMINI_API_KEY"),
    os.environ.get("GEMINI_API_KEY_2"),
    os.environ.get("GEMINI_API_KEY_3"),
    os.environ.get("GEMINI_API_KEY_4"),
] if k]
assert KEYS, "no GEMINI_API_KEY* found"
print(f"Loaded {len(KEYS)} Gemini keys", flush=True)

MODEL = "gemini-2.5-flash"
ENDPOINT_TPL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
_key_lock = threading.Lock()
_key_cycle = cycle(KEYS)
def next_key():
    with _key_lock:
        return next(_key_cycle)

# ---- 1) Load lessons in path order ----------------------------------------
PATH_ORDER = ["intro", "builder", "creator", "automator", "analyst", "business"]

def list_lessons_for_path(path: str) -> list[str]:
    files = sorted(p.stem for p in LESSONS_DIR.glob(f"{path}-*.ts"))
    # Sort numerically by module then lesson when possible
    def key(lid: str):
        # e.g. builder-m10-l24-rag → (10, 24)
        m = re.match(rf"{path}-m(\d+)(?:-l(\d+))?", lid)
        if not m: return (999, 999, lid)
        mod = int(m.group(1))
        les = int(m.group(2)) if m.group(2) else 0
        return (mod, les, lid)
    return sorted(files, key=key)

LESSON_ORDER: list[tuple[str,str]] = []  # (path, lid)
for p in PATH_ORDER:
    for lid in list_lessons_for_path(p):
        LESSON_ORDER.append((p, lid))

print(f"Total lessons: {len(LESSON_ORDER)}", flush=True)

def extract_lesson_summary(path: str, lid: str) -> dict:
    p = LESSONS_DIR / f"{lid}.ts"
    txt = p.read_text(encoding="utf-8")
    titles = re.findall(r'title:\s*"([^"]{3,120})"', txt)
    eyebrows = re.findall(r'eyebrow:\s*"([^"]{2,40})"', txt)
    terms = re.findall(r'term:\s*"([^"]{2,60})"', txt)
    head_title = titles[0] if titles else lid
    return {
        "path": path,
        "id": lid,
        "title": head_title,
        "tags": list(dict.fromkeys(eyebrows))[:4],
        "terms": list(dict.fromkeys(terms))[:4],
    }

LESSONS = [extract_lesson_summary(p, l) for p, l in LESSON_ORDER]

# ---- 2) Build 100 personas ------------------------------------------------
ARCHETYPES = [
    ("Curious-Beginner", "مبتدئ فضولي، عمره 25، شغّال HR"),
    ("Skeptical-Manager", "مدير 38 سنة، شاكك، عايز ROI"),
    ("Marketer", "marketer 29 سنة، عايز AI في الكونتنت"),
    ("Designer", "designer 27 سنة، بصري، يمل من النصوص"),
    ("Teacher", "مدرس 35 سنة، صبور، بيحب التفاصيل"),
    ("Doctor", "دكتور 40 سنة، وقته ضيق"),
    ("Engineer", "مهندس 30 سنة، تقني، يمل لو الكلام بدائي"),
    ("Non-Tech-Founder", "مؤسس startup 33 سنة، مش programmer"),
    ("Student", "طالب 21 سنة، عايز شغل freelance"),
    ("Sales-Rep", "مندوب مبيعات 32 سنة، عايز يأتمت المتابعة"),
    ("Mom-Side-Hustle", "أم 36 سنة، عندها side business"),
    ("Content-Creator", "creator TikTok 24 سنة"),
    ("Accountant", "محاسب 34 سنة، حساس للأرقام"),
    ("Project-Manager", "PM 31 سنة، بيفكر workflows"),
    ("Freelance-Dev", "dev freelancer 28 سنة"),
    ("Real-Estate-Agent", "سمسار 37 سنة، عايز AI للـ leads"),
    ("Restaurant-Owner", "صاحب مطعم 41 سنة"),
    ("Journalist", "صحفي 30 سنة"),
    ("Lawyer", "محامي 39 سنة"),
    ("HR-Specialist", "HR 28 سنة"),
]
PSYCH_FLAGS = [
    ("low-tolerance", "بيسيب أول ما يحس بضيقة"),
    ("medium-tolerance", "هيكمل لو في فايدة قريبة"),
    ("high-tolerance", "صبور لآخر الكورس"),
    ("hostile-to-jargon", "أي مصطلح إنجليزي بدون شرح = هيقفل"),
    ("aha-hunter", "بيدور على لحظة wow في أول 5 دروس"),
]

def build_personas():
    personas = []
    pid = 0
    for arch in ARCHETYPES:
        for flag in PSYCH_FLAGS:
            pid += 1
            personas.append({
                "id": f"P{pid:03d}",
                "archetype": arch[0],
                "bio": arch[1],
                "flag": flag[0],
                "behavior": flag[1],
            })
    return personas

PERSONAS = build_personas()
assert len(PERSONAS) == 100

# ---- 3) Lessons block ------------------------------------------------------
def lesson_card(i: int, l: dict) -> str:
    bits = [f"L{i+1:02d} [{l['path']}] {l['id']} — {l['title']}"]
    if l["tags"]: bits.append(f"   tags: {' | '.join(l['tags'])}")
    if l["terms"]: bits.append(f"   مفاهيم: {' • '.join(l['terms'])}")
    return "\n".join(bits)

LESSONS_BLOCK = "\n\n".join(lesson_card(i, l) for i, l in enumerate(LESSONS))

SYSTEM = (
    "إنت شخصية مصرية حقيقية بتقيّم كورس AI أونلاين فيه 6 مسارات (intro→builder→creator→automator→analyst→business). "
    "هتقرا كل الدروس بالترتيب وترد JSON بس. "
    "كل درس قيّم: confidence/confusion/boredom من 1-10 + هل هتكمل + لو حابب تسيب قول quit_here:true. "
    "كمان اكتب comment قصير (سطر أو 2) لكل درس بصراحة. "
    "متجمّلش، انت user حقيقي."
)

USER_TPL = """شخصيتك:
- ID: {pid}
- Archetype: {arch}
- Bio: {bio}
- Flag: {flag} — {behavior}

الكورس فيه {n} درس بالترتيب:

{lessons}

ردّ JSON بالشكل ده (متضيفش markdown، JSON خالص):
{{
  "persona_id": "{pid}",
  "lessons": [
    {{"i":1,"lid":"...","conf":1-10,"confu":1-10,"bore":1-10,"would_cont":true|false,"quit_here":true|false,"comment":"سطر مصري"}}
  ],
  "final_completion_pct": 0-100,
  "quit_at_lesson": رقم أو null,
  "reached_path": "intro|builder|creator|automator|analyst|business",
  "overall_verdict": "سطرين بالعامية",
  "top_5_pain_points": ["...","...","...","...","..."],
  "top_3_aha_lessons": ["lid","lid","lid"],
  "best_path": "اسم المسار الأقوى",
  "weakest_path": "اسم المسار الأضعف"
}}

كل الـ {n} درس لازم يكونوا في الـ array. لو سيبت عند L{n_mid} كمّل الباقي بـ would_cont:false وquit_here:false."""

# ---- 4) Gemini call --------------------------------------------------------
def call_gemini(persona: dict, retries: int = 4) -> dict:
    user_msg = USER_TPL.format(
        pid=persona["id"], arch=persona["archetype"], bio=persona["bio"],
        flag=persona["flag"], behavior=persona["behavior"],
        lessons=LESSONS_BLOCK, n=len(LESSONS), n_mid=len(LESSONS)//2,
    )
    payload = {
        "systemInstruction": {"parts": [{"text": SYSTEM}]},
        "contents": [{"role": "user", "parts": [{"text": user_msg}]}],
        "generationConfig": {
            "responseMimeType": "application/json",
            "temperature": 0.85,
            "maxOutputTokens": 32000,
        },
    }
    for attempt in range(retries):
        key = next_key()
        url = ENDPOINT_TPL.format(model=MODEL, key=key)
        try:
            r = requests.post(url, json=payload, timeout=240)
            if r.status_code in (429, 503):
                time.sleep(6 * (attempt + 1)); continue
            if r.status_code == 400 and "API key" in r.text:
                # try another key
                time.sleep(2); continue
            r.raise_for_status()
            jr = r.json()
            cand = jr.get("candidates", [{}])[0]
            txt = "".join(p.get("text","") for p in cand.get("content",{}).get("parts",[]))
            if not txt:
                raise RuntimeError(f"empty response: {json.dumps(jr)[:200]}")
            # strip ``` if present
            txt = re.sub(r"^```(?:json)?\s*|\s*```$", "", txt.strip())
            data = json.loads(txt)
            data["_meta"] = {"archetype": persona["archetype"], "flag": persona["flag"]}
            return data
        except Exception as e:
            if attempt == retries - 1:
                return {"error": str(e)[:300], "persona_id": persona["id"]}
            time.sleep(3 * (attempt + 1))
    return {"error": "max_retries", "persona_id": persona["id"]}

# ---- 5) Run + aggregate ----------------------------------------------------
CKPT = OUT_DIR / "persona-sim-v12-checkpoint.json"

def main():
    stamp = datetime.utcnow().strftime("%Y%m%d-%H%M%S")
    results = []
    done_ids = set()
    if CKPT.exists():
        try:
            results = json.loads(CKPT.read_text(encoding="utf-8"))
            done_ids = {r.get("persona_id") for r in results if "error" not in r}
            print(f"Resuming: {len(done_ids)} personas already done", flush=True)
        except Exception:
            results = []
    todo = [p for p in PERSONAS if p["id"] not in done_ids]
    print(f"Running {len(todo)}/{len(PERSONAS)} personas × {len(LESSONS)} lessons", flush=True)
    if not todo:
        print("All personas done — generating report only", flush=True)
    t0 = time.time()
    ckpt_lock = threading.Lock()
    with ThreadPoolExecutor(max_workers=16) as ex:
        futs = {ex.submit(call_gemini, p): p for p in todo}
        for i, fut in enumerate(as_completed(futs), 1):
            results.append(fut.result())
            with ckpt_lock:
                CKPT.write_text(json.dumps(results, ensure_ascii=False), encoding="utf-8")
            if i % 3 == 0:
                ok = sum(1 for r in results if "error" not in r)
                print(f"  +{i}/{len(todo)} ({ok} ok total) — {time.time()-t0:.0f}s", flush=True)

    raw_path = OUT_DIR / f"persona-sim-v12-{stamp}-raw.json"
    raw_path.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")

    ok = [r for r in results if "error" not in r and "lessons" in r]
    errs = [r for r in results if "error" in r or "lessons" not in r]

    completion = [r.get("final_completion_pct", 0) for r in ok]
    quit_counts = {}
    reached = {}
    pain_points = {}
    aha = {}
    best_path = {}
    weakest = {}
    per_lesson: dict[str, list] = {l["id"]: [] for l in LESSONS}
    per_lesson_comments: dict[str, list] = {l["id"]: [] for l in LESSONS}

    for r in ok:
        q = r.get("quit_at_lesson")
        if q: quit_counts[q] = quit_counts.get(q, 0) + 1
        rp = r.get("reached_path")
        if rp: reached[rp] = reached.get(rp, 0) + 1
        for pp in (r.get("top_5_pain_points") or [])[:5]:
            pain_points[pp] = pain_points.get(pp, 0) + 1
        for a in (r.get("top_3_aha_lessons") or [])[:3]:
            aha[a] = aha.get(a, 0) + 1
        bp = r.get("best_path");  best_path[bp] = best_path.get(bp,0)+1 if bp else 0
        wp = r.get("weakest_path"); weakest[wp] = weakest.get(wp,0)+1 if wp else 0
        for lr in r.get("lessons", []):
            lid = lr.get("lid")
            if lid in per_lesson:
                per_lesson[lid].append(lr)
                c = (lr.get("comment") or "").strip()
                if c: per_lesson_comments[lid].append(
                    f"[{r.get('persona_id','?')}/{r['_meta']['archetype']}] {c}"
                )

    def avg(xs, k):
        v = [x.get(k) for x in xs if isinstance(x.get(k), (int,float))]
        return round(sum(v)/len(v),2) if v else None

    md = [f"# Persona Sim v12 — Full course (100 personas × {len(LESSONS)} lessons)\n"]
    md.append(f"**Model:** Google Gemini ({MODEL}) — direct API, no Lovable credits")
    md.append(f"**Source:** `{raw_path.name}`")
    md.append(f"**OK:** {len(ok)}/100 · **Errors:** {len(errs)}")
    md.append(f"**Avg completion:** {round(sum(completion)/len(completion),1) if completion else 0}%\n")

    md.append("## Reached path (final stop)")
    for p in PATH_ORDER:
        md.append(f"- {p}: **{reached.get(p,0)}** personas")
    md.append("")

    md.append("## Best / Weakest path votes")
    md.append("**Best:**")
    for k,v in sorted(best_path.items(), key=lambda x:-x[1])[:6]:
        if k: md.append(f"- {k}: {v}")
    md.append("\n**Weakest:**")
    for k,v in sorted(weakest.items(), key=lambda x:-x[1])[:6]:
        if k: md.append(f"- {k}: {v}")
    md.append("")

    md.append("## Quit distribution (top 20 lesson indices)")
    for k,v in sorted(quit_counts.items(), key=lambda x:-x[1])[:20]:
        try:
            lname = LESSONS[int(k)-1]["id"]
        except: lname = "?"
        md.append(f"- L{k} ({lname}): **{v}** personas")
    md.append("")

    md.append("## Top 20 pain points")
    for pp,c in sorted(pain_points.items(), key=lambda x:-x[1])[:20]:
        md.append(f"- **{c}×** {pp}")
    md.append("")

    md.append("## Top 15 aha-moment lessons")
    for lid,c in sorted(aha.items(), key=lambda x:-x[1])[:15]:
        md.append(f"- **{c}×** {lid}")
    md.append("")

    md.append("## Per-lesson averages (conf / confu / bore / n)")
    cur_path = None
    for i,l in enumerate(LESSONS,1):
        xs = per_lesson[l["id"]]
        if not xs: continue
        if l["path"] != cur_path:
            cur_path = l["path"]
            md.append(f"\n### {cur_path.upper()}")
        md.append(f"- L{i:02d} `{l['id']}` — conf {avg(xs,'conf')} · confu {avg(xs,'confu')} · bore {avg(xs,'bore')} · n={len(xs)}")
    md.append("")

    md.append("## Per-lesson sample comments (up to 5 per lesson)")
    cur_path = None
    for l in LESSONS:
        cs = per_lesson_comments[l["id"]]
        if not cs: continue
        if l["path"] != cur_path:
            cur_path = l["path"]
            md.append(f"\n### {cur_path.upper()}")
        md.append(f"\n**`{l['id']}` — {l['title']}**")
        for c in cs[:5]:
            md.append(f"- {c}")
    md.append("")

    md.append("## Sample overall verdicts (first 20)")
    for r in ok[:20]:
        md.append(f"- **{r.get('persona_id')}** ({r['_meta']['archetype']}/{r['_meta']['flag']}): {r.get('overall_verdict','')}")
    md.append("")

    if errs:
        md.append(f"## Errors ({len(errs)})")
        for e in errs[:10]:
            md.append(f"- {e.get('persona_id','?')}: {str(e.get('error',''))[:200]}")

    md_path = OUT_DIR / f"persona-sim-v12-{stamp}.md"
    md_path.write_text("\n".join(md), encoding="utf-8")
    print(f"\nDONE in {time.time()-t0:.0f}s")
    print(f"  md:  {md_path}")
    print(f"  raw: {raw_path}")

if __name__ == "__main__":
    main()

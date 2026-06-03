#!/usr/bin/env python3
"""
Persona Sim v12.1 — Business-only validation (20 personas, fresh entry).

Goal: confirm v12's Business breakdown was caused by burn-out from upstream
Builder confusion, NOT by Business content itself. Personas enter Business
fresh (no prior fatigue) — if scores are healthy, the re-order theory is right.
"""
from __future__ import annotations
import json, os, re, time, threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from pathlib import Path
from itertools import cycle
import requests

ROOT = Path(__file__).resolve().parents[2]
LESSONS_DIR = ROOT / "src/components/intro/lessons"
OUT_DIR = Path("/mnt/documents"); OUT_DIR.mkdir(parents=True, exist_ok=True)

KEYS = [k for k in [os.environ.get(f"GEMINI_API_KEY{s}") for s in ("","_2","_3","_4")] if k]
assert KEYS, "no GEMINI_API_KEY* found"
print(f"Loaded {len(KEYS)} keys", flush=True)

MODEL = "gemini-2.5-flash"
EP = "https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={k}"
_lock = threading.Lock(); _cyc = cycle(KEYS)
def nk():
    with _lock: return next(_cyc)

def lesson_files():
    files = sorted(p.stem for p in LESSONS_DIR.glob("business-*.ts"))
    def key(lid):
        m = re.match(r"business-m(\d+)", lid)
        return (int(m.group(1)) if m else 99, lid)
    return sorted(files, key=key)

def summarize(lid):
    txt = (LESSONS_DIR / f"{lid}.ts").read_text(encoding="utf-8")
    titles = re.findall(r'title:\s*"([^"]{3,120})"', txt)
    eyebrows = re.findall(r'eyebrow:\s*"([^"]{2,40})"', txt)
    terms = re.findall(r'term:\s*"([^"]{2,60})"', txt)
    return {"id": lid, "title": titles[0] if titles else lid,
            "tags": list(dict.fromkeys(eyebrows))[:4],
            "terms": list(dict.fromkeys(terms))[:4]}

LESSONS = [summarize(l) for l in lesson_files()]
print(f"Business lessons: {len(LESSONS)}", flush=True)

ARCHETYPES = [
    ("Skeptical-Manager", "مدير 38 سنة، شاكك، عايز ROI"),
    ("Non-Tech-Founder", "مؤسس startup 33 سنة، مش programmer"),
    ("Restaurant-Owner", "صاحب مطعم 41 سنة"),
    ("Real-Estate-Agent", "سمسار 37 سنة، عايز AI للـ leads"),
    ("Sales-Rep", "مندوب مبيعات 32 سنة"),
    ("Mom-Side-Hustle", "أم 36 سنة، عندها side business"),
    ("Project-Manager", "PM 31 سنة، بيفكر workflows"),
    ("Lawyer", "محامي 39 سنة"),
    ("Accountant", "محاسب 34 سنة"),
    ("HR-Specialist", "HR 28 سنة"),
]
FLAGS = [
    ("medium-tolerance","هيكمل لو في فايدة قريبة"),
    ("aha-hunter","بيدور على لحظة wow في أول 3 دروس"),
]
PERSONAS = []
pid = 0
for a in ARCHETYPES:
    for f in FLAGS:
        pid += 1
        PERSONAS.append({"id":f"P{pid:02d}","archetype":a[0],"bio":a[1],"flag":f[0],"behavior":f[1]})
assert len(PERSONAS) == 20

def card(i,l):
    bits = [f"L{i+1:02d} {l['id']} — {l['title']}"]
    if l["tags"]: bits.append(f"   tags: {' | '.join(l['tags'])}")
    if l["terms"]: bits.append(f"   مفاهيم: {' • '.join(l['terms'])}")
    return "\n".join(bits)

BLOCK = "\n\n".join(card(i,l) for i,l in enumerate(LESSONS))

SYS = ("إنت شخصية مصرية حقيقية بتقيّم مسار Business في كورس AI. دخلت المسار ده فريش "
       "(مش متعب من حاجة قبله). اقرا الدروس بالترتيب ورد JSON بس.")

USER_TPL = """شخصيتك:
- ID: {pid} · Archetype: {arch} · Bio: {bio}
- Flag: {flag} — {behavior}

مسار Business فيه {n} درس:

{lessons}

ردّ JSON خالص:
{{
  "persona_id":"{pid}",
  "lessons":[{{"i":1,"lid":"...","conf":1-10,"confu":1-10,"bore":1-10,"would_cont":true|false,"quit_here":true|false,"comment":"سطر مصري"}}],
  "final_completion_pct":0-100,
  "quit_at_lesson":رقم أو null,
  "overall_verdict":"سطرين بالعامية",
  "top_3_pain_points":["...","...","..."],
  "top_3_aha_lessons":["lid","lid","lid"]
}}"""

def call(persona, retries=4):
    msg = USER_TPL.format(pid=persona["id"], arch=persona["archetype"], bio=persona["bio"],
                          flag=persona["flag"], behavior=persona["behavior"],
                          lessons=BLOCK, n=len(LESSONS))
    payload = {"systemInstruction":{"parts":[{"text":SYS}]},
               "contents":[{"role":"user","parts":[{"text":msg}]}],
               "generationConfig":{"responseMimeType":"application/json","temperature":0.85,"maxOutputTokens":8000}}
    for a in range(retries):
        k = nk(); url = EP.format(m=MODEL,k=k)
        try:
            r = requests.post(url, json=payload, timeout=180)
            if r.status_code in (429,503): time.sleep(5*(a+1)); continue
            r.raise_for_status()
            jr = r.json()
            cand = jr.get("candidates",[{}])[0]
            txt = "".join(p.get("text","") for p in cand.get("content",{}).get("parts",[]))
            txt = re.sub(r"^```(?:json)?\s*|\s*```$","",txt.strip())
            data = json.loads(txt)
            data["_meta"] = {"archetype": persona["archetype"], "flag": persona["flag"]}
            return data
        except Exception as e:
            if a == retries-1: return {"error":str(e)[:300],"persona_id":persona["id"]}
            time.sleep(3*(a+1))

def main():
    stamp = datetime.utcnow().strftime("%Y%m%d-%H%M%S")
    print(f"Running {len(PERSONAS)} personas × {len(LESSONS)} lessons", flush=True)
    t0 = time.time()
    results = []
    with ThreadPoolExecutor(max_workers=10) as ex:
        futs = {ex.submit(call,p): p for p in PERSONAS}
        for i,f in enumerate(as_completed(futs),1):
            results.append(f.result())
            if i % 3 == 0: print(f"  +{i}/{len(PERSONAS)} — {time.time()-t0:.0f}s", flush=True)

    raw = OUT_DIR / f"persona-sim-v12_1-business-{stamp}-raw.json"
    raw.write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding="utf-8")

    ok = [r for r in results if "error" not in r and "lessons" in r]
    errs = [r for r in results if "error" in r or "lessons" not in r]
    comp = [r.get("final_completion_pct",0) for r in ok]
    per = {l["id"]:[] for l in LESSONS}
    comments = {l["id"]:[] for l in LESSONS}
    pains = {}; ahas = {}; quits = {}
    for r in ok:
        for lr in r.get("lessons",[]):
            lid = lr.get("lid")
            if lid in per:
                per[lid].append(lr)
                c = (lr.get("comment") or "").strip()
                if c: comments[lid].append(f"[{r.get('persona_id')}/{r['_meta']['archetype']}] {c}")
        q = r.get("quit_at_lesson")
        if q: quits[q] = quits.get(q,0)+1
        for p in (r.get("top_3_pain_points") or []): pains[p] = pains.get(p,0)+1
        for a in (r.get("top_3_aha_lessons") or []): ahas[a] = ahas.get(a,0)+1

    def avg(xs,k):
        v = [x.get(k) for x in xs if isinstance(x.get(k),(int,float))]
        return round(sum(v)/len(v),2) if v else None

    md = [f"# Persona Sim v12.1 — Business fresh-entry validation ({len(PERSONAS)} personas)\n",
          f"**Model:** Gemini ({MODEL}) — direct API",
          f"**OK:** {len(ok)}/{len(PERSONAS)} · **Errors:** {len(errs)}",
          f"**Avg completion:** {round(sum(comp)/len(comp),1) if comp else 0}%\n",
          "## Quit distribution",
          *[f"- L{k}: **{v}**" for k,v in sorted(quits.items(),key=lambda x:-x[1])[:10]],
          "\n## Top pain points",
          *[f"- **{c}×** {p}" for p,c in sorted(pains.items(),key=lambda x:-x[1])[:10]],
          "\n## Top aha lessons",
          *[f"- **{c}×** {l}" for l,c in sorted(ahas.items(),key=lambda x:-x[1])[:10]],
          "\n## Per-lesson averages"]
    for i,l in enumerate(LESSONS,1):
        xs = per[l["id"]]
        if not xs: continue
        md.append(f"- L{i:02d} `{l['id']}` — conf {avg(xs,'conf')} · confu {avg(xs,'confu')} · bore {avg(xs,'bore')} · n={len(xs)}")
    md.append("\n## Per-lesson comments")
    for l in LESSONS:
        cs = comments[l["id"]]
        if not cs: continue
        md.append(f"\n**`{l['id']}` — {l['title']}**")
        for c in cs[:5]: md.append(f"- {c}")
    md.append("\n## Sample verdicts")
    for r in ok[:10]:
        md.append(f"- **{r.get('persona_id')}** ({r['_meta']['archetype']}/{r['_meta']['flag']}): {r.get('overall_verdict','')}")
    if errs:
        md.append(f"\n## Errors ({len(errs)})")
        for e in errs[:5]: md.append(f"- {e.get('persona_id','?')}: {str(e.get('error',''))[:200]}")

    out = OUT_DIR / f"persona-sim-v12_1-business-{stamp}.md"
    out.write_text("\n".join(md),encoding="utf-8")
    print(f"\nDONE in {time.time()-t0:.0f}s\n  md:  {out}\n  raw: {raw}")

if __name__ == "__main__":
    main()

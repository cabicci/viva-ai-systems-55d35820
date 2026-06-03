#!/usr/bin/env python3
"""
Persona Sim v13 — Worst-20 validation.

Picks the 20 personas most likely to have failed v12 (non-tech archetypes
× low-tolerance / hostile-to-jargon flags) and walks them through the NEW
path order (intro → business → creator → automator → analyst → builder)
with the technical-warning blocks injected in Phase 4.

Goal: confirm that re-order + opt-out warnings rescue the worst cohort
without re-running 100 personas.
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

# NEW path order (post Phase 2 re-order)
PATH_ORDER = ["intro", "business", "creator", "automator", "analyst", "builder"]

def list_lessons_for_path(path: str) -> list[str]:
    files = sorted(p.stem for p in LESSONS_DIR.glob(f"{path}-*.ts"))
    def key(lid: str):
        m = re.match(rf"{path}-m(\d+)(?:-l(\d+))?", lid)
        if not m: return (999, 999, lid)
        return (int(m.group(1)), int(m.group(2)) if m.group(2) else 0, lid)
    return sorted(files, key=key)

LESSON_ORDER = [(p, l) for p in PATH_ORDER for l in list_lessons_for_path(p)]
print(f"Total lessons: {len(LESSON_ORDER)}", flush=True)

def summarize(path, lid):
    txt = (LESSONS_DIR / f"{lid}.ts").read_text(encoding="utf-8")
    titles = re.findall(r'title:\s*"([^"]{3,120})"', txt)
    eyebrows = re.findall(r'eyebrow:\s*"([^"]{2,40})"', txt)
    terms = re.findall(r'term:\s*"([^"]{2,60})"', txt)
    has_tech_warn = "تنبيه: درس تقني" in txt
    return {"path": path, "id": lid,
            "title": titles[0] if titles else lid,
            "tags": list(dict.fromkeys(eyebrows))[:4],
            "terms": list(dict.fromkeys(terms))[:4],
            "tech_warn": has_tech_warn}

LESSONS = [summarize(p, l) for p, l in LESSON_ORDER]

# Worst-20 = 10 vulnerable archetypes × 2 worst flags
WORST_ARCHETYPES = [
    ("Curious-Beginner",   "مبتدئ فضولي، 25 سنة، شغّال HR"),
    ("Skeptical-Manager",  "مدير 38 سنة، شاكك، عايز ROI"),
    ("Teacher",            "مدرس 35 سنة، صبور بس بيكره الحشو"),
    ("Doctor",             "دكتور 40 سنة، وقته ضيق جدًا"),
    ("Non-Tech-Founder",   "مؤسس startup 33 سنة، مش programmer"),
    ("Mom-Side-Hustle",    "أم 36 سنة، عندها side business"),
    ("Accountant",         "محاسب 34 سنة، حساس للأرقام والوضوح"),
    ("Real-Estate-Agent",  "سمسار 37 سنة، عايز AI للـ leads"),
    ("Restaurant-Owner",   "صاحب مطعم 41 سنة، مش تقني"),
    ("Lawyer",             "محامي 39 سنة، بيكره المصطلحات"),
]
WORST_FLAGS = [
    ("low-tolerance",      "بيسيب أول ما يحس بضيقة"),
    ("hostile-to-jargon",  "أي مصطلح إنجليزي بدون شرح = هيقفل"),
]
PERSONAS = []
pid = 0
for a in WORST_ARCHETYPES:
    for f in WORST_FLAGS:
        pid += 1
        PERSONAS.append({"id": f"P{pid:02d}", "archetype": a[0], "bio": a[1],
                         "flag": f[0], "behavior": f[1]})
assert len(PERSONAS) == 20

def card(i, l):
    bits = [f"L{i+1:02d} [{l['path']}] {l['id']} — {l['title']}"]
    if l["tech_warn"]: bits.append("   ⚠ تقني — فيه تنبيه opt-out في أول الدرس")
    if l["tags"]: bits.append(f"   tags: {' | '.join(l['tags'])}")
    if l["terms"]: bits.append(f"   مفاهيم: {' • '.join(l['terms'])}")
    return "\n".join(bits)

BLOCK = "\n\n".join(card(i, l) for i, l in enumerate(LESSONS))

SYS = ("إنت شخصية مصرية حقيقية بتقيّم كورس AI فيه 6 مسارات بالترتيب الجديد "
       "(intro→business→creator→automator→analyst→builder). الدروس اللي عليها ⚠ "
       "بتبدأ بتنبيه إنها تقنية وممكن تتخطاها لو مش مهتم. اقرا كل الدروس بالترتيب "
       "ورد JSON بس. متجمّلش — انت user حقيقي.")

USER_TPL = """شخصيتك:
- ID: {pid} · Archetype: {arch} · Bio: {bio}
- Flag: {flag} — {behavior}

الكورس فيه {n} درس بالترتيب الجديد:

{lessons}

ردّ JSON خالص:
{{
  "persona_id":"{pid}",
  "lessons":[{{"i":1,"lid":"...","conf":1-10,"confu":1-10,"bore":1-10,"skipped":true|false,"would_cont":true|false,"quit_here":true|false,"comment":"سطر مصري"}}],
  "final_completion_pct":0-100,
  "quit_at_lesson":رقم أو null,
  "reached_path":"intro|business|creator|automator|analyst|builder",
  "overall_verdict":"سطرين بالعامية",
  "top_5_pain_points":["...","...","...","...","..."],
  "top_3_aha_lessons":["lid","lid","lid"],
  "best_path":"اسم المسار الأقوى",
  "weakest_path":"اسم المسار الأضعف",
  "tech_warning_useful":true|false
}}

كل الـ{n} درس لازم يكونوا في الـarray. لو تخطيت درس تقني خلي skipped:true."""

def call(persona, retries=4):
    msg = USER_TPL.format(pid=persona["id"], arch=persona["archetype"], bio=persona["bio"],
                          flag=persona["flag"], behavior=persona["behavior"],
                          lessons=BLOCK, n=len(LESSONS))
    payload = {"systemInstruction": {"parts": [{"text": SYS}]},
               "contents": [{"role": "user", "parts": [{"text": msg}]}],
               "generationConfig": {"responseMimeType": "application/json",
                                    "temperature": 0.85, "maxOutputTokens": 32000}}
    for a in range(retries):
        k = nk(); url = EP.format(m=MODEL, k=k)
        try:
            r = requests.post(url, json=payload, timeout=240)
            if r.status_code in (429, 503): time.sleep(6 * (a + 1)); continue
            r.raise_for_status()
            jr = r.json()
            cand = jr.get("candidates", [{}])[0]
            txt = "".join(p.get("text", "") for p in cand.get("content", {}).get("parts", []))
            txt = re.sub(r"^```(?:json)?\s*|\s*```$", "", txt.strip())
            return json.loads(txt)
        except Exception as e:
            if a == retries - 1:
                return {"persona_id": persona["id"], "error": str(e)[:200]}
            time.sleep(3 * (a + 1))
    return {"persona_id": persona["id"], "error": "exhausted retries"}

def run_one(p):
    t0 = time.time()
    out = call(p)
    out["_persona"] = p; out["_secs"] = round(time.time() - t0, 1)
    err = "error" in out
    status = "ERR" if err else f"{out.get('final_completion_pct', 0):3}%"
    print(f"  {p['id']} {p['archetype']:20s} {p['flag']:20s} {status} ({out['_secs']}s)", flush=True)
    return out

def main():
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    print(f"Running v13 worst-20 · {len(PERSONAS)} personas × {len(LESSONS)} lessons", flush=True)
    results = []
    with ThreadPoolExecutor(max_workers=8) as ex:
        futs = [ex.submit(run_one, p) for p in PERSONAS]
        for f in as_completed(futs):
            results.append(f.result())

    raw = OUT_DIR / f"persona-sim-v13-worst20-{stamp}-raw.json"
    raw.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nRaw → {raw}", flush=True)

    # Aggregate
    ok = [r for r in results if "error" not in r]
    errs = [r for r in results if "error" in r]
    avg_comp = sum(r.get("final_completion_pct", 0) for r in ok) / max(1, len(ok))
    quits = sum(1 for r in ok if r.get("quit_at_lesson"))
    tech_useful = sum(1 for r in ok if r.get("tech_warning_useful"))

    # path-level
    path_stats = {p: {"conf": [], "confu": [], "bore": [], "skip": 0, "n": 0} for p in PATH_ORDER}
    lid_to_path = {l["id"]: l["path"] for l in LESSONS}
    for r in ok:
        for ln in r.get("lessons", []):
            p = lid_to_path.get(ln.get("lid"))
            if not p: continue
            path_stats[p]["n"] += 1
            for k in ("conf", "confu", "bore"):
                v = ln.get(k)
                if isinstance(v, (int, float)): path_stats[p][k].append(v)
            if ln.get("skipped"): path_stats[p]["skip"] += 1

    md = [f"# Persona Sim v13 — Worst-20 ({stamp})", ""]
    md.append(f"- Personas: {len(PERSONAS)} (ok={len(ok)}, err={len(errs)})")
    md.append(f"- Lessons walked: {len(LESSONS)}")
    md.append(f"- Avg completion: **{avg_comp:.1f}%**")
    md.append(f"- Quit count: **{quits}/{len(ok)}**")
    md.append(f"- Tech-warning useful: **{tech_useful}/{len(ok)}**")
    md.append("")
    md.append("## Path-level averages")
    md.append("| Path | n | avg conf | avg confu | avg bore | skipped |")
    md.append("|---|---:|---:|---:|---:|---:|")
    for p in PATH_ORDER:
        s = path_stats[p]
        avg = lambda x: sum(x) / len(x) if x else 0
        md.append(f"| {p} | {s['n']} | {avg(s['conf']):.2f} | {avg(s['confu']):.2f} | "
                  f"{avg(s['bore']):.2f} | {s['skip']} |")
    md.append("")
    md.append("## Verdicts")
    for r in ok:
        p = r["_persona"]
        md.append(f"### {p['id']} · {p['archetype']} · {p['flag']}")
        md.append(f"- completion: {r.get('final_completion_pct')}% · "
                  f"quit_at: {r.get('quit_at_lesson')} · reached: {r.get('reached_path')}")
        md.append(f"- best: {r.get('best_path')} · weakest: {r.get('weakest_path')} · "
                  f"tech_warn_useful: {r.get('tech_warning_useful')}")
        md.append(f"- verdict: {r.get('overall_verdict','')}")
        pains = r.get("top_5_pain_points") or []
        if pains: md.append(f"- pains: {' · '.join(map(str, pains))}")
        ahas = r.get("top_3_aha_lessons") or []
        if ahas: md.append(f"- ahas: {' · '.join(map(str, ahas))}")
        md.append("")
    if errs:
        md.append("## Errors")
        for r in errs:
            md.append(f"- {r['_persona']['id']}: {r.get('error')}")

    rep = OUT_DIR / f"persona-sim-v13-worst20-{stamp}.md"
    rep.write_text("\n".join(md), encoding="utf-8")
    print(f"Report → {rep}", flush=True)
    print(f"\nDONE · avg={avg_comp:.1f}% · quits={quits}/{len(ok)} · err={len(errs)}", flush=True)

if __name__ == "__main__":
    main()

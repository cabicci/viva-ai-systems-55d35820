#!/usr/bin/env python3
"""
Persona Sim v14 — Worst-20 validation (post three-tier + warning rewrite).

Same 20 personas as v13, but the prompt now explains the three-tier system
(Level 1 AI User · Level 2 AI Operator · Level 3 AI Builder · optional)
and the technical-warning copy is the NEW wording:
"اختياري — للمتقدمين / لو هدفك استخدام AI في شغلك فقط، تقدر تعدّي بأمان".

Adds two diagnostic fields:
- felt_like_engineer (هل حسّيت إنك بتتعلم شغل مبرمج؟) — should be FALSE post-v14
- tier_clarity (1-10) — هل المستويات الثلاثة كانت واضحة؟
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

# v14 path order (Level 1 first, Builder last and optional)
PATH_ORDER = ["intro", "business", "creator", "analyst", "automator", "builder"]

# Tier mapping (matches src/lib/curriculum-data.ts)
PATH_TIER = {
    "intro": "user", "business": "user", "creator": "user", "analyst": "user",
    "automator": "operator", "builder": "builder",
}

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
    # v14 detects the NEW warning copy
    has_tech_warn = "اختياري — للمتقدمين" in txt or "تنبيه: درس تقني" in txt
    return {"path": path, "id": lid, "tier": PATH_TIER[path],
            "title": titles[0] if titles else lid,
            "tags": list(dict.fromkeys(eyebrows))[:4],
            "terms": list(dict.fromkeys(terms))[:4],
            "tech_warn": has_tech_warn}

LESSONS = [summarize(p, l) for p, l in LESSON_ORDER]

# Same Worst-20 cohort as v13
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
    tier_label = {"user": "Lv1·User", "operator": "Lv2·Operator", "builder": "Lv3·Builder·اختياري"}[l["tier"]]
    bits = [f"L{i+1:02d} [{tier_label}] {l['id']} — {l['title']}"]
    if l["tech_warn"]:
        bits.append("   ⚠ اختياري — للمتقدمين · لو هدفك استخدام AI في شغلك بس، عدّيه بأمان")
    if l["tags"]: bits.append(f"   tags: {' | '.join(l['tags'])}")
    if l["terms"]: bits.append(f"   مفاهيم: {' • '.join(l['terms'])}")
    return "\n".join(bits)

BLOCK = "\n\n".join(card(i, l) for i, l in enumerate(LESSONS))

SYS = (
    "إنت شخصية مصرية حقيقية بتقيّم كورس AI. الكورس بقى منظّم في 3 مستويات واضحة:\n"
    "• Level 1 — AI User: استخدام AI في شغلك (intro + business + creator + analyst + Automator m1+m2). ده 80% من اللي محتاجه أي حد.\n"
    "• Level 2 — AI Operator: أتمتة متقدمة (Automator m3+m4 — RAG، agents، webhooks).\n"
    "• Level 3 — AI Builder: بناء منتجات AI كاملة (مسار تقني، اختياري تمامًا — مش المرحلة التالية الطبيعية).\n"
    "الدروس اللي عليها ⚠ بتبدأ بتنبيه واضح إنها اختيارية للمتقدمين فقط. "
    "اقرا كل الدروس بالترتيب ورد JSON بس. متجمّلش — انت user حقيقي."
)

USER_TPL = """شخصيتك:
- ID: {pid} · Archetype: {arch} · Bio: {bio}
- Flag: {flag} — {behavior}

الكورس فيه {n} درس مقسومين على 3 مستويات:

{lessons}

ردّ JSON خالص:
{{
  "persona_id":"{pid}",
  "lessons":[{{"i":1,"lid":"...","conf":1-10,"confu":1-10,"bore":1-10,"skipped":true|false,"would_cont":true|false,"quit_here":true|false,"comment":"سطر مصري"}}],
  "final_completion_pct":0-100,
  "quit_at_lesson":رقم أو null,
  "reached_path":"intro|business|creator|analyst|automator|builder",
  "overall_verdict":"سطرين بالعامية",
  "top_5_pain_points":["...","...","...","...","..."],
  "top_3_aha_lessons":["lid","lid","lid"],
  "best_path":"اسم المسار الأقوى",
  "weakest_path":"اسم المسار الأضعف",
  "tech_warning_useful":true|false,
  "felt_like_engineer":true|false,
  "felt_like_engineer_reason":"سطر — هل حسيت إنك بتتعلم شغل مبرمج؟ امتى؟",
  "tier_clarity":1-10,
  "would_recommend_level1_only":true|false
}}

كل الـ{n} درس لازم يكونوا في الـarray. لو تخطيت درس اختياري خلي skipped:true."""

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
    print(f"Running v14 worst-20 · {len(PERSONAS)} personas × {len(LESSONS)} lessons", flush=True)
    results = []
    with ThreadPoolExecutor(max_workers=8) as ex:
        futs = [ex.submit(run_one, p) for p in PERSONAS]
        for f in as_completed(futs):
            results.append(f.result())

    raw = OUT_DIR / f"persona-sim-v14-worst20-{stamp}-raw.json"
    raw.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nRaw → {raw}", flush=True)

    ok = [r for r in results if "error" not in r]
    errs = [r for r in results if "error" in r]
    avg_comp = sum(r.get("final_completion_pct", 0) for r in ok) / max(1, len(ok))
    quits = sum(1 for r in ok if r.get("quit_at_lesson"))
    tech_useful = sum(1 for r in ok if r.get("tech_warning_useful"))
    felt_eng = sum(1 for r in ok if r.get("felt_like_engineer"))
    avg_tier_clarity = sum(r.get("tier_clarity", 0) for r in ok if isinstance(r.get("tier_clarity"), (int, float))) / max(1, len(ok))
    lvl1_only = sum(1 for r in ok if r.get("would_recommend_level1_only"))

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

    md = [f"# Persona Sim v14 — Worst-20 ({stamp})", ""]
    md.append("Post Phase A+B+C: three-tier + new warning copy.\n")
    md.append(f"- Personas: {len(PERSONAS)} (ok={len(ok)}, err={len(errs)})")
    md.append(f"- Lessons walked: {len(LESSONS)}")
    md.append(f"- **Avg completion: {avg_comp:.1f}%** (v13 baseline: 78.1%)")
    md.append(f"- **Quit count: {quits}/{len(ok)}** (v13: 17)")
    md.append(f"- **Felt like engineer: {felt_eng}/{len(ok)}** (target: ≤4)")
    md.append(f"- **Tier clarity avg: {avg_tier_clarity:.2f}/10**")
    md.append(f"- Tech-warning useful: {tech_useful}/{len(ok)}")
    md.append(f"- Would recommend Level 1 only: {lvl1_only}/{len(ok)}")
    md.append("")
    md.append("## Pass criteria")
    md.append(f"- ✅ Avg completion ≥ 85% → {'PASS' if avg_comp >= 85 else 'FAIL'} ({avg_comp:.1f}%)")
    md.append(f"- ✅ Felt-like-engineer ≤ 4/20 → {'PASS' if felt_eng <= 4 else 'FAIL'} ({felt_eng}/{len(ok)})")
    md.append(f"- ✅ Tier clarity ≥ 7.5 → {'PASS' if avg_tier_clarity >= 7.5 else 'FAIL'} ({avg_tier_clarity:.2f})")
    md.append("")
    md.append("## Path-level averages")
    md.append("| Path | tier | n | avg conf | avg confu | avg bore | skipped |")
    md.append("|---|---|---:|---:|---:|---:|---:|")
    for p in PATH_ORDER:
        s = path_stats[p]
        avg = lambda x: sum(x) / len(x) if x else 0
        md.append(f"| {p} | {PATH_TIER[p]} | {s['n']} | {avg(s['conf']):.2f} | {avg(s['confu']):.2f} | "
                  f"{avg(s['bore']):.2f} | {s['skip']} |")
    md.append("")
    md.append("## Verdicts")
    for r in ok:
        p = r["_persona"]
        md.append(f"### {p['id']} · {p['archetype']} · {p['flag']}")
        md.append(f"- completion: {r.get('final_completion_pct')}% · "
                  f"quit_at: {r.get('quit_at_lesson')} · reached: {r.get('reached_path')}")
        md.append(f"- best: {r.get('best_path')} · weakest: {r.get('weakest_path')}")
        md.append(f"- tier_clarity: {r.get('tier_clarity')} · "
                  f"felt_like_engineer: {r.get('felt_like_engineer')} · "
                  f"tech_warn_useful: {r.get('tech_warning_useful')} · "
                  f"recommend_lvl1_only: {r.get('would_recommend_level1_only')}")
        if r.get("felt_like_engineer_reason"):
            md.append(f"- engineer_reason: {r.get('felt_like_engineer_reason')}")
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

    rep = OUT_DIR / f"persona-sim-v14-worst20-{stamp}.md"
    rep.write_text("\n".join(md), encoding="utf-8")
    print(f"Report → {rep}", flush=True)
    print(f"\nDONE · avg={avg_comp:.1f}% · quits={quits}/{len(ok)} · felt_eng={felt_eng} · err={len(errs)}", flush=True)

if __name__ == "__main__":
    main()

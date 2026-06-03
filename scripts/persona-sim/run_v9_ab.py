#!/usr/bin/env python3
"""v9 step 2 — A/B test current vs suggested block order with 20 agents."""
from __future__ import annotations
import json, os, sys, time, statistics, glob, itertools, threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from pathlib import Path
import requests

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

PERSONAS = [
    ("Designer-Eye", "مصمم UI/UX خبرة 8 سنين. حساس للتسلسل البصري والـ contrast."),
    ("First-Time-Visitor", "أول مرة يدخل المنصة. بيتشتت بسهولة."),
    ("Mobile-User", "موبايل 6 إنش. كل حاجة لازم تكون مقروءة بإيد واحدة."),
    ("Returning-Learner", "زائر متكرر. بيلاحظ inconsistency بسرعة."),
]

PALETTE = "bg أبيض مزرق فاتح | text كحلي | primary أزرق متوسط | accents pastel: mint/lavender/peach/yellow/pink/mintDeep"

SYSTEM = """أنت ناقد بصري. هتشوف نسختين من ترتيب بلوكات درس (A و B) وتختار الأفضل بصرياً.
حكمك على الشكل والترتيب فقط، مش المحتوى. ترد JSON فقط."""

METRICS = ["visual_clarity","hierarchy_strength","color_harmony","block_order_logic",
           "accent_appropriateness","cta_prominence","mobile_readability_guess"]

def latest_suggestions():
    p = OUT_DIR / "persona-sim-v9-suggestions-latest.json"
    if p.exists(): return json.loads(p.read_text(encoding="utf-8"))
    files = sorted(glob.glob(str(OUT_DIR / "persona-sim-v9-suggestions-*.json")))
    return json.loads(Path(files[-1]).read_text(encoding="utf-8"))

def reorder(scenes, order):
    by_i = {s["i"]: s for s in scenes}
    return [{"card": by_i[i]["card"], "accent": by_i[i]["accent"]} for i in order if i in by_i]

def build_prompt(persona, desc, lid, a, b):
    return f"""[Persona] {persona}: {desc}
[Palette] {PALETTE}
[Lesson: {lid}]

النسخة A ({len(a)} بلوك):
{json.dumps(a, ensure_ascii=False)}

النسخة B ({len(b)} بلوك):
{json.dumps(b, ensure_ascii=False)}

قيّم النسختين بصرياً وارجع JSON:
{{
  "A": {{ {", ".join(f'"{m}": 1-10' for m in METRICS)} }},
  "B": {{ {", ".join(f'"{m}": 1-10' for m in METRICS)} }},
  "preference": "A" | "B" | "neutral",
  "reason": "جملة قصيرة عربي ليه"
}}"""

def call_ai(prompt, retries=3):
    for i in range(retries):
        try:
            r = requests.post(ENDPOINT, headers={
                "Authorization": f"Bearer {API_KEY}", "Content-Type":"application/json",
            }, json={
                "model": MODEL,
                "messages":[{"role":"system","content":SYSTEM},{"role":"user","content":prompt}],
                "response_format":{"type":"json_object"},
            }, timeout=60)
            if r.status_code == 429: time.sleep(3*(i+1)); continue
            r.raise_for_status()
            return json.loads(r.json()["choices"][0]["message"]["content"])
        except Exception as e:
            if i == retries-1: return {"error": str(e)[:200]}
            time.sleep(2)

def avg(vals):
    nums = [v for v in vals if isinstance(v,(int,float))]
    return round(statistics.mean(nums), 2) if nums else None

def main():
    sugs = latest_suggestions()
    lessons = {}
    for lid, data in sugs.items():
        sug = data.get("suggestion", {})
        if "error" in sug or "suggested_order" not in sug:
            print(f"⚠️  skip {lid} (no suggestion)", file=sys.stderr); continue
        cur = [{"card":s["card"],"accent":s["accent"]} for s in data["current"]]
        new = reorder(data["current"], sug["suggested_order"])
        if not new or len(new) != len(cur):
            print(f"⚠️  skip {lid} (bad order)", file=sys.stderr); continue
        # randomize A/B per lesson to avoid bias — but we'll fix: A=current, B=suggested, then track
        lessons[lid] = {"current": cur, "suggested": new, "rationale": sug.get("rationale","")}

    # Build tasks: each agent does each lesson; alternate A/B labeling to debias
    tasks = []
    for p_idx, (pname, pdesc) in enumerate(PERSONAS):
        for run in range(5):
            for li, (lid, d) in enumerate(lessons.items()):
                swap = (run + li) % 2 == 1  # half see suggested as A
                A = d["suggested"] if swap else d["current"]
                B = d["current"] if swap else d["suggested"]
                a_is = "suggested" if swap else "current"
                b_is = "current" if swap else "suggested"
                tasks.append((f"{pname}#{run+1}", pname, pdesc, lid, A, B, a_is, b_is))

    print(f"{len(lessons)} lessons × {len(PERSONAS)*5} agents = {len(tasks)} evals", file=sys.stderr)

    results = []
    with ThreadPoolExecutor(max_workers=10) as ex:
        futs = {ex.submit(call_ai, build_prompt(pn,pd,lid,A,B)): (aid,pn,lid,a_is,b_is)
                for (aid,pn,pd,lid,A,B,a_is,b_is) in tasks}
        done = 0
        for f in as_completed(futs):
            aid,pn,lid,a_is,b_is = futs[f]
            res = f.result() or {}
            # Normalize: map preference to "current"/"suggested"
            pref = res.get("preference")
            norm_pref = None
            if pref == "A": norm_pref = a_is
            elif pref == "B": norm_pref = b_is
            elif pref == "neutral": norm_pref = "neutral"
            results.append({
                "agent_id":aid,"persona":pn,"lesson_id":lid,
                "a_is":a_is,"b_is":b_is,
                "scores_current": res.get(a_is.upper()[0]) if False else (res.get("A") if a_is=="current" else res.get("B")),
                "scores_suggested": res.get("A") if a_is=="suggested" else res.get("B"),
                "preference": norm_pref,
                "reason": res.get("reason"),
                "error": res.get("error"),
            })
            done += 1
            if done % 20 == 0: print(f"  {done}/{len(tasks)}", file=sys.stderr)

    ts = datetime.now().strftime("%Y%m%d-%H%M%S")
    raw = OUT_DIR / f"persona-sim-v9-ab-{ts}-raw.json"
    raw.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")

    # Aggregate per lesson
    summary = {}
    for lid in lessons:
        rs = [r for r in results if r["lesson_id"]==lid and not r.get("error")]
        if not rs: continue
        def overall(side):
            per_agent = []
            for r in rs:
                s = r.get(f"scores_{side}") or {}
                vals = [s.get(m) for m in METRICS]
                a = avg(vals)
                if a is not None: per_agent.append(a)
            return avg(per_agent)
        prefs = [r["preference"] for r in rs if r["preference"]]
        n_sug = prefs.count("suggested"); n_cur = prefs.count("current"); n_neu = prefs.count("neutral")
        n = len(prefs)
        cur_o = overall("current"); sug_o = overall("suggested")
        pct_sug = round(100*n_sug/n, 1) if n else 0
        decision = "apply" if pct_sug >= 70 else ("keep" if prefs.count("current")/max(n,1) >= 0.5 else "iterate")
        summary[lid] = {
            "n": n, "current_overall": cur_o, "suggested_overall": sug_o,
            "delta": round((sug_o or 0) - (cur_o or 0), 2),
            "pref_suggested": n_sug, "pref_current": n_cur, "pref_neutral": n_neu,
            "pct_suggested": pct_sug, "decision": decision,
            "rationale": lessons[lid]["rationale"],
        }

    md = [f"# Persona Sim v9 — A/B (current vs suggested)\n",
          f"**التاريخ:** {ts}  ", f"**Model:** `{MODEL}`  ",
          f"**الـ Agents:** 20  ", f"**الدروس:** {len(lessons)}  ",
          f"**إجمالي التقييمات:** {len(results)} (ناجحة: {sum(1 for r in results if not r.get('error'))})\n",
          "## القرار لكل درس\n",
          "| الدرس | current | suggested | Δ | % فضّلوا suggested | القرار |",
          "|---|---|---|---|---|---|"]
    for lid, s in sorted(summary.items(), key=lambda x: -(x[1]["delta"] or 0)):
        md.append(f"| {lid} | {s['current_overall']} | {s['suggested_overall']} | **{s['delta']:+}** | {s['pct_suggested']}% ({s['pref_suggested']}/{s['n']}) | **{s['decision']}** |")

    md.append("\n## تفاصيل\n")
    for lid, s in summary.items():
        md.append(f"### {lid} → `{s['decision']}`")
        md.append(f"- current: **{s['current_overall']}**  vs  suggested: **{s['suggested_overall']}**  (Δ {s['delta']:+})")
        md.append(f"- التصويت: suggested={s['pref_suggested']} · current={s['pref_current']} · neutral={s['pref_neutral']}")
        md.append(f"- منطق الترتيب الجديد: {s['rationale']}")
        sample = [r["reason"] for r in results if r["lesson_id"]==lid and r.get("reason")][:5]
        if sample:
            md.append("- عينة آراء:")
            for x in sample: md.append(f"  - {x}")
        md.append("")

    md.append("## الخلاصة\n")
    apply_ct = sum(1 for s in summary.values() if s["decision"]=="apply")
    iter_ct = sum(1 for s in summary.values() if s["decision"]=="iterate")
    keep_ct = sum(1 for s in summary.values() if s["decision"]=="keep")
    md.append(f"- **apply:** {apply_ct} درس (نطبّق الترتيب الجديد)")
    md.append(f"- **iterate:** {iter_ct} درس (محتاج محاولة تانية)")
    md.append(f"- **keep:** {keep_ct} درس (الحالي أحسن، سيبه)")

    md_path = OUT_DIR / f"persona-sim-v9-ab-{ts}.md"
    md_path.write_text("\n".join(md), encoding="utf-8")
    print(f"✅ {md_path}")
    print(f"✅ {raw}")

if __name__ == "__main__":
    main()
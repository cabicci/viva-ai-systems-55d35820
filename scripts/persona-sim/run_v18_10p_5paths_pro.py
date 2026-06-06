#!/usr/bin/env python3
"""
Persona Sim v18 — 10 personas × (Intro + Business + Automator + Analyst + Creator).

Model: gemini-2.5-pro (direct Gemini API, no Lovable Gateway).
Each persona reads every lesson in module order, submits comment + mission attempt.

Output:
  /mnt/documents/persona-sim-v18-{stamp}.md
  /mnt/documents/persona-sim-v18-{stamp}-raw.json
Checkpoint:
  /mnt/documents/persona-sim-v18-checkpoint.json
"""
from __future__ import annotations
import json, os, re, time, threading
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from pathlib import Path
from itertools import cycle
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

MODEL = "gemini-2.5-pro"
ENDPOINT_TPL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
_key_lock = threading.Lock()
_key_cycle = cycle(KEYS)
def next_key():
    with _key_lock:
        return next(_key_cycle)

PATHS = ["intro", "business", "automator", "analyst", "creator"]

def list_lessons_for_path(path: str) -> list[str]:
    files = sorted(p.stem for p in LESSONS_DIR.glob(f"{path}-*.ts"))
    def key(lid: str):
        m = re.match(rf"{path}-m(\d+)(?:-l(\d+))?", lid)
        if not m: return (999, 999, lid)
        return (int(m.group(1)), int(m.group(2)) if m.group(2) else 0, lid)
    return sorted(files, key=key)

LESSON_ORDER = []
for path in PATHS:
    for l in list_lessons_for_path(path):
        LESSON_ORDER.append((path, l))

print(f"Total lessons: {len(LESSON_ORDER)} " +
      " · ".join(f"{p}={sum(1 for pp,_ in LESSON_ORDER if pp==p)}" for p in PATHS), flush=True)

def extract_lesson(path: str, lid: str) -> dict:
    txt = (LESSONS_DIR / f"{lid}.ts").read_text(encoding="utf-8")
    titles = re.findall(r'title:\s*"([^"]{3,200})"', txt)
    prompts = re.findall(r'prompt:\s*"((?:[^"\\]|\\.){20,2000})"', txt)
    mission = ""
    if prompts:
        mission = max(prompts, key=len).encode().decode("unicode_escape", errors="ignore")
    body_strings = re.findall(r'"([^"]{15,600})"', txt)
    seen = set(); clean = []
    for s in body_strings:
        if s in seen: continue
        if re.match(r"^[a-zA-Z0-9_\-/.]+$", s): continue
        seen.add(s); clean.append(s)
    return {
        "path": path,
        "id": lid,
        "title": titles[0] if titles else lid,
        "section_titles": titles[:12],
        "body_excerpt": "\n".join(clean[:40]),
        "mission_prompt": mission,
    }

LESSONS = [extract_lesson(p, l) for p, l in LESSON_ORDER]

# 10 personas — mixed archetypes & tolerance flags
PERSONAS = [
    {"id":"P01","arch":"Curious-Beginner","bio":"موظفة HR، 25 سنة، أول مرة تجرب AI","flag":"aha-hunter","behavior":"بتدور على لحظة wow بسرعة"},
    {"id":"P02","arch":"Skeptical-Manager","bio":"مدير عمليات، 38 سنة، عايز ROI واضح","flag":"low-tolerance","behavior":"بيقفل أول ما يحس بكلام نظري"},
    {"id":"P03","arch":"Non-Tech-Founder","bio":"مؤسس startup صغيرة، 33 سنة، مش programmer","flag":"medium-tolerance","behavior":"هيكمل لو شاف فايدة عملية"},
    {"id":"P04","arch":"Restaurant-Owner","bio":"صاحب مطعمين، 41 سنة، مش بيحب التكنولوجيا","flag":"hostile-to-jargon","behavior":"أي مصطلح إنجليزي = هيقفل"},
    {"id":"P05","arch":"Engineer","bio":"مهندس سوفتوير 30 سنة","flag":"high-tolerance","behavior":"صبور بس بيمل من الكلام البدائي"},
    {"id":"P06","arch":"Mom-Side-Hustle","bio":"أم 36 سنة، عندها مشروع بيع منزلي","flag":"medium-tolerance","behavior":"وقتها ضيق بس عايزة تتعلم"},
    {"id":"P07","arch":"Accountant","bio":"محاسب 34 سنة، حساس للأرقام والتفاصيل","flag":"hostile-to-jargon","behavior":"عايز أمثلة دقيقة مش عمومية"},
    {"id":"P08","arch":"Student","bio":"طالب جامعة 21 سنة، عايز freelance","flag":"low-tolerance","behavior":"بيتشتت بسرعة لو الدرس طويل"},
    {"id":"P09","arch":"Content-Creator","bio":"منشئة محتوى تيك توك 24 سنة، 50k followers","flag":"medium-tolerance","behavior":"عايزة سكريبتات أسرع"},
    {"id":"P10","arch":"Lawyer","bio":"محامي 39 سنة، بيقرا بتركيز","flag":"hostile-to-jargon","behavior":"بيشكّك في كل كلمة مبهمة"},
]
assert len(PERSONAS) == 10

SYSTEM = (
    "إنت شخصية مصرية حقيقية بتاخد كورس AI، مش chatbot ومتجمّلش. "
    "هتقرا درس واحد بالكامل + المهمة بتاعته، وترد JSON بس. "
    "كل رد لازم يحتوي: تقييمك للدرس، كومنت مفصّل (3-6 جمل بالعامية المصرية)، "
    "وتسليم حقيقي للمهمة لو فيه مهمة (مش تجريدي — اكتب كأنك بتسلّمها فعلاً بتفاصيل من حياتك)."
)

USER_TPL = """شخصيتك:
- ID: {pid}
- Archetype: {arch}
- Bio: {bio}
- Behavior flag: {flag} — {behavior}

الدرس رقم {idx}/{total} | المسار: {path}
العنوان: {title}

أقسام الدرس:
{sections}

ملخّص محتوى الدرس (نصوص من الـ slides):
{body}

{mission_block}

ردّ JSON خالص (مفيش markdown):
{{
  "persona_id": "{pid}",
  "lesson_id": "{lid}",
  "conf": 1-10,
  "confu": 1-10,
  "bore": 1-10,
  "drop_risk": 0-10,
  "would_continue": true|false,
  "quit_here": true|false,
  "aha_moment": true|false,
  "jargon_hits": ["كلمة مبهمة 1", "كلمة 2"],
  "confusion_points": "حاجة مش فهمتها بالضبط — جملة قصيرة",
  "comment": "3-6 جمل بالعامية المصرية — رأيك الحقيقي، ايه عجبك وايه ضايقك",
  "suggestions": "سطر أو 2 اقتراحات للتحسين",
  "mission_attempt": "{mission_default}"
}}"""

MISSION_BLOCK_TPL = """نص المهمة (Mission):
\"\"\"
{mission}
\"\"\"
لازم تسلّم المهمة فعلاً في mission_attempt — اكتب كأنك بتقدّم الـ deliverable بتفاصيل من شخصيتك."""

def call_gemini(persona: dict, idx: int, lesson: dict, retries: int = 4) -> dict:
    has_mission = bool(lesson["mission_prompt"])
    mission_block = MISSION_BLOCK_TPL.format(mission=lesson["mission_prompt"]) if has_mission \
        else "مفيش مهمة في الدرس ده — حط mission_attempt = \"لا توجد مهمة\"."
    mission_default = "تسليم مفصّل للمهمة" if has_mission else "لا توجد مهمة"

    user_msg = USER_TPL.format(
        pid=persona["id"], arch=persona["arch"], bio=persona["bio"],
        flag=persona["flag"], behavior=persona["behavior"],
        idx=idx+1, total=len(LESSONS), path=lesson["path"],
        title=lesson["title"], lid=lesson["id"],
        sections="\n".join(f"- {s}" for s in lesson["section_titles"]),
        body=lesson["body_excerpt"][:4000],
        mission_block=mission_block,
        mission_default=mission_default,
    )
    payload = {
        "systemInstruction": {"parts": [{"text": SYSTEM}]},
        "contents": [{"role": "user", "parts": [{"text": user_msg}]}],
        "generationConfig": {
            "responseMimeType": "application/json",
            "temperature": 0.85,
            "maxOutputTokens": 4000,
        },
    }
    for attempt in range(retries):
        key = next_key()
        url = ENDPOINT_TPL.format(model=MODEL, key=key)
        try:
            r = requests.post(url, json=payload, timeout=180)
            if r.status_code in (429, 503):
                time.sleep(8 * (attempt + 1)); continue
            if r.status_code == 400 and "API key" in r.text:
                time.sleep(2); continue
            r.raise_for_status()
            jr = r.json()
            cand = jr.get("candidates", [{}])[0]
            txt = "".join(p.get("text","") for p in cand.get("content",{}).get("parts",[]))
            if not txt:
                raise RuntimeError(f"empty: {json.dumps(jr)[:200]}")
            txt = re.sub(r"^```(?:json)?\s*|\s*```$", "", txt.strip())
            try:
                data = json.loads(txt)
            except json.JSONDecodeError:
                from json_repair import repair_json
                data = json.loads(repair_json(txt))
            data["persona_id"] = persona["id"]
            data["lesson_id"] = lesson["id"]
            data["_archetype"] = persona["arch"]
            data["_path"] = lesson["path"]
            data["_idx"] = idx + 1
            data["_has_mission"] = has_mission
            return data
        except Exception as e:
            if attempt == retries - 1:
                return {"error": str(e)[:300], "persona_id": persona["id"], "lesson_id": lesson["id"], "_idx": idx+1, "_path": lesson["path"]}
            time.sleep(3 * (attempt + 1))

CKPT = OUT_DIR / "persona-sim-v18-checkpoint.json"

def aslist(v):
    if isinstance(v, list): return v
    if isinstance(v, str) and v.strip(): return [v]
    return []

def main():
    stamp = datetime.utcnow().strftime("%Y%m%d-%H%M%S")
    results = []
    done_keys = set()
    if CKPT.exists():
        try:
            results = json.loads(CKPT.read_text(encoding="utf-8"))
            done_keys = {(r.get("persona_id"), r.get("lesson_id")) for r in results if "error" not in r}
            print(f"Resuming: {len(done_keys)} (persona,lesson) pairs done", flush=True)
        except Exception:
            results = []

    tasks = []
    for p in PERSONAS:
        for i, l in enumerate(LESSONS):
            if (p["id"], l["id"]) in done_keys: continue
            tasks.append((p, i, l))

    total_target = len(PERSONAS) * len(LESSONS)
    print(f"Running {len(tasks)} calls (target total: {total_target})", flush=True)
    t0 = time.time()
    ckpt_lock = threading.Lock()
    # gemini-2.5-pro has lower RPM than flash — keep concurrency modest
    with ThreadPoolExecutor(max_workers=6) as ex:
        futs = {ex.submit(call_gemini, p, i, l): (p, i, l) for (p, i, l) in tasks}
        for n, fut in enumerate(as_completed(futs), 1):
            results.append(fut.result())
            with ckpt_lock:
                CKPT.write_text(json.dumps(results, ensure_ascii=False), encoding="utf-8")
            if n % 10 == 0 or n == len(tasks):
                ok = sum(1 for r in results if "error" not in r)
                print(f"  +{n}/{len(tasks)} done ({ok} ok total) — {time.time()-t0:.0f}s", flush=True)

    raw_path = OUT_DIR / f"persona-sim-v18-{stamp}-raw.json"
    raw_path.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")

    # dedupe by (persona_id, lesson_id)
    dedup = {}
    for r in results:
        k = (r.get("persona_id"), r.get("lesson_id"))
        if "error" in r and k in dedup: continue
        dedup[k] = r
    results = list(dedup.values())

    by_persona = {p["id"]: [] for p in PERSONAS}
    by_lesson = defaultdict(list)
    for r in results:
        if not r: continue
        if r.get("persona_id") in by_persona:
            by_persona[r["persona_id"]].append(r)
        by_lesson[r.get("lesson_id")].append(r)
    for pid in by_persona:
        by_persona[pid].sort(key=lambda x: x.get("_idx", 999))

    lesson_stats = []
    for lesson in LESSONS:
        rows = [r for r in by_lesson[lesson["id"]] if "error" not in r]
        if not rows:
            lesson_stats.append({"lesson": lesson, "n":0}); continue
        avg_conf = sum(r.get("conf",0) for r in rows)/len(rows)
        avg_bore = sum(r.get("bore",0) for r in rows)/len(rows)
        avg_drop = sum(r.get("drop_risk",0) for r in rows)/len(rows)
        ahas = sum(1 for r in rows if r.get("aha_moment"))
        quits = sum(1 for r in rows if r.get("quit_here"))
        jargon = Counter()
        confusions = []
        for r in rows:
            for j in aslist(r.get("jargon_hits")):
                if isinstance(j, str) and j.strip(): jargon[j.strip()] += 1
            for cp in aslist(r.get("confusion_points")):
                if isinstance(cp, str) and cp.strip(): confusions.append(cp.strip())
        lesson_stats.append({
            "lesson": lesson, "n": len(rows),
            "avg_conf": avg_conf, "avg_bore": avg_bore, "avg_drop": avg_drop,
            "ahas": ahas, "quits": quits,
            "jargon": jargon.most_common(5),
            "confusions": confusions[:5],
        })

    md = [
        f"# Persona Sim v18 — 10 personas × (Intro + Business + Automator + Analyst + Creator)",
        f"_generated {stamp} UTC · model {MODEL} · direct Gemini API_\n",
        f"- Personas: {len(PERSONAS)}",
        f"- Lessons per persona: {len(LESSONS)} · " +
        " + ".join(f"{p}={sum(1 for pp,_ in LESSON_ORDER if pp==p)}" for p in PATHS),
        f"- Total responses: {len(results)} (target {total_target})",
        f"- Errors: {sum(1 for r in results if 'error' in r)}\n",
        "---\n",
        "## 1) أعلى 20 درس خطر (drop_risk)\n",
        "| # | Path | Lesson | avg drop | avg bore | avg conf | quits | n |",
        "|---|------|--------|---------:|---------:|---------:|------:|--:|",
    ]
    top_risk = sorted([s for s in lesson_stats if s["n"]>0], key=lambda s: -s["avg_drop"])[:20]
    for i, s in enumerate(top_risk, 1):
        l = s["lesson"]
        md.append(f"| {i} | {l['path']} | `{l['id']}` — {l['title']} | "
                  f"{s['avg_drop']:.1f} | {s['avg_bore']:.1f} | {s['avg_conf']:.1f} | "
                  f"{s['quits']} | {s['n']} |")
    md.append("")

    g_jargon = Counter()
    for s in lesson_stats:
        for term, c in s.get("jargon", []):
            g_jargon[term] += c
    md.append("## 2) أكتر Jargon اتشاف ضايق\n")
    if g_jargon:
        for term, c in g_jargon.most_common(30):
            md.append(f"- `{term}` — {c} مرة")
    else:
        md.append("_(لا يوجد)_")
    md.append("\n---\n")

    md.append("## 3) ملاحظات كل درس\n")
    for s in lesson_stats:
        l = s["lesson"]
        if s["n"] == 0:
            md.append(f"### `{l['id']}` — {l['title']}  _(no data)_\n"); continue
        md.append(f"### [{l['path']}] `{l['id']}` — {l['title']}")
        md.append(f"**stats:** conf {s['avg_conf']:.1f} · bore {s['avg_bore']:.1f} · "
                  f"drop {s['avg_drop']:.1f} · aha {s['ahas']}/{s['n']} · quits {s['quits']}/{s['n']}")
        if s["jargon"]:
            md.append("**jargon:** " + " · ".join(f"`{t}`×{c}" for t,c in s["jargon"]))
        if s["confusions"]:
            md.append("**نقاط الالتباس:**")
            for cp in s["confusions"]:
                md.append(f"- {cp}")
        md.append("")
    md.append("---\n")

    md.append("## 4) رحلة كل برسونا\n")
    for p in PERSONAS:
        rows = by_persona[p["id"]]
        ok = [r for r in rows if "error" not in r]
        avg_conf = round(sum(r.get("conf",0) for r in ok)/max(1,len(ok)), 1)
        avg_bore = round(sum(r.get("bore",0) for r in ok)/max(1,len(ok)), 1)
        avg_drop = round(sum(r.get("drop_risk",0) for r in ok)/max(1,len(ok)), 1)
        quits = [r for r in ok if r.get("quit_here")]
        ahas = [r for r in ok if r.get("aha_moment")]
        md.append(f"### {p['id']} — {p['arch']} ({p['flag']})")
        md.append(f"> {p['bio']} — _{p['behavior']}_\n")
        md.append(f"**Stats:** avg conf={avg_conf} · avg bore={avg_bore} · avg drop={avg_drop} "
                  f"· aha={len(ahas)} · quits={len(quits)}/{len(ok)}\n")
        # top 5 strongest comments (highest drop) + first aha
        sorted_rows = sorted(ok, key=lambda r: -r.get("drop_risk",0))[:6]
        for r in sorted_rows:
            md.append(f"- **[{r.get('_path')}] `{r.get('lesson_id')}`** — drop {r.get('drop_risk')} · "
                      f"conf {r.get('conf')} · bore {r.get('bore')}"
                      + (" · ⚠️ quit" if r.get("quit_here") else "")
                      + (" · ✨ aha" if r.get("aha_moment") else ""))
            cmt = r.get("comment","").strip().replace("\n"," ")
            if cmt: md.append(f"  - 💬 {cmt}")
            sug = r.get("suggestions","")
            if isinstance(sug,list): sug = " / ".join(str(x) for x in sug)
            sug = (sug or "").strip().replace("\n"," ")
            if sug: md.append(f"  - 🔧 {sug}")
        md.append("")

    report_path = OUT_DIR / f"persona-sim-v18-{stamp}.md"
    report_path.write_text("\n".join(md), encoding="utf-8")
    print(f"\nDone.\n  Report: {report_path}\n  Raw:    {raw_path}", flush=True)

if __name__ == "__main__":
    main()

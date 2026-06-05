#!/usr/bin/env python3
"""
Persona Sim v17 — 20 personas × (Intro + Business + Creator) deep walk-through.

Each persona reads every lesson (intro → business → creator in module order),
writes a detailed comment, and attempts the mission. Uses Gemini API DIRECTLY
(4 rotating keys) — NO Lovable AI Gateway, NO Lovable credits.

Output:
  /mnt/documents/persona-sim-v17-{stamp}.md
  /mnt/documents/persona-sim-v17-{stamp}-raw.json
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

MODEL = "gemini-2.5-flash"
ENDPOINT_TPL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
_key_lock = threading.Lock()
_key_cycle = cycle(KEYS)
def next_key():
    with _key_lock:
        return next(_key_cycle)

# ---- 1) Lessons in order --------------------------------------------------
def list_lessons_for_path(path: str) -> list[str]:
    files = sorted(p.stem for p in LESSONS_DIR.glob(f"{path}-*.ts"))
    def key(lid: str):
        m = re.match(rf"{path}-m(\d+)(?:-l(\d+))?", lid)
        if not m: return (999, 999, lid)
        return (int(m.group(1)), int(m.group(2)) if m.group(2) else 0, lid)
    return sorted(files, key=key)

LESSON_ORDER = (
    [("intro", l) for l in list_lessons_for_path("intro")] +
    [("business", l) for l in list_lessons_for_path("business")] +
    [("creator", l) for l in list_lessons_for_path("creator")]
)
print(f"Total lessons: {len(LESSON_ORDER)} "
      f"(intro {sum(1 for p,_ in LESSON_ORDER if p=='intro')}, "
      f"business {sum(1 for p,_ in LESSON_ORDER if p=='business')}, "
      f"creator {sum(1 for p,_ in LESSON_ORDER if p=='creator')})", flush=True)

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

# ---- 2) 20 personas (1 per archetype, mixed psych flags) ------------------
PERSONAS = [
    {"id":"P01","arch":"Curious-Beginner","bio":"موظفة HR، 25 سنة، أول مرة تجرب AI","flag":"aha-hunter","behavior":"بتدور على لحظة wow بسرعة"},
    {"id":"P02","arch":"Skeptical-Manager","bio":"مدير عمليات، 38 سنة، عايز ROI واضح","flag":"low-tolerance","behavior":"بيقفل أول ما يحس بكلام نظري"},
    {"id":"P03","arch":"Non-Tech-Founder","bio":"مؤسس startup صغيرة، 33 سنة، مش programmer","flag":"medium-tolerance","behavior":"هيكمل لو شاف فايدة عملية"},
    {"id":"P04","arch":"Marketer","bio":"marketer 29 سنة، شغّال e-commerce","flag":"aha-hunter","behavior":"عايز tactics يطبّقها بكرة"},
    {"id":"P05","arch":"Restaurant-Owner","bio":"صاحب مطعمين، 41 سنة، مش بيحب التكنولوجيا","flag":"hostile-to-jargon","behavior":"أي مصطلح إنجليزي = هيقفل"},
    {"id":"P06","arch":"Engineer","bio":"مهندس سوفتوير 30 سنة","flag":"high-tolerance","behavior":"صبور بس بيمل من الكلام البدائي"},
    {"id":"P07","arch":"Mom-Side-Hustle","bio":"أم 36 سنة، عندها مشروع بيع منزلي","flag":"medium-tolerance","behavior":"وقتها ضيق بس عايزة تتعلم"},
    {"id":"P08","arch":"Sales-Rep","bio":"مندوب مبيعات B2B 32 سنة","flag":"aha-hunter","behavior":"بيقيس كل حاجة بـ deals"},
    {"id":"P09","arch":"Accountant","bio":"محاسب 34 سنة، حساس للأرقام والتفاصيل","flag":"hostile-to-jargon","behavior":"عايز أمثلة دقيقة مش عمومية"},
    {"id":"P10","arch":"Student","bio":"طالب جامعة 21 سنة، عايز freelance","flag":"low-tolerance","behavior":"بيتشتت بسرعة لو الدرس طويل"},
    {"id":"P11","arch":"Teacher","bio":"مدرّسة ثانوي 35 سنة، بتدور على أدوات تعليمية","flag":"medium-tolerance","behavior":"بتحب الأمثلة الواقعية من حياتها"},
    {"id":"P12","arch":"Designer","bio":"graphic designer 27 سنة، freelancer","flag":"aha-hunter","behavior":"بتدور على workflow أسرع"},
    {"id":"P13","arch":"Doctor","bio":"دكتور 39 سنة، وقته ضيق جداً","flag":"low-tolerance","behavior":"بيقفل لو الدرس طوّل في المقدمة"},
    {"id":"P14","arch":"Retired-60","bio":"موظف متقاعد 60 سنة، بيتعلم كهواية","flag":"high-tolerance","behavior":"صبور بس بيلخبط في المصطلحات"},
    {"id":"P15","arch":"E-commerce-Operator","bio":"صاحب متجر online 31 سنة","flag":"aha-hunter","behavior":"عايز يأتمت كل حاجة"},
    {"id":"P16","arch":"Content-Creator","bio":"منشئة محتوى تيك توك 24 سنة، 50k followers","flag":"medium-tolerance","behavior":"عايزة سكريبتات أسرع"},
    {"id":"P17","arch":"Real-Estate-Agent","bio":"سمسار 37 سنة، عايز AI للـ leads","flag":"hostile-to-jargon","behavior":"بيكره أي كلام تقني مش عملي"},
    {"id":"P18","arch":"Journalist","bio":"صحفي 30 سنة","flag":"high-tolerance","behavior":"بيدوّر على دقة وعمق"},
    {"id":"P19","arch":"Lawyer","bio":"محامي 39 سنة، بيقرا بتركيز","flag":"hostile-to-jargon","behavior":"بيشكّك في كل كلمة مبهمة"},
    {"id":"P20","arch":"HR-Specialist","bio":"HR 28 سنة، عايزة تأتمت توظيف","flag":"medium-tolerance","behavior":"بتركّز على workflow الناس"},
]
assert len(PERSONAS) == 20

# ---- 3) Prompt -------------------------------------------------------------
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

# ---- 4) Gemini call --------------------------------------------------------
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
            r = requests.post(url, json=payload, timeout=120)
            if r.status_code in (429, 503):
                time.sleep(5 * (attempt + 1)); continue
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
            time.sleep(2 * (attempt + 1))

# ---- 5) Run ---------------------------------------------------------------
CKPT = OUT_DIR / "persona-sim-v17-checkpoint.json"

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
    with ThreadPoolExecutor(max_workers=12) as ex:
        futs = {ex.submit(call_gemini, p, i, l): (p, i, l) for (p, i, l) in tasks}
        for n, fut in enumerate(as_completed(futs), 1):
            results.append(fut.result())
            with ckpt_lock:
                CKPT.write_text(json.dumps(results, ensure_ascii=False), encoding="utf-8")
            if n % 20 == 0 or n == len(tasks):
                ok = sum(1 for r in results if "error" not in r)
                print(f"  +{n}/{len(tasks)} done ({ok} ok total) — {time.time()-t0:.0f}s", flush=True)

    raw_path = OUT_DIR / f"persona-sim-v17-{stamp}-raw.json"
    raw_path.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")

    # ----- Build report ----
    by_persona = {p["id"]: [] for p in PERSONAS}
    by_lesson = defaultdict(list)
    for r in results:
        if not r: continue
        if r.get("persona_id") in by_persona:
            by_persona[r["persona_id"]].append(r)
        by_lesson[r.get("lesson_id")].append(r)
    for pid in by_persona:
        by_persona[pid].sort(key=lambda x: x.get("_idx", 999))

    # lesson stats
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
            for j in (r.get("jargon_hits") or []):
                if isinstance(j, str) and j.strip(): jargon[j.strip()] += 1
            cp = r.get("confusion_points")
            if cp and isinstance(cp, str) and cp.strip(): confusions.append(cp.strip())
        lesson_stats.append({
            "lesson": lesson, "n": len(rows),
            "avg_conf": avg_conf, "avg_bore": avg_bore, "avg_drop": avg_drop,
            "ahas": ahas, "quits": quits,
            "jargon": jargon.most_common(5),
            "confusions": confusions[:5],
        })

    md = [
        f"# Persona Sim v17 — 20 personas × (Intro + Business + Creator)",
        f"_generated {stamp} UTC · model {MODEL} · direct Gemini API_\n",
        f"- Personas: {len(PERSONAS)}",
        f"- Lessons per persona: {len(LESSONS)} "
        f"(Intro {sum(1 for p,_ in LESSON_ORDER if p=='intro')} + "
        f"Business {sum(1 for p,_ in LESSON_ORDER if p=='business')} + "
        f"Creator {sum(1 for p,_ in LESSON_ORDER if p=='creator')})",
        f"- Total calls executed: {len(results)}",
        f"- Errors: {sum(1 for r in results if 'error' in r)}\n",
        "---\n",
        "## 1) Executive Summary — أعلى 15 درس خطر (drop_risk)\n",
        "| # | Path | Lesson | avg drop | avg bore | avg conf | quits | n |",
        "|---|------|--------|---------:|---------:|---------:|------:|--:|",
    ]
    top_risk = sorted([s for s in lesson_stats if s["n"]>0], key=lambda s: -s["avg_drop"])[:15]
    for i, s in enumerate(top_risk, 1):
        l = s["lesson"]
        md.append(f"| {i} | {l['path']} | `{l['id']}` — {l['title']} | "
                  f"{s['avg_drop']:.1f} | {s['avg_bore']:.1f} | {s['avg_conf']:.1f} | "
                  f"{s['quits']} | {s['n']} |")
    md.append("")

    # global jargon counter
    g_jargon = Counter()
    for s in lesson_stats:
        for term, c in s.get("jargon", []):
            g_jargon[term] += c
    md.append("## 2) أكتر Jargon اتشاف ضايق\n")
    if g_jargon:
        for term, c in g_jargon.most_common(20):
            md.append(f"- `{term}` — {c} مرة")
    else:
        md.append("_(لا يوجد)_")
    md.append("\n---\n")

    # Per-lesson section
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

    # Per-persona path
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
        for r in rows:
            if "error" in r:
                md.append(f"- L{r.get('_idx','?'):>2} ❌ `{r.get('lesson_id')}` — {r['error']}")
                continue
            flag = "🚪" if r.get("quit_here") else ("💡" if r.get("aha_moment") else "•")
            md.append(f"- L{r['_idx']:>2} {flag} [{r.get('_path')}] `{r['lesson_id']}` "
                      f"(conf {r.get('conf')} · bore {r.get('bore')} · drop {r.get('drop_risk','?')})")
            cm = (r.get("comment") or "").strip().replace("\n"," ")
            if cm:
                md.append(f"   - _{cm}_")
            sg = (r.get("suggestions") or "").strip().replace("\n"," ")
            if sg:
                md.append(f"   - 💡 {sg}")
        md.append("\n---\n")

    md_path = OUT_DIR / f"persona-sim-v17-{stamp}.md"
    md_path.write_text("\n".join(md), encoding="utf-8")

    print(f"\n✅ Done in {time.time()-t0:.0f}s", flush=True)
    print(f"  JSON: {raw_path}", flush=True)
    print(f"  MD:   {md_path}", flush=True)

if __name__ == "__main__":
    main()

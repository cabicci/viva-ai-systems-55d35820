#!/usr/bin/env python3
"""
Persona Sim v10 — 100 personas × intro+builder sequential content review.

Each of 100 Egyptian-Arabic personas walks through 35 lessons (7 intro + 28 builder)
IN ORDER and decides per-lesson:
  - confidence (1-10)
  - confusion (1-10)
  - boredom (1-10)
  - would_continue (bool)
  - quit_here (bool) — first lesson where they bail
  - reason (short string)

One Lovable AI Gateway call per persona (100 total). Uses google/gemini-3-flash-preview.

Output:
  /mnt/documents/persona-sim-v11-post-v4-{stamp}.md
  /mnt/documents/persona-sim-v11-post-v4-{stamp}-raw.json
"""
from __future__ import annotations
import json, os, re, sys, time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from pathlib import Path
import requests

ROOT = Path(__file__).resolve().parents[2]
LESSONS_DIR = ROOT / "src/components/intro/lessons"
OUT_DIR = Path("/mnt/documents")
OUT_DIR.mkdir(parents=True, exist_ok=True)

API_KEY = os.environ["LOVABLE_API_KEY"]
MODEL = "google/gemini-3-flash-preview"
ENDPOINT = "https://ai.gateway.lovable.dev/v1/chat/completions"

# ---- 1) Load + condense lessons ---------------------------------------------
LESSON_ORDER = [
    "intro-m1-l1-what-is-ai",
    "intro-m1-l2-first-prompt",
    "intro-m1-l3-setup-your-ai",
    "intro-m1-l4-ai-can-cannot",
    "intro-m1-l5-ai-vs-software",
    "intro-m1-l6-learn-without-fear",
    "intro-m1-l7-choose-your-path",
    "builder-m1-l1-what-is-llm",
    "builder-m1-l2-tokens-training",
    "builder-m2-l3-prompt-layer",
    "builder-m2-l4-instructions-examples",
    "builder-m2-l5-style-control",
    "builder-m3-l6-context-layer",
    "builder-m3-l7-memory-limits",
    "builder-m4-l8-parameters",
    "builder-m5-l9-transition",
    "builder-m5-l10-frontend",
    "builder-m5-l11-backend-api",
    "builder-m5-l12-database-intro",
    "builder-m5-l12b-mini-win",
    "builder-m6-l13-idea-to-page",
    "builder-m6-l14-wireframe",
    "builder-m6-l15-first-prompt-to-lovable",
    "builder-m6-l16-components-routes",
    "builder-m6-l17-iteration",
    "builder-m6-l18-debugging",
    "builder-m7-l19-tables-columns",
    "builder-m7-l20-relations",
    "builder-m7-l21-queries",
    "builder-m8-l22-sessions-jwt",
    "builder-m8-l23-rls",
    "builder-m9-l24-rag",
    "builder-m9-l25-embeddings",
    "builder-m9-l26-agents",
    "builder-m10-deploy-domain",
    "builder-m10-first-users",
]

def extract_lesson_summary(lid: str) -> dict:
    p = LESSONS_DIR / f"{lid}.ts"
    txt = p.read_text(encoding="utf-8")
    titles = re.findall(r'title:\s*"([^"]{3,120})"', txt)
    eyebrows = re.findall(r'eyebrow:\s*"([^"]{2,40})"', txt)
    terms = re.findall(r'term:\s*"([^"]{2,60})"', txt)
    # crash-grab a short description line near top
    head_title = titles[0] if titles else lid
    key_terms = list(dict.fromkeys(terms))[:6]
    eyebrow_tags = list(dict.fromkeys(eyebrows))[:6]
    return {
        "id": lid,
        "title": head_title,
        "section_titles": titles[:6],
        "eyebrows": eyebrow_tags,
        "terms": key_terms,
    }

LESSONS = [extract_lesson_summary(l) for l in LESSON_ORDER]

# ---- 2) Build 100 personas ---------------------------------------------------
ARCHETYPES = [
    ("Curious-Beginner", "مبتدئ فضولي، عمره 25، شغّال HR، أول مرة يقرّر يدخل AI"),
    ("Skeptical-Manager", "مدير 38 سنة، شاكك في الـ hype، عايز ROI واضح"),
    ("Marketer", "marketer 29 سنة، عايز يستخدم AI في الكونتنت بسرعة"),
    ("Designer", "designer 27 سنة، بصري، بيمل من النصوص الطويلة"),
    ("Teacher", "مدرس 35 سنة، صبور، بيحب التفاصيل"),
    ("Doctor", "دكتور 40 سنة، وقته ضيق، بيدوّر على تطبيق مباشر في شغله"),
    ("Engineer", "مهندس 30 سنة، عنده خلفية تقنية، يمل لو الكلام بدائي"),
    ("Non-Tech-Founder", "مؤسس startup 33 سنة، مش programmer، عايز يبني MVP"),
    ("Student", "طالب جامعة 21 سنة، مفيش فلوس، عايز شغل freelance"),
    ("Sales-Rep", "مندوب مبيعات 32 سنة، عايز يأتمت متابعة العملاء"),
    ("Mom-Side-Hustle", "أم 36 سنة، عندها side business، بتدوّر على أدوات توفر وقت"),
    ("Content-Creator", "creator على TikTok 24 سنة، عايز يسرّع الإنتاج"),
    ("Accountant", "محاسب 34 سنة، حسّاس للأرقام والدقة، بيكره الغموض"),
    ("Project-Manager", "PM 31 سنة، بيفكر في workflows والـ automation"),
    ("Freelance-Dev", "developer freelancer 28 سنة، عايز يضيف AI لخدماته"),
    ("Real-Estate-Agent", "سمسار عقارات 37 سنة، عايز AI للـ leads والرد على عملاء"),
    ("Restaurant-Owner", "صاحب مطعم 41 سنة، عايز يأتمت الطلبات و social media"),
    ("Journalist", "صحفي 30 سنة، عايز AI للبحث والترجمة"),
    ("Lawyer", "محامي 39 سنة، عايز AI لمراجعة العقود"),
    ("HR-Specialist", "HR 28 سنة، عايز AI للـ CV screening والـ outreach"),
]
PSYCH_FLAGS = [
    ("low-tolerance", "بيسيب أول ما يحس بضيقة أو ملل"),
    ("medium-tolerance", "هيكمل لو حاسس إن في فايدة قريبة"),
    ("high-tolerance", "صبور، هيكمل لآخر الكورس لو الـ value واضح"),
    ("hostile-to-jargon", "أي مصطلح إنجليزي تقني بدون شرح بسيط = هيقفل"),
    ("aha-hunter", "بيدوّر على لحظة wow، لو معجباش في أول 5 دروس هيمشي"),
]

def build_personas():
    personas = []
    pid = 0
    for arch in ARCHETYPES:  # 20
        for flag in PSYCH_FLAGS:  # 5 → 100
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

# ---- 3) Build prompt ---------------------------------------------------------
def lesson_card(i: int, l: dict) -> str:
    lines = [f"L{i+1:02d} [{l['id']}] — {l['title']}"]
    if l["eyebrows"]:
        lines.append(f"   tags: {' | '.join(l['eyebrows'])}")
    if l["terms"]:
        lines.append(f"   مفاهيم: {' • '.join(l['terms'])}")
    if l["section_titles"][1:]:
        lines.append(f"   أقسام: {' / '.join(l['section_titles'][1:4])}")
    return "\n".join(lines)

LESSONS_BLOCK = "\n\n".join(lesson_card(i, l) for i, l in enumerate(LESSONS))

SYSTEM = (
    "إنت شخصية مصرية حقيقية بتقيّم كورس AI أونلاين. "
    "هتقرا 35 درس بالترتيب (7 intro + 28 builder) وترد JSON بس. "
    "كل درس هتدي رأيك الصادق: لو حسيت بضيقة قول، لو فهمت قول، "
    "لو حابب تسيب الكورس عند درس معين قول 'quit_here:true' وكمّل الباقي بـ would_continue:false. "
    "متجمّلش، انت بتمثّل user حقيقي عينته متعوّدة على TikTok و YouTube."
)

USER_TPL = """شخصيتك:
- ID: {pid}
- Archetype: {arch}
- Bio: {bio}
- Flag: {flag} — {behavior}

الكورس فيه 35 درس بالترتيب ده:

{lessons}

ردّ JSON واحد بالشكل ده بالظبط (متضيفش markdown):
{{
  "persona_id": "{pid}",
  "lessons": [
    {{"i": 1, "lid": "intro-m1-l1-what-is-ai", "conf": 1-10, "confu": 1-10, "bore": 1-10, "would_cont": true|false, "quit_here": true|false, "reason": "سطر واحد مصري"}},
    ...
  ],
  "final_completion_pct": 0-100,
  "quit_at_lesson": رقم الدرس اللي سبت عنده أو null,
  "overall_verdict": "سطرين بالعامية — هتكمل تروح Creator/Automator؟ ليه؟",
  "top_3_pain_points": ["...", "...", "..."],
  "biggest_aha_moment_lesson_id": "lesson_id أو null"
}}

كل الـ 35 درس لازم يكونوا في الـ array. لو سيبت عند L12 يبقى من L13→L35 كلهم would_cont:false."""

# ---- 4) Call gateway ---------------------------------------------------------
def call_one(persona: dict, retries: int = 3) -> dict:
    user_msg = USER_TPL.format(
        pid=persona["id"],
        arch=persona["archetype"],
        bio=persona["bio"],
        flag=persona["flag"],
        behavior=persona["behavior"],
        lessons=LESSONS_BLOCK,
    )
    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM},
            {"role": "user", "content": user_msg},
        ],
        "response_format": {"type": "json_object"},
    }
    headers = {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}
    for attempt in range(retries):
        try:
            r = requests.post(ENDPOINT, headers=headers, json=payload, timeout=180)
            if r.status_code == 429:
                time.sleep(8 * (attempt + 1)); continue
            if r.status_code == 402:
                return {"error": "credits_exhausted", "persona_id": persona["id"]}
            r.raise_for_status()
            content = r.json()["choices"][0]["message"]["content"]
            data = json.loads(content)
            data["_meta"] = {"archetype": persona["archetype"], "flag": persona["flag"]}
            return data
        except Exception as e:
            if attempt == retries - 1:
                return {"error": str(e), "persona_id": persona["id"]}
            time.sleep(3 * (attempt + 1))
    return {"error": "max_retries", "persona_id": persona["id"]}

# ---- 5) Run + aggregate ------------------------------------------------------
def main():
    stamp = datetime.utcnow().strftime("%Y%m%d-%H%M%S")
    results = []
    print(f"Running 100 personas × {len(LESSONS)} lessons via {MODEL}...", flush=True)
    t0 = time.time()
    with ThreadPoolExecutor(max_workers=10) as ex:
        futs = {ex.submit(call_one, p): p for p in PERSONAS}
        for i, fut in enumerate(as_completed(futs), 1):
            res = fut.result()
            results.append(res)
            if i % 10 == 0:
                ok = sum(1 for r in results if "error" not in r)
                print(f"  {i}/100 done ({ok} ok) — {time.time()-t0:.0f}s", flush=True)

    raw_path = OUT_DIR / f"persona-sim-v11-post-v4-{stamp}-raw.json"
    raw_path.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")

    # ---- aggregate ----
    ok = [r for r in results if "error" not in r and "lessons" in r]
    errs = [r for r in results if "error" in r]

    quit_counts = {}
    completion = []
    continue_to_creator = 0
    pain_points = {}
    aha_lessons = {}
    per_lesson_metrics: dict[str, list] = {l["id"]: [] for l in LESSONS}

    for r in ok:
        completion.append(r.get("final_completion_pct", 0))
        verdict = (r.get("overall_verdict") or "").lower()
        if any(w in verdict for w in ["هكمل", "هاكمل", "اكمل", "ايوة", "تمام", "creator"]):
            continue_to_creator += 1
        q = r.get("quit_at_lesson")
        if q:
            quit_counts[q] = quit_counts.get(q, 0) + 1
        for pp in (r.get("top_3_pain_points") or [])[:3]:
            pain_points[pp] = pain_points.get(pp, 0) + 1
        aha = r.get("biggest_aha_moment_lesson_id")
        if aha:
            aha_lessons[aha] = aha_lessons.get(aha, 0) + 1
        for lr in r.get("lessons", []):
            lid = lr.get("lid")
            if lid in per_lesson_metrics:
                per_lesson_metrics[lid].append(lr)

    def avg(xs, k):
        vals = [x.get(k) for x in xs if isinstance(x.get(k), (int, float))]
        return round(sum(vals) / len(vals), 2) if vals else None

    md = [f"# Persona Sim v11 — Post-v4 content overhaul (100 personas × {len(LESSONS)} lessons)\n"]
    md.append(f"**Source:** `{raw_path.name}`")
    md.append(f"**Model:** {MODEL}")
    md.append(f"**OK:** {len(ok)}/100 · **Errors:** {len(errs)}\n")
    md.append("## Overall")
    md.append(f"- Avg expected completion: **{round(sum(completion)/len(completion),1) if completion else 0}%**")
    md.append(f"- Personas saying they'd continue to Creator/Automator: **{continue_to_creator}/{len(ok)}**\n")

    md.append("## Quit distribution (lesson index)")
    for k in sorted(quit_counts):
        md.append(f"- L{k}: **{quit_counts[k]}** personas")
    md.append("")

    md.append("## Per-lesson averages (conf / confu / bore)")
    for i, l in enumerate(LESSONS, 1):
        xs = per_lesson_metrics[l["id"]]
        if not xs: continue
        md.append(f"- L{i:02d} `{l['id']}` — conf {avg(xs,'conf')} · confu {avg(xs,'confu')} · bore {avg(xs,'bore')} · n={len(xs)}")
    md.append("")

    md.append("## Top pain points (mentions)")
    for pp, c in sorted(pain_points.items(), key=lambda x: -x[1])[:15]:
        md.append(f"- **{c}×** {pp}")
    md.append("")

    md.append("## Aha-moment lessons")
    for lid, c in sorted(aha_lessons.items(), key=lambda x: -x[1])[:10]:
        md.append(f"- **{c}×** {lid}")
    md.append("")

    md.append("## Sample verdicts (first 10)")
    for r in ok[:10]:
        md.append(f"- **{r.get('persona_id')}** ({r['_meta']['archetype']}/{r['_meta']['flag']}): {r.get('overall_verdict','')}")
    md.append("")

    if errs:
        md.append(f"## Errors\n- {len(errs)} personas failed")
        for e in errs[:5]:
            md.append(f"  - {e.get('persona_id')}: {e.get('error','?')[:120]}")

    md_path = OUT_DIR / f"persona-sim-v11-post-v4-{stamp}.md"
    md_path.write_text("\n".join(md), encoding="utf-8")
    print(f"\nDONE in {time.time()-t0:.0f}s")
    print(f"  md:  {md_path}")
    print(f"  raw: {raw_path}")

if __name__ == "__main__":
    main()

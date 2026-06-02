#!/usr/bin/env python3
"""
Persona Sim v8 — Visual-only lesson evaluation.

Evaluates the SHAPE of lesson pages (block order, accents, palette, density)
— NOT the content. Uses Lovable AI Gateway directly.

Output:
  /mnt/documents/persona-sim-v8-visual-{N}-agents-{stamp}.md
  /mnt/documents/persona-sim-v8-visual-{N}-agents-{stamp}-raw.json
"""
from __future__ import annotations
import json, os, re, sys, time, statistics
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from pathlib import Path
import requests

ROOT = Path(__file__).resolve().parents[2]
LESSONS_DIR = ROOT / "remotion/src/lessons-generated"
OUT_DIR = Path("/mnt/documents")

API_KEY = os.environ["LOVABLE_API_KEY"]
MODEL = "google/gemini-3-flash-preview"
ENDPOINT = "https://ai.gateway.lovable.dev/v1/chat/completions"

SAMPLE = [
    "intro-m1-l3-setup-your-ai",
    "builder-m1-what-is-llm",
    "builder-m3-context-layer",
    "creator-m2-hook",
    "automator-m1-systems-view",
    "analyst-m2-three-sources",
    "analyst-m3-decision-rule",
    "business-m1-weekly-rhythm",
]

PERSONAS = [
    ("Designer-Eye", "مصمم UI/UX خبرة 8 سنين. حساس جدًا للتسلسل البصري والـ alignment والـ contrast."),
    ("First-Time-Visitor", "شخص أول مرة يدخل المنصة. مش متعود على dark/light themes. بيتشتت بسهولة."),
    ("Mobile-User", "بيستخدم موبايل 6 إنش. كل حاجة لازم تكون مقروءة بإيد واحدة وبدون zoom."),
    ("Returning-Learner", "زائر من قبل. عينه اتعودت على شكل المنصة. بيلاحظ inconsistency بسرعة."),
]

PALETTE = {
    "background": "oklch(0.995 0.003 230) — أبيض مزرق فاتح جدًا",
    "foreground": "oklch(0.30 0.04 260) — كحلي غامق للنص",
    "primary": "oklch(0.62 0.08 235) — أزرق متوسط (CTA)",
    "accent": "oklch(0.88 0.06 165) — أخضر منت فاتح",
    "secondary": "oklch(0.90 0.045 20) — بيج وردي فاتح",
    "muted": "oklch(0.97 0.012 230) — رمادي مزرق فاتح",
    "destructive": "oklch(0.65 0.16 25) — أحمر/برتقالي",
    "card_accents": "mint, lavender, peach, yellow, pink, mintDeep — pastels على bg فاتح",
}

SCENE_RE = re.compile(r"export const SCENES:[^=]*=\s*(\[[\s\S]*?\])\s+as SceneData\[\];", re.M)

def extract_scenes(lesson_id: str):
    p = LESSONS_DIR / f"{lesson_id}.gen.ts"
    if not p.exists():
        return None
    txt = p.read_text(encoding="utf-8")
    m = SCENE_RE.search(txt)
    if not m:
        return None
    # Convert TS object literal to JSON-ish: keys are already quoted in these files
    raw = m.group(1)
    try:
        scenes = json.loads(raw)
    except Exception:
        return None
    # Reduce each scene to {card, accent, role-hint}
    out = []
    for s in scenes:
        out.append({
            "card": s.get("card"),
            "accent": s.get("accent"),
            "has_title": bool(s.get("title")),
            "has_compare": s.get("card") == "CompareCard",
            "has_bullets_count": len(s.get("bullets") or []),
            "is_cta": s.get("card") == "CTACard",
        })
    return out

SYSTEM = """أنت ناقد بصري للواجهات (UI/UX critic).
مهمتك: تقييم شكل صفحة درس (block order + accents + palette) بدون أي حكم على المحتوى.
ترد JSON فقط بدون أي نص إضافي."""

def build_user_prompt(persona_name, persona_desc, lesson_id, scenes):
    return f"""[Persona] {persona_name}: {persona_desc}

[Platform Palette]
{json.dumps(PALETTE, ensure_ascii=False, indent=2)}

[Lesson: {lesson_id}]
block sequence ({len(scenes)} blocks):
{json.dumps(scenes, ensure_ascii=False, indent=2)}

قيّم الشكل البصري بس (مش المحتوى). ارجع JSON بهذا الشكل بالظبط:
{{
  "visual_clarity": 1-10,
  "hierarchy_strength": 1-10,
  "color_harmony": 1-10,
  "block_order_logic": 1-10,
  "density_feel": "cramped|comfortable|empty",
  "accent_appropriateness": 1-10,
  "cta_prominence": 1-10,
  "mobile_readability_guess": 1-10,
  "top_issue": "جملة واحدة عربي قصيرة",
  "reorder_suggestion": "اقتراح إعادة ترتيب (أو null لو الترتيب كويس)"
}}"""

def call_ai(prompt, retries=3):
    for i in range(retries):
        try:
            r = requests.post(ENDPOINT, headers={
                "Authorization": f"Bearer {API_KEY}",
                "Content-Type": "application/json",
            }, json={
                "model": MODEL,
                "messages": [
                    {"role": "system", "content": SYSTEM},
                    {"role": "user", "content": prompt},
                ],
                "response_format": {"type": "json_object"},
            }, timeout=60)
            if r.status_code == 429:
                time.sleep(3 * (i+1)); continue
            r.raise_for_status()
            txt = r.json()["choices"][0]["message"]["content"]
            return json.loads(txt)
        except Exception as e:
            if i == retries - 1:
                return {"error": str(e)[:200]}
            time.sleep(2)
    return {"error": "exhausted"}

def main():
    lessons = {}
    for lid in SAMPLE:
        s = extract_scenes(lid)
        if s is None:
            print(f"⚠️  skip {lid} (no scenes)", file=sys.stderr)
            continue
        lessons[lid] = s
    print(f"loaded {len(lessons)} lessons, {len(PERSONAS)} personas, 5 agents/persona", file=sys.stderr)

    tasks = []
    for p_idx, (pname, pdesc) in enumerate(PERSONAS):
        for run in range(5):  # 5 agents per persona = 20 total
            for lid, scenes in lessons.items():
                tasks.append((f"{pname}#{run+1}", pname, pdesc, lid, scenes))
    print(f"total evals: {len(tasks)}", file=sys.stderr)

    results = []
    with ThreadPoolExecutor(max_workers=10) as ex:
        futs = {ex.submit(call_ai, build_user_prompt(pn, pd, lid, sc)): (aid, pn, lid)
                for (aid, pn, pd, lid, sc) in tasks}
        done = 0
        for f in as_completed(futs):
            aid, pn, lid = futs[f]
            res = f.result()
            results.append({"agent_id": aid, "persona": pn, "lesson_id": lid, **res})
            done += 1
            if done % 20 == 0:
                print(f"  {done}/{len(tasks)}", file=sys.stderr)

    ts = datetime.now().strftime("%Y%m%d-%H%M%S")
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    raw_path = OUT_DIR / f"persona-sim-v8-visual-20-agents-{ts}-raw.json"
    raw_path.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")

    # Aggregate
    METRICS = ["visual_clarity","hierarchy_strength","color_harmony","block_order_logic",
               "accent_appropriateness","cta_prominence","mobile_readability_guess"]
    by_lesson = {lid: [] for lid in lessons}
    for r in results:
        if "error" not in r and r["lesson_id"] in by_lesson:
            by_lesson[r["lesson_id"]].append(r)

    def avg(vals):
        nums = [v for v in vals if isinstance(v, (int, float))]
        return round(statistics.mean(nums), 2) if nums else None

    lesson_summary = {}
    for lid, rs in by_lesson.items():
        row = {m: avg([r.get(m) for r in rs]) for m in METRICS}
        density = [r.get("density_feel") for r in rs if r.get("density_feel")]
        row["density_mode"] = max(set(density), key=density.count) if density else None
        row["n"] = len(rs)
        row["overall"] = avg([row[m] for m in METRICS if row[m] is not None])
        row["top_issues"] = [r.get("top_issue") for r in rs[:6] if r.get("top_issue")]
        row["reorder_suggestions"] = [r.get("reorder_suggestion") for r in rs if r.get("reorder_suggestion")][:5]
        lesson_summary[lid] = row

    sorted_lessons = sorted(lesson_summary.items(), key=lambda x: x[1]["overall"] or 0)
    worst3 = sorted_lessons[:3]
    best3 = sorted_lessons[-3:][::-1]

    # Markdown report
    md = [f"# Persona Sim v8 — تقييم بصري للدروس\n",
          f"**التاريخ:** {ts}  ",
          f"**Model:** `{MODEL}`  ",
          f"**الـ Agents:** 20 ({len(PERSONAS)} personas × 5)  ",
          f"**الدروس:** {len(lessons)}  ",
          f"**إجمالي التقييمات:** {len(results)}  ",
          f"**ناجحة:** {sum(1 for r in results if 'error' not in r)}\n",
          "## الخلاصة السريعة\n",
          "تقييم بصري فقط — شكل الصفحة، ترتيب البلوكات، الألوان، الـ accents. **مش تقييم محتوى.**\n",
          "## أسوأ 3 دروس بصرياً\n"]
    for lid, row in worst3:
        md.append(f"- **{lid}** — overall: `{row['overall']}` | clarity: {row['visual_clarity']} | hierarchy: {row['hierarchy_strength']} | density: {row['density_mode']}")
    md.append("\n## أحسن 3 دروس بصرياً\n")
    for lid, row in best3:
        md.append(f"- **{lid}** — overall: `{row['overall']}` | clarity: {row['visual_clarity']} | hierarchy: {row['hierarchy_strength']}")

    md.append("\n## Heatmap (المتوسط لكل مقياس × درس)\n")
    md.append("| الدرس | clarity | hierarchy | color | order | accent | cta | mobile | density | **overall** |")
    md.append("|---|---|---|---|---|---|---|---|---|---|")
    for lid, row in sorted_lessons:
        md.append(f"| {lid} | {row['visual_clarity']} | {row['hierarchy_strength']} | {row['color_harmony']} | {row['block_order_logic']} | {row['accent_appropriateness']} | {row['cta_prominence']} | {row['mobile_readability_guess']} | {row['density_mode']} | **{row['overall']}** |")

    md.append("\n## تفاصيل كل درس\n")
    for lid, row in sorted_lessons:
        md.append(f"### {lid}  (overall: {row['overall']})")
        md.append(f"- **كثافة:** {row['density_mode']}  |  **عدد التقييمات:** {row['n']}")
        if row["top_issues"]:
            md.append("- **أبرز المشاكل:**")
            for it in row["top_issues"][:5]:
                md.append(f"  - {it}")
        if row["reorder_suggestions"]:
            md.append("- **اقتراحات إعادة ترتيب:**")
            for s in row["reorder_suggestions"][:3]:
                md.append(f"  - {s}")
        md.append("")

    # Cross-cutting recommendations
    all_reorders = [r.get("reorder_suggestion") for r in results if r.get("reorder_suggestion")]
    md.append(f"## Top اقتراحات إعادة ترتيب (إجمالي: {len(all_reorders)})\n")
    for s in all_reorders[:10]:
        md.append(f"- {s}")

    md_path = OUT_DIR / f"persona-sim-v8-visual-20-agents-{ts}.md"
    md_path.write_text("\n".join(md), encoding="utf-8")
    print(f"✅ {md_path}")
    print(f"✅ {raw_path}")

if __name__ == "__main__":
    main()
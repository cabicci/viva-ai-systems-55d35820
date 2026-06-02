#!/usr/bin/env python3
"""
Persona Simulator v5 — 30 realistic Egyptian-Arabic learners walk the whole platform.

- Uses Gemini API directly (not Lovable Gateway) with round-robin across 4 keys
- 30 personas across 6 behavioral groups
- Walks intro → builder → creator → automator → analyst → business (or persona's chosen start)
- Each lesson: ONE Gemini call returns full metrics JSON
- Voluntary continue/quit per lesson; overwhelmed personas REALLY quit
- Pulls lesson excerpts from knowledge_chunks when available
- Outputs: /mnt/documents/persona-sim-v5-{timestamp}.md  +  raw.json
"""
from __future__ import annotations

import argparse
import itertools
import json
import os
import random
import statistics
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Any

import requests

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

GEMINI_KEYS = [k for k in [
    os.environ.get("GEMINI_API_KEY"),
    os.environ.get("GEMINI_API_KEY_2"),
    os.environ.get("GEMINI_API_KEY_3"),
    os.environ.get("GEMINI_API_KEY_4"),
] if k]
assert GEMINI_KEYS, "No GEMINI_API_KEY* env vars found"

GEMINI_MODEL = "gemini-2.5-flash"
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"

# Filter out dead keys at startup so round-robin never hits them
def _validate_keys(keys: list[str]) -> list[str]:
    good = []
    for i, k in enumerate(keys, 1):
        try:
            r = requests.post(
                f"{GEMINI_URL}?key={k}",
                json={"contents": [{"parts": [{"text": "ok"}]}]},
                timeout=10,
            )
            if r.status_code == 200:
                good.append(k)
                print(f"  ✓ key #{i} valid")
            else:
                print(f"  ✗ key #{i} dead ({r.status_code}) — skipping")
        except Exception as e:
            print(f"  ✗ key #{i} error: {e} — skipping")
    return good

print(f"🔑 Validating {len(GEMINI_KEYS)} Gemini keys...")
GEMINI_KEYS = _validate_keys(GEMINI_KEYS)
assert GEMINI_KEYS, "All Gemini keys are dead"

_key_cycle = itertools.cycle(GEMINI_KEYS)
_key_lock = __import__("threading").Lock()
def next_key() -> str:
    with _key_lock:
        return next(_key_cycle)

ROOT = Path(__file__).parent
LESSONS_FILE = ROOT / "lessons.json"
OUT_DIR = Path("/mnt/documents")
OUT_DIR.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------------------
# Lessons
# ---------------------------------------------------------------------------
ALL_LESSONS: list[dict] = json.loads(LESSONS_FILE.read_text())

# Group lessons by path for ordered traversal
def lessons_for_path(path_id: str) -> list[dict]:
    return [l for l in ALL_LESSONS if l["path"] == path_id]

PATH_ORDER = ["intro", "builder", "creator", "automator", "analyst", "business"]

# ---------------------------------------------------------------------------
# Personas (30)
# ---------------------------------------------------------------------------
@dataclass
class Persona:
    slug: str
    name: str
    group: str
    age: int
    background: str
    tech_level: str   # zero | low | medium | high
    personality: str
    weakness: str
    behavior: str
    starting_path: str = "intro"      # where they actually begin
    skip_intro: bool = False
    quit_threshold: int = 7           # overwhelm score that triggers quit
    max_lessons: int = 95             # hard cap (some personas only do 5-10)
    patience: int = 5                 # 1..10

    # runtime
    journey: list[dict] = field(default_factory=list)
    quit_at: str | None = None
    quit_reason: str | None = None
    final_energy: int = 5


PERSONAS: list[Persona] = [
    # === GROUP 1 — TRUE BEGINNERS (8) ===
    Persona("g1-ahmed-patient", "أحمد المبتدئ الصبور", "True Beginners", 24, "خريج تجارة",
        "zero", "صبور، متواضع، فضولي", "بيخاف من الكلمات الإنجليزي",
        "بيقرا كل حاجة، بيدّي المنصة فرصة، بيسأل المساعد، بيكمّل غير لو اتلخبط جدًا",
        patience=8, quit_threshold=9),
    Persona("g1-ahmed-impatient", "أحمد المبتدئ النافد الصبر", "True Beginners", 24, "Sales",
        "zero", "نافد الصبر", "تركيزه قليل",
        "بيتخطى الشرح الطويل، بيقفل لو الدرس صعب، بيكره التعقيد، عايز مكاسب سريعة",
        patience=2, quit_threshold=5, max_lessons=15),
    Persona("g1-fearful", "المبتدئ الخواف", "True Beginners", 35, "محاسب",
        "zero", "قلقان", "بيفتكر الـ AI والكود حاجة مرعبة",
        "بيعمل panic من الكلمات التقنية، محتاج طمأنة، حساس لإحساس البرمجة",
        patience=4, quit_threshold=4, max_lessons=20),
    Persona("g1-slow", "المتعلم البطيء", "True Beginners", 42, "صاحب محل صغير",
        "low", "صبور بس بطيء", "محتاج تكرار",
        "بيتلخبط بسهولة، بيتعب من كتر المفاهيم",
        patience=7, quit_threshold=6),
    Persona("g1-fragile", "السريع الهش", "True Beginners", 28, "Freelancer",
        "medium", "ثقته تنهار فجأة", "هشاشة نفسية",
        "بيفهم بسرعة بس لو درس واحد بان مستحيل بيقفل",
        patience=5, quit_threshold=5, max_lessons=30),
    Persona("g1-english-phobic", "اللي بيكره الإنجليزي", "True Beginners", 31, "HR",
        "zero", "حساس للمصطلحات", "ردة فعل قوية على الكلمات الإنجليزي",
        "بيقيس الإرهاق من كم مصطلح إنجليزي ف الدرس",
        patience=4, quit_threshold=5),
    Persona("g1-distracted", "المتعلم المشتت", "True Beginners", 30, "موظف مشغول",
        "low", "مشتت", "بينسى الدروس اللي فاتت",
        "Sessions قصيرة، بيتقاطع، بينسى",
        patience=3, quit_threshold=6, max_lessons=20),
    Persona("g1-skeptic", "المبتدئ المشكّك", "True Beginners", 27, "Marketing",
        "low", "مشكّك", "بيسأل ليه أنا محتاج ده؟",
        "بيسأل دايمًا: ده هيفيدني في إيه؟",
        patience=4, quit_threshold=6, max_lessons=25),

    # === GROUP 2 — BUSINESS USERS (6) ===
    Persona("g2-sb-owner", "صاحب بزنس صغير", "Business Users", 38, "تجارة محلية",
        "low", "براجماتي", "بيكره النظري", "ROI focused — عايز فايدة عملية",
        starting_path="business", patience=5, quit_threshold=6),
    Persona("g2-furniture", "صاحب مصنع موبيليا", "Business Users", 45, "تصنيع",
        "zero", "صنايعي", "بيخاف من الكلام الأكاديمي",
        "محتاج أمثلة من البزنس بتاعه بالظبط",
        starting_path="business", patience=5, quit_threshold=5),
    Persona("g2-agency", "صاحب وكالة تسويق", "Business Users", 33, "Marketing",
        "medium", "ذكي تجاريًا", "بيقيس كل حاجة بالـ ROI",
        "بيسأل: ده هيوفّر فلوس أو وقت لفريقي ولا لأ؟",
        starting_path="business", patience=6, quit_threshold=7),
    Persona("g2-restaurant", "صاحب مطعم", "Business Users", 40, "F&B",
        "low", "عملي", "مفيش وقت للتفاصيل",
        "عايز يعرف ينفّذ إزاي في مطعمه بالظبط",
        starting_path="automator", patience=4, quit_threshold=5),
    Persona("g2-broker", "سمسار عقارات", "Business Users", 36, "Real Estate",
        "low", "Sales-driven", "بيقيس النتايج فلوس",
        "كل سؤاله: هتزوّد العمولة بتاعتي إزاي؟",
        starting_path="business", patience=5, quit_threshold=6),
    Persona("g2-exec", "Executive مشغول", "Business Users", 47, "Corporate",
        "medium", "وقته قليل", "مفيش صبر للأكاديميات",
        "عايز strategic insight بسرعة، بيسيب اللحظة اللي يحس فيها بإطالة",
        starting_path="business", patience=3, quit_threshold=5, max_lessons=10),

    # === GROUP 3 — CRITICS & TOUGH USERS (5) ===
    Persona("g3-tech-critic", "الناقد التقني", "Critics", 32, "مهندس برمجيات",
        "high", "صارم", "بيكتشف الغموض",
        "بيعاقب التبسيط الزيادة، بيدوّر على دقة تقنية",
        patience=4, quit_threshold=8),
    Persona("g3-aggressive", "المراجع الحاد", "Critics", 30, "Reviewer",
        "medium", "حاد", "صبره قليل جدًا",
        "Feedback قاسي، بيقفل بسرعة",
        patience=2, quit_threshold=4, max_lessons=15),
    Persona("g3-scam-detector", "كاشف النصب", "Critics", 29, "صحفي",
        "medium", "low trust", "حساس للمبالغة",
        "أول ما يحس بـ over-promise بيقفل",
        patience=3, quit_threshold=4, max_lessons=10),
    Persona("g3-overthinker", "المفرّط في التفكير", "Critics", 34, "Researcher",
        "medium", "بيلف على نفسه", "Confusion loops",
        "بيدخل في تساؤلات لا نهائية ويضيع",
        patience=6, quit_threshold=7),
    Persona("g3-negative", "الشخصية السلبية", "Critics", 36, "Cynic",
        "low", "بيفترض الفشل", "صعب الإقناع",
        "بيبدأ متوقع إن المنصة وحشة وبيدوّر على دليل",
        patience=3, quit_threshold=5, max_lessons=12),

    # === GROUP 4 — HIGH PERFORMERS (4) ===
    Persona("g4-self-learner", "المتعلم الذاتي", "High Performers", 26, "طالب",
        "medium", "نشيط", "بيمل من البطء",
        "بيفهم بسرعة وبيتنرفز لو المنصة بتمشي بطيء",
        patience=6, quit_threshold=7),
    Persona("g4-ai-enthusiast", "متحمس AI", "High Performers", 25, "تقني هاوي",
        "high", "متحمس", "عنده توقعات عالية جدًا",
        "بيدوّر على عمق تقني، بيتخيب لو لقى تبسيط",
        patience=5, quit_threshold=7),
    Persona("g4-fast-builder", "Builder سريع", "High Performers", 28, "Developer",
        "high", "Builder عملي", "بيدوّر شغل، مش نظريات",
        "بيقفز للـ Builder/Automator، بيتجاهل theory",
        starting_path="builder", skip_intro=True, patience=5, quit_threshold=7),
    Persona("g4-highly-motivated", "المتعلم المُلتزم", "High Performers", 29, "Career switcher",
        "low", "ملتزم جدًا", "Burnout potential",
        "بيكمّل حتى لو حصلت صعوبة، بيدفع نفسه",
        patience=9, quit_threshold=9),

    # === GROUP 5 — EDGE CASES (4) ===
    Persona("g5-start-automator", "بيبدأ من Automator مباشرة", "Edge Cases", 31, "Ops",
        "low", "براجماتي", "مش هيقرأ Builder",
        "بيتجاهل intro، بيدخل Automator على طول، dependency gaps",
        starting_path="automator", skip_intro=True, patience=4, quit_threshold=5),
    Persona("g5-start-business", "بيبدأ من Business مباشرة", "Edge Cases", 44, "صاحب شركة",
        "zero", "Top-down", "مش هيدخل تقني خالص",
        "بيدور على المعنى الإستراتيجي بس",
        starting_path="business", skip_intro=True, patience=4, quit_threshold=5),
    Persona("g5-returner", "بيرجع بعد أسبوعين", "Edge Cases", 33, "موظف",
        "low", "نسيان", "بينسى تفاصيل من قبل",
        "كأنه بيبدأ من جديد بس مع بقايا ذكريات",
        patience=4, quit_threshold=5, max_lessons=15),
    Persona("g5-skip-intro", "بيتخطى Intro خالص", "Edge Cases", 30, "Builder",
        "medium", "ثقة زيادة", "بيفتقد فهم أساسي",
        "بيقفز للمحتوى التقني، بيحس بـ context gap",
        starting_path="builder", skip_intro=True, patience=5, quit_threshold=6),

    # === GROUP 6 — EXTREME EDGE CASES (3) ===
    Persona("g6-mobile-only", "موبايل بس", "Extreme Edge", 22, "طالب جامعي",
        "low", "متلهف بس مش صبور", "شاشة صغيرة",
        "بيتنرفز من UX على الموبايل، النصوص الطويلة بتضايقه",
        patience=3, quit_threshold=5, max_lessons=20),
    Persona("g6-burned-out", "مُنهك", "Extreme Edge", 39, "موظف منهك",
        "low", "طاقة منخفضة", "Quit risk عالي",
        "بيدخل وهو مش راكز، أي friction بيخليه يقفل",
        patience=2, quit_threshold=4, max_lessons=8),
    Persona("g6-time-starved", "وقته 15 دقيقة", "Extreme Edge", 35, "Working parent",
        "low", "محدود الوقت", "محتاج progress واضح بسرعة",
        "لو مش حسس بتقدم في أول 15 دقيقة بيقفل",
        patience=3, quit_threshold=5, max_lessons=10),
]

assert len(PERSONAS) == 30, f"expected 30 personas, got {len(PERSONAS)}"

# ---------------------------------------------------------------------------
# Helpers — lesson content + Gemini call
# ---------------------------------------------------------------------------
_lesson_cache: dict[str, str] = {}

def fetch_lesson_excerpt(lesson_id: str) -> str:
    if lesson_id in _lesson_cache:
        return _lesson_cache[lesson_id]
    text = ""
    if SUPABASE_URL and SERVICE_KEY:
        try:
            r = requests.get(
                f"{SUPABASE_URL}/rest/v1/knowledge_chunks"
                f"?lesson_id=eq.{lesson_id}&select=title,content&limit=3",
                headers={"apikey": SERVICE_KEY, "Authorization": f"Bearer {SERVICE_KEY}"},
                timeout=20,
            )
            if r.status_code == 200:
                chunks = r.json()
                text = "\n\n".join(
                    f"{c.get('title','')}\n{(c.get('content','') or '')[:600]}" for c in chunks
                )[:1800]
        except Exception as e:
            print(f"  ⚠️ fetch_lesson_excerpt({lesson_id}): {e}", file=sys.stderr)
    if not text:
        text = "(لا يوجد ملخص للدرس — احكم بناءً على العنوان فقط)"
    _lesson_cache[lesson_id] = text
    return text


def gemini_json(system: str, user: str, retries: int = 3) -> dict | None:
    """Call Gemini with response_mime_type=application/json. Returns parsed dict or None."""
    body = {
        "system_instruction": {"parts": [{"text": system}]},
        "contents": [{"role": "user", "parts": [{"text": user}]}],
        "generationConfig": {
            "responseMimeType": "application/json",
            "temperature": 0.85,    # human-like variance
            "maxOutputTokens": 2048,
            "thinkingConfig": {"thinkingBudget": 0},
        },
    }
    for attempt in range(retries):
        key = next_key()
        try:
            r = requests.post(f"{GEMINI_URL}?key={key}", json=body, timeout=60)
            if r.status_code == 429:
                time.sleep(2 + attempt * 3)
                continue
            if r.status_code != 200:
                if attempt == retries - 1:
                    print(f"  ⚠️ gemini {r.status_code}: {r.text[:200]}", file=sys.stderr)
                time.sleep(1 + attempt)
                continue
            data = r.json()
            text = data["candidates"][0]["content"]["parts"][0]["text"]
            return json.loads(text)
        except Exception as e:
            if attempt == retries - 1:
                print(f"  ⚠️ gemini exception: {e}", file=sys.stderr)
            time.sleep(1 + attempt)
    return None


# ---------------------------------------------------------------------------
# Single lesson reaction — one Gemini call returns full metrics
# ---------------------------------------------------------------------------
def persona_system_prompt(p: Persona) -> str:
    return (
        f"إنت بتتقمّص شخصية بشرية مصرية حقيقية اسمها: {p.name}.\n"
        f"عمرك: {p.age}. خلفيتك: {p.background}. مستواك التقني: {p.tech_level}.\n"
        f"شخصيتك: {p.personality}. نقطة ضعفك: {p.weakness}.\n"
        f"سلوكك: {p.behavior}.\n"
        f"صبرك من 10: {p.patience}. لو الـ overwhelm وصل {p.quit_threshold} بتقفل المنصة فعلًا.\n\n"
        "قواعد مهمة جدًا:\n"
        "1. إنت إنسان مش AI reviewer — بتحس وبتزهق وبتتشتت وبتنسى.\n"
        "2. ممكن تسيء فهم الدرس — متحاولش تكون منصف.\n"
        "3. لو حسيت إن ده 'بقى برمجة' أو 'مصطلحات كتير' قول.\n"
        "4. لا تجبر نفسك تكمّل — لو زهقت قول quit.\n"
        "5. ردك دايمًا JSON صرف بدون أي شرح خارجي.\n"
        "6. ردة الفعل بالعامية المصرية الصرف، قصيرة، صادقة، عاطفية."
    )


REACTION_SCHEMA_HINT = (
    '{"confidence":1-10,"overwhelm":1-10,"trust":1-10,"clarity":1-10,'
    '"emotional_reaction":"رد عاطفي قصير بالعامية",'
    '"first_confusion":"أول حاجة لخبطتك (أو لا شيء)",'
    '"ui_friction":"احتكاك واجهة لو حسيت (أو لا شيء)",'
    '"mission_difficulty":1-10,'
    '"feels_like_programming":true/false,'
    '"english_overload":true/false,'
    '"decision":"continue|quit",'
    '"quit_reason":"لو quit، السبب",'
    '"energy":1-10}'
)

def react_to_lesson(p: Persona, lesson: dict, idx: int, total: int) -> dict:
    excerpt = fetch_lesson_excerpt(lesson["id"])
    user = (
        f"دلوقتي فاتح درس رقم {idx+1} من {total} في المنصة.\n"
        f"اسمه: «{lesson['title']}» — مسار: {lesson['path']}.\n\n"
        f"مقتطف من الدرس:\n{excerpt}\n\n"
        "كده، قعد ثواني وحس بنفسك. رد بـ JSON واحد بس الشكل ده:\n"
        f"{REACTION_SCHEMA_HINT}\n\n"
        "كلام مهم: لو حسيت إنك زهقت أو الموضوع overwhelm > حد تحملك، قول decision=quit بصراحة."
    )
    result = gemini_json(persona_system_prompt(p), user)
    if result is None:
        return {
            "confidence": 5, "overwhelm": 5, "trust": 5, "clarity": 5,
            "emotional_reaction": "(لم يستجب النموذج)",
            "first_confusion": "", "ui_friction": "",
            "mission_difficulty": 5, "feels_like_programming": False,
            "english_overload": False, "decision": "continue",
            "quit_reason": "", "energy": 5,
        }
    # sanitize types
    for k in ("confidence","overwhelm","trust","clarity","mission_difficulty","energy"):
        try: result[k] = max(1, min(10, int(result.get(k, 5))))
        except: result[k] = 5
    if result.get("decision") not in ("continue","quit"):
        result["decision"] = "continue"
    return result


# ---------------------------------------------------------------------------
# Walk one persona
# ---------------------------------------------------------------------------
def persona_journey(p: Persona) -> Persona:
    # Build lesson queue based on starting path
    start_idx = PATH_ORDER.index(p.starting_path) if p.starting_path in PATH_ORDER else 0
    paths = PATH_ORDER[start_idx:]
    if p.skip_intro and "intro" in paths:
        paths = [x for x in paths if x != "intro"]

    queue: list[dict] = []
    for path in paths:
        queue.extend(lessons_for_path(path))
    queue = queue[: p.max_lessons]

    print(f"\n🤖 [{p.slug}] {p.name} — {len(queue)} درس متاح، بيبدأ من {p.starting_path}")

    for i, lesson in enumerate(queue):
        try:
            r = react_to_lesson(p, lesson, i, len(queue))
        except Exception as e:
            print(f"  ⚠️ react error: {e}")
            continue
        p.journey.append({
            "idx": i+1,
            "lesson_id": lesson["id"],
            "lesson_title": lesson["title"],
            "path": lesson["path"],
            **r,
        })
        p.final_energy = r.get("energy", p.final_energy)
        # Realistic quit: explicit, or overwhelm exceeded threshold
        ow = r.get("overwhelm", 5)
        if r["decision"] == "quit" or ow >= p.quit_threshold:
            p.quit_at = lesson["id"]
            p.quit_reason = r.get("quit_reason") or f"overwhelm={ow} >= threshold={p.quit_threshold}"
            print(f"  🚪 quit at درس {i+1}: {lesson['title']} (ow={ow}, conf={r['confidence']})")
            break
        if (i+1) % 5 == 0:
            print(f"  ✓ {i+1}/{len(queue)} — conf={r['confidence']} ow={r['overwhelm']} trust={r['trust']}")
    else:
        print(f"  🏁 أكمل {len(queue)} درس — تمام")
    return p


# ---------------------------------------------------------------------------
# Aggregation + report
# ---------------------------------------------------------------------------
def avg(xs):
    xs = [x for x in xs if x is not None]
    return round(statistics.mean(xs), 2) if xs else 0

def build_report(personas: list[Persona], duration_s: float) -> str:
    L = []
    L.append("# Persona Simulation Report — v5 (30 agents × كل المنصة)")
    L.append("")
    L.append(f"- وقت التشغيل: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    L.append(f"- مدة السيميوليشن: {duration_s/60:.1f} دقيقة")
    L.append(f"- موديل: `{GEMINI_MODEL}` عبر Gemini API مباشرة (×{len(GEMINI_KEYS)} keys)")
    L.append(f"- عدد الشخصيات: {len(personas)}")
    L.append(f"- إجمالي ردود الفعل المسجلة: {sum(len(p.journey) for p in personas)}")
    L.append("")

    # ===== Executive summary =====
    L.append("## 1. Executive Summary")
    all_reactions = [r for p in personas for r in p.journey]
    completion_rates = [len(p.journey) for p in personas]
    quitters = [p for p in personas if p.quit_at]
    L.append(f"- **متوسط الدروس قبل القفل**: {avg(completion_rates):.1f}")
    L.append(f"- **نسبة اللي قفلوا**: {len(quitters)}/{len(personas)} ({100*len(quitters)/len(personas):.0f}%)")
    L.append(f"- **متوسط الثقة (confidence)**: {avg([r['confidence'] for r in all_reactions])}")
    L.append(f"- **متوسط الإرهاق (overwhelm)**: {avg([r['overwhelm'] for r in all_reactions])}")
    L.append(f"- **متوسط الثقة في المنصة (trust)**: {avg([r['trust'] for r in all_reactions])}")
    L.append(f"- **متوسط الوضوح (clarity)**: {avg([r['clarity'] for r in all_reactions])}")
    feels_prog = sum(1 for r in all_reactions if r.get("feels_like_programming"))
    eng_over = sum(1 for r in all_reactions if r.get("english_overload"))
    L.append(f"- **'بقى برمجة'**: {feels_prog}/{len(all_reactions)} ({100*feels_prog/max(1,len(all_reactions)):.0f}%)")
    L.append(f"- **English terminology overload**: {eng_over}/{len(all_reactions)} ({100*eng_over/max(1,len(all_reactions)):.0f}%)")
    # would-pay / recommend scores: derived from confidence × trust
    wp = avg([(r['confidence'] + r['trust']) / 2 for r in all_reactions])
    wr = avg([(r['confidence'] + r['trust'] + r['clarity']) / 3 for r in all_reactions])
    L.append(f"- **Would-pay score (1-10)**: {wp}")
    L.append(f"- **Would-recommend score (1-10)**: {wr}")
    L.append("")

    # ===== Per-path breakdown =====
    L.append("## 2. Per-Path Breakdown")
    L.append("| Path | Reactions | Avg Confidence | Avg Overwhelm | Avg Trust | Avg Clarity | Quit Rate |")
    L.append("|------|-----------|----------------|---------------|-----------|-------------|-----------|")
    for path in PATH_ORDER:
        path_rx = [r for r in all_reactions if r["path"] == path]
        if not path_rx: continue
        path_quits = sum(1 for p in personas if p.quit_at and any(j["path"]==path and j["lesson_id"]==p.quit_at for j in p.journey))
        L.append(f"| {path} | {len(path_rx)} | {avg([r['confidence'] for r in path_rx])} | "
                 f"{avg([r['overwhelm'] for r in path_rx])} | {avg([r['trust'] for r in path_rx])} | "
                 f"{avg([r['clarity'] for r in path_rx])} | {path_quits} |")
    L.append("")

    # ===== Top 20 issues =====
    L.append("## 3. Top 20 Issues (ranked by severity = high overwhelm × low clarity × low trust)")
    issues = []
    for r in all_reactions:
        severity = r['overwhelm'] * (11 - r['clarity']) * (11 - r['trust']) / 100
        if r.get("first_confusion") and r["first_confusion"] not in ("لا شيء","", None):
            issues.append((severity, r))
    issues.sort(key=lambda x: -x[0])
    for i, (sev, r) in enumerate(issues[:20], 1):
        L.append(f"{i}. **`{r['lesson_id']}`** ({r['path']}) — severity={sev:.1f} — "
                 f"_{r['first_confusion'][:140]}_")
    L.append("")

    # ===== Top retention killers =====
    L.append("## 4. Top Retention Killers (lessons that caused quits)")
    quit_lessons: dict[str, list] = {}
    for p in personas:
        if p.quit_at:
            quit_lessons.setdefault(p.quit_at, []).append(p)
    sorted_quits = sorted(quit_lessons.items(), key=lambda kv: -len(kv[1]))
    for lid, ps in sorted_quits[:15]:
        title = next((l["title"] for l in ALL_LESSONS if l["id"]==lid), lid)
        reasons = "; ".join(f"{p.slug}:{p.quit_reason[:80]}" for p in ps[:3])
        L.append(f"- **{title}** (`{lid}`) — قفل {len(ps)} شخص — أمثلة: {reasons}")
    L.append("")

    # ===== UI problems =====
    L.append("## 5. UI Problems")
    ui_issues = [r for r in all_reactions if r.get("ui_friction") and r["ui_friction"] not in ("","لا شيء",None)]
    ui_count: dict[str, int] = {}
    for r in ui_issues:
        ui_count[r["ui_friction"][:120]] = ui_count.get(r["ui_friction"][:120], 0) + 1
    for ui, c in sorted(ui_count.items(), key=lambda x: -x[1])[:15]:
        L.append(f"- ({c}×) {ui}")
    L.append("")

    # ===== Content confusion map =====
    L.append("## 6. Content Confusion Map (lessons with lowest clarity)")
    lesson_clarity: dict[str, list] = {}
    for r in all_reactions:
        lesson_clarity.setdefault(r["lesson_id"], []).append(r["clarity"])
    worst = sorted(lesson_clarity.items(), key=lambda kv: avg(kv[1]))[:15]
    for lid, cls in worst:
        title = next((l["title"] for l in ALL_LESSONS if l["id"]==lid), lid)
        L.append(f"- `{lid}` — **{title}** — avg clarity={avg(cls)} (n={len(cls)})")
    L.append("")

    # ===== Heatmap (hardest lessons by overwhelm) =====
    L.append("## 7. Heatmap of Hardest Lessons (highest overwhelm)")
    lesson_ow: dict[str, list] = {}
    for r in all_reactions:
        lesson_ow.setdefault(r["lesson_id"], []).append(r["overwhelm"])
    hardest = sorted(lesson_ow.items(), key=lambda kv: -avg(kv[1]))[:20]
    for lid, ows in hardest:
        title = next((l["title"] for l in ALL_LESSONS if l["id"]==lid), lid)
        bar = "█" * int(avg(ows))
        L.append(f"- `{lid}` **{title}** — {bar} {avg(ows)}")
    L.append("")

    # ===== Suggested fixes =====
    L.append("## 8. Suggested Fixes (prioritized by impact)")
    if quit_lessons:
        top_killer = sorted_quits[0]
        L.append(f"1. **أعد تصميم درس `{top_killer[0]}`** — قفل {len(top_killer[1])} شخص فيه")
    if worst:
        L.append(f"2. **بسّط درس `{worst[0][0]}`** — أقل وضوح ({avg(worst[0][1])})")
    if eng_over > len(all_reactions) * 0.3:
        L.append(f"3. **قلّل المصطلحات الإنجليزية** — {eng_over} رد فعل اشتكوا منها")
    if feels_prog > len(all_reactions) * 0.2:
        L.append(f"4. **خفّف الإحساس البرمجي** — {feels_prog} رد حسوا إن 'ده بقى برمجة'")
    L.append("")

    # ===== Per-persona detail =====
    L.append("## 9. Per-Persona Detail")
    by_group: dict[str, list[Persona]] = {}
    for p in personas:
        by_group.setdefault(p.group, []).append(p)
    for group, ps in by_group.items():
        L.append(f"### {group}")
        for p in ps:
            avgs = {k: avg([j[k] for j in p.journey]) for k in ("confidence","overwhelm","trust","clarity")}
            status = f"❌ قفل عند `{p.quit_at}`" if p.quit_at else f"✅ أكمل {len(p.journey)} درس"
            L.append(f"- **{p.name}** (`{p.slug}`) — {status}")
            L.append(f"  - conf={avgs['confidence']} ow={avgs['overwhelm']} trust={avgs['trust']} clarity={avgs['clarity']} energy={p.final_energy}")
            if p.quit_reason:
                L.append(f"  - quit reason: _{p.quit_reason[:160]}_")
            # show last 2 reactions
            for j in p.journey[-2:]:
                L.append(f"  - `{j['lesson_id']}`: «{(j.get('emotional_reaction','') or '')[:100]}»")
        L.append("")

    return "\n".join(L)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--personas", type=int, default=30,
                    help="cap on number of personas (default 30 = all)")
    ap.add_argument("--filter", default="", help="filter personas by slug substring")
    ap.add_argument("--parallel", type=int, default=6, help="concurrent personas")
    ap.add_argument("--max-lessons", type=int, default=0,
                    help="override hard cap on lessons per persona (0 = use persona setting)")
    args = ap.parse_args()

    personas = PERSONAS
    if args.filter:
        personas = [p for p in personas if args.filter in p.slug]
    personas = personas[: args.personas]
    if args.max_lessons > 0:
        for p in personas:
            p.max_lessons = min(p.max_lessons, args.max_lessons)

    print(f"🚀 Running {len(personas)} personas | parallel={args.parallel} | "
          f"lessons available={len(ALL_LESSONS)} | gemini keys={len(GEMINI_KEYS)}")

    t0 = time.time()
    results: list[Persona] = []
    with ThreadPoolExecutor(max_workers=args.parallel) as ex:
        futures = {ex.submit(persona_journey, p): p for p in personas}
        for fut in as_completed(futures):
            try:
                results.append(fut.result())
            except Exception as e:
                print(f"⚠️ persona crashed: {e}")
    duration = time.time() - t0

    # Sort by original persona order
    order = {p.slug: i for i, p in enumerate(personas)}
    results.sort(key=lambda p: order.get(p.slug, 999))

    stamp = time.strftime("%Y%m%d-%H%M%S")
    raw_path = OUT_DIR / f"persona-sim-v5-{stamp}-raw.json"
    raw_path.write_text(json.dumps(
        [asdict(p) for p in results], ensure_ascii=False, indent=2
    ), encoding="utf-8")

    report = build_report(results, duration)
    md_path = OUT_DIR / f"persona-sim-v5-{stamp}.md"
    md_path.write_text(report, encoding="utf-8")

    print(f"\n✅ تم — {duration/60:.1f} دقيقة")
    print(f"📄 Report: {md_path}")
    print(f"📦 Raw:    {raw_path}")


if __name__ == "__main__":
    main()
#!/usr/bin/env python3
"""
Persona Simulator v6 — 50 Egyptian-Arabic agents × full platform deep-scan.

Groups:
  A) 20 Realistic Users        — mode=realistic, may quit normally
  B) 10 Friction Hunters       — mode=realistic, hostile-to-friction
  C) 10 Path Breakers          — mode=realistic, break navigation assumptions
  D) 10 Forced Completion      — mode=forced_completion, NEVER quit; record would_quit

Each lesson reaction returns a rich metrics blob (confidence, overwhelm, trust,
clarity, boredom, motivation, perceived_value, would_pay, would_recommend,
feels_like_programming, english_overload, aha_moment, would_continue,
would_quit, confusion_reason, ui_friction, emotional_reaction, suggested_fix).

Output:
  /mnt/documents/persona-sim-v6-50-agents-full-platform-{stamp}.md
  /mnt/documents/persona-sim-v6-50-agents-full-platform-{stamp}-raw.json

Does NOT touch v5/v4 files or platform code. Read-only against lessons.json +
knowledge_chunks. Uses Gemini API directly with round-robin across keys.
"""
from __future__ import annotations

import argparse
import itertools
import json
import os
import statistics
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field, asdict
from pathlib import Path

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

GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"

def _validate_keys(keys):
    good = []
    for i, k in enumerate(keys, 1):
        try:
            r = requests.post(
                f"{GEMINI_URL}?key={k}",
                json={"contents": [{"parts": [{"text": "ok"}]}]},
                timeout=10,
            )
            if r.status_code == 200:
                good.append(k); print(f"  ✓ key #{i} valid")
            else:
                print(f"  ✗ key #{i} dead ({r.status_code})")
        except Exception as e:
            print(f"  ✗ key #{i} error: {e}")
    return good

print(f"🔑 Validating {len(GEMINI_KEYS)} Gemini keys...")
GEMINI_KEYS = _validate_keys(GEMINI_KEYS)
assert GEMINI_KEYS, "All Gemini keys dead"

_key_cycle = itertools.cycle(GEMINI_KEYS)
_key_lock = threading.Lock()
def next_key():
    with _key_lock:
        return next(_key_cycle)

ROOT = Path(__file__).parent
LESSONS_FILE = ROOT / "lessons.json"
OUT_DIR = Path("/mnt/documents")
OUT_DIR.mkdir(parents=True, exist_ok=True)

ALL_LESSONS = json.loads(LESSONS_FILE.read_text())

PATH_ORDER = ["intro", "builder", "creator", "automator", "analyst", "business"]
def lessons_for_path(path_id): return [l for l in ALL_LESSONS if l["path"] == path_id]

# ---------------------------------------------------------------------------
# Personas (50)
# ---------------------------------------------------------------------------
@dataclass
class Persona:
    slug: str
    name: str
    group: str          # A | B | C | D
    group_label: str
    mode: str           # realistic | forced_completion
    age: int
    background: str
    tech_level: str
    personality: str
    weakness: str
    behavior: str
    starting_path: str = "intro"
    skip_intro: bool = False
    quit_threshold: int = 7
    max_lessons: int = 95
    patience: int = 5
    # runtime
    journey: list = field(default_factory=list)
    quit_at: str | None = None
    quit_reason: str | None = None
    would_quit_at: str | None = None     # forced-completion: where they WOULD have quit
    would_quit_reason: str | None = None
    completed_full_platform: bool = False
    final_energy: int = 5

def _make(mode, slug, name, group, group_label, age, background, tech_level,
          personality, weakness, behavior, **kw):
    return Persona(slug=slug, name=name, group=group, group_label=group_label,
                   mode=mode, age=age, background=background, tech_level=tech_level,
                   personality=personality, weakness=weakness, behavior=behavior, **kw)
def R(*a, **kw):  # realistic
    return _make("realistic", *a, **kw)
def F(*a, **kw):  # forced_completion — never auto-quits, walks full platform
    kw.setdefault("max_lessons", 95)
    kw["quit_threshold"] = 99
    return _make("forced_completion", *a, **kw)

PERSONAS: list[Persona] = [
    # ===== A) 20 REALISTIC USERS =====
    R("a01-beginner-patient", "أحمد المبتدئ الصبور", "A", "Realistic", 24, "خريج تجارة",
      "zero", "صبور فضولي", "بيخاف من الإنجليزي",
      "بيقرأ كل حاجة، بيدّي فرصة، بيكمّل غير لو اتلخبط جدًا", patience=8, quit_threshold=9),
    R("a02-beginner-impatient", "المبتدئ نافد الصبر", "A", "Realistic", 26, "Sales",
      "zero", "نافد الصبر", "تركيزه قليل",
      "بيتخطى الشرح، بيقفل لو الدرس صعب، عايز مكاسب سريعة", patience=2, quit_threshold=5, max_lessons=15),
    R("a03-english-hater", "بيكره الإنجليزي", "A", "Realistic", 31, "HR",
      "zero", "حساس للمصطلحات", "أي مصطلح إنجليزي يضايقه",
      "بيقيس الإرهاق من عدد الكلمات الإنجليزي ف الدرس", patience=4, quit_threshold=5),
    R("a04-slow-learner", "بطيء الفهم", "A", "Realistic", 42, "صاحب محل",
      "low", "صبور بس بطيء", "محتاج تكرار",
      "بيتلخبط بسهولة، بيتعب من كتر المفاهيم", patience=7, quit_threshold=6),
    R("a05-distracted", "مشتت", "A", "Realistic", 30, "موظف",
      "low", "مشتت", "بينسى اللي فات",
      "sessions قصيرة، بيتقاطع، بينسى السياق", patience=3, quit_threshold=6, max_lessons=20),
    R("a06-attention-problems", "عنده attention problems", "A", "Realistic", 23, "Student",
      "medium", "تشتت مزمن", "مش بيكمل ٥ دقايق متواصلة",
      "بيلف بين tabs، بيرجع ينسى فين كان", patience=2, quit_threshold=5, max_lessons=18),
    R("a07-tech-fearful", "خايف من التكنولوجيا", "A", "Realistic", 48, "محاسب",
      "zero", "قلقان", "بيفتكر AI = حاجة مرعبة",
      "panic من المصطلحات التقنية، حساس لإحساس البرمجة", patience=4, quit_threshold=4, max_lessons=20),
    R("a08-ai-equals-chatgpt", "فاكر AI = ChatGPT", "A", "Realistic", 29, "Marketing",
      "low", "متلخبط مفاهيميًا", "بيستغرب أي حاجة غير ChatGPT",
      "بيقول 'ده ChatGPT برضه؟' في نص الدرس", patience=4, quit_threshold=6),
    R("a09-wants-money-fast", "عايز فلوس بسرعة", "A", "Realistic", 27, "هاوي تجارة",
      "low", "متحمس مادي", "بيكره النظري",
      "أول ما يحس إن الدرس مش بيجيب فلوس بيقفل", patience=3, quit_threshold=5, max_lessons=15),
    R("a10-busy-executive", "Executive مشغول", "A", "Realistic", 47, "Corporate",
      "medium", "وقته قليل", "مفيش صبر",
      "عايز strategic insight بسرعة، بيقفل لما يحس بإطالة",
      starting_path="business", patience=3, quit_threshold=5, max_lessons=10),
    R("a11-factory-owner", "صاحب مصنع موبيليا", "A", "Realistic", 45, "تصنيع",
      "zero", "صنايعي", "بيخاف من الأكاديمي",
      "محتاج أمثلة من شغله بالظبط",
      starting_path="business", patience=5, quit_threshold=5),
    R("a12-restaurant-owner", "صاحب مطعم", "A", "Realistic", 40, "F&B",
      "low", "عملي", "مفيش وقت",
      "عايز يعرف ينفّذ في مطعمه إزاي",
      starting_path="automator", patience=4, quit_threshold=5),
    R("a13-trader", "صاحب تجارة", "A", "Realistic", 38, "تجارة محلية",
      "low", "براجماتي", "بيكره النظري", "ROI focused",
      starting_path="business", patience=5, quit_threshold=6),
    R("a14-freelancer", "Freelancer", "A", "Realistic", 28, "Designer",
      "medium", "مستقل", "بيدور أدوات بسرعة",
      "بيقفز للأجزاء العملية، بيكره الـ intro الطويل", patience=5, quit_threshold=6),
    R("a15-marketer", "مسوّق", "A", "Realistic", 32, "Marketing",
      "medium", "بيقيس ROI", "حساس للـ hype",
      "بيسأل: ده هيوفر وقت لفريقي؟", starting_path="creator", patience=6, quit_threshold=7),
    R("a16-corporate-employee", "موظف Corporate", "A", "Realistic", 33, "Corporate ops",
      "medium", "محترف بارد", "بيكره العامية الزيادة",
      "بيدور تنظيم وخطوات واضحة", patience=5, quit_threshold=6),
    R("a17-student", "Student", "A", "Realistic", 21, "طالب جامعي",
      "medium", "فضولي", "بيمل بسرعة",
      "بيحب الـ aha moments بس بيقفل لو طوّل", patience=4, quit_threshold=6, max_lessons=25),
    R("a18-senior", "كبير في السن", "A", "Realistic", 58, "متقاعد",
      "zero", "حذر", "بيخاف من الـ UI",
      "محتاج خطوات واضحة وكبيرة، بيتلخبط من tabs كتير", patience=6, quit_threshold=5, max_lessons=15),
    R("a19-mobile-only", "Mobile-only", "A", "Realistic", 22, "طالب",
      "low", "متلهف", "شاشة صغيرة",
      "بيتنرفز من UX على الموبايل، النصوص الطويلة بتضايقه", patience=3, quit_threshold=5, max_lessons=20),
    R("a20-time-starved", "وقته قليل جدًا", "A", "Realistic", 35, "Working parent",
      "low", "محدود الوقت", "محتاج progress واضح",
      "لو مش حسس بتقدم في ١٥ دقيقة بيقفل", patience=3, quit_threshold=5, max_lessons=10),

    # ===== B) 10 FRICTION HUNTERS =====
    R("b01-strict", "متشدد جدًا", "B", "Friction Hunter", 34, "Senior reviewer",
      "high", "صارم", "بيعاقب أي تبسيط زيادة",
      "بيدور على دقة تقنية، بيكتب نقد قاسي", patience=4, quit_threshold=7),
    R("b02-bored-fast", "بيزهق بسرعة", "B", "Friction Hunter", 28, "Reviewer",
      "medium", "زهقان دايمًا", "صبره أقل من 3 دقايق لكل درس",
      "أول ما يحس بتكرار بيكتب 'مكرر مكرر'", patience=2, quit_threshold=5, max_lessons=20),
    R("b03-repetition-watchdog", "بيدقق في التكرار", "B", "Friction Hunter", 31, "Editor",
      "medium", "حساس للتكرار", "بيلاحظ نفس الفكرة في درسين",
      "بيشير لو لقى مفهوم اتقال قبل كده", patience=4, quit_threshold=6),
    R("b04-marketing-hater", "بيكره لغة التسويق", "B", "Friction Hunter", 33, "Journalist",
      "medium", "anti-fluff", "بيكره 'حول حياتك' و'كن مبدعًا'",
      "أول مرة يشوف جملة تسويقية بيكتب 'ده hype فاضي'", patience=3, quit_threshold=5),
    R("b05-anti-hype", "anti-hype", "B", "Friction Hunter", 36, "Analyst",
      "high", "متشكك مزمن", "بيستفز من الوعود الكبيرة",
      "بيدور على over-promise وبيفضحه", patience=3, quit_threshold=5),
    R("b06-technical-skeptic", "technical skeptic", "B", "Friction Hunter", 35, "Engineer",
      "high", "low trust", "بيشك في كل ادعاء تقني",
      "بيقول 'منين جبت ده؟' لما يشوف رقم", patience=4, quit_threshold=6),
    R("b07-overthinker", "overthinker", "B", "Friction Hunter", 34, "Researcher",
      "medium", "بيلف على نفسه", "confusion loops",
      "بيدخل في تساؤلات لا نهائية", patience=6, quit_threshold=7),
    R("b08-detail-obsessed", "detail obsessed", "B", "Friction Hunter", 30, "QA",
      "medium", "perfectionist", "بيقف على أي خطأ صغير",
      "بيلاحظ أي تناقض في الأرقام أو الـ wording", patience=5, quit_threshold=6),
    R("b09-ui-critic", "UI critic", "B", "Friction Hunter", 29, "UX designer",
      "high", "نقدي بصري", "حساس للـ hierarchy والـ spacing",
      "بيكتب feedback عن كل زرار وكل اتصال CTA", patience=5, quit_threshold=7),
    R("b10-accessibility-critic", "accessibility critic", "B", "Friction Hunter", 32, "A11y consultant",
      "high", "حساس لـ contrast/keyboard", "بيدور على مشاكل وصول",
      "بيقيم alt text وkeyboard nav وcontrast ratios", patience=5, quit_threshold=7),

    # ===== C) 10 PATH BREAKERS =====
    R("c01-start-business", "يبدأ من Business", "C", "Path Breaker", 44, "صاحب شركة",
      "zero", "Top-down", "مش هيدخل تقني",
      "بيدور المعنى الإستراتيجي بس",
      starting_path="business", skip_intro=True, patience=4, quit_threshold=5),
    R("c02-start-automator", "يبدأ من Automator", "C", "Path Breaker", 31, "Ops",
      "low", "براجماتي", "مش هيقرأ Builder",
      "بيتجاهل intro، بيدخل Automator على طول",
      starting_path="automator", skip_intro=True, patience=4, quit_threshold=5),
    R("c03-skip-intro", "يتخطى Intro", "C", "Path Breaker", 30, "Builder",
      "medium", "ثقة زيادة", "بيفتقد فهم أساسي",
      "بيقفز للمحتوى التقني، بيحس بـ context gap",
      starting_path="builder", skip_intro=True, patience=5, quit_threshold=6),
    R("c04-returns-after-weeks", "يرجع بعد أسبوعين", "C", "Path Breaker", 33, "موظف",
      "low", "نسيان", "بينسى تفاصيل",
      "كأنه بيبدأ من جديد بس مع بقايا ذكريات", patience=4, quit_threshold=5, max_lessons=15),
    R("c05-mobile-only-pb", "يفتح من الموبايل فقط", "C", "Path Breaker", 26, "موظف",
      "low", "Mobile-only", "شاشة صغيرة",
      "بيشتكي من كل عنصر مش متجاوب", patience=3, quit_threshold=5, max_lessons=20),
    R("c06-slow-internet", "إنترنت بطيء", "C", "Path Breaker", 36, "مدرسة عامة",
      "low", "صبر منخفض على load", "الفيديوهات بتقطع",
      "بيقفل لو الـ video مشغّلش في 5 ثواني", patience=3, quit_threshold=5, max_lessons=12),
    R("c07-opens-many-lessons", "يفتح أكتر من درس", "C", "Path Breaker", 28, "متعدد المهام",
      "medium", "متشتت بـ tabs", "مش بيكمل واحد",
      "بيفتح ٥ دروس مع بعض ويلف بينهم", patience=4, quit_threshold=6, max_lessons=25),
    R("c08-random-entry", "يدخل عشوائي", "C", "Path Breaker", 29, "Curious",
      "medium", "عشوائي", "بيكسر ترتيب الـ curriculum",
      "بيدخل درس من النص بدون سياق",
      starting_path="analyst", skip_intro=True, patience=4, quit_threshold=5),
    R("c09-quits-mid-video", "يسيب الفيديو في النص", "C", "Path Breaker", 27, "Impatient",
      "low", "بيمل بسرعة من الفيديو", "بيقرا transcript بدل ما يكمل",
      "بيقفز للـ quiz بدون ما يكمل الفيديو", patience=3, quit_threshold=6),
    R("c10-refresh-spammer", "يعمل refresh كتير", "C", "Path Breaker", 25, "Power user",
      "medium", "بيكسر الـ state", "بيشتكي لو progress ضاع",
      "بيعمل refresh وnav كل شوية، بيدور bugs", patience=4, quit_threshold=7),

    # ===== D) 10 FORCED COMPLETION AGENTS (deep platform scan) =====
    F("d01-deep-scanner-beginner", "ماسح عميق — مبتدئ", "D", "Forced Completion", 28, "QA",
      "low", "صبور إجباريًا", "بيلاحظ كل تفصيلة كأنه مبتدئ",
      "بيدخل من عين مبتدئ، بيسجل كل لخبطة بس ميقفلش", patience=10),
    F("d02-deep-scanner-builder", "ماسح عميق — Builder", "D", "Forced Completion", 30, "Engineer",
      "high", "تقني", "بيقيس depth و dependency gaps",
      "بيقيم لو الـ builder lessons فيها قفز أو نقص",
      starting_path="intro", patience=9),
    F("d03-deep-scanner-creator", "ماسح عميق — Creator", "D", "Forced Completion", 27, "Content lead",
      "medium", "محتوى", "بيقيم voice وtone و repetition",
      "بيلاحظ تكرار الأمثلة والصور البصرية", patience=9),
    F("d04-deep-scanner-automator", "ماسح عميق — Automator", "D", "Forced Completion", 32, "Ops engineer",
      "medium", "workflows", "بيقيم clarity للـ flows",
      "بيدور حاجة مفقودة بين الخطوات", patience=9),
    F("d05-deep-scanner-analyst", "ماسح عميق — Analyst", "D", "Forced Completion", 31, "Data analyst",
      "high", "أرقام", "بيقيم الأمثلة و الـ metrics",
      "بيشكك في أي رقم بدون مصدر", patience=9),
    F("d06-deep-scanner-business", "ماسح عميق — Business", "D", "Forced Completion", 38, "Founder",
      "medium", "Strategy", "بيقيم perceived_value و would_pay",
      "بيقيس لكل درس: ده يستاهل فلوس؟", patience=9),
    F("d07-friction-mapper", "خرائط الـ friction", "D", "Forced Completion", 30, "UX researcher",
      "high", "بيرصد UI", "بيسجل كل احتكاك بصري/تفاعلي",
      "كل درس بيكتب 3 احتكاكات UI لو موجودة", patience=10),
    F("d08-trust-auditor", "مدقّق الثقة", "D", "Forced Completion", 35, "Editor-in-chief",
      "medium", "trust-focused", "حساس للـ over-promise",
      "بيقيم trust drops في كل CTA و mission", patience=10),
    F("d09-english-auditor", "مدقّق الإنجليزي", "D", "Forced Completion", 33, "Translator",
      "medium", "حساس للترجمة", "بيعد المصطلحات الإنجليزي",
      "بيكتب map للمصطلحات الإنجليزي اللي لازم تتترجم", patience=10),
    F("d10-programming-feel-auditor", "مدقّق 'حاسس إنها برمجة'", "D", "Forced Completion", 29, "Beginner advocate",
      "low", "حساس للإحساس البرمجي", "بيدور أي لحظة بتحس إنها code",
      "بيرصد كل لحظة 'ده بقى برمجة'", patience=10),
]

assert len(PERSONAS) == 50, f"expected 50 personas, got {len(PERSONAS)}"

# ---------------------------------------------------------------------------
# Lesson excerpt cache + Gemini call
# ---------------------------------------------------------------------------
_lesson_cache: dict[str, str] = {}
_cache_lock = threading.Lock()

def fetch_lesson_excerpt(lesson_id: str) -> str:
    with _cache_lock:
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
            print(f"  ⚠️ fetch {lesson_id}: {e}", file=sys.stderr)
    if not text:
        text = "(لا يوجد ملخص للدرس — احكم بناءً على العنوان)"
    with _cache_lock:
        _lesson_cache[lesson_id] = text
    return text

def gemini_json(system: str, user: str, retries: int = 3):
    body = {
        "system_instruction": {"parts": [{"text": system}]},
        "contents": [{"role": "user", "parts": [{"text": user}]}],
        "generationConfig": {
            "responseMimeType": "application/json",
            "temperature": 0.9,
            "maxOutputTokens": 2048,
            "thinkingConfig": {"thinkingBudget": 0},
        },
    }
    for attempt in range(retries):
        key = next_key()
        try:
            r = requests.post(f"{GEMINI_URL}?key={key}", json=body, timeout=60)
            if r.status_code == 429:
                time.sleep(2 + attempt * 3); continue
            if r.status_code != 200:
                if attempt == retries - 1:
                    print(f"  ⚠️ gemini {r.status_code}: {r.text[:200]}", file=sys.stderr)
                time.sleep(1 + attempt); continue
            data = r.json()
            text = data["candidates"][0]["content"]["parts"][0]["text"]
            return json.loads(text)
        except Exception as e:
            if attempt == retries - 1:
                print(f"  ⚠️ gemini exception: {e}", file=sys.stderr)
            time.sleep(1 + attempt)
    return None

# ---------------------------------------------------------------------------
# Persona reaction
# ---------------------------------------------------------------------------
def persona_system_prompt(p: Persona) -> str:
    mode_note = (
        "إنت في وضع 'forced_completion' — لازم تعدّي على كل الدروس مهما حصل، "
        "بس لو وصلت لنقطة كنت هتقفل فيها لو كنت مستخدم حقيقي، اكتب would_quit=true "
        "في الـ JSON بتاع الدرس ده، وقول السبب بصراحة. متقفلش فعلًا."
    ) if p.mode == "forced_completion" else (
        "إنت في وضع 'realistic' — لو زهقت أو اتلخبطت، طبيعي تقفل وتكتب would_quit=true."
    )
    return (
        f"إنت بتتقمّص شخصية بشرية مصرية حقيقية اسمها: {p.name}.\n"
        f"عمرك: {p.age}. خلفيتك: {p.background}. مستواك التقني: {p.tech_level}.\n"
        f"شخصيتك: {p.personality}. نقطة ضعفك: {p.weakness}.\n"
        f"سلوكك: {p.behavior}.\n"
        f"صبرك من 10: {p.patience}.\n\n"
        f"{mode_note}\n\n"
        "قواعد:\n"
        "1. إنت إنسان مش AI reviewer — بتحس وبتزهق وبتتشتت وبتنسى.\n"
        "2. ممكن تسيء فهم الدرس — متحاولش تكون منصف.\n"
        "3. لو حسيت 'ده بقى برمجة' أو 'مصطلحات كتير' قول.\n"
        "4. ردك JSON صرف بدون أي شرح خارجي.\n"
        "5. ردة الفعل بالعامية المصرية، قصيرة، صادقة، عاطفية.\n"
        "6. متستخدمش لغة تسويقية — اتكلم زي ابن بلد حقيقي."
    )

SCHEMA_HINT = (
    '{'
    '"confidence":1-10,'
    '"overwhelm":1-10,'
    '"trust":1-10,'
    '"clarity":1-10,'
    '"boredom":1-10,'
    '"motivation":1-10,'
    '"perceived_value":1-10,'
    '"would_pay":1-10,'
    '"would_recommend":1-10,'
    '"feels_like_programming":true|false,'
    '"english_overload":true|false,'
    '"aha_moment":true|false,'
    '"would_continue":true|false,'
    '"would_quit":true|false,'
    '"confusion_reason":"السبب اللي لخبطك (أو فاضي)",'
    '"ui_friction":"احتكاك في الواجهة (أو فاضي)",'
    '"emotional_reaction":"رد عاطفي قصير بالعامية",'
    '"suggested_fix":"اقتراحك السريع للإصلاح"'
    '}'
)

METRIC_INTS = ("confidence","overwhelm","trust","clarity","boredom","motivation",
               "perceived_value","would_pay","would_recommend")
METRIC_BOOLS = ("feels_like_programming","english_overload","aha_moment",
                "would_continue","would_quit")
METRIC_STRS = ("confusion_reason","ui_friction","emotional_reaction","suggested_fix")

def sanitize(r: dict) -> dict:
    out = {}
    for k in METRIC_INTS:
        try: out[k] = max(1, min(10, int(r.get(k, 5))))
        except: out[k] = 5
    for k in METRIC_BOOLS:
        v = r.get(k, False)
        out[k] = bool(v) if isinstance(v, bool) else str(v).strip().lower() in ("true","1","yes","نعم","ايوة","أيوه")
    for k in METRIC_STRS:
        v = r.get(k, "") or ""
        out[k] = str(v).strip()
    return out

def react(p: Persona, lesson: dict, idx: int, total: int) -> dict:
    excerpt = fetch_lesson_excerpt(lesson["id"])
    user = (
        f"دلوقتي فاتح درس رقم {idx+1} من {total} في المنصة.\n"
        f"اسمه: «{lesson['title']}» — مسار: {lesson['path']}.\n\n"
        f"مقتطف من الدرس:\n{excerpt}\n\n"
        "رد بـ JSON واحد بس بالشكل ده بالظبط:\n"
        f"{SCHEMA_HINT}\n\n"
        "ملاحظات:\n"
        "- would_quit=true لو ده كان درس هتقفل عنده لو إنت حقيقي.\n"
        "- aha_moment=true بس لو فعلاً حسيت 'فهمت دلوقتي حاجة جديدة'.\n"
        "- feels_like_programming=true لو حسيت إن ده بقى code/تركيب تقني.\n"
        "- english_overload=true لو فيه أكتر من ٥ مصطلحات إنجليزي مالهاش ترجمة."
    )
    data = gemini_json(persona_system_prompt(p), user)
    if data is None:
        return sanitize({"emotional_reaction": "(لم يستجب النموذج)"})
    return sanitize(data)

# ---------------------------------------------------------------------------
# Journey
# ---------------------------------------------------------------------------
def persona_journey(p: Persona) -> Persona:
    # v7: NOBODY enters intro. Force-skip for everyone.
    starting = p.starting_path if p.starting_path in PATH_ORDER else "builder"
    if starting == "intro":
        starting = "builder"
    start_idx = PATH_ORDER.index(starting)
    paths = [x for x in PATH_ORDER[start_idx:] if x != "intro"]
    queue = []
    for path in paths:
        queue.extend(lessons_for_path(path))
    queue = queue[: p.max_lessons]

    print(f"\n🤖 [{p.slug}] {p.name} ({p.mode}) — {len(queue)} درس")

    for i, lesson in enumerate(queue):
        try:
            r = react(p, lesson, i, len(queue))
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
        p.final_energy = r.get("motivation", p.final_energy)

        if p.mode == "realistic":
            ow = r["overwhelm"]
            if r["would_quit"] or r["would_continue"] is False or ow >= p.quit_threshold:
                p.quit_at = lesson["id"]
                p.quit_reason = r.get("confusion_reason") or f"overwhelm={ow}"
                print(f"  🚪 quit at {i+1}: {lesson['title']} (ow={ow})")
                break
        else:
            # forced_completion: record first would_quit but keep going
            if r["would_quit"] and not p.would_quit_at:
                p.would_quit_at = lesson["id"]
                p.would_quit_reason = r.get("confusion_reason") or "would_quit"
        if (i+1) % 10 == 0:
            print(f"  ✓ {i+1}/{len(queue)}")
    else:
        if p.mode == "forced_completion":
            p.completed_full_platform = True
        print(f"  🏁 أكمل {len(queue)} درس")
    return p

# ---------------------------------------------------------------------------
# Report
# ---------------------------------------------------------------------------
def avg(xs):
    xs = [x for x in xs if x is not None]
    return round(statistics.mean(xs), 2) if xs else 0

def pct(n, d): return f"{100*n/max(1,d):.0f}%"

def topn_lessons(reactions, key, n=15, lowest=False):
    bucket: dict[str, list] = {}
    for r in reactions:
        bucket.setdefault(r["lesson_id"], []).append(r[key])
    items = [(lid, avg(v), len(v)) for lid, v in bucket.items()]
    items.sort(key=lambda x: x[1] if lowest else -x[1])
    return items[:n]

def topn_freetext(reactions, key, n=20):
    c: dict[str, int] = {}
    for r in reactions:
        t = (r.get(key) or "").strip()
        if t and t not in ("لا شيء","لا","none","None","-"):
            t = t[:140]
            c[t] = c.get(t, 0) + 1
    return sorted(c.items(), key=lambda x: -x[1])[:n]

def lesson_title(lid):
    return next((l["title"] for l in ALL_LESSONS if l["id"]==lid), lid)

def build_report(personas: list[Persona], duration_s: float) -> str:
    L = []
    L.append("# Persona Simulation Report — v7 (50 agents · NO INTRO)")
    L.append("")
    L.append("> كل المستخدمين بدأوا مباشرة من أول درس في الـ path بتاعهم. مفيش intro خالص.")
    L.append("")
    L.append(f"- وقت التشغيل: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    L.append(f"- مدة السيميوليشن: {duration_s/60:.1f} دقيقة")
    L.append(f"- موديل: `{GEMINI_MODEL}` (Gemini API direct × {len(GEMINI_KEYS)} keys)")
    L.append(f"- عدد الشخصيات: {len(personas)} (A=20, B=10, C=10, D=10)")
    L.append(f"- إجمالي ردود الفعل: {sum(len(p.journey) for p in personas)}")
    L.append("")

    realistic = [p for p in personas if p.mode == "realistic"]
    forced = [p for p in personas if p.mode == "forced_completion"]
    all_rx = [r for p in personas for r in p.journey]
    rx_real = [r for p in realistic for r in p.journey]
    rx_forced = [r for p in forced for r in p.journey]

    # ===== 1. Executive Summary =====
    L.append("## 1. Executive Summary")
    quitters = [p for p in realistic if p.quit_at]
    L.append(f"- **Realistic users**: {len(realistic)} — قفلوا: {len(quitters)} ({pct(len(quitters), len(realistic))})")
    L.append(f"- **Forced completion**: {len(forced)} — أكملوا فعلًا: {sum(1 for p in forced if p.completed_full_platform)}")
    L.append(f"- **متوسط الدروس قبل القفل (realistic)**: {avg([len(p.journey) for p in realistic]):.1f}")
    if all_rx:
        L.append(f"- **Avg confidence**: {avg([r['confidence'] for r in all_rx])}")
        L.append(f"- **Avg overwhelm**: {avg([r['overwhelm'] for r in all_rx])}")
        L.append(f"- **Avg trust**: {avg([r['trust'] for r in all_rx])}")
        L.append(f"- **Avg clarity**: {avg([r['clarity'] for r in all_rx])}")
        L.append(f"- **Avg boredom**: {avg([r['boredom'] for r in all_rx])}")
        L.append(f"- **Avg perceived_value**: {avg([r['perceived_value'] for r in all_rx])}")
        L.append(f"- **Avg would_pay**: {avg([r['would_pay'] for r in all_rx])}")
        L.append(f"- **Avg would_recommend**: {avg([r['would_recommend'] for r in all_rx])}")
        fp = sum(1 for r in all_rx if r['feels_like_programming'])
        eo = sum(1 for r in all_rx if r['english_overload'])
        aha = sum(1 for r in all_rx if r['aha_moment'])
        wq = sum(1 for r in all_rx if r['would_quit'])
        L.append(f"- **'حاسس إنها برمجة'**: {fp}/{len(all_rx)} ({pct(fp,len(all_rx))})")
        L.append(f"- **English overload**: {eo}/{len(all_rx)} ({pct(eo,len(all_rx))})")
        L.append(f"- **Aha moments**: {aha}/{len(all_rx)} ({pct(aha,len(all_rx))})")
        L.append(f"- **would_quit flags (all)**: {wq}/{len(all_rx)} ({pct(wq,len(all_rx))})")
    L.append("")

    # ===== 2. Realistic drop-off =====
    L.append("## 2. Realistic User Drop-off Report")
    quit_lessons: dict[str, list] = {}
    for p in realistic:
        if p.quit_at:
            quit_lessons.setdefault(p.quit_at, []).append(p)
    L.append(f"- نقاط قفل فريدة: {len(quit_lessons)}")
    L.append("| Lesson | عدد القافلين | أسباب |")
    L.append("|--------|--------------|-------|")
    for lid, ps in sorted(quit_lessons.items(), key=lambda kv: -len(kv[1]))[:20]:
        reasons = " · ".join(f"{p.slug}: {(p.quit_reason or '')[:60]}" for p in ps[:3])
        L.append(f"| `{lid}` {lesson_title(lid)[:40]} | {len(ps)} | {reasons} |")
    L.append("")

    # ===== 3. Forced completion scan =====
    L.append("## 3. Forced Completion Full-Platform Scan")
    L.append(f"- {len(forced)} agent مشيوا على كل دروس المنصة (مهما حصل).")
    L.append(f"- إجمالي ردود: {len(rx_forced)} / متوقّع: {len(forced) * len(ALL_LESSONS)}")
    L.append("")
    L.append("### نقاط 'كان هيقفل هنا' (would_quit في وضع forced)")
    wq_count: dict[str, int] = {}
    for r in rx_forced:
        if r["would_quit"]:
            wq_count[r["lesson_id"]] = wq_count.get(r["lesson_id"], 0) + 1
    for lid, n in sorted(wq_count.items(), key=lambda x:-x[1])[:25]:
        L.append(f"- `{lid}` **{lesson_title(lid)[:60]}** — {n} agent")
    L.append("")

    # ===== 4. Per-path breakdown =====
    L.append("## 4. Per-Path Breakdown")
    L.append("| Path | Reactions | Conf | Overwhelm | Trust | Clarity | Boredom | PerceivedValue | WouldPay | feelsProg% | engOver% |")
    L.append("|------|-----------|------|-----------|-------|---------|---------|----------------|----------|------------|----------|")
    for path in PATH_ORDER:
        pr = [r for r in all_rx if r["path"] == path]
        if not pr: continue
        fp = sum(1 for r in pr if r['feels_like_programming'])
        eo = sum(1 for r in pr if r['english_overload'])
        L.append(f"| {path} | {len(pr)} | {avg([r['confidence'] for r in pr])} | "
                 f"{avg([r['overwhelm'] for r in pr])} | {avg([r['trust'] for r in pr])} | "
                 f"{avg([r['clarity'] for r in pr])} | {avg([r['boredom'] for r in pr])} | "
                 f"{avg([r['perceived_value'] for r in pr])} | {avg([r['would_pay'] for r in pr])} | "
                 f"{pct(fp,len(pr))} | {pct(eo,len(pr))} |")
    L.append("")

    # ===== 5. Per-lesson heatmap =====
    L.append("## 5. Per-Lesson Heatmap (overwhelm)")
    hardest = topn_lessons(all_rx, "overwhelm", n=25)
    for lid, v, n in hardest:
        bar = "█" * int(v)
        L.append(f"- `{lid}` **{lesson_title(lid)[:50]}** — {bar} {v} (n={n})")
    L.append("")

    # ===== 6. Top 30 content issues =====
    L.append("## 6. Top 30 Content Issues (by confusion_reason frequency)")
    for txt, n in topn_freetext(all_rx, "confusion_reason", n=30):
        L.append(f"- ({n}×) {txt}")
    L.append("")

    # ===== 7. Top 20 UI issues =====
    L.append("## 7. Top 20 UI Issues")
    for txt, n in topn_freetext(all_rx, "ui_friction", n=20):
        L.append(f"- ({n}×) {txt}")
    L.append("")

    # ===== 8. Top 20 trust killers =====
    L.append("## 8. Top 20 Trust Killers (lowest trust lessons)")
    for lid, v, n in topn_lessons(all_rx, "trust", n=20, lowest=True):
        L.append(f"- `{lid}` **{lesson_title(lid)[:50]}** — trust={v} (n={n})")
    L.append("")

    # ===== 9. Top 20 'feels like programming' moments =====
    L.append("## 9. Top 20 'حاسس إنها برمجة' Moments")
    fp_count: dict[str, int] = {}
    for r in all_rx:
        if r["feels_like_programming"]:
            fp_count[r["lesson_id"]] = fp_count.get(r["lesson_id"], 0) + 1
    for lid, n in sorted(fp_count.items(), key=lambda x:-x[1])[:20]:
        L.append(f"- `{lid}` **{lesson_title(lid)[:50]}** — {n} agent")
    L.append("")

    # ===== 10. English overload map =====
    L.append("## 10. English Terminology Overload Map")
    eo_count: dict[str, int] = {}
    for r in all_rx:
        if r["english_overload"]:
            eo_count[r["lesson_id"]] = eo_count.get(r["lesson_id"], 0) + 1
    for lid, n in sorted(eo_count.items(), key=lambda x:-x[1])[:25]:
        L.append(f"- `{lid}` **{lesson_title(lid)[:50]}** — {n} agent")
    L.append("")

    # ===== 11. Lowest clarity =====
    L.append("## 11. Lowest Clarity Lessons")
    for lid, v, n in topn_lessons(all_rx, "clarity", n=20, lowest=True):
        L.append(f"- `{lid}` **{lesson_title(lid)[:50]}** — clarity={v} (n={n})")
    L.append("")

    # ===== 12. Highest boredom =====
    L.append("## 12. Highest Boredom Lessons")
    for lid, v, n in topn_lessons(all_rx, "boredom", n=20):
        L.append(f"- `{lid}` **{lesson_title(lid)[:50]}** — boredom={v} (n={n})")
    L.append("")

    # ===== 13. Highest overwhelm =====
    L.append("## 13. Highest Overwhelm Lessons (top 20)")
    for lid, v, n in topn_lessons(all_rx, "overwhelm", n=20):
        L.append(f"- `{lid}` **{lesson_title(lid)[:50]}** — overwhelm={v} (n={n})")
    L.append("")

    # ===== 14. Highest perceived value =====
    L.append("## 14. Highest Perceived Value Lessons")
    for lid, v, n in topn_lessons(all_rx, "perceived_value", n=20):
        L.append(f"- `{lid}` **{lesson_title(lid)[:50]}** — value={v} (n={n})")
    L.append("")

    # ===== 15. Aha moments =====
    L.append("## 15. Aha Moments Map")
    aha_count: dict[str, int] = {}
    for r in all_rx:
        if r["aha_moment"]:
            aha_count[r["lesson_id"]] = aha_count.get(r["lesson_id"], 0) + 1
    for lid, n in sorted(aha_count.items(), key=lambda x:-x[1])[:20]:
        L.append(f"- `{lid}` **{lesson_title(lid)[:50]}** — {n} aha")
    L.append("")

    # ===== 16. Would pay =====
    L.append("## 16. Would-Pay Analysis")
    L.append(f"- متوسط عام: {avg([r['would_pay'] for r in all_rx])}/10")
    L.append(f"- realistic: {avg([r['would_pay'] for r in rx_real])}/10")
    L.append(f"- forced: {avg([r['would_pay'] for r in rx_forced])}/10")
    L.append("### أعلى ١٠ دروس would_pay")
    for lid, v, n in topn_lessons(all_rx, "would_pay", n=10):
        L.append(f"- `{lid}` **{lesson_title(lid)[:50]}** — {v}")
    L.append("### أدنى ١٠ دروس would_pay")
    for lid, v, n in topn_lessons(all_rx, "would_pay", n=10, lowest=True):
        L.append(f"- `{lid}` **{lesson_title(lid)[:50]}** — {v}")
    L.append("")

    # ===== 17. Would recommend =====
    L.append("## 17. Would-Recommend Analysis")
    L.append(f"- متوسط عام: {avg([r['would_recommend'] for r in all_rx])}/10")
    L.append(f"- realistic: {avg([r['would_recommend'] for r in rx_real])}/10")
    L.append(f"- forced: {avg([r['would_recommend'] for r in rx_forced])}/10")
    L.append("")

    # ===== 18. Suggested fixes (collected) =====
    L.append("## 18. Suggested Fixes from Agents (top 30 by frequency)")
    for txt, n in topn_freetext(all_rx, "suggested_fix", n=30):
        L.append(f"- ({n}×) {txt}")
    L.append("")

    # ===== 19. Fixes ranked by impact & urgency =====
    L.append("## 19. Fixes Ranked by Impact × Urgency")
    # Score each lesson: impact = high overwhelm × low clarity × low trust × quit_count
    lesson_score: dict[str, dict] = {}
    for r in all_rx:
        s = lesson_score.setdefault(r["lesson_id"], {"ow":[], "cl":[], "tr":[], "bo":[], "fp":0, "eo":0, "wq":0, "n":0})
        s["ow"].append(r["overwhelm"]); s["cl"].append(r["clarity"])
        s["tr"].append(r["trust"]); s["bo"].append(r["boredom"])
        s["fp"] += int(r["feels_like_programming"])
        s["eo"] += int(r["english_overload"])
        s["wq"] += int(r["would_quit"])
        s["n"] += 1
    rank = []
    for lid, s in lesson_score.items():
        impact = avg(s["ow"]) * (11 - avg(s["cl"])) * (11 - avg(s["tr"])) / 100
        urgency = s["wq"] * 2 + s["fp"] + s["eo"] * 0.5
        rank.append((lid, impact * (1 + urgency / 10), impact, urgency, s))
    rank.sort(key=lambda x:-x[1])
    L.append("| Lesson | score | impact | urgency | n |")
    L.append("|--------|-------|--------|---------|---|")
    for lid, score, impact, urgency, s in rank[:30]:
        L.append(f"| `{lid}` {lesson_title(lid)[:35]} | {score:.1f} | {impact:.1f} | {urgency:.0f} | {s['n']} |")
    L.append("")

    # ===== 20. Must fix before launch =====
    L.append("## 20. Must Fix Before Launch")
    must = [r for r in rank if r[3] >= 5][:15]   # high urgency
    if not must:
        must = rank[:15]
    for lid, score, impact, urgency, s in must:
        L.append(f"- **`{lid}`** {lesson_title(lid)[:50]} — would_quit={s['wq']} · feels_prog={s['fp']} · "
                 f"overwhelm={avg(s['ow'])} · clarity={avg(s['cl'])}")
    L.append("")

    # ===== 21. Can wait after beta =====
    L.append("## 21. Can Wait After Beta (lower-impact items)")
    later = [r for r in rank if r[3] < 3 and r[2] < 5][:15]
    for lid, score, impact, urgency, s in later:
        L.append(f"- `{lid}` {lesson_title(lid)[:50]} — impact={impact:.1f} urgency={urgency:.0f}")
    L.append("")

    # ===== 22. Per-group summary =====
    L.append("## 22. Per-Group Summary")
    by_group: dict[str, list[Persona]] = {}
    for p in personas:
        by_group.setdefault(f"{p.group} — {p.group_label}", []).append(p)
    for label, ps in by_group.items():
        rx = [r for q in ps for r in q.journey]
        if not rx: continue
        L.append(f"### {label} (n={len(ps)})")
        L.append(f"- ردود: {len(rx)} | avg conf={avg([r['confidence'] for r in rx])} | "
                 f"ow={avg([r['overwhelm'] for r in rx])} | trust={avg([r['trust'] for r in rx])} | "
                 f"clarity={avg([r['clarity'] for r in rx])} | boredom={avg([r['boredom'] for r in rx])}")
        for p in ps:
            status = (f"❌ quit at `{p.quit_at}`" if p.quit_at else
                      (f"✅ forced completed ({len(p.journey)}/{len(ALL_LESSONS)})" if p.completed_full_platform
                       else f"➖ {len(p.journey)} درس"))
            extra = f" · would_quit_at=`{p.would_quit_at}`" if p.would_quit_at else ""
            L.append(f"  - {p.name} (`{p.slug}`) — {status}{extra}")
        L.append("")

    return "\n".join(L)

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--personas", type=int, default=50)
    ap.add_argument("--filter", default="")
    ap.add_argument("--parallel", type=int, default=8)
    ap.add_argument("--max-lessons", type=int, default=0,
                    help="override per-persona max (0 = use persona setting)")
    ap.add_argument("--name", default="persona-sim-v7-no-intro-50-agents")
    ap.add_argument("--compare-v6", default="/mnt/documents/persona-sim-v6-50-agents-full-platform-20260531-212852-raw.json",
                    help="path to v6 raw.json for delta section")
    args = ap.parse_args()

    personas = PERSONAS
    if args.filter:
        personas = [p for p in personas if args.filter in p.slug]
    personas = personas[: args.personas]
    if args.max_lessons > 0:
        for p in personas:
            p.max_lessons = min(p.max_lessons, args.max_lessons)

    print(f"🚀 Running {len(personas)} personas | parallel={args.parallel} | "
          f"lessons={len(ALL_LESSONS)} | keys={len(GEMINI_KEYS)}")

    t0 = time.time()
    results: list[Persona] = []
    with ThreadPoolExecutor(max_workers=args.parallel) as ex:
        futs = {ex.submit(persona_journey, p): p for p in personas}
        for fut in as_completed(futs):
            try:
                results.append(fut.result())
            except Exception as e:
                print(f"⚠️ persona crashed: {e}")
    duration = time.time() - t0

    order = {p.slug: i for i, p in enumerate(personas)}
    results.sort(key=lambda p: order.get(p.slug, 999))

    stamp = time.strftime("%Y%m%d-%H%M%S")
    raw = OUT_DIR / f"{args.name}-{stamp}-raw.json"
    raw.write_text(json.dumps([asdict(p) for p in results], ensure_ascii=False, indent=2), encoding="utf-8")
    report = build_report(results, duration)
    # ===== v7 vs v6 delta =====
    try:
        v6_path = Path(args.compare_v6)
        if v6_path.exists():
            v6 = json.loads(v6_path.read_text())
            v6_real = [p for p in v6 if p.get("mode") == "realistic"]
            v6_rx = [r for p in v6 for r in p.get("journey", [])]
            v7_real = [p for p in results if p.mode == "realistic"]
            v7_rx = [r for p in results for r in p.journey]
            def _avg(xs, k):
                vs = [r[k] for r in xs if r.get(k) is not None]
                return round(statistics.mean(vs), 2) if vs else 0
            def _pctflag(xs, k):
                return round(100*sum(1 for r in xs if r.get(k))/max(1,len(xs)), 1)
            v6_quit = sum(1 for p in v6_real if p.get("quit_at"))
            v7_quit = sum(1 for p in v7_real if p.quit_at)
            delta = []
            delta.append("\n## 23. v7 vs v6 — Delta (no-intro vs with-intro)\n")
            delta.append("| Metric | v6 (with intro) | v7 (no intro) | Δ |")
            delta.append("|--------|-----------------|---------------|----|")
            def row(label, a, b, fmt="{}"):
                d = b - a
                arrow = "↓" if d < 0 else ("↑" if d > 0 else "→")
                delta.append(f"| {label} | {fmt.format(a)} | {fmt.format(b)} | {arrow} {fmt.format(abs(d))} |")
            row("Realistic quit rate %", round(100*v6_quit/max(1,len(v6_real)),1), round(100*v7_quit/max(1,len(v7_real)),1))
            row("Avg lessons before quit",
                round(statistics.mean([len(p.get('journey',[])) for p in v6_real]),1),
                round(statistics.mean([len(p.journey) for p in v7_real]),1))
            row("English overload %", _pctflag(v6_rx,"english_overload"), _pctflag(v7_rx,"english_overload"))
            row("Feels like programming %", _pctflag(v6_rx,"feels_like_programming"), _pctflag(v7_rx,"feels_like_programming"))
            row("Aha moment %", _pctflag(v6_rx,"aha_moment"), _pctflag(v7_rx,"aha_moment"))
            row("Avg confidence", _avg(v6_rx,"confidence"), _avg(v7_rx,"confidence"))
            row("Avg overwhelm", _avg(v6_rx,"overwhelm"), _avg(v7_rx,"overwhelm"))
            row("Avg trust", _avg(v6_rx,"trust"), _avg(v7_rx,"trust"))
            row("Avg clarity", _avg(v6_rx,"clarity"), _avg(v7_rx,"clarity"))
            row("Avg perceived_value", _avg(v6_rx,"perceived_value"), _avg(v7_rx,"perceived_value"))
            row("Avg would_pay", _avg(v6_rx,"would_pay"), _avg(v7_rx,"would_pay"))
            row("Avg would_recommend", _avg(v6_rx,"would_recommend"), _avg(v7_rx,"would_recommend"))
            report += "\n" + "\n".join(delta) + "\n"
    except Exception as e:
        print(f"⚠️ v6 compare failed: {e}")
    md = OUT_DIR / f"{args.name}-{stamp}.md"
    md.write_text(report, encoding="utf-8")

    print(f"\n✅ تم — {duration/60:.1f} دقيقة")
    print(f"📄 Report: {md}")
    print(f"📦 Raw:    {raw}")
    print(f"REPORT_PATH={md}")

if __name__ == "__main__":
    main()
#!/usr/bin/env python3
"""
Persona Simulator — pre-beta UX/content stress test.

Spins up 5 AI personas, each impersonating an Egyptian Arabic-speaking learner.
Each persona:
  1. Gets created via Supabase admin API (email pre-confirmed).
  2. Signs in to obtain a JWT.
  3. Walks through the first 3 Builder lessons.
  4. Decides (via Lovable AI) whether to read / ask the assistant / leave.
  5. Calls the live assistant-runtime edge function for "ask" turns.
  6. Records EVERY action in `learner_events`.

Outputs: /mnt/documents/persona-sim-report.md
"""
from __future__ import annotations

import json
import os
import random
import sys
import time
import uuid
from dataclasses import dataclass, field
from typing import Any

import requests

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
SUPABASE_URL = os.environ["SUPABASE_URL"].rstrip("/")
SERVICE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
PUBLIC_KEY = os.environ["SUPABASE_PUBLISHABLE_KEY"]
LOVABLE_KEY = os.environ["LOVABLE_API_KEY"]

AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions"
AI_MODEL = "google/gemini-2.5-flash"  # fast + cheap + good Arabic

# Lessons to test (Builder, Module 1)
LESSONS = [
    {"id": "builder-m1-what-is-llm", "title": "إيه هو الـ LLM؟",
     "path_id": "builder", "module_id": "builder-m1"},
    {"id": "builder-m1-tokens-training", "title": "Tokens والتدريب",
     "path_id": "builder", "module_id": "builder-m1"},
]

# Expanded lineup so we can measure voluntary drop-off across a real arc.
LESSONS = [
    {"id": "builder-m1-what-is-llm",          "title": "إيه هو الـ LLM؟",        "path_id": "builder", "module_id": "builder-m1"},
    {"id": "builder-m1-tokens-training",      "title": "Tokens والتدريب",        "path_id": "builder", "module_id": "builder-m1"},
    {"id": "builder-m2-prompt-layer",         "title": "طبقة الـ Prompt",        "path_id": "builder", "module_id": "builder-m2"},
    {"id": "builder-m2-instructions-examples","title": "تعليمات وأمثلة",         "path_id": "builder", "module_id": "builder-m2"},
    {"id": "builder-m2-style-control",        "title": "تحكّم في الـ Style",     "path_id": "builder", "module_id": "builder-m2"},
    {"id": "builder-m3-context-layer",        "title": "طبقة الـ Context",       "path_id": "builder", "module_id": "builder-m3"},
    {"id": "builder-m3-memory-limits",        "title": "حدود الذاكرة",           "path_id": "builder", "module_id": "builder-m3"},
    {"id": "builder-m4-parameters",           "title": "الـ Parameters",         "path_id": "builder", "module_id": "builder-m4"},
    {"id": "builder-m4-temperature",          "title": "Temperature و Top-p",    "path_id": "builder", "module_id": "builder-m4"},
    {"id": "builder-m5-frontend",             "title": "الـ Frontend",           "path_id": "builder", "module_id": "builder-m5"},
    {"id": "builder-m5-backend-api",          "title": "Backend / API",          "path_id": "builder", "module_id": "builder-m5"},
    {"id": "builder-m5-database-intro",       "title": "مقدمة الـ Database",     "path_id": "builder", "module_id": "builder-m5"},
]

# ---------------------------------------------------------------------------
# Personas
# ---------------------------------------------------------------------------
@dataclass
class Persona:
    slug: str
    name: str
    system_prompt: str
    user_id: str = ""
    jwt: str = ""
    session_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    events: list[dict] = field(default_factory=list)


PERSONAS = [
    Persona(
        slug="junior-learner",
        name="Junior Learner",
        system_prompt=(
            "إنت يوزر مصري داخل المنصة لأول مرة في حياتك. مش فاهم إيه هي ولا "
            "بتعمل إيه، وبتجرّب كل حاجة من الأول: بتقرا العناوين، بتدوس على "
            "أول درس، بتتلخبط من المصطلحات (LLM، Token، Prompt)، وبتسأل "
            "أسئلة بدائية جدًا زي 'يعني إيه ده؟' أو 'أعمل إيه دلوقتي؟' أو "
            "'من فين أبدأ؟'. مفيش عندك أي خلفية تقنية. بتكتب بالعامية "
            "المصرية البسيطة، رد قصير جدًا (سطر واحد) وبراءة المبتدئ."
        ),
    ),
    Persona(
        slug="distracted-beginner",
        name="المبتدئ المشتت",
        system_prompt=(
            "إنت يوزر مصري عمره 24 سنة، مبتدئ خالص في الـ AI، بتتفرّج على المنصة "
            "وإنت مشتت. بتقرا الدرس بسرعة، بتسأل أسئلة سطحية ومش متركّز، "
            "وممكن تسيب الدرس في النص لو حسّيت إنه طويل. "
            "بتكتب بالعامية المصرية الصرف، رد قصير جدًا (سطر واحد)."
        ),
    ),
    Persona(
        slug="fast-learner",
        name="المتعلم السريع",
        system_prompt=(
            "إنت يوزر مصري ذكي ومتحمس، بتفهم بسرعة وبتسأل أسئلة عميقة عن "
            "الـ details التقنية. بتخلّص كل درس وبتدوّر على اللي بعده. "
            "بتكتب بالعامية المصرية، رد قصير ومركّز."
        ),
    ),
    Persona(
        slug="skeptic",
        name="المتشكك",
        system_prompt=(
            "إنت يوزر مصري متشكّك، دايمًا بتسأل 'ليه أنا محتاج ده؟' و'ده هيفيدني "
            "في إيه؟'. بتستفزّ المساعد عشان تشوف لو هيقدر يقنعك. "
            "بتكتب بالعامية المصرية، رد قصير ومستفز."
        ),
    ),
    Persona(
        slug="weak-arabic",
        name="عربيته ضعيفة",
        system_prompt=(
            "إنت يوزر بتكتب عربي مكسّر ومليان أخطاء إملائية، وبتخلط كلمات إنجليزي "
            "كتير. مش متعوّد تقرا عربي فصحى. مثلًا: 'انا مش fhem el lesson da'. "
            "رد قصير."
        ),
    ),
    Persona(
        slug="expert-critic",
        name="الخبير الناقد",
        system_prompt=(
            "إنت مهندس برمجيات خبير، بتقيّم المحتوى بشكل صارم. بتدوّر على أخطاء "
            "تقنية، تبسيط زيادة، أو معلومات مغلوطة. أسئلتك تقنية ودقيقة. "
            "بتكتب بالعامية المصرية المهنية، رد قصير وحاد."
        ),
    ),
]

# ---------------------------------------------------------------------------
# HTTP helpers
# ---------------------------------------------------------------------------
def admin_headers() -> dict:
    return {
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type": "application/json",
    }


def user_headers(jwt: str) -> dict:
    return {
        "apikey": PUBLIC_KEY,
        "Authorization": f"Bearer {jwt}",
        "Content-Type": "application/json",
    }


def create_user(email: str, password: str) -> str:
    """Create user via admin API with email pre-confirmed. Idempotent."""
    r = requests.post(
        f"{SUPABASE_URL}/auth/v1/admin/users",
        headers=admin_headers(),
        json={"email": email, "password": password, "email_confirm": True},
        timeout=30,
    )
    if r.status_code in (200, 201):
        return r.json()["id"]
    # User exists — find by email
    if "already" in r.text.lower() or r.status_code == 422:
        lst = requests.get(
            f"{SUPABASE_URL}/auth/v1/admin/users?email={email}",
            headers=admin_headers(), timeout=30,
        ).json()
        users = lst.get("users", lst) if isinstance(lst, dict) else lst
        for u in users:
            if u.get("email") == email:
                return u["id"]
    raise RuntimeError(f"create_user failed: {r.status_code} {r.text}")


def sign_in(email: str, password: str) -> str:
    r = requests.post(
        f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
        headers={"apikey": PUBLIC_KEY, "Content-Type": "application/json"},
        json={"email": email, "password": password},
        timeout=30,
    )
    r.raise_for_status()
    return r.json()["access_token"]


def insert_event(persona: Persona, event_type: str, **fields: Any) -> None:
    payload = {
        "user_id": persona.user_id,
        "event_type": event_type,
        "session_id": persona.session_id,
        "metadata": fields.pop("metadata", {}),
    }
    for k in ("path_id", "module_id", "lesson_id", "mission_id"):
        if k in fields:
            payload[k] = fields[k]
    r = requests.post(
        f"{SUPABASE_URL}/rest/v1/learner_events",
        headers={**user_headers(persona.jwt), "Prefer": "return=minimal"},
        json=payload, timeout=30,
    )
    if r.status_code not in (200, 201, 204):
        print(f"  ⚠️  insert_event failed: {r.status_code} {r.text}")
    persona.events.append({"type": event_type, **payload})


def fetch_lesson_content(lesson_id: str) -> str:
    """Pull lesson chunks from knowledge_chunks via service role."""
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/knowledge_chunks"
        f"?lesson_id=eq.{lesson_id}&select=title,content&limit=10",
        headers=admin_headers(), timeout=30,
    )
    if r.status_code != 200:
        return f"(content unavailable: {r.status_code})"
    chunks = r.json()
    if not chunks:
        return "(no content found)"
    return "\n\n".join(f"{c.get('title','')}\n{c.get('content','')[:800]}" for c in chunks[:5])


# ---------------------------------------------------------------------------
# AI calls
# ---------------------------------------------------------------------------
def ai_call(system: str, user: str, max_tokens: int = 300) -> str:
    r = requests.post(
        AI_URL,
        headers={"Authorization": f"Bearer {LOVABLE_KEY}", "Content-Type": "application/json"},
        json={
            "model": AI_MODEL,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "max_tokens": max_tokens,
        },
        timeout=60,
    )
    if r.status_code == 429:
        time.sleep(5)
        return ai_call(system, user, max_tokens)
    if r.status_code == 402:
        raise RuntimeError("AI credits exhausted")
    r.raise_for_status()
    return r.json()["choices"][0]["message"]["content"].strip()


def persona_decide_action(persona: Persona, lesson_title: str, lesson_excerpt: str) -> dict:
    """Ask the persona: what do you do with this lesson?"""
    prompt = (
        f"إنت بتشوف درس عنوانه: «{lesson_title}»\n\n"
        f"مقتطف من الدرس:\n{lesson_excerpt[:1500]}\n\n"
        "إيه اللي هتعمله؟ رد بـ JSON بس على الشكل ده (من غير أي شرح):\n"
        '{"action": "read|ask|leave", "question": "السؤال لو action=ask", '
        '"finished": true|false, "thoughts": "إيه اللي حسيت بيه (سطر واحد)"}'
    )
    raw = ai_call(persona.system_prompt, prompt, max_tokens=250)
    # Strip code fences
    if "```" in raw:
        raw = raw.split("```")[1].replace("json", "", 1).strip()
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {"action": "read", "finished": True, "thoughts": raw[:200]}


def call_assistant(persona: Persona, lesson: dict, question: str) -> str:
    """Hit the live assistant-runtime edge function as the persona."""
    r = requests.post(
        f"{SUPABASE_URL}/functions/v1/assistant-runtime",
        headers={
            "Authorization": f"Bearer {persona.jwt}",
            "apikey": PUBLIC_KEY,
            "Content-Type": "application/json",
        },
        json={
            "query": question,
            "learnerContext": {
                "currentPath": lesson["path_id"],
                "currentModule": lesson["module_id"],
                "currentLesson": lesson["id"],
                "currentLessonTitle": lesson["title"],
            },
        },
        timeout=60,
    )
    if r.status_code != 200:
        return f"[ERROR {r.status_code}: {r.text[:200]}]"
    data = r.json()
    return data.get("answer") or data.get("message") or "[empty response]"


def evaluate_answer(persona: Persona, question: str, answer: str) -> dict:
    """Persona rates the assistant's answer."""
    prompt = (
        f"سألت المساعد: «{question}»\n\nرد المساعد:\n{answer[:1200]}\n\n"
        "قيّم الرد بـ JSON:\n"
        '{"clarity": "clear|vague|wrong", "helpful": true|false, '
        '"reaction": "ردة فعلك في سطر واحد"}'
    )
    raw = ai_call(persona.system_prompt, prompt, max_tokens=200)
    if "```" in raw:
        raw = raw.split("```")[1].replace("json", "", 1).strip()
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {"clarity": "unknown", "helpful": False, "reaction": raw[:200]}

def persona_decide_continue(persona: Persona, just_finished_title: str,
                            next_title: str | None, lessons_done: int) -> dict:
    """After a lesson, persona voluntarily decides: continue to next, or quit now."""
    if next_title is None:
        return {"decision": "continue", "reason": "(no next lesson — end of arc)"}
    prompt = (
        f"لسه خلّصت درس: «{just_finished_title}» (ده الدرس رقم {lessons_done} ليك في المنصة).\n"
        f"الدرس اللي بعده اسمه: «{next_title}».\n\n"
        "بصراحة كده، إنت دلوقتي عايز تكمّل وتفتح الدرس الجاي، ولا حاسس "
        "إنك مش هتكمّل دلوقتي وعايز تقفل؟ مفيش ضغط — قول رأيك الصريح.\n\n"
        "رد بـ JSON بس:\n"
        '{"decision": "continue|quit", "reason": "ليه (سطر واحد)", '
        '"energy": 1-10}'
    )
    raw = ai_call(persona.system_prompt, prompt, max_tokens=200)
    if "```" in raw:
        raw = raw.split("```")[1].replace("json", "", 1).strip()
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {"decision": "continue", "reason": raw[:200], "energy": 5}


# ---------------------------------------------------------------------------
# Simulation
# ---------------------------------------------------------------------------
def run_persona(persona: Persona) -> None:
    email = f"sim-{persona.slug}@persona.local"
    password = "Sim!Persona2026_xK9"  # not breached, passes HIBP
    print(f"\n🤖 [{persona.slug}] {persona.name}")

    persona.user_id = create_user(email, password)
    persona.jwt = sign_in(email, password)
    print(f"  ✓ signed in (user_id={persona.user_id[:8]})")

    insert_event(persona, "sim_started", metadata={"persona": persona.slug})
    insert_event(persona, "path_selected", path_id="builder")

    for i, lesson in enumerate(LESSONS):
        print(f"  📖 lesson {i+1}: {lesson['title']}")
        insert_event(persona, "lesson_opened",
                     path_id=lesson["path_id"],
                     module_id=lesson["module_id"],
                     lesson_id=lesson["id"])

        content = fetch_lesson_content(lesson["id"])
        decision = persona_decide_action(persona, lesson["title"], content)
        print(f"     → action={decision.get('action')} thoughts={decision.get('thoughts','')[:80]}")

        insert_event(persona, "lesson_reaction",
                     lesson_id=lesson["id"],
                     metadata=decision)

        if decision.get("action") == "leave":
            insert_event(persona, "lesson_abandoned", lesson_id=lesson["id"])
            print(f"     ✋ left lesson")
            break

        if decision.get("action") == "ask":
            q = decision.get("question") or "اشرحلي تاني"
            print(f"     ❓ asks: {q[:80]}")
            insert_event(persona, "assistant_asked",
                         lesson_id=lesson["id"],
                         metadata={"question": q})
            answer = call_assistant(persona, lesson, q)
            print(f"     💬 answer: {answer[:80]}...")
            evaluation = evaluate_answer(persona, q, answer)
            insert_event(persona, "assistant_evaluated",
                         lesson_id=lesson["id"],
                         metadata={"question": q, "answer": answer[:500],
                                   "evaluation": evaluation})
            print(f"     ⭐ clarity={evaluation.get('clarity')} helpful={evaluation.get('helpful')}")

        if decision.get("finished"):
            insert_event(persona, "lesson_completed",
                         path_id=lesson["path_id"],
                         module_id=lesson["module_id"],
                         lesson_id=lesson["id"])

        # Voluntary continuation gate — persona explicitly chooses to go on or quit.
        next_lesson = LESSONS[i + 1] if i + 1 < len(LESSONS) else None
        cont = persona_decide_continue(
            persona,
            just_finished_title=lesson["title"],
            next_title=next_lesson["title"] if next_lesson else None,
            lessons_done=i + 1,
        )
        insert_event(
            persona,
            "voluntary_continue" if cont.get("decision") == "continue" else "voluntary_quit",
            lesson_id=lesson["id"],
            metadata=cont,
        )
        print(f"     🔁 voluntary={cont.get('decision')} energy={cont.get('energy')} — {cont.get('reason','')[:80]}")
        if cont.get("decision") == "quit":
            print(f"     🚪 chose to stop after {i+1} lessons")
            break
        time.sleep(0.5)

    insert_event(persona, "sim_ended", metadata={"events_count": len(persona.events)})


# ---------------------------------------------------------------------------
# Report
# ---------------------------------------------------------------------------
def generate_report(personas: list[Persona]) -> str:
    lines = ["# Persona Simulation Report", ""]
    lines.append(f"شُغّل في: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    lines.append(f"عدد الشخصيات: {len(personas)}")
    lines.append("")

    # Aggregate
    total_events = sum(len(p.events) for p in personas)
    abandoned = sum(1 for p in personas if any(e["type"] == "lesson_abandoned" for e in p.events))
    asked = sum(1 for p in personas if any(e["type"] == "assistant_asked" for e in p.events))
    voluntary_quit = sum(1 for p in personas if any(e["type"] == "voluntary_quit" for e in p.events))
    lessons_completed_counts = [
        sum(1 for e in p.events if e["type"] == "lesson_completed") for p in personas
    ]
    avg_completed = (sum(lessons_completed_counts) / len(personas)) if personas else 0

    lines.append("## نظرة سريعة")
    lines.append(f"- إجمالي الأحداث المسجلة: **{total_events}**")
    lines.append(f"- شخصيات سابت درس قبل ما تخلّصه: **{abandoned}/{len(personas)}**")
    lines.append(f"- شخصيات سألت المساعد: **{asked}/{len(personas)}**")
    lines.append(f"- شخصيات قرّرت تقف طوعًا قبل آخر درس: **{voluntary_quit}/{len(personas)}**")
    lines.append(f"- متوسط الدروس المكتملة لكل شخصية: **{avg_completed:.1f} / {len(LESSONS)}**")
    lines.append("")

    for p in personas:
        lines.append(f"## {p.name} (`{p.slug}`)")
        lines.append(f"- user_id: `{p.user_id}`")
        lines.append(f"- session_id: `{p.session_id}`")
        lines.append(f"- عدد الأحداث: {len(p.events)}")
        lines.append("")
        lines.append("### تسلسل الرحلة")
        for e in p.events:
            typ = e["type"]
            meta = e.get("metadata", {})
            extra = ""
            if typ == "lesson_reaction":
                extra = f" — {meta.get('thoughts','')[:100]}"
            elif typ == "assistant_asked":
                extra = f" — Q: {meta.get('question','')[:100]}"
            elif typ == "assistant_evaluated":
                ev = meta.get("evaluation", {})
                extra = f" — clarity={ev.get('clarity')}, helpful={ev.get('helpful')}, «{ev.get('reaction','')[:80]}»"
            elif typ == "lesson_opened":
                extra = f" — {e.get('lesson_id','')}"
            elif typ in ("voluntary_continue", "voluntary_quit"):
                extra = f" — energy={meta.get('energy')}, «{meta.get('reason','')[:80]}»"
            lines.append(f"  - `{typ}`{extra}")
        lines.append("")

    # Assistant quality summary
    lines.append("## جودة المساعد")
    clear = vague = wrong = 0
    for p in personas:
        for e in p.events:
            if e["type"] == "assistant_evaluated":
                c = e.get("metadata", {}).get("evaluation", {}).get("clarity")
                if c == "clear": clear += 1
                elif c == "vague": vague += 1
                elif c == "wrong": wrong += 1
    lines.append(f"- ردود واضحة: **{clear}**")
    lines.append(f"- ردود غامضة: **{vague}**")
    lines.append(f"- ردود خاطئة: **{wrong}**")
    lines.append("")

    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main() -> int:
    print("🚀 Persona Simulator starting...")
    print(f"   Supabase: {SUPABASE_URL}")
    print(f"   Model: {AI_MODEL}")

    for p in PERSONAS:
        try:
            run_persona(p)
        except Exception as exc:
            print(f"❌ [{p.slug}] failed: {exc}")

    report = generate_report(PERSONAS)
    out = "/mnt/documents/persona-sim-report.md"
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, "w", encoding="utf-8") as f:
        f.write(report)
    print(f"\n✅ Report written: {out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
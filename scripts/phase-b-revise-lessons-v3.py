#!/usr/bin/env python3
"""
Phase B v3 — Builder m5-m8 reframing.
نفس بنية v2 + يحقن قواعد الـ reframing glossary (mental-model) كقواعد إلزامية
عشان الدروس الصعبة (Frontend/Backend/API/Database/Auth/RLS) ما تحسسش اليوزر
إنه دخل CS course.

استخدام:
    python3 scripts/phase-b-revise-lessons-v3.py builder-m5-l2-frontend [...]
أو من غير args يشتغل على ORDER الافتراضي.
"""
import os, sys, json, time, pathlib, re
import requests

LESSONS_DIR = pathlib.Path("src/components/intro/lessons")

# الترتيب الافتراضي لو ما اتبعتش args
DEFAULT_ORDER = [
    "builder-m5-l2-frontend",
    "builder-m5-l3-backend-api",
    "builder-m5-l4-database-intro",
    # m6/m7/m8 يتضافوا بعد ما نراجع m5
]

KEYS = [os.environ[k] for k in ("GEMINI_API_KEY","GEMINI_API_KEY_2","GEMINI_API_KEY_3","GEMINI_API_KEY_4") if os.environ.get(k)]
assert KEYS, "no GEMINI keys"
MODEL = "gemini-2.5-pro"

SYSTEM = """أنت محرر محتوى تعليمي خبير في اللهجة المصرية + تصميم تجربة تعلّم.

مهمتك: تستلم ملف TypeScript فيه درس واحد من **Phase 2 (Builder m5–m8)** في منصة بتعلّم بناء AI apps بـ Lovable، وترجّعه ملف TypeScript محسّن.

## ⚠️ القاعدة الأم (Phase 2 Framing) — أهم من أي حاجة تانية
اليوزر دخل عشان يبني **AI app**، مش عشان يتعلم Web Development.
كل درس في m5–m8 لازم يفضّل المتعلم يحس إنه **بيبني تطبيق ذكي**، مش إنه دخل CS course.
لازم يبقى في الدرس **scene واحدة على الأقل** تأكد إن الطبقة دي (Frontend/Backend/API/DB/Auth) هي اللي بتخلي الـ AI يقدر يخدم ناس حقيقيين.

## 📖 قاموس الـ Mental Model (إلزامي — استخدم الـ analogy الأول، والمصطلح الإنجليزي بين قوسين)

| المصطلح | الـ framing الإلزامي |
|---|---|
| Frontend | **واجهة التطبيق** — "الوش اللي العميل بيشوفه" (زي ديكور المحل) |
| Backend | **مخ التطبيق / الكواليس** — "المطبخ اللي بيطبخ القرار" |
| API | **ساعي البريد** — "بيوصل الرسائل بين البرامج" |
| Database | **المخزن الذكي** — "الأرشيف اللي بنشيّل فيه كل حاجة" |
| JWT | **كارت الدخول المؤقت / الإسورة** — "السيرفر بيعرفك بيها من غير ما تكتب الباسورد" |
| RLS Policy | **الحارس الشخصي لكل سطر** — "كل واحد يشوف اللي يخصه بس" |
| Foreign Key | **الوصلة بين دولابين** — "زي رقم الأوردر على كيس الدليفري" |
| Query | **سؤال للمخزن** |
| Session | **جلسة الزائر** |
| Cascade Delete | **يمسحوا مع بعض** |
| Index | **فهرس عشان السرعة** |
| RAG | **AI بيقرا ملفاتك قبل ما يجاوب** |

أمثلة AI-app framing جاهزة:
- Frontend → "الوش اللي العميل بيكلم منه الـ AI بتاعك"
- Backend → "المخ اللي بيستقبل سؤال العميل ويبعته للـ AI"
- Database → "المخزن اللي بيحفظ سؤال كل عميل ورد الـ AI عليه"
- Auth (JWT) → "عشان كل عميل يكلم AI خاص بيه، مش AI مشترك"
- RLS → "عشان عميل A ميشوفش محادثات عميل B مع الـ AI"

## 🚫 كلمات ممنوعة (إلا لو ضروري + analogy في نفس السطر)
- "Software Engineering" / "Full-stack" / "Web Development"
- "React" بدون شرح "أداة بنبني بيها الواجهة"
- "SQL" بدون شرح "لغة سؤال المخزن"

## قواعد V2 الإلزامية (لسه سارية)
1. **No Theory Without Tension** — أول section يفتح بألم/سؤال محسوس، مش بتعريف.
2. **Quick Win في أول 30 ثانية** — تاني section "جرّب دلوقتي" بنتيجة فورية.
3. **مثال حسي قبل المصطلح** — أي مصطلح تقني يسبقه مثال من الحياة.
4. **مصطلح تقني واحد كحد أقصى لكل درس** (غير المصطلح الرئيسي للدرس نفسه).
5. **Mission ≤ 10 دقايق** وبسيطة بخطوة-اتنين.
6. **لهجة مصرية صرف** — "ماذا"→"إيه"، "كيف"→"إزاي"، "لماذا"→"ليه"، "الآن"→"دلوقتي"، "فقط"→"بس"، "جداً"→"قوي".
7. **مفيش تكرار** بين الـ sections.
8. **Momentum** — كل section يخلي المتعلم يحس بتقدّم.

## قواعد فنية صارمة (مش قابلة للنقاش)
- متغيّرش أي `import` أو `export const NAME`.
- متغيّرش أسماء `kind` للـ blocks ولا بنيتها (نفس المفاتيح بالظبط).
- متغيّرش `lessonId` أو `id` في الـ quiz items.
- متغيّرش `src` للصور (`@/assets/...`) ولا الـ `href` للينكات.
- متغيّرش أيقونات lucide.
- ممكن تعدّل: النصوص العربية بس (eyebrow, title, paragraphs, intro, prompt, criteria, term, meaning, example, question, options, explanation, summary, bullets, body, label, caption, alt).
- ممكن تعيد ترتيب الـ sections لو ده بيخدم القاعدة #1 و#2.
- ممكن تحذف section كامل لو فيه تكرار.
- ممكن تضيف concept جديد لقايمة `concepts.items` لو ناقص (خصوصًا الـ analogy من القاموس).

## الإخراج
ملف TypeScript كامل من `import` لـ `];`. مفيش شرح، مفيش markdown fences. الرد كله كود جاهز للحفظ."""

def call_gemini(prompt: str, key: str) -> str:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={key}"
    payload = {
        "system_instruction": {"parts": [{"text": SYSTEM}]},
        "contents": [{"role":"user","parts":[{"text": prompt}]}],
        "generationConfig": {"temperature": 0.4, "maxOutputTokens": 16384},
    }
    r = requests.post(url, json=payload, timeout=180)
    if r.status_code != 200:
        raise RuntimeError(f"HTTP {r.status_code}: {r.text[:500]}")
    data = r.json()
    try:
        return data["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError):
        raise RuntimeError(f"bad response: {json.dumps(data)[:500]}")

def clean(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        lines = lines[1:]
        if lines and lines[-1].strip().startswith("```"):
            lines = lines[:-1]
        text = "\n".join(lines)
    return text.strip()

def validate(original: str, revised: str) -> tuple[bool, str]:
    orig_imports = re.findall(r"^import .+;$", original, re.M)
    for imp in orig_imports:
        if imp not in revised:
            return False, f"missing import: {imp}"
    m = re.search(r"export const ([A-Z_0-9]+)", original)
    if m:
        name = m.group(1)
        if f"export const {name}" not in revised:
            return False, f"missing export {name}"
    if not revised.rstrip().endswith("];"):
        return False, "doesn't end with ];"
    if len(revised) < len(original) * 0.4:
        return False, f"revised too short ({len(revised)} vs {len(original)})"
    return True, "ok"

def main():
    order = sys.argv[1:] if len(sys.argv) > 1 else DEFAULT_ORDER
    results = []
    total = len(order)
    for i, slug in enumerate(order):
        f = LESSONS_DIR / f"{slug}.ts"
        if not f.exists():
            print(f"[{i+1}/{total}] SKIP missing: {slug}")
            results.append((slug, "missing"))
            continue
        original = f.read_text()
        key = KEYS[i % len(KEYS)]
        print(f"[{i+1}/{total}] {slug} ... ", end="", flush=True)
        prompt = f"الملف الأصلي للدرس:\n\n```typescript\n{original}\n```\n\nراجعه طبقًا لقواعد Phase 2 + V2 + القاموس وارجع الملف المحسّن كامل."
        try:
            t0 = time.time()
            raw = call_gemini(prompt, key)
            revised = clean(raw)
            ok, msg = validate(original, revised)
            if not ok:
                print(f"INVALID ({msg}) — retry")
                raw = call_gemini(prompt + "\n\nالملف لازم يحافظ على كل الـ imports والـ export const. الرد كود فقط.", KEYS[(i+1) % len(KEYS)])
                revised = clean(raw)
                ok, msg = validate(original, revised)
            if ok:
                f.write_text(revised)
                dt = time.time() - t0
                print(f"OK ({dt:.1f}s, {len(revised)}b)")
                results.append((slug, "revised"))
            else:
                print(f"FAIL: {msg}")
                results.append((slug, f"fail:{msg}"))
        except Exception as e:
            print(f"ERROR: {e}")
            results.append((slug, f"err:{e}"))
        time.sleep(1.2)

    summary = pathlib.Path(".lovable/phase-b-v3-results.json")
    summary.parent.mkdir(exist_ok=True)
    summary.write_text(json.dumps(results, ensure_ascii=False, indent=2))
    ok_n = sum(1 for _, s in results if s == "revised")
    print(f"\n=== DONE: {ok_n}/{len(results)} revised ===")
    print(f"summary: {summary}")

if __name__ == "__main__":
    main()

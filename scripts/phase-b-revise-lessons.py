#!/usr/bin/env python3
"""
Phase B — Builder lessons content revision per V2 rules.
Uses Gemini API directly (user-provided keys), rotates across 4 keys.
"""
import os, sys, json, time, pathlib, re
import requests

LESSONS_DIR = pathlib.Path("src/components/intro/lessons")
ORDER = [
    "builder-m9-l24-rag",
    "builder-m9-l25-embeddings",
    "builder-m9-l26-agents",
]

KEYS = [os.environ[k] for k in ("GEMINI_API_KEY","GEMINI_API_KEY_2","GEMINI_API_KEY_3","GEMINI_API_KEY_4") if os.environ.get(k)]
assert KEYS, "no GEMINI keys"
MODEL = "gemini-2.5-pro"

SYSTEM = """أنت محرر محتوى تعليمي خبير في اللهجة المصرية + تصميم تجربة تعلّم.

مهمتك: تستلم ملف TypeScript فيه درس واحد من مسار "Builder" (تعلّم بناء تطبيقات بالـ AI/Lovable)، وترجّعه ملف TypeScript محسّن طبقًا لقواعد V2:

## قواعد V2 الإلزامية
1. **No Theory Without Tension** — مفيش مفهوم نظري قبل ما المتعلم يحس بمشكلة. أول section لازم يفتح بألم/سؤال محسوس مش بتعريف.
2. **Quick Win في أول 30 ثانية** — تاني section لازم يكون "جرّب دلوقتي" بنتيجة فورية محسوسة.
3. **مثال حسي قبل المصطلح** — أي مصطلح تقني يسبقه مثال من الحياة اليومية.
4. **مصطلح تقني واحد كحد أقصى لكل درس**. لو فيه أكتر، دمج أو احذف.
5. **Mission ≤ 10 دقايق وبسيطة** — لو فيه mission طويلة بسّطها لخطوة-اتنين بنتيجة واضحة.
6. **لهجة مصرية صرف** (Cairo Ammiya) — مفيش فصحى. كل "ماذا"→"إيه"، "كيف"→"إزاي"، "لماذا"→"ليه"، "الآن"→"دلوقتي"، "فقط"→"بس"، "جداً"→"قوي".
7. **مفيش تكرار** بين الـ sections — لو فقرتين بيقولوا نفس الفكرة، احذف واحدة.
8. **Momentum** — كل section يخلي المتعلم يحس بتقدّم. مفيش نص ميت.

## قواعد فنية صارمة (مش قابلة للنقاش)
- متغيّرش أي `import` أو `export const NAME`.
- متغيّرش أسماء `kind` للـ blocks ولا بنيتها (نفس المفاتيح بالظبط).
- متغيّرش `lessonId` أو `id` في الـ quiz items.
- متغيّرش `src` للصور (`@/assets/...`) ولا الـ `href` للينكات.
- متغيّرش أيقونات lucide.
- ممكن تعدّل: النصوص العربية فقط (eyebrow, title, paragraphs, intro, prompt, criteria, term, meaning, example, question, options, explanation, summary, bullets, body, label, caption, alt).
- ممكن تعيد ترتيب الـ sections لو ده بيخدم القاعدة #1 و#2.
- ممكن تحذف section كامل لو فيه تكرار، بشرط ما يحصلش break لأي reference.
- ممكن تضيف concept جديد لقايمة `concepts.items` لو ناقص.

## الإخراج
ارجع **ملف TypeScript كامل** يبتدي بـ `import` وينتهي بـ `];` للـ export. مفيش أي شرح، مفيش markdown fences، الرد كله كود TypeScript جاهز للحفظ مباشرة."""

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
    # strip ```typescript ... ``` fences if model added them
    if text.startswith("```"):
        lines = text.split("\n")
        lines = lines[1:]  # drop opening fence
        if lines and lines[-1].strip().startswith("```"):
            lines = lines[:-1]
        text = "\n".join(lines)
    return text.strip()

def validate(original: str, revised: str) -> tuple[bool, str]:
    # must keep all imports
    orig_imports = re.findall(r"^import .+;$", original, re.M)
    for imp in orig_imports:
        if imp not in revised:
            return False, f"missing import: {imp}"
    # must keep export const NAME
    m = re.search(r"export const ([A-Z_0-9]+)", original)
    if m:
        name = m.group(1)
        if f"export const {name}" not in revised:
            return False, f"missing export {name}"
    # must end with ];
    if not revised.rstrip().endswith("];"):
        return False, "doesn't end with ];"
    # rough sanity: length not collapsed to nothing
    if len(revised) < len(original) * 0.4:
        return False, f"revised too short ({len(revised)} vs {len(original)})"
    return True, "ok"

def main():
    results = []
    for i, slug in enumerate(ORDER):
        f = LESSONS_DIR / f"{slug}.ts"
        if not f.exists():
            print(f"[{i+1}/26] SKIP missing: {slug}")
            results.append((slug, "missing"))
            continue
        original = f.read_text()
        key = KEYS[i % len(KEYS)]
        print(f"[{i+1}/26] {slug} ... ", end="", flush=True)
        prompt = f"الملف الأصلي للدرس:\n\n```typescript\n{original}\n```\n\nراجعه طبقًا لقواعد V2 وارجع الملف المحسّن كامل."
        try:
            t0 = time.time()
            raw = call_gemini(prompt, key)
            revised = clean(raw)
            ok, msg = validate(original, revised)
            if not ok:
                print(f"INVALID ({msg}) — retry with key2")
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
        time.sleep(1.2)  # gentle throttle

    summary = pathlib.Path(".lovable/phase-b-results.json")
    summary.write_text(json.dumps(results, ensure_ascii=False, indent=2))
    ok_n = sum(1 for _, s in results if s == "revised")
    print(f"\n=== DONE: {ok_n}/{len(results)} revised ===")
    print(f"summary: {summary}")

if __name__ == "__main__":
    main()

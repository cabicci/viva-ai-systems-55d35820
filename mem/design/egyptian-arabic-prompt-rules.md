---
name: Egyptian Arabic prompt rules
description: TTS Egyptian Ammiya pronunciation rules + ق-word substitution policy + PRESERVE list
type: design
---

## ق-words policy (DEFAULT)

**Prefer Egyptian synonyms without ق over keeping the word.** The TTS often
mispronounces ق either way (ء أو ق غريبة). Cleanest fix = use a word that
doesn't contain ق at all.

**Substitution table (use these by default when writing scripts):**

| Avoid (has ق) | Use instead |
|---|---|
| قاعدة / القاعدة | أصل / مبدأ / حتة |
| قواعد | أصول / مبادئ / حاجات لازم تعملها |
| السياق | الموقف / الخلفية / الظروف |
| حقيقة / في الحقيقة | الواقع / فعلًا / بجد |
| دقيقة (الزمن) | لحظة / ثانية |
| الوقت | الزمن (لو ماشي) |
| طريقة | أسلوب / شكل |
| قرار | اختيار |
| قريب | جنب / على وشك |
| قصة | حكاية |
| قسم | جزء / فرع |
| مقابل | عكس / في مقابلة |
| مطلق | تمام / كامل |
| تطبيق | برنامج / app |
| دقايق | لحظات |

Apply this BEFORE writing the segment. If a ق-word is truly unavoidable
(proper noun, technical term with no clean synonym), then add it to PRESERVE.

## PRESERVE list (last resort)

File: `remotion/scripts/lib/egyptian_phonetic.py` → `PRESERVE` set.
Default fallback: any ق not in PRESERVE or WORD_MAP → ء (glottal stop).

Current preserved:
- قاعدة، القاعدة، قواعد، القواعد، بالقاعدة، بالقواعد
- سياق، السياق، بالسياق، سياقه، سياقها
- القرآن، قرآن، القاهرة، قانون، القانون، قوانين
- موسيقى، الموسيقى، حقوق، الحقوق، قسط، أقساط

**When adding to PRESERVE:**
1. Include every inflection: bare, with ال, with بال, with possessive suffixes.
2. Delete cached wavs for affected segments: `rm /tmp/m1-lXX/audio/sN_voice.wav`.
3. Re-run TTS script then re-render video.

**Order of operations when writing a new lesson script:**
1. First pass — substitute ق-words with synonyms from the table above.
2. Second pass — anything still containing ق that MUST stay → add to PRESERVE.
3. Never leave a raw ق-word that isn't either substituted or preserved.

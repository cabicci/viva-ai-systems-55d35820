# Lesson Design Rules (v9-derived)

مستخرجة من تقرير Persona Sim v9 (1920 تقييم على 96 درس، 20 agent). اتطبقت كقواعد ثابتة بعد ما الـ apply رسّخها.

## 1. ترتيب البلوكات

**الترتيب المعياري:**
```
[TitleCard] → [Concept × 1-2] → [Bullets/Compare/Quote] → [Concept × 1-2] → [BigStat/Compare] → [CTACard]
```

- **بداية واضحة:** أول بلوك دايمًا `TitleCard`.
- **نهاية حاسمة:** آخر بلوك دايمًا `CTACard`. مينفعش يكون في النص.
- **مفيش أكتر من 2 ConceptCard متتاليين.** الزيادة بتسبب ملل (مكسب block_order +2.74).
  - لو عندك 3+ concepts، اكسرها بـ `BulletsCard` أو `QuoteCard` أو `CompareCard`.

## 2. توزيع الألوان (Accents)

- **ممنوع تكرار نفس الـ accent في بلوكين متتاليين.**
- نوّع بين: `mint, lavender, peach, yellow, pink, mintDeep`.
- الـ `mintDeep` يفضل يتحجز للحظات قوية (BigStat / CTA).

## 3. هرمية الموبايل

- العنوان (Title) أكبر بوضوح من باقي البلوكات.
- الـ CTA لازم يكون مرئي بدون scroll طويل (مكسب mobile_readability +2.45).

## 4. الـ CTA

- نص واضح ومحدد: "ابدأ المهمة"، "كمّل للدرس اللي بعده".
- لون متباين (يفضل `mintDeep` أو `pink`).
- بلوك واحد فقط من نوع CTA لكل درس.

## 5. ما تعملش

- ❌ تتالي 3 ConceptCard أو أكتر.
- ❌ CTA في النص أو في البداية.
- ❌ تكرار accent متتالي.
- ❌ Title في غير أول بلوك.

---

**Enforcement:** السكريبت `scripts/lint-lesson-design.ts` بيشيك على القواعد دي على كل ملفات `src/components/intro/lessons/*.ts`.

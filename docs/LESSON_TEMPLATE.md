# Unified Lesson Template — Builder v2.2

كل درس على المنصة (Builder / Creator / Automator / Analyst / Business)
لازم يتبع نفس التركيبة دي. مفيش استثناءات. لو القسم لسه مش جاهز،
يتحط placeholder — مش يتشال.

## الـ 7 أقسام (بالترتيب)

| # | Block kind             | الغرض                                                        |
|---|------------------------|--------------------------------------------------------------|
| 1 | `paragraphs` (Hero)    | فكرة الدرس في جملتين — eyebrow = "HERO"                      |
| 2 | `lessonVideo`          | فيديو قصير (1-2 دقيقة) يشرح الفكرة بصرياً                    |
| 3 | `paragraphs`           | شرح بسيط — 3-4 فقرات قصيرة                                   |
| 4 | `comparison` (مفاهيمي) | إنسان × AI / قبل × بعد / طلب عام × طلب فيه تفاصيل             |
| 5 | `comparison` (صح×غلط)  | السلوك الصح × الغلطة الشائعة — eyebrow = "صح × غلط"          |
| 6 | `caseStudy`            | "المنصة دي عملت كده بالظبط" — title + summary + bullets     |
| 7 | `mission`              | مهمة تطبيقية + artifact يطلع منها                            |

## قاعدة الفيديو

- الـ `lessonVideo` جزء أساسي من الـ rhythm، مش اختياري.
- لو الفيديو لسه مش متصوّر: سيب `url` فاضي → الـ renderer يعرض
  placeholder لطيف (LESSON VIDEO · COMING SOON).
- `caption` و `durationLabel` اختياريين.

## مثال مختصر

```ts
import { Sparkles, Video, BookOpen, Scale, FileText, Rocket } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";

export const EXAMPLE_LESSON: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "HERO",
    title: "AI مش بيفكر زيك",
    block: {
      kind: "paragraphs",
      paragraphs: ["هو مش عقل بشري. هو بيتوقّع أقرب رد مناسب."],
    },
  },
  {
    icon: Video,
    eyebrow: "VIDEO",
    title: "شوف الفكرة",
    block: {
      kind: "lessonVideo",
      url: "", // placeholder حالياً
      caption: "شرح بصري للفكرة في دقيقة ونص.",
      durationLabel: "1:30",
    },
  },
  {
    icon: BookOpen,
    eyebrow: "الفكرة",
    title: "إيه اللي بيحصل جوّه؟",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "بيتوقّع، مش بيفهم.",
        "بيشوف كلامك ويربط بأنماط شافها قبل كده.",
        "ممكن يطلع واثق وغلط في نفس الوقت.",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "مقارنة",
    title: "إنسان × AI",
    block: {
      kind: "comparison",
      left:  { label: "إنسان", body: "بيفهم من تجربة وسياق حياتي." },
      right: { label: "AI",    body: "بيتوقّع من أنماط في بيانات." },
    },
  },
  {
    icon: CheckCircle2,
    eyebrow: "صح × غلط",
    title: "السلوك الصح × الغلطة الشائعة",
    block: {
      kind: "comparison",
      left:  { label: "صح ✓", body: "تستخدمه كأداة وتراجع نتيجته." },
      right: { label: "غلط ✗", body: "تاخد رده كأنه حقيقة من غير مراجعة." },
    },
  },
  {
    icon: FileText,
    eyebrow: "CASE STUDY",
    title: "المنصة دي عملت كده إزاي؟",
    block: {
      kind: "caseStudy",
      title: "كيف استخدمنا الفكرة هنا",
      summary: "المساعد بتاع المنصة بيشتغل بنفس المبدأ.",
      bullets: [
        "بنبعتله سياق الدرس قبل سؤالك.",
        "بنحدّد له الـ tone والـ format المتوقع.",
        "بنتحقق من إجابته قبل ما تظهر.",
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "MISSION",
    title: "جرّب بنفسك",
    block: {
      kind: "mission",
      intro: "افتح ChatGPT واكتب البرومبت ده، وشوف الفرق.",
      prompt: "اشرحلي في 3 جمل الفرق بين الفهم والتوقّع.",
      buttonLabel: "نسخ البرومبت",
      copiedLabel: "تم النسخ ✓",
    },
  },
];
```

## ملحوظة لأي AI session

- لما تضيف درس جديد: ابدأ من القالب ده، 6 blocks، نفس الترتيب.
- ما تشيلش الفيديو حتى لو مفيش URL — حط placeholder.
- بعد كتابة الدرس، نفّذ الـ 3 خطوات في `mem://index.md` لتسجيل الدرس
  في الـ curriculum.

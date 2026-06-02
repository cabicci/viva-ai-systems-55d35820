import {
  Sparkles,
  PlayCircle,
  Lightbulb,
  Image as ImageIcon,
  Scale,
  Rocket,
  BookOpen, FlaskConical } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";
import ctaScreenshot from "@/assets/lessons/creator-m2-cta.jpg";

/**
 * Creator · M2 · Lesson 03 — CTA: ازاي تخلّي المتفرّج يتحرّك
 * Format: Hero → Video → Concept → Platform Screenshot → Failure×Right → Mission
 */
export const CREATOR_M2_CTA_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "HERO",
    title: "محتوى من غير CTA = Views بس",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "الـ Views لوحدها مش هدف. الهدف إن حد يتحرّك.",
        "CTA واحد واضح > 3 طلبات ضايعة.",
      ],
    },
  },
  {
    icon: BookOpen,
    eyebrow: "مصطلحات الدرس",
    title: "مصطلحات هتشوفها في الدرس",
    tone: "primary",
    block: {
      kind: "concepts",
      items: [
        { term: "Lead / عميل مستهدف", meaning: "عميل محتمل أبدى اهتمامه بخدمتك وممكن يشتري قدام.", example: "لما حد يكلمك يسأل عن سعر الخدمة أو يبعت \"تفاصيل\"، ده بقى Lead تقدر تتابعه." },
        { term: "Awareness", meaning: "الوعي بالعلامة التجارية.. يعني تخلي الناس تعرف إنك موجود أصلاً.", example: "محل لسه فاتح بيعمل فيديو \"إحنا مين ومكاننا فين\" عشان الناس تعرفه بس." },
        { term: "Newsletter", meaning: "نشرة بريدية بتبعتها للناس اللي مهتمة بمحتواك على الإيميل.", example: "مكتب محاسبة بيبعت كل أسبوع إيميل فيه نصايح ضريبية للناس اللي مسجلة عنده." },
        { term: "Soft CTA", meaning: "طلب خفيف من المتابع \"زي لايك أو كومنت\" مش محتاج تفكير.", example: "لما تقول للناس في فيديو \"لو عجبك المحتوى اعمل لايك\"، ده طلب بسيط." },
        { term: "Hard CTA", meaning: "طلب مباشر وصريح لعملية بيع أو اشتراك فوري.", example: "لما تحط سعر الكورس وتقول \"احجز مكانك دلوقتي قبل ما الخصم يخلص\"." },
        { term: "Conversion", meaning: "لما الشخص ينفذ الطلب اللي إنت قلته في الـ CTA فعلاً.", example: "لو 100 واحد شافوا الفيديو و5 بس اشتروا، يبقى ده معدل التحويل بتاعك." },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج الأول",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption: "إزاي تختار CTA واحد قوي بدل ما تتعب المتفرّج بـ 5 طلبات.",
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "Soft CTA × Hard CTA",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "كل فيديو لازم يقول للمتفرّج «اعمل إيه بعد ما خلصت تتفرّج». من غير ده، الفيديو زي إعلان من غير اسم منتج.",
        "Soft CTA — طلب صغير سهل: «احفظ البوست»، «اكتب رأيك في كومنت»، «شير لصاحبك». بيبني علاقة من غير ضغط.",
        "Hard CTA — طلب مباشر بقيمة: «اشترك في الـ Newsletter»، «احجز جلسة»، «اطلب الكتاب». بيحوّل المتفرّج لـ Lead أو عميل.",
        "قاعدة ذهبية: CTA واحد لكل فيديو. لو طلبت متابعة + لايك + كومنت + شير + سيف، مش هتحصل على أي حاجة.",
        "وضع الـ CTA مهم: في النص (مش الآخر بس)، بصوت واضح، وبتكرار لو الفيديو طويل.",
      ],
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوف بنفسك",
    title: "Mission بزر واحد",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: ctaScreenshot,
      alt: "كارت Mission بزر واحد «انسخ القالب»، وتحته زرّيْ «خلّصت» و«الدرس التالي».",
      caption:
        "كل كارت Mission في المنصة فيه طلب واحد بس: «انسخ القالب». وفي آخر الدرس زرار واحد بارز للخطوة الجاية. مفيش 5 طلبات بتتزاحم.",
      label: "من المنصة — Mission + Lesson Nav",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "إزاي تطلب من المتفرّج صح",
    block: {
      kind: "comparison",
      left: {
        label: "FAILURE — «Follow, like, share, comment, save»",
        body: "خمس طلبات في 3 ثواني. المتفرّج اتلخبط، فمش هيعمل أي حاجة. أكتر من طلب = موت الـ CTA.",
      },
      right: {
        label: "RIGHT — طلب واحد محدّد",
        body: "«احفظ البوست ده عشان ترجعله بعدين». طلب واحد، سهل، واضح ليه. النتيجة: نسبة الـ saves بتقفز.",
      },
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "اكتب 3 CTAs لـ 3 أهداف مختلفة",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "creator-m2-cta-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "أحمد عامل فيديو عالتيك توك بيشرح فيه إزاي تعمل قهوة مظبوطة. هو عايز يزود عدد المتابعين بتوعه وميكُنش بيضغط عليهم. إيه أنسب CTA ممكن يستخدمه في آخر الفيديو؟",
          options: [
            "لو عجبتك القهوة دي، اعمل فولو عشان تشوف وصفات تانية كتير!",
            "اشتري كورس القهوة بتاعي دلوقتي عشان تبقى باريستا محترف!",
            "ابعَت 'قهوة' عالواتساب عشان تاخد خصم عالبُن بتاعنا."
          ],
          correctIndex: 0,
          explanation: "ده Soft CTA بسيط ومش بيضغط، ومناسب لهدف زيادة المتابعين وتكوين علاقة مع الجمهور."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "سارة بتعمل فيديوهات عن التسويق الرقمي وهدفها تجمع إيميلات لناس مهتمة عشان تبعتلهم نشرة إخبارية (Newsletter). إيه الـ CTA اللي المفروض تستخدمه عشان تحقق الهدف ده؟",
          options: [
            "دوس لايك وشير عشان المحتوى يوصل لأكبر عدد.",
            "سجّل في الـ Newsletter من اللينك اللي في البايو عشان يوصلك كل جديد في التسويق.",
            "احجز استشارة مجانية معايا عشان أساعدك في خطتك التسويقية."
          ],
          correctIndex: 1,
          explanation: "ده Hard CTA بس بيقدم قيمة (معلومات جديدة) وواضح في طلب التسجيل في النشرة الإخبارية، واللي بيحوّل المشاهد لـ Lead."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "ريم عندها فيديو بتشرح فيه تفاصيل كورس 'اصنع مشروعك الخاص'. هدفها الأساسي إن الناس تسجل في الكورس ده. إيه أنسب CTA ممكن تستخدمه عشان تحصل على تسجيلات مباشرة؟",
          options: [
            "اكتب رأيك في الكومنتات لو نفسك تعمل مشروعك الخاص.",
            "شير الفيديو ده مع أي حد بيفكر يبدأ مشروع.",
            "سجّل لكورس 'اصنع مشروعك الخاص' دلوقتي من اللينك اللي في البايو قبل ما العدد يكتمل!"
          ],
          correctIndex: 2,
          explanation: "ده Hard CTA مباشر وواضح وبيطلب قرار فوري (التسجيل) لتحقيق هدف المبيعات أو الحجوزات، مع ذكر قيمة إضافية (العدد محدود)."
        }
      ]
    },
  },
  {
    icon: Rocket,
    eyebrow: "Mission",
    title: "صمّم Soft CTA + Hard CTA لقطعة محتوى عندك",
    tone: "primary",
    block: {
      kind: "mission",
      intro:
        "هتاخد فكرة محتوى واحدة وتصمّمها بـ CTA واحد فقط — مش ٣، مش ٥ — وتفرّق بين Soft و Hard.",
      prompt:
        "في تسليمك اكتب:\n\n١) فكرة المحتوى في سطر + المنصة:\n٢) الهدف الحقيقي للقطعة دي (Awareness / Lead / Sale):\n٣) Soft CTA واحد (مثال: «احفظ البوست»، «شارك حد محتاجه»).\n٤) Hard CTA واحد (مثال: «سجّل في الـ Free Workshop من اللينك»).\n٥) أنهي واحد فيهم اخترته كـ CTA النهائي ولِيه — مرتبط بالهدف؟",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "Soft + Hard مختلفين فعلاً",
          weight: 60,
          criteria: [
            "الـ Soft CTA مفيهوش طلب التزام (حفظ/مشاركة/تعليق).",
            "الـ Hard CTA فيه طلب التزام واضح (لينك/تسجيل/شراء).",
          ],
        },
        {
          label: "اختيار مربوط بالهدف",
          weight: 40,
          criteria: [
            "اخترت CTA واحد بالاسم — مش الاتنين.",
            "التبرير مربوط بالهدف (Awareness vs Lead vs Sale)، مش «لإنه أقوى».",
          ],
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جزء من المنصة",
    title: "كل صفحة في المنصة فيها CTA واحد محدّد",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "كل صفحة في المنصة فيها CTA واحد محدّد",
      summary:
        "الجزء ده من المنصة اتبنى بمسار Creator — نفس اللي بتتعلمه. /index فيه CTA واحد: «ابدأ مجانًا». /dashboard فيه CTA واحد: «كمّل درسك». مش 5 خيارات. CTA واحد قوي = conversion أعلى من 5 CTAs ضعاف.",
      bullets: [
        "Landing page: CTA واحد primary + link secondary واحد.",
        "Lesson page: CTA «خلصت الدرس» — مفيش بدائل.",
        "Dashboard: «كمّل من حيث وقفت» — مش ١٠ زرايير.",
      ],
      pathAngle: "creator",
      link: { label: "افتح الصفحة الرئيسية", href: "/" },
    },
  }
];

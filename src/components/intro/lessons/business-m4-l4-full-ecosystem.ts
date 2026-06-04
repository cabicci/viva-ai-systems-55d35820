import { Layers, PlayCircle, Lightbulb, Scale, Rocket, BookOpen, MessageSquare, Sparkles } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";

/** Business · M4 · Lesson 04 — الـ ٥ مسارات في يومك */
export const BUSINESS_M7_L1_FULL_ECOSYSTEM_BLOCKS: IntroLessonContent = [
  {
    icon: Layers,
    eyebrow: "HERO",
    title: "Business مش مسار لوحده — هو اللي بيوصّل الـ ٤ مسارات لبعضها",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "أحمد دلوقتي عنده نظام تشغيل كامل: Decision Framework، Customer Journey، SOPs، Time Audit، Weekly Rhythm. بس فضل عنده اكتشاف أخير — مسار Business لوحده مش كافي. لازم يربط الـ ٥ مسارات في إيكوسيستم متكامل.",
        "Builder بيحلّ مشكلة منتج. Creator بيوصّل صوت البيزنس. Automator بيشيل العمليات المتكررة. Analyst بيدّيك الأرقام للقرارات. Business هو الـ conductor اللي بيقول لكل مسار يلعب امتى وإزاي.",
        "أحمد لما ربط الـ ٥ مسارات: استخدم Analyst عشان يحلّل الـ Retention، Creator عشان يحوّل القصص لمحتوى، Automator عشان يأتمت الـ Retention Flow، Builder عشان يبني تطبيق طلبات. كل ده تحت قيادة Business. نتيجة: بيزنس بيشتغل كمنظومة، مش كقطع متفرّقة.",
      ],
    },
  },
  {
    icon: BookOpen,
    eyebrow: "مصطلحات الدرس",
    title: "اللي هتسمعه في الدرس ده",
    block: {
      kind: "concepts",
      items: [
        { term: "Ecosystem", meaning: "منظومة متكاملة من المسارات الـ ٥ بتشتغل مع بعض بدل ما تكون منعزلة.", example: "أحمد: Business بيقرّر، Analyst بيقيس، Automator بينفّذ، Creator بيوصّل، Builder بيبني." },
        { term: "Conductor Role", meaning: "دور القائد اللي بيحدّد كل مسار يلعب امتى وإزاي.", example: "أحمد بيقرّر إن Analyst يحلّل قبل ما Creator يكتب." },
        { term: "Cross-Track Synergy", meaning: "لما مسارين بيشتغلوا مع بعض بيطلّعوا نتيجة أكبر من جمعهم.", example: "Analyst + Creator: بيانات الـ Retention بتحوّل لقصة محتوى." },
        { term: "Workflow Stack", meaning: "تسلسل واضح: المسار ده بياخد input من فين، وبيدّي output لمين.", example: "Analyst → Business (قرار) → Automator (تنفيذ) → Creator (توصيل)." },
        { term: "Integration Audit", meaning: "مراجعة دورية: هل المسارات الـ ٥ بتتكلم مع بعض ولا كل واحد لوحده؟", example: "أحمد كل شهر يشوف: هل في مسار شغّال في عزلة؟" },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج الأول",
    tone: "accent",
    block: { kind: "lessonVideo", caption: "إزاي الـ ٥ مسارات بتشتغل مع بعض تحت قيادة Business." },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "ربط الـ ٥ مسارات في workflow واحد",
    block: {
      kind: "numberedList",
      items: [
        "Analyst — بيكشف المشكلة بالأرقام (مثلاً: Retention 18%).",
        "Business — بيحدّد القرار (نشتغل على Retention قبل أي حاجة).",
        "Automator — بيبني الـ workflow (رسالة بعد كل أوردر).",
        "Creator — بيكتب الرسالة بصوت البراند.",
        "Builder — بيبني الأداة لو محتاج شيء مخصّص (تطبيق ولاء مثلاً).",
      ],
    },
  },
  {
    icon: MessageSquare,
    eyebrow: "الـ Prompt القاتل",
    title: "5-Track Ecosystem Designer",
    tone: "accent",
    block: {
      kind: "rule",
      statement: "\"عندي مشكلة في بيزنسي [اوصفها]. صمّم لي workflow بيستخدم الـ ٥ مسارات (Business, Analyst, Automator, Creator, Builder) بالترتيب. لكل مسار: ١) دوره في الحل. ٢) الـ input اللي بياخده. ٣) الـ output اللي بيدّيه. ٤) أداة AI واحدة محدّدة هستخدمها.\"",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "مسارات منعزلة vs ecosystem متكامل",
    block: {
      kind: "comparison",
      left: { label: "FAILURE — منعزل", body: "أحمد يستخدم Creator لمحتوى عشوائي بدون أرقام من Analyst. يكتب أتمتة بدون قرار من Business. كل مسار شغّال لوحده — نتيجة: شغل كتير، أثر قليل." },
      right: { label: "RIGHT — ecosystem", body: "أحمد يبدأ من Analyst (إيه المشكلة؟)، يقرّر بـ Business، يبني بـ Automator، يوصّل بـ Creator. كل مسار بيدخل في التاني. نتيجة: شغل أقل، أثر أكبر." },
    },
  },
  {
    icon: Rocket,
    eyebrow: "Build Along — قطعتك في الـ Business OS",
    title: "صمّم workflow حقيقي يربط الـ ٥ مسارات",
    tone: "accent",
    block: {
      kind: "executionTask",
      title: "آخر قطعة في الـ Business OS = القدرة تربط كل المسارات في حل واحد متكامل.",
      steps: [
        "اختار مشكلة حقيقية في بيزنسك دلوقتي (Retention ضعيف، مبيعات ثابتة، فريق مش منتج).",
        "افتح AI. الصق الـ Prompt القاتل مع المشكلة بتاعتك.",
        "خد الـ workflow اللي طلع، وارسمه على ورقة كـ flow chart (مربع لكل مسار + سهم بين كل اتنين).",
        "لكل مسار، حدّد: الأداة اللي هتستخدمها + الوقت المتوقع + المسؤول (إنت، فريق، AI).",
        "نفّذ أول خطوتين فقط (Analyst + Business) الأسبوع ده. مش لازم تنفّذ الـ ٥ مرة واحدة.",
        "وثّق الـ workflow في \"Business OS\" بتاعك — هتعيد استخدامه لمشاكل تانية.",
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "اختبر فهمك",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "business-m7-l1-full-ecosystem-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "أحمد عايز يرفع المبيعات. بدأ مباشرة بـ Creator يكتب إعلانات. إيه الغلط؟",
          options: [
            "مفيش غلط — Creator هو اللي بيجيب مبيعات.",
            "بدأ من نص المنظومة. لازم Analyst الأول (إيه السبب الحقيقي لقلة المبيعات؟) ثم Business يقرّر الحل، وبعدين Creator.",
            "كان لازم يبدأ بـ Builder.",
          ],
          correctIndex: 1,
          explanation: "Creator بدون Analyst = إعلانات لمشكلة مش متأكد إيه هي. ممكن المشكلة مش في التوعية أصلاً — ممكن في التسعير، الجودة، أو الـ Retention. ابدأ بالتشخيص دايماً، بعدين القرار، بعدين التنفيذ."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "Cross-Track Synergy: أحمد عنده بيانات Retention من Analyst. إزاي يستفيد Creator منها؟",
          options: [
            "يستخدمها كأرقام إعلانية.",
            "يحوّل قصص العملاء اللي رجعوا لمحتوى — شهادات، فيديوهات قبل/بعد، \"ليه ٤٧% بيرجعوا\".",
            "يتجاهلها — مش شغله.",
          ],
          correctIndex: 1,
          explanation: "Synergy الحقيقي = أرقام Analyst بتتحوّل لقصص Creator. العملاء الراجعين هم أقوى دليل اجتماعي — استخدم قصصهم في المحتوى. ده بيرفع الـ acquisition عن طريق الـ retention. ده اللي بيخلّي المسارات تكسب من بعض."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "في workflow بتاعك، Builder بياخد input من مين؟",
          options: [
            "Creator — عشان يبني واجهة جميلة.",
            "Business — اللي بيحدّد الحاجة الفعلية للأداة المخصّصة، بناءً على قرار من Analyst.",
            "من حد، Builder بيشتغل لوحده.",
          ],
          correctIndex: 1,
          explanation: "Builder بياخد input من Business اللي بياخد input من Analyst. ده الترتيب الصح: مشكلة → قرار → بناء. لو Builder بيبدأ من غير قرار من Business، بتبني حاجة مش محتاجها — إهدار وقت وفلوس."
        }
      ]
    },
  },
  {
    icon: Sparkles,
    eyebrow: "Mission",
    title: "صمّم ونفّذ workflow حقيقي يربط ٥ مسارات",
    tone: "accent",
    block: {
      kind: "mission",
      intro: "ده الاختبار النهائي للـ Business OS بتاعك. مش درس — هو تخرّج.",
      prompt: "في تسليمك اكتب:\n\n١) المشكلة الحقيقية اللي اخترتها.\n٢) الـ workflow الكامل (٥ مسارات × دور × input × output × أداة).\n٣) رسم flow chart بسيط (صورة أو وصف بالكلام).\n٤) نتيجة تنفيذ أول خطوتين (Analyst + Business) — إيه اللي اكتشفته؟\n٥) خطة الـ ٣ خطوات الباقية (Automator + Creator + Builder) للأسبوع الجاي.\n٦) كيف الـ Business OS بتاعك بعد التخرّج مختلف عن لما بدأت المسار؟",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "Workflow متكامل",
          weight: 50,
          criteria: [
            "الـ ٥ مسارات موجودة وبترتيب منطقي.",
            "كل مسار بياخد input من اللي قبله وبيدّي output للي بعده.",
          ],
        },
        {
          label: "تنفيذ وتأمل",
          weight: 50,
          criteria: [
            "في تنفيذ فعلي لأول خطوتين.",
            "في تأمل صادق على التحوّل من بداية المسار للنهاية.",
          ],
        },
      ],
    },
  },
];

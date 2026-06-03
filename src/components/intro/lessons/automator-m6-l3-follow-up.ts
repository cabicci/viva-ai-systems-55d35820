import {
  Repeat,
  PlayCircle,
  Lightbulb,
  Image as ImageIcon,
  Scale,
  Rocket,
  BookOpen, FlaskConical } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";
import schedulingScreenshot from "@/assets/lessons/unique/automator-m6-l3-follow-up.jpg";

/**
 * Automator · M5 · Lesson 03 — المتابعة التلقائية + CRM
 */
export const AUTOMATOR_M5_FOLLOW_UP_BLOCKS: IntroLessonContent = [
  {
    icon: Repeat,
    eyebrow: "HERO",
    title: "المتابعة اللي بتشتغل لوحدها",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "Lead دخل. ردّت. سكت.",
        "الـ automation هيكمل المحادثة.",
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
        { term: "Lead", meaning: "زبون مهتم بس لسه مشتراش، مجرد \"طرف خيط\" لبيعة محتملة.", example: "لو بتبيع بدل وأخدت رقم زبون دخل المحل، ده كدا \"Lead\" لسه بنحاول نخليه يشتري." },
        { term: "CRM (Customer Relationship Management)", meaning: "الدفتر الرقمي اللي شايل بيانات عملائك وكل اللي حصل مابينكم.", example: "زي نوتة التليفونات بس ذكية، بتعرفك فلان اشترى إيه وآخر مرة كلمته كانت إمتى." },
        { term: "Trigger", meaning: "الشرارة أو \"الخبطة\" اللي بتخلي السيستم يبدأ ينفذ خطوات ورا بعض.", example: "لو حد ساب رقمه (Trigger)، السيستم يبعتله رسالة ترحيب فوراً وبعد يوم يبعت كتالوج." },
        { term: "Lead Nurturing", meaning: "إنك \"توجب\" مع الزبون بمعلومات ومتابعة عشان تسخن البيعة.", example: "زي ما بتبعت نصائح لمتابعينك عن الموضة عشان يفتكروك ويثقوا فيك قبل ما تطلب منهم يشتروا." },
        { term: "Follow-up Sequence (أو Automation)", meaning: "مجموعة رسائل أو خطوات مترتبة ورا بعض بتشتغل لوحدها بالوقت.", example: "زي شريط الكاسيت، بتبعت رسالة ترحيب، بعدها بيوم مكالمة، بعدها بيومين إيميل." },
        { term: "Break-up Message", meaning: "رسالة \"آخر فرصة\" بتعرف فيها الزبون إنك هتوقف متابعة معاه.", example: "بتبعتها لزبون مبردش عليك خالص، بتقوله \"شكلك مشغول، هقفل الملف دلوقتي ولو احتجتني أنا موجود\"." },
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
      caption: "إزاي تبني follow-up sequence بتتحرّك لوحدها حسب سلوك الـ lead.",
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "الـ Sequence بتتحرّك لوحدها",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "اليوم 0: Lead دخل → ردّ ترحيب فوري + resource مفيد.",
        "اليوم 2: لو مافتحش الإيميل → WhatsApp reminder.",
        "اليوم 5: لو ماتفاعلش → رسالة قصيرة بسؤال واحد.",
        "اليوم 7: لو اتفاعل → تحويل لـ human (فريق المبيعات).",
        "اليوم 14: لو ماتفاعلش نهائيًا → tag 'cold' ونقل لـ nurture sequence بطيئة.",
        "كل step في الـ sequence بتتنفّز أو بتتخطّى حسب سلوك الـ lead، مش حسب الوقت بس.",
      ],
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوف بنفسك",
    title: "الجدولة في Creator",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: schedulingScreenshot,
      alt: "درس Creator عن الجدولة والاستمرارية — جدول محتوى أسبوعي",
      caption:
        "في Creator M5 شفنا إن الجدولة محتاجة system. هنا هنبني نفس الفكرة بس للـ follow-up: جدول زمني + triggers + actions + evaluation. الـ content calendar بتاع Creator بقى 'follow-up sequence' للـ leads.",
      label: "من المنصة — درس الجدولة في Creator",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "Sequence بطيئة vs Sequence مزعجة",
    block: {
      kind: "comparison",
      left: {
        label: "FAILURE — تكرار من غير context",
        body: "بتبعت نفس الرسالة كل يومين لمدة شهر. 'تفتكر العرض؟' 'العرض لسه موجود!' 'العرض ممكن ينتهي!' الـ lead بيحظرك وبيتكتب مقال عن 'الشركة المزعجة دي'.",
      },
      right: {
        label: "RIGHT — Sequence بتتكيّف مع سلوك الـ lead",
        body: "فتح الإيميل → ننتقل لـ WhatsApp. رد على رسالة → human takeover. ماتفاعلش أبدًا → nurture monthly. كل touchpoint مختلفة عن اللي قبله ومبنية على اللي حصل.",
      },
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "اكتب Sequence أول Lead",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "automator-m6-l3-follow-up-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "عميل جديد اسمه 'أحمد' ساب بياناته في فورم على موقعك عشان يحمل 'دليل تحسين الإنتاجية'. إنت عايز تبعت له رسالة ترحيب فورية وفيها الدليل ده. أي أحسن channel تستخدمه لرسالة الترحيب الأولى دي بناءً على اللي درسته؟",
          options: [
            "WhatsApp",
            "Email",
            "مكالمة تليفونية"
          ],
          correctIndex: 0,
          explanation: "الـ WhatsApp هو الأنسب للرسالة الفورية عشان بتضمن إنها توصل وتتقري بسرعة أكبر من الإيميل، وكمان بتخلي المحادثة شخصية اكتر وبتحسس العميل إن فيه رد فعل سريع."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "بعد ما بعت رسالة لأحمد في اليوم الـ 0 وفيها الدليل، عدى يومين وهو لسه مافتحش الإيميل بتاع الدليل ده. إيه الإجراء المنطقي اللي تاخده في الـ sequence عشان تفكره و'تصحيه'؟",
          options: [
            "تبعت له إيميل تاني بنفس الدليل",
            "تتصل بيه مباشرةً",
            "تبعت له رسالة على WhatsApp بتفكره يفتح الإيميل"
          ],
          correctIndex: 2,
          explanation: "الـ WhatsApp reminder هو الأنسب في الحالة دي، لأنه بيوصل للعميل بشكل مباشر وبيكون أقل إزعاجاً من المكالمة، وفي نفس الوقت بيختلف عن الإيميل اللي هو بالفعل تجاهله."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "وصلنا لليوم السابع من دخول 'أحمد' السيستم. بعد الرسائل اللي فاتت، أحمد رد على رسالة الـ WhatsApp وسألك سؤال محدد عن الخدمة. إيه التصرف الأنسب في الـ sequence الأوتوماتيكية في اللحظة دي؟",
          options: [
            "تبعته له إيميل فيه إجابة السؤال",
            "تحوله لفريق المبيعات عشان يتواصلوا معاه شخصيًا",
            "تبعته له رسالة أوتوماتيكية بسيرة ذاتية لفريق العمل"
          ],
          correctIndex: 1,
          explanation: "بما أن Lead 'أحمد' بقى متفاعل وطرح سؤال محدد، ده معناه إنه Interest، والأوتوميشن هنا عمل وظيفته، فالمرحلة الجاية إننا نحوله لـ human (فريق المبيعات) عشان يكمل المحادثة ويزود فرص البيع."
        }
      ]
    },
  },
  {
    icon: Rocket,
    eyebrow: "Mission",
    title: "صمّم Sequence متابعة بـ ٤ touches في ١٠ أيام",
    tone: "primary",
    block: {
      kind: "mission",
      intro:
        "أول رسالة مش بتقفل صفقة. هتصمم sequence من ٤ touches مختلفة بقنوات وtimings مختلفة.",
      prompt:
        "في تسليمك:\n\nالسياق: Lead سجّل ولم يرد على الرسالة الأولى. صمّم sequence:\n\nTouch 1 (يوم 0): channel + رسالة + الـ goal\nTouch 2 (يوم 2): نفس الشكل\nTouch 3 (يوم 5): نفس الشكل + channel مختلف\nTouch 4 (يوم 10): الـ break-up message\n\nبعدين:\n- Stop conditions — إمتى الـ sequence يقف؟ (reply / unsubscribe / closed)\n- Tracking — هتقيس نجاح كل touch إزاي؟",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "٤ touches مختلفين",
          weight: 60,
          criteria: [
            "كل touch بـ channel وgoal مختلف.",
            "Break-up message في الـ touch الرابع، مش بيع تاني.",
          ],
        },
        {
          label: "Stop + Track",
          weight: 40,
          criteria: [
            "Stop conditions كاملة (ما تقفش بـ reply بس).",
            "Tracking metrics محددة لكل touch.",
          ],
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جزء من المنصة",
    title: "lesson_review_schedule = follow-up automated",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "lesson_review_schedule = follow-up automated",
      summary:
        "الجزء ده من المنصة اتبنى بمسار Automator — نفس اللي بتتعلمه. خلّصت درس؟ بنحجزله مراجعة بعد يوم. عملت المراجعة؟ بنحجز التانية بعد ٣ أيام. وهكذا (spaced repetition). الـ follow-up مش هيتنسي لأن DB بتدير الجدولة.",
      bullets: [
        "ease + interval + reviews columns = SM-2 algorithm.",
        "ReviewsDueCard في /dashboard بيوريك اللي حان وقته.",
        "كل review بتحدّث next_review_at تلقائي.",
      ],
      pathAngle: "automator",
      link: { label: "افتح /dashboard", href: "/dashboard" },
    },
  }
];

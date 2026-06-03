import {
  Workflow,
  PlayCircle,
  Lightbulb,
  Scale,
  Rocket,
  Image as ImageIcon,
  BookOpen, FlaskConical } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";
import opsLayersScreenshot from "@/assets/lessons/unique/automator-m2-l1-systems-view.jpg";
/**
 * Automator · M1 · Lesson 01 — كل شغل = System
 */
export const AUTOMATOR_M1_SYSTEMS_VIEW_BLOCKS: IntroLessonContent = [
  {
    icon: Workflow,
    eyebrow: "HERO",
    title: "أي شغل بتعمله = نظام",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "Inputs → Processes → Outputs.",
        "لو شفته كده، تقدر تأتمته.",
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
        { term: "System", meaning: "مجموعة خطوات ثابتة بتعملها عشان تخلص شغلك وتطلع نتيجة مضمونة.", example: "بدل ما تعصر دماغك تفتكر التاجر كلمك إمتي، السيستم بيقولك الخطوة الجاية." },
        { term: "Input", meaning: "أي حاجة بتدخلها للسيستم عشان يبدأ يشتغل.", example: "البيانات اللي المحاسب بياخدها من الفواتير الورق عشان يدخلها على الكمبيوتر." },
        { term: "Process", meaning: "الخطوات اللي بتحصل جوه السيستم عشان تحول المدخلات لنتائج.", example: "لما المحاسب يراجع الفاتورة (Validate) ويقسمها دي مصاريف ولا إيرادات (Classify)." },
        { term: "Output", meaning: "النتيجة النهائية اللي بتطلع من السيستم بعد ما يخلص شغله.", example: "التقرير المالي اللي بيطلع للمدير في آخر الشهر ومترتب جاهز." },
        { term: "Leads", meaning: "الزبون المحتمل اللي لسه بيسأل ومشتراش منك بشكل رسمي.", example: "لما حد يبعت لك رسالة يسأل عن السعر، ده كده Lead مهتم بمنتجك." },
        { term: "CRM", meaning: "أي مكان بتجمع فيه بيانات الزباين وتاريخ كلامك معاهم.", example: "ممكن يكون برنامج غالي أو شيت إكسيل بتسجل فيه بيانات الزباين." },
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
      caption: "إزاي تشوف شغلك كنظام مكوّن من Inputs و Outputs.",
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "الـ 3 طبقات",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "Inputs — البيانات اللي بتدخل (Lead form، رسالة WhatsApp، Order جديد، Comment، Email).",
        "Processes — الخطوات اللي بتتعمل عليها (Validate → Classify → Decide → Transform).",
        "Outputs — اللي بيطلع في الآخر (رسالة رد، صف في Database، Notification، Task جديدة).",
        "مثال حي: الرد على رسالة WhatsApp = Input (سؤال العميل) → Process (تفهم الطلب + تدوّر في الـ price list) → Output (رد + إضافة لـ CRM). بتعمله 50 مرة في اليوم يدوي — والـ Automator هدفه يخلّيه يشتغل لوحده.",
      ],
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوف بنفسك",
    title: "صفحة /operational-layers",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: opsLayersScreenshot,
      alt: "صفحة /operational-layers بتعرض الطبقات التشغيلية للمنصة — Context Layer، Retrieval Layer، Memory Layer.",
      caption: "دي صفحة /operational-layers بتاعتنا. المنصة نفسها مبنية كـ system: كل طبقة عندها Input محدّد، Process معروف، وOutput بيتغذّى للطبقة اللي بعدها. ده اللي هتعمله مع شغلك إنت — تكسره لطبقات وتشوف الـ Inputs/Outputs بين كل واحدة.",
      label: "من المنصة — صفحة /operational-layers",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "Tasks vs Systems",
    block: {
      kind: "comparison",
      left: {
        label: "FAILURE — بتفكّر في Tasks",
        body: "«أنا محتاج أرد على الرسالة دي». «محتاج أنزل بوست النهارده». كل حاجة منفصلة، وكل يوم بتبدأ من الصفر. مفيش حاجة بتتراكم.",
      },
      right: {
        label: "RIGHT — بتفكّر في Systems",
        body: "«أنا عندي نظام رد على الرسائل بيشتغل كده». لما تشوفه نظام، تقدر تحسّنه، تأتمته، أو تسلّمه لحد تاني. الـ tasks بتختفي، النظام بيفضل.",
      },
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "حوّل 3 tasks لـ 3 systems",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "automator-m2-l1-systems-view-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "أنت شغال في سوشيال ميديا وبترد على استفسارات العملا اللي بتجيلك على رسايل صفحة الفيسبوك. عشان تحول الموضوع ده لنظام، إيه اللي يعتبر 'Input' في الحالة دي؟",
          options: [
            "رسالة عميل جديدة بتسأل عن سعر منتج معين",
            "نسخة جاهزة من أسعار المنتجات عشان ترد بيها على العميل",
            "إضافة بيانات العميل لبرنامج الـ CRM بعد ما يتواصل معاك"
          ],
          correctIndex: 0,
          explanation: "الـ Input هو البيانات أو الحدث اللي بيشغّل النظام. في الحالة دي، رسالة العميل هي اللي بتبدأ عملية الرد."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "مسؤول الـ Sales بيوصله كل يوم فورمات كتير من العملاء المحتملين (Leads) عن طريق الويب سايت. عشان يقدر يحول عميل منهم لصفقة، بيعدي على خطوات معينة: يتأكد من بياناته، يحدد هو مهتم بإيه بالظبط، يقيم إذا كان ينفع يكون عميل كويس ولا لأ، وبعدين يحوله لمكالمه بيع. الخطوات دي كلها بتمثل إيه في الـ 'System' ده؟",
          options: [
            "الـ Output بتاعه",
            "الـ Process بتاعه",
            "الـ Input بتاعه"
          ],
          correctIndex: 1,
          explanation: "الـ Process هي الخطوات اللي بتحصل جوّه النظام زي التحقق والتقييم والتصنيف. هنا هي الخطوات اللي بيعملها مسؤول المبيعات على الـ Lead."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "مدير مشروع عايز يراقب progress الشغل كل أسبوع. بيبعت ايميل للفريق يطلب منهم تحديثات الشغل، يستنى الردود، يجمع كل التحديثات في ملف واحد، وبعدين يعمل تقرير مختصر ويبعته للإدارة. إيه اللي يعتبر 'Output' في النظام ده؟",
          options: [
            "الايميل اللي بيبعته للفريق يطلب التحديثات",
            "تقرير الشغل المختصر اللي بيبعته للإدارة",
            "الردود اللي بتجيله من الفريق على ايميله"
          ],
          correctIndex: 1,
          explanation: "الـ Output هو النتيجة اللي بتطلع برّه النظام. في الحالة دي، التقرير اللي بيوصل للإدارة هو المنتج النهائي للنظام."
        }
      ]
    },
  },
  {
    icon: Rocket,
    eyebrow: "Mission",
    title: "فكّك Task من شغلك لنظام Input → Process → Output",
    tone: "primary",
    block: {
      kind: "mission",
      intro:
        "اختار Task واحد بتعمله كل أسبوع في شغلك (رد على عميل، تجهيز تقرير، نزول بوست... أي حاجة). فكّكه لنظام واضح بـ ٣ أجزاء، عشان بعدين تقدر تأتمته.",
      prompt:
        "في تسليمك اكتب:\n\n١) اسم الـ Task بالظبط:\n٢) الـ Input (إيه اللي بيشغّله؟ مين بيبعت، إمتى، إيه شكله؟):\n٣) الـ Process (الخطوات اللي بتعملها بالترتيب — على الأقل ٤ خطوات):\n٤) الـ Output (إيه الناتج النهائي اللي بيوصل لمين؟):\n٥) في سطر واحد: لو هتأتمت خطوة واحدة بس، هتأتمت أنهي وليه؟",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "تفكيك Input/Process/Output",
          weight: 70,
          criteria: [
            "Task محدّد ومتكرّر من شغلك (مش مثال عام).",
            "الـ Input + Output واضحين، والـ Process فيه ٤ خطوات على الأقل مرتّبة.",
          ],
        },
        {
          label: "خطوة الأتمتة",
          weight: 30,
          criteria: [
            "اخترت خطوة واحدة من الـ Process مع سبب منطقي (تكرار/وقت ضايع/خطأ بشري).",
          ],
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جزء من المنصة",
    title: "كل feature في المنصة = Inputs → Processes → Outputs",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "كل feature في المنصة = Inputs → Processes → Outputs",
      summary:
        "الجزء ده من المنصة اتبنى بمسار Automator — نفس اللي بتتعلمه. خد مثال tracking الدروس: Input = click على «خلصت الدرس». Process = serverFn بتحدّث lesson_progress + بتحسب streak جديدة. Output = badge في /dashboard. ٣ خطوات واضحة.",
      bullets: [
        "Inputs: user clicks, form submits, time triggers.",
        "Processes: serverFn, DB triggers, edge functions.",
        "Outputs: UI updates, notifications, badges.",
      ],
      pathAngle: "automator",
      link: { label: "افتح /system-state", href: "/system-state" },
    },
  }
];
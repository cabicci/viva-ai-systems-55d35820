import {
  Sparkles,
  Compass,
  PlayCircle,
  Lightbulb,
  CheckCircle2,
  Rocket,
  BookOpen,
  Image as ImageIcon,
  FlaskConical,
  BrainCircuit,
  MousePointerClick,
  Database,
  Layers3,
} from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";
import transitionImage from "@/assets/lessons/unique/builder-m5-l1-transition.jpg";

/**
 * V2 Refactor:
 * 1.  **Tension First:** Starts with the problem: AI chat isn't a full app.
 * 2.  **Quick Win:** Moves the interactive quiz to the second section.
 * 3.  **One Concept:** Merges all 7 terms into one core concept ("تشريح الأبلكيشن") with 3 sub-items.
 * 4.  **Simplified Mission:** Reduces the complex mission to a simple 3-line analysis.
 * 5.  **Momentum:** Deletes "Failure x Right" and the placeholder video to keep the flow.
 * 6.  **Egyptian Dialect:** Rewrites all text into pure Cairo Ammiya.
 */
export const BUILDER_M5_TRANSITION_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بعد الدرس ده هتقدر",
    title: "تبدأ Phase 2 وانت عارف فين رايح",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "في الـ 8 دروس الجايين هتبني تطبيق AI كامل. الدرس ده هيوريك الخريطة.",
      ],
    },
  },
  {
    icon: Compass,
    eyebrow: "لحظة انتقال مهمة",
    title: "لحد هنا فهمت AI كويس. من هنا هنحوّل الفكرة لتطبيق حقيقي.",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "في الـ 8 دروس اللي فاتوا، فهمت AI فعلاً — إزاي بيفكر، إزاي بتكلّمه، إزاي بتتحكم في رده. ده Phase 1.",
        "من هنا هنبدأ نحوّل الفكرة لتطبيق حقيقي خطوة بخطوة. عميلك لما يفتح موبايله ويكلم AI خاص بيك، هو محتاج: واجهة يكلم منها، مكان يحفظ كلامه، وحاجة تعرفه إن ده هو فعلاً. ده Phase 2.",
        "**مش مطلوب منك تكون مبرمج.** إحنا مش داخلين كورس Web Development. إحنا بنركّب الـ 3 طبقات اللي بتخلي الـ AI بتاعك يوصل لناس حقيقيين. كل مصطلح هتسمعه، هتلاقي جنبه تشبيه من حياتك.",
        "هنمشي خطوة بخطوة، وفي آخر Phase 2 هتكون قادر تبني أول AI app حقيقي بنفسك.",
      ],
    },
  },
  {
    icon: CheckCircle2,
    eyebrow: "جرّب دلوقتي",
    title: "حلّل أبلكيشن بتستخدمه كل يوم",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "builder-m5-l1-transition-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "لما تفتح أبلكيشن 'أوبر' وتشوف الخريطة والزرار بتاع 'اطلب رحلة'، الجزء اللي عينك شايفاه ده اسمه إيه؟",
          options: ["الواجهة (Frontend)", "الكواليس (Backend)", "المخزن (Database)"],
          correctIndex: 0,
          explanation:
            "صح! الـ Frontend هو \"الوش\" بتاع الأبلكيشن. كل حاجة بتشوفها وتدوس عليها.",
        },
        {
          id: "apply2",
          bloom: "apply",
          question:
            "بعد ما دوست على الزرار، الأبلكيشن بيبعت طلب للسيرفرات عشان يلاقي أقرب عربية. الشغل اللي بيحصل في الكواليس ده اسمه إيه؟",
          options: [
            "الـ Frontend بيلاقي العربية",
            "الـ Backend بيستقبل الطلب ويدوّر",
            "الـ Database بيبعت العربية",
          ],
          correctIndex: 1,
          explanation:
            "بالظبط! الـ Backend هو \"المطبخ\" أو \"العقل\" اللي بيعمل كل العمليات الصعبة اللي مش بنشوفها.",
        },
        {
          id: "apply3",
          bloom: "apply",
          question:
            "لما رحلتك تخلص، الأبلكيشن بيحفظ تفاصيلها (زي المكان والوقت والسعر) عشان تقدر تشوفها بعدين في 'مشاويرك السابقة'. البيانات دي بتتشال فين؟",
          options: [
            "في الـ Frontend على موبايلك",
            "في الـ Backend اللي بيشغل الأبلكيشن",
            "في الـ Database اللي هو مخزن البيانات",
          ],
          correctIndex: 2,
          explanation:
            "تمام! الـ Database هو \"الأرشيف\" أو \"المخزن\" اللي بنشيّل فيه كل المعلومات عشان نرجع لها في أي وقت.",
        },
      ],
    },
  },
  {
    icon: Layers3,
    eyebrow: "المصطلح الوحيد للدرس ده",
    title: "أي أبلكيشن في الدنيا = ٣ طبقات بس",
    block: {
      kind: "concepts",
      items: [
        {
          term: "Frontend (الواجهة)",
          meaning:
            "الوش بتاع الأبلكيشن. كل حاجة عينك شايفاها وصباعك بيدوس عليها.",
          example:
            "زي الديكور والمنيو في أي مطعم. ده اللي الزبون بيتعامل معاه مباشرة.",
        },
        {
          term: "Backend (الكواليس)",
          meaning:
            "المطبخ أو العقل اللي بيفكر وبينفذ الأوامر اللي مبتتشفش.",
          example:
            "زي الشيف اللي بيطبخ الأكل في المطبخ. الزبون مش بيشوفه، بس هو اللي بيعمل كل الشغل.",
        },
        {
          term: "Database (المخزن)",
          meaning:
            "الأرشيف اللي بنشيّل فيه كل حاجة (بيانات المستخدمين، المنتجات، الرسايل) عشان نرجع لها بعدين.",
          example:
            "زي التلاجة أو المخزن اللي الشيف بيجيب منه المكونات عشان يطبخ.",
        },
      ],
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوف بنفسك",
    title: "الجسر اللي بين الكلام والبناء",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: transitionImage,
      alt: "رسمة بسيطة: على الشمال فقاعات شات (تمثل الـ prompts اللي اتعلمناها)، وعلى اليمين شاشة أبلكيشن + سيرفر + database (اللي جاي). سهم بيوصل الاتنين.",
      caption:
        "إنت دلوقتي واقف على الجسر ده. خلصت مرحلة إزاي \"تكلّم\" الـ AI، وداخل على مرحلة إزاي \"تبني\" له بيت يعيش فيه.",
      label: "من الكلام مع الـAI لبناء الأبلكيشن",
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمتك في ٥ دقايق",
    title: "حلّل فكرتك في ٣ سطور",
    tone: "primary",
    block: {
      kind: "mission",
      intro:
        "قبل ما نكتب أي كود، لازم نفصص الفكرة لـ ٣ طبقات. لو مش عارف تعمل ده، تبقى لسه مجرد فكرة مش مشروع.",
      prompt:
        "اختار فكرة أبلكيشن عايز تبنيه. في ٣ سطور بس، جاوب على الأسئلة دي:\n\n١. **الواجهة (Frontend):** المستخدم هيشوف إيه ويدوس على إيه؟ (مثال: شاشة تسجيل دخول وزرار 'ابدأ').\n٢. **الكواليس (Backend):** إيه اللي هيحصل لما يدوس؟ (مثال: يتأكد من الباسورد ويبعتله رسالة ترحيب).\n٣. **المخزن (Database):** إيه أهم معلومة هتتخزن؟ (مثال: إيميل المستخدم واسمه).",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخت!",
      rubric: [
        {
          label: "الـ ٣ طبقات واضحين",
          weight: 100,
          criteria: [
            "كل طبقة بتوصف جزء مختلف من الأبلكيشن.",
            "الإجابة مباشرة ومختصرة في ٣ سطور.",
          ],
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جزء من المنصة",
    title: "المنصة اللي إنت عليها دي معمولة بنفس الطريقة",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "المنصة دي مش مجرد شات، ده أبلكيشن كامل",
      summary:
        "كل حاجة بتشوفها هنا مبنية بنفس الـ ٣ طبقات. الدروس اللي فاتت كانت مجرد كلام مع AI، لكن من دلوقتي إنت بتتعامل مع أبلكيشن حقيقي: صفحات، تخزين بيانات، تسجيل دخول. كل صفحة بتفتحها هي تطبيق عملي للي بنقوله.",
      bullets: [
        "Frontend: شكل الصفحة دي والزراير اللي فيها.",
        "Backend: الكود اللي بيسجّل تقدمك لما بتخلص الدرس.",
        "Database: المكان اللي متخزّن فيه إنت خلصت كام درس.",
      ],
      pathAngle: "builder",
      link: { label: "شوف الـ Dashboard بتاعك", href: "/dashboard" },
    },
  },
];
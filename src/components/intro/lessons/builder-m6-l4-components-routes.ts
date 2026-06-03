import {
  Sparkles,
  PlayCircle,
  Lightbulb,
  Image as ImageIcon,
  Scale,
  Rocket,
  BookOpen,
  FlaskConical,
} from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";
import componentsScreenshot from "@/assets/lessons/builder-m6-l4-components-routes.jpg";

/**
 * Builder · M6 · Lesson 05 — Components & Routes
 * Format: Hero → Video → Concept → Platform Screenshot → Failure×Right → Mission
 *
 * يبني على M6.1 (Sitemap) — دلوقتي إزاي نبني الصفحات نفسها من قطع قابلة لإعادة الاستخدام.
 */
export const BUILDER_M6_COMPONENTS_ROUTES_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بعد الدرس ده هتقدر",
    title: "تنظّم تطبيقك في أجزاء بدل بلوك واحد",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "بعد الدرس هتعرف إزاي تقسّم تطبيقك لأجزاء صغيرة قابلة لإعادة الاستخدام.",
      ],
    },
  },
  {
    icon: Sparkles,
    eyebrow: "المشكلة",
    title: "ليه واجهة الـ AI بتاعك شكلها ملخبط؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "تخيل العميل بتاعك بيستخدم الـ AI app بتاعك. مرة يلاقي زرار \"إرسال\" لونه أزرق في صفحة الشات، ومرة تانية يلاقيه أخضر في صفحة تانية. فجأة، التطبيق بتاعك بقى شكله مش احترافي والعميل هيفقد الثقة فيه.",
        "ده بيحصل لما بتكرر نفس الكود بـ copy-paste. في الأول بتبقى حركة سريعة، بس مع الوقت بتبقى كابوس صيانة. أي تعديل بسيط محتاج تلف على التطبيق كله.",
        "الدرس ده هيوريك إزاي تبني **واجهة التطبيق** (الوش اللي العميل بيشوفه) زي الليجو: قطع بتركبها جنب بعض، ولما تعدّل قطعة واحدة، التعديل يسمّع في كل مكان. عشان العميل يركز على قوة الـ AI بتاعك، مش على لخبطة التصميم.",
      ],
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "جرّب دلوقتي",
    title: "حلّل واجهة أي تطبيق AI ناجح",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: componentsScreenshot,
      alt: "صفحة /curriculum — كرت Creator بداخله ModuleCard بدرسين، وكرت Automator بداخله موديولين كل واحد فيه LessonRow",
      caption:
        "بص على أي واجهة احترافية، زي ChatGPT أو حتى الصفحة دي في Lovable. هي تبان معقدة، بس في الحقيقة هي تكرار لـ 3-4 قوالب بسيطة. في شات جي بي تي، فيه \"قالب لرسالة المستخدم\"، و\"قالب لرد الـ AI\"، و\"قالب لاسم المحادثة\" في الشريط الجانبي. دي فكرة الـ Components.",
      label: "منصة Lovable كمثال",
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "شوف بعينك: إزاي بنبني بالـ Components",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption:
        "إزاي تبني 'قالب' لرسالة الشات مرة واحدة، وتستخدمه عشان تعرض كل رسايل العميل والـ AI.",
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "السر كله: قالب + بيانات = Component",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "تخيل الـ Component ده قطعة ليجو. ممكن يبقى زرار، فقاعة رسالة في شات، أو كارت محادثة سابقة. بدل ما تبني شكل الكارت ٢٠ مرة في ٢٠ مكان، انت بتصمم \"قالب الكارت\" مرة واحدة بس.",
        "طب إزاي نفس القالب بيعرض رسايل مختلفة؟ عن طريق حاجة اسمها **Props**. الـ Props هي البيانات اللي بتبعتها للقالب. مثلاً، عندك قالب اسمه `ChatMessage`، مرة تبعتله `sender=\"User\"` و `text=\"اكتبلي قصيدة عن مصر\"`، ومرة تانية تبعتله `sender=\"AI\"` و `text=\"في قلب النيل...\"`. نفس القالب، بيانات مختلفة، نتيجة مختلفة.",
        "الـ **Route** هو الصفحة الكاملة اللي ليها عنوان في المتصفح (زي `/chat`). الـ **Component** هو قطعة جوه الصفحة دي (زي `ChatMessage` أو `Sidebar`). الصفحة نفسها (الـ Route) هي مجرد component كبير بيجمع components أصغر جواه.",
        "قاعدة مهمة: كل component المفروض يعمل حاجة واحدة بس. لو لقيت نفسك بتعمل component واحد فيه ٣٠٠ سطر كود وبيعمل كل حاجة، قسمه لقطع أصغر. ده بيخلي الكود سهل يتفهم ويتصلح.",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "صح x غلط",
    title: "امتى تعمل Component وامتى لأ؟",
    block: {
      kind: "comparison",
      left: {
        label: "غلط — كل حاجة من الأول",
        body: "\"هعمل شكل رسالة المستخدم في صفحة الشات، وشكل تاني شبهه في صفحة سجل المحادثات، وتالت في صفحة الإعدادات.\" النتيجة؟ ٣ نسخ من نفس الكود. لما تيجي تغير حجم الخط، لازم تفتكر تعدل في الـ ٣ أماكن. ولو نسيت واحد، واجهة الـ AI بتاعك شكلها هيبوظ.",
      },
      right: {
        label: "صح — قاعدة الـ 3 مرات",
        body: "أول مرة محتاج قطعة UI: اكتبها في مكانها عادي. تاني مرة: ممكن تعمل copy-paste، لسه بدري. تالت مرة: اقف. دي إشارة إنك لازم تطلّع الكود ده في Component منفصل وتستخدمه في الـ ٣ أماكن. كده بتتجنب الفذلكة الزيادة، وفي نفس الوقت بتحافظ على الكود نضيف ومنظم.",
      },
    },
  },
  {
    icon: Rocket,
    eyebrow: "اختبر نفسك",
    title: "مخك بيفكر زي اللي بيبني واجهة AI؟",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "builder-m6-l4-components-routes-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "في تطبيق الـ AI بتاعك، محتاج تعرض المحادثات السابقة في الداش بورد. كل محادثة ليها كارت فيه عنوان المحادثة وملخصها وتاريخها. إيه أنسب طريقة تستخدم بيها الـ 'ConversationCard' component؟",
          options: [
            "أعمل 'ConversationCard' واحد، وأمرر له بيانات كل محادثة كـ 'props' عشان يعرض أشكال مختلفة منه.",
            "أعمل لكل محادثة 'component' جديد باسم 'ConversationCard1', 'ConversationCard2' وهكذا.",
            "أدمج كل الكروت في component واحد كبير اسمه 'HistoryPage' وخلاص.",
          ],
          correctIndex: 0,
          explanation:
            "الـ Component معمولة عشان تتكتب مرة وتستخدم كذا مرة ببيانات (Props) مختلفة. ده بيقلل التكرار وبيخلي الكود منظم.",
        },
        {
          id: "apply2",
          bloom: "apply",
          question:
            "في تطبيق الـ AI بتاعك، الشريط الجانبي اللي فيه قايمة المحادثات (Sidebar) لازم يظهر في كل الصفحات. المفروض تحطه فين عشان متكرروش؟",
          options: [
            "في ملف الـ `__root.tsx` مرة واحدة بس عشان يبقى هو الـ Layout الأساسي.",
            "في كل صفحة (route) لوحدها.",
            "أعمله component واحد اسمه 'Layout' وأكرره في كل الصفحات.",
          ],
          correctIndex: 0,
          explanation:
            "الـ Components اللي بتظهر في كل حتة زي الـ Sidebar أو الـ Navbar بتتحط في ملف الـ Layout الرئيسي مرة واحدة عشان تطبّق على كل الصفحات اللي جواها.",
        },
        {
          id: "apply3",
          bloom: "apply",
          question:
            "وانت بتبني واجهة الشات، عملت component اسمه 'ChatInterface' بيعرض منطقة كتابة الرسالة، قايمة الرسايل اللي فاتت، واسم الـ AI model اللي شغال. إيه أحسن حاجة تعملها عشان تخلي الكود منظم؟",
          options: [
            "أسيبه زي ما هو، كلها حاجات ليها علاقة بالشات.",
            "أقسمه لـ components أصغر: 'MessageInput', 'MessageList', 'ModelSelector'.",
            "أخليه component واحد، بس أحط كل جزء في فايل لوحده.",
          ],
          correctIndex: 1,
          explanation:
            "قاعدة الـ Single Responsibility بتقول إن كل component المفروض يعمل حاجة واحدة بس. تقسيمه لـ components أصغر بيخلي كل واحد مسؤول عن وظيفته، وده بيسهل الصيانة والتطوير.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمتك",
    title: "خطط واجهة تطبيق الـ AI بتاعك",
    tone: "primary",
    block: {
      kind: "mission",
      intro:
        "قبل ما نكتب سطر كود واحد لواجهة تطبيقك، لازم نخططها على الورق. مهمتك دلوقتي إنك تحلل فكرة الـ AI بتاعك وتطلع منها خريطة للصفحات (Routes) والقطع اللي جواها (Components).",
      prompt:
        "في ورقة أو أي برنامج رسم، اعمل الآتي:\n\n١) **ارسم شخبطة سريعة لواجهة الشات الرئيسية** بتاعت تطبيقك. مش لازم تبقى فنان، مربعات وخطوط كفاية.\n\n٢) **من الرسمة دي، طلّع قايمة بالـ Components** اللي بتتكرر أو ممكن تتكرر. زي (SendButton, ChatBubble, ConversationHistoryItem, ...الخ).\n\n٣) **جنب كل Component، اكتب إيه الـ Props (البيانات)** اللي محتاجها عشان شكله أو محتواه يتغير. مثال: `ChatBubble` محتاج `(sender, messageText, timestamp)`.\n\n٤) **سؤال بونس:** فيه component منهم محتاج يبقى عنده \"ذاكرة\" داخلية (state)؟ زي مثلاً مربع الكتابة اللي العميل بيكتب فيه سؤاله للـ AI. لو آه، هو إيه وليه؟",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "التحليل الأساسي",
          weight: 60,
          criteria: [
            "رسمة واضحة لواجهة الشات.",
            "قايمة فيها ٤+ components على الأقل بأسماء ليها علاقة بالـ AI app.",
            "كل component متحدد له الـ props اللي محتاجها.",
          ],
        },
        {
          label: "التفكير المتقدم",
          weight: 40,
          criteria: [
            "قادر يحدد component محتاج state (زي مربع الإدخال).",
            "شرح منطقي لسبب احتياج الـ state ده.",
          ],
        },
      ],
    },
  },
];
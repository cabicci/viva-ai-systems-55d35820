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
import agentsDiagram from "@/assets/lessons/concepts/agents-diagram.jpg";

/**
 * Builder · M9 · Lesson 03 — Agents: AI بياخد قرارات
 * V2: Tension → Quick Win (Comparison) → One Concept → How it works → Mission (Simplified)
 */
export const BUILDER_M9_AGENTS_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "البداية",
    title: "الـ AI بتاعك بيردّ... بس مش بيعمل حاجة",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "الدرس اللي فات (RAG) خلّى الـ AI يرد على أسئلة. بس لو اليوزر قال \"احجزلي ميعاد بكرة الساعة ٤\" — دي مش إجابة، ده فعل.",
        "تخيل الـ AI بتاعك زي موظف خدمة عملاء شاطر في الكلام، بس إيده مربوطة. بيوصفلك الحل، بس مش بيعملهولك.",
        "الدرس ده هو القفزة من \"Chatbot بيرد\" لـ \"Agent بينفّذ\". هي دي النقلة اللي بتخلي اليوزر يحس إن الـ AI ده مش لعبة، ده مساعد حقيقي بيخلّص شغل.",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "جرّب بنفسك",
    title: "شوف الفرق: Chatbot بيقول vs. Agent بيعمل",
    block: {
      kind: "comparison",
      left: {
        label: "فاشل: Chatbot حافظ مش فاهم",
        body: "العميل: \"عايز ألغي اشتراكي\".\nالـ AI: \"تمام، عشان تلغي اشتراكك، روح على Settings → Billing → Cancel Subscription، ودوس تأكيد\".\n\nالنتيجة: العميل قفل الشات محبط. إنت اديته معلومة بدل ما تخلّص له طلبه. حس إن الـ AI بتاعك ديكور مش أكتر.",
      },
      right: {
        label: "صح: Agent إيده في الشغل",
        body: "العميل: \"عايز ألغي اشتراكي\".\nالـ Agent: (بيستخدم tool اسمها `getSubscription`) \"لقيت اشتراكك Pro بيتجدّد كمان شهرين. أكّد الإلغاء؟\"\nالعميل: \"آه\".\nالـ Agent: (بيستخدم tool اسمها `cancelSubscription`) \"تمام، اتلغى. هيفضل شغال معاك لآخر الشهر\".\n\nالنتيجة: المهمة خلصت في ٢٠ ثانية والعميل معملش أي مجهود.",
      },
    },
  },
  {
    icon: BookOpen,
    eyebrow: "المصطلح الوحيد",
    title: "إيه هو الـ Agent؟",
    block: {
      kind: "concepts",
      items: [
        {
          term: "Agent",
          meaning:
            "برنامج ذكي عنده (مخ) عشان يفكّر ويقرّر، و(إيدين) عشان ينفّذ.",
          example:
            "زي الشيف اللي عنده عقل (عشان يبتكر وصفة) وأدوات زي سكينة وبوتاجاز (عشان يطبخ بجد). المخ هو الـ LLM، والأدوات هي الـ Tools.",
        },
      ],
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "تحت الغطا",
    title: "الـ Agent بيفكر إزاي: فكّر ← نفّذ ← شوف النتيجة ← كرّر",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: agentsDiagram,
      alt: "رسم بياني لـ AI Agent: في النص LLM، وحواليه أدوات (بحث، آلة حاسبة، داتابيز)، وبيلف في دايرة: فكر -> نفذ -> لاحظ -> كرر",
      caption:
        "الـ Agent مش مجرد LLM بيرد وخلاص. هو دايرة تفكير وتنفيذ. لما بيجيله طلب، بيفكّر (Think)، ويقرر يستخدم أنهي أداة (Act)، ويشوف نتيجتها (Observe)، ويكرر الدايرة دي لحد ما يوصل للحل النهائي. ده اللي بيخليه يحل مشاكل معقدة.",
      label: "دايرة تفكير الـ Agent",
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "التفاصيل",
    title: "إزاي الـ Agent بيستخدم الـ Tools بتاعته؟",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "الـ Tool هي مجرد function في الكود بتاعك (زي `sendEmail` أو `searchProducts`). إنت بتدي للـ LLM قايمة بالـ tools المتاحة ووصف لكل واحدة، وهو بيقرر لوحده إمتى يستخدمها.",
        "الـ Agent بيمشي في دايرة تفكير اسمها (ReAct Loop):\n  ١) اليوزر يطلب حاجة.\n  ٢) الـ LLM يفكّر ويرد: \"عايز أستخدم tool اسمها `searchProducts` وأدور على 'لابتوب'\".\n  ٣) الكود بتاعك ينفّذ الـ tool دي ويرجّع النتيجة للـ LLM.\n  ٤) الـ LLM يبص على النتيجة ويفكّر تاني: هل أستخدم tool تانية؟ ولا خلاص أرد على اليوزر؟\n  ٥) الدايرة دي بتقف لما الـ LLM يقرر إنه خلص ويرجع رد نهائي.",
        "الأمان الأول: أي tool خطيرة (زي الدفع أو مسح بيانات) لازم تحط خطوة تأكيد من اليوزر (Human-in-the-loop). وكمان لازم تحدد أقصى عدد محاولات عشان الـ Agent ميفضلش يلف في الدايرة دي للأبد.",
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "شرح بالفيديو",
    title: "شوف الدرس ده عملي",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption:
        "الفرق بين الـ Agent والـ Chatbot، وإزاي تبني واحد بيفكر وينفذ بجد.",
    },
  },
  {
    icon: Rocket,
    eyebrow: "اختبر نفسك",
    title: "هتعرف تتصرف؟",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "builder-m9-l26-agents-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "عميل بيشتكي إن المنتج اللي اشتراه بايظ ومش لاقي فاتورته. الـ Agent بتاعك عنده tool اسمها `search_user_orders` بتجيب طلبات العميل، و tool تانية اسمها `create_support_ticket` عشان تفتح شكوى. إيه أول حاجة الـ Agent المفروض يعملها؟",
          options: [
            "يستخدم `search_user_orders` الأول عشان يلاقي طلبات العميل ويدور على الفاتورة.",
            "يستخدم `create_support_ticket` على طول عشان يفتح شكوى للعميل.",
            "يسأل العميل عن رقم الفاتورة تاني.",
          ],
          correctIndex: 0,
          explanation:
            "الصح دايمًا إن الـ Agent يجمع معلومات الأول قبل ما ياخد أي أكشن. زي ما أي موظف شاطر بيعمل.",
        },
        {
          id: "apply2",
          bloom: "apply",
          question:
            "العميل عايز يرجع المنتج البايظ وياخد فلوسه. الـ Agent بتاعك مالقاش أي tool اسمها `process_refund`. إيه التصرف الصح للـ Agent في الحالة دي؟",
          options: [
            "يقول للعميل إنه مش هيقدر يساعده.",
            "يقترح على العميل إنه يفتح تذكرة دعم عشان فريق خدمة العملاء يتدخل، وياخد موافقته الأول.",
            "يخترع طريقة يرجع بيها الفلوس.",
          ],
          correctIndex: 1,
          explanation:
            "لما الـ Agent يوصل لحدود قدراته، أحسن حاجة إنه يسلّم الموضوع لبني آدم (فريق الدعم) بدل ما يفتي.",
        },
        {
          id: "apply3",
          bloom: "apply",
          question:
            "الـ Agent بيحاول ينفذ tool اسمها `delete_user_data`، بس السيستم رجّعله error. المفروض يتصرف إزاي؟",
          options: [
            "يعتذر للعميل ويقوله إن فيه مشكلة تقنية، ويسجّل الـ error ده عشان المطورين يشوفوه.",
            "يفضل يحاول ينفذ نفس الـ tool كذا مرة ورا بعض.",
            "يقول للعميل إنه هيحاول تاني بعدين.",
          ],
          correctIndex: 0,
          explanation:
            "الأمان أهم حاجة. لو في مشكلة تقنية، الـ Agent لازم يبلغ العميل بصراحة ويسجّل المشكلة، مش يفضل يحاول وخلاص.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمتك",
    title: "صمّم Tool واحدة لـ Agent بتاعك",
    tone: "primary",
    block: {
      kind: "mission",
      intro:
        "قوة أي Agent في الـ Tools بتاعته. مهمتك بسيطة: هتصمم Tool واحدة بس، بتعمل حاجة محددة ومفيدة.",
      prompt:
        "في تسليمك، جاوب على دول بس:\n\n١) إيه المهمة الكبيرة اللي الـ Agent بتاعك بيعملها؟ (مثال: يساعد العملاء يرجعوا منتجات)\n\n٢) صمّم Tool واحدة بس للمهمة دي:\n   - اسم الـ Tool (بالإنجليزي، زي `find_order`)\n   - وصف بسيط (بتعمل إيه في سطر واحد)\n   - إيه المعلومة اللي محتاجاها عشان تشتغل؟ (مثال: رقم الطلب)",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "فكرة الـ Tool واضحة",
          weight: 100,
          criteria: [
            "اسم الـ Tool ووصفه منطقيين للمهمة.",
            "المدخلات (المعلومة اللي محتاجاها) محددة وواضحة.",
          ],
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "مثال من المنصة",
    title: "مساعد Lovable هو Agent، مش مجرد Chatbot",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "مساعد Lovable هو Agent، مش مجرد Chatbot",
      summary:
        "المساعد اللي بتستخدمه في المنصة هنا مبني بنفس الطريقة اللي بتتعلمها. هو مش LLM عادي. لو سألته \"وريني تقدّمي\"، هو بياخد قرار يستخدم tool اسمها get_user_progress، يجيب بياناتك، ويرد عليك بيها. ده agent، مش chatbot.",
      bullets: [
        "الـ Tools المتاحة له: البحث في الدروس، جلب بيانات تقدمك، معرفة الدرس الحالي.",
        "الـ LLM بيقرر يستخدم أنهي tool حسب سؤالك بالظبط.",
        "تقدر تشوف الـ tool calls دي بنفسك في صفحة /assistant-runtime.",
      ],
      pathAngle: "builder",
      link: { label: "افتح /assistant-runtime", href: "/assistant-runtime" },
    },
  },
];
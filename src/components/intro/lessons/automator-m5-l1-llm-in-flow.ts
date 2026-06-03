import {
  Sparkles,
  PlayCircle,
  Lightbulb,
  Image as ImageIcon,
  Scale,
  Rocket,
  BookOpen,
  Link2, FlaskConical } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";
import automatorM4LlmInFlowScreenshot from "@/assets/lessons/unique/automator-m5-l1-llm-in-flow.jpg";
/**
 * Automator · M4 · Lesson 01 — LLM جوه الـ Flow
 */
export const AUTOMATOR_M4_LLM_IN_FLOW_BLOCKS: IntroLessonContent = [
  {
    icon: Lightbulb,
    eyebrow: "اختياري — للمتقدمين",
    title: "لو هدفك استخدام AI في شغلك فقط، تقدر تعدّي الدرس ده بأمان",
    tone: "accent",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "الدرس ده فيه مفاهيم تقنية للناس اللي شغّالة فعلاً على n8n. لو لسه بتتعلم الأساسيات، تقدر تعدّيه دلوقتي وترجعله بعدين — مش هيأثر على باقي رحلتك.",
        "لو فعلًا عايز تبني — يلا نكمل.",
      ],
    },
  },
  {
    icon: Sparkles,
    eyebrow: "HERO",
    title: "LLM جوه الـ Workflow",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "مش لازم تفتح ChatGPT بإيدك.",
        "الـ LLM ممكن يبقى node في الـ flow بتاعك.",
      ],
    },
  },
  {
    icon: Link2,
    eyebrow: "🔗 ربط بـ Builder M1",
    title: "نفس فكرة الـ LLM — تطبيق مختلف",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "لو خلّصت Builder M1، إنت عارف الـ LLM يعني إيه: موديل بياخد نص ويرد بنص. نفس الفكرة هنا بالظبط.",
        "الفرق الوحيد: في Builder بتستدعيه من كود، هنا بتستدعيه من node جوّه n8n/Make. نفس الـ API ورا الكواليس.",
        "لو لسه مكملتش Builder: الفكرة في سطر — LLM = AI بتبعتله نص وبيرجّعلك نص. متشغلش بالك بالتفاصيل التقنية، ركّز على إزاي تستخدمه في الـ flow.",
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
        { term: "Node (خطوة)", meaning: "خطوة واحدة جوه سير العمل بتعمل مهمة معينة ومحددة.", example: "لو بتعمل برنامج للأوردرات، الـ Node هي الخطوة اللي بتبعت واتساب للعميل لوحدها." },
        { term: "System Prompt", meaning: "الأوامر الأساسية اللي بتعرف الموديل هو شغال إيه وشخصيته إيه.", example: "لو إنت محاسب، بتقول للموديل: \"إنت محاسب شاطر وبتراجع الفواتير بدقة\"، دي تعليمات ثابتة." },
        { term: "Schema (فورمة)", meaning: "هيكل أو تقسيمة فاضية بتحدد للموديل ينظم بياناته إزاي بالظبط.", example: "لو تاجر خشب، الـ Schema هي التقسيمة (نوع الخشب، السعر، المقاس) اللي الموديل بيملاها." },
        { term: "JSON Mode / Structured Output", meaning: "طريقة تخلي الموديل يرد بشكل منظم تفهمه البرامج التانية مش كلام رغي.", example: "لو مسوق، الـ JSON بيخلي رد الموديل يروح لجدول Excel علطول من غير لخبطة." },
        { term: "Token Cost (التكلفة)", meaning: "وحدة قياس الكلام اللي الموديل بيعالجه، وعليها بتتحسب التكلفة.", example: "الـ Token ده زي البنزين، كل ما تطول كلامك الموديل يستهلك بنزين أكتر وتدفع أكتر." },
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
      caption: "إزاي تحط LLM كخطوة جوه أي scenario.",
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "الـ LLM بقى زي أي API",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "في n8n/Make/Zapier فيه nodes جاهزة لـ OpenAI و Anthropic و Gemini.",
        "بتدّيه: system prompt + user message + parameters (temperature، model).",
        "بيرجّعلك: text أو JSON تقدر تستخدمه في الـ step اللي بعده.",
        "أمثلة: تصنيف رسالة (شكوى/استفسار/متابعة)، تلخيص مكالمة، استخراج اسم وtelephone من رسالة عربي عامي، ترجمة، صياغة رد.",
      ],
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوف بنفسك",
    title: "مساعد المنصة",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: automatorM4LlmInFlowScreenshot,
      alt: "سكرين شوت من المنصة",
      caption:
        "المساعد ده عبارة عن LLM node + سياق المتعلم + system prompt محدّد. لو فتحنا الـ flow ورا الكواليس هنلاقي بالظبط نفس الـ nodes اللي هتبنيها في Make/n8n. الفكرة واحدة، بس بتطبّقها على شغلك.",
      label: "من المنصة — صفحة /ai-assistant",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "Free-text vs Structured Output",
    block: {
      kind: "comparison",
      left: {
        label: "FAILURE — بترجّع نص حر",
        body: "بتقول للـ LLM 'صنّف الرسالة دي'. بيرد بفقرة فيها التصنيف وسطها. الـ step اللي بعده مش عارف يقراها، فبتقعد تكتب regex وتتعصّب.",
      },
      right: {
        label: "RIGHT — JSON محدّد",
        body: "بتقوله: 'رد بـ JSON: { \"type\": \"complaint|inquiry|followup\", \"urgent\": true|false }'. الـ step اللي بعده بياخد الـ JSON على طول ويعمل Route حسب النوع.",
      },
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "أول LLM node",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "automator-m5-l1-llm-in-flow-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "لو عندك ايميل وصلك وفي الـ n8n node اللي بيستدعي الـ LLM، إيه أحسن طريقة تضمن بيها إن الـ LLM يرجعلك اسم العميل ورقم تليفونه في شكل منظم تقدر تستخدمه في الخطوة اللي بعدها؟",
          options: [
            "تطلب من الـ LLM يرسل الرد في رسالة عادية وأنت تقطعه يدويًا.",
            "تستخدم الـ JSON Mode وتحدد الـ Schema المتوقع للاسم والرقم.",
            "تضبط الـ temperature بتاع الـ LLM على أعلى قيمة عشان يدي إجابات متنوعة."
          ],
          correctIndex: 1,
          explanation: "استخدام الـ JSON Mode / Structured Output بيضمن إن الـ LLM يرجع البيانات في شكل منظم ومحدد (JSON) وده بيسهل استخدامها في الـ steps اللي بعد كده في الـ workflow."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "صاحب شركة لسه بادئ عايز يعمل نظام آلي لتصنيف رسائل العملاء (شكوى، استفسار، متابعة) عشان يرد عليهم أسرع. إيه أحسن حاجة يقدر يستخدمها عشان يخلي الـ LLM Node يقوم بالمهمة دي بفاعلية؟",
          options: [
            "يستخدم User Message بس ويسيب الـ LLM يحدد التصنيف بناءً على فهمه.",
            "يكتب System Prompt واضح يحدد دور الـ LLM كمصنف ويطلب رد بـ JSON محدد.",
            "يستخدم Node مش LLM خالص ويعمل If/Else Conditions لكل كلمة مفتاحية."
          ],
          correctIndex: 1,
          explanation: "الـ System Prompt مهم جدًا لتحديد دور الـ LLM وتقييد إجابته، ولو طلب رد بـ JSON هيسهل استخدام التصنيف مباشرة في الخطوات اللي بعده زي التوجيه لموظف معين."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "عندك n8n workflow بيستقبل رسائل واتساب وعايز الـ LLM يلخص كل رسالة في جملة واحدة. إيه أكتر حاجة هتأثر على الـ Token Cost للـ LLM Node ده؟",
          options: [
            "عدد المرات اللي الـ workflow بيشتغل فيها في الشهر.",
            "طول الرسائل اللي بتبعتها للـ LLM Node كل مرة.",
            "نوع الـ LLM اللي بتستخدمه (مثلاً Gemini ولا OpenAI)."
          ],
          correctIndex: 1,
          explanation: "الـ Token Cost بيتحسب على أساس عدد الـ tokens في الـ prompt (سواء user message أو system prompt). فكل ما الرسالة المدخلة أطول، كل ما الـ cost بيكون أعلى."
        }
      ]
    },
  },
  {
    icon: Rocket,
    eyebrow: "Mission",
    title: "حط LLM step في Workflow بـ Prompt واضح",
    tone: "primary",
    block: {
      kind: "mission",
      intro:
        "LLM في الـ workflow = decision-maker مرن. هتصمم step فيه LLM بـ structured input وstructured output.",
      prompt:
        "في تسليمك:\n\n١) Use case + ايه الـ LLM هيقرّر/يكتب؟\n٢) Input للـ LLM (من الـ steps اللي قبله) — مثال JSON:\n٣) System Prompt للـ LLM (انسخه — لازم يحدّد الدور + الـ output format):\n٤) User Prompt template — فين بنحط الـ variables؟\n٥) Expected output structure (JSON schema أو وصف):\n٦) Validation — إزاي بنتأكد إن الـ LLM رد بالـ format الصح؟ ايه يحصل لو لأ؟",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "LLM step مكتمل",
          weight: 60,
          criteria: [
            "Prompts فيها دور + format + variables.",
            "Expected output structure محدد (مش «هيرد بـ JSON»).",
          ],
        },
        {
          label: "Validation + Fallback",
          weight: 40,
          criteria: [
            "Validation strategy فعلية (parse / retry / default).",
            "الـ fallback مش «هيفشل الـ workflow».",
          ],
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جزء من المنصة",
    title: "Mission evaluation = LLM جوّه serverFn",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "Mission evaluation = LLM جوّه serverFn",
      summary:
        "الجزء ده من المنصة اتبنى بمسار Automator — نفس اللي بتتعلمه. لما تسلّم mission، serverFn بتبعت الـ submission + الـ rubric لـ Gemini، بيقيّم بناءً على الـ rubric، ويرجّع score + feedback. مفيش خروج من المنصة لـ ChatGPT.",
      bullets: [
        "mission-ai-evaluation.functions = الـ orchestrator.",
        "Prompt template بيحقن الـ rubric من الـ lesson data.",
        "Result بيتخزّن في mission_submissions تلقائي.",
      ],
      pathAngle: "automator",
      link: { label: "افتح /assistant-runtime", href: "/assistant-runtime" },
    },
  }
];

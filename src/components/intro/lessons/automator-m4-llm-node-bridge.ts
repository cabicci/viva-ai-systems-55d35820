import {
  Bot,
  PlayCircle,
  Lightbulb,
  Scale,
  Rocket,
  BookOpen,
} from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";

/**
 * Automator · M4 · Lesson 01 (Bridge) — LLM في Builder vs LLM في n8n
 *
 * Bridge lesson that softens the M3 → M4 cliff. Reframes the LLM mental
 * model: in Builder it's a standalone chatbot; in n8n it's a station inside
 * a pipeline that returns structured output to the next node.
 */
export const AUTOMATOR_M4_LLM_NODE_BRIDGE_BLOCKS: IntroLessonContent = [
  {
    icon: Bot,
    eyebrow: "HERO",
    title: "LLM في Builder ≠ LLM في n8n",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "نفس الموديل، استخدام مختلف تماماً.",
        "الفرق هو مين بيقرأ الـ output.",
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
        {
          term: "Node (محطة)",
          meaning: "خطوة واحدة جوه الـ workflow بتاخد input وترجّع output للخطوة اللي بعدها.",
          example: "زي محطة في خط إنتاج مصنع — كل واحدة بتعمل شغل محدد وبتسلّم اللي بعدها.",
        },
        {
          term: "Structured Output (Output منظم)",
          meaning: "رد الـ LLM في شكل JSON ثابت بأعمدة محددة، مش نص حر.",
          example: "بدل ما يرد \"العميل متضايق ومحتاج رد سريع\"، يرد {\"sentiment\":\"angry\",\"priority\":\"high\"}.",
        },
        {
          term: "JSON Mode",
          meaning: "إعداد في الـ LLM يضمن إن الرد دايماً يطلع JSON صالح للتحليل البرمجي.",
          example: "زي ما تقول لشخص \"رد عليّ في شكل جدول\" — مينفعش يرد بكلام عادي.",
        },
        {
          term: "Downstream Node",
          meaning: "المحطة اللي بعد الـ LLM في الـ workflow — هي اللي هتقرا الرد وتتصرف عليه.",
          example: "لو الـ LLM طلع \"priority=high\"، الـ downstream node بيبعت Slack alert.",
        },
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
      caption: "الفرق العقلي بين LLM-chatbot و LLM-node — وليه structured output مش رفاهية.",
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "نفس الموديل، عقليتين مختلفتين",
    block: {
      kind: "numberedList",
      items: [
        "في Builder (M1): الـ LLM = محادثة لوحدها. اللي بيقرا الرد = إنسان. النص الحر مفيد.",
        "في n8n (M4): الـ LLM = محطة جوه pipeline. اللي بيقرا الرد = الـ node اللي بعدها. النص الحر يكسر الـ workflow.",
        "علشان كده structured output (JSON) مش اختيار — هو شرط الـ pipeline يكمل.",
        "Prompt engineering في Builder بيركز على نبرة وأسلوب. في n8n بيركز على schema و output format.",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "تكتب الـ Prompt إزاي؟",
    block: {
      kind: "comparison",
      left: {
        label: "FAILURE — Prompt مكتوب كأن إنسان هيقراه",
        body: "\"شوف الرسالة دي وقولي العميل متضايق ولا لأ، وقترح رد مناسب.\" — الرد هيرجع نص حر، الـ node اللي بعده مش هيعرف يقرأه، الـ workflow هيقف.",
      },
      right: {
        label: "RIGHT — Prompt مكتوب كأن نظام هيقراه",
        body: "\"حلّل الرسالة وارجع JSON بالشكل ده فقط: {\\\"sentiment\\\":\\\"happy|angry|neutral\\\",\\\"reply\\\":\\\"...\\\",\\\"priority\\\":\\\"low|high\\\"}.\" — الـ output يقدر يتحوّل لـ branches و alerts و DB rows مباشرة.",
      },
    },
  },
  {
    icon: Rocket,
    eyebrow: "اختبر نفسك",
    title: "٥ أسئلة قصيرة قبل ما تكمل",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "automator-m4-llm-node-bridge-check",
      items: [
        {
          id: "q1",
          bloom: "understand",
          question: "الفرق الجوهري بين LLM في Builder و LLM في n8n هو:",
          options: [
            "الموديل نفسه بيكون أقوى في n8n.",
            "مين اللي بيقرا الـ output — إنسان (Builder) ولا نظام (n8n).",
            "n8n بيستخدم prompts أقصر.",
          ],
          correctIndex: 1,
          explanation: "نفس الموديل بالظبط. اللي بيتغير هو الـ consumer للرد، وده اللي بيحدد لازم structured ولا حر.",
        },
        {
          id: "q2",
          bloom: "understand",
          question: "ليه Structured Output مهم في n8n؟",
          options: [
            "علشان الرد يطلع أسرع.",
            "علشان الـ node اللي بعد الـ LLM يقدر يحوّل الرد لقرارات أو يحطه في DB.",
            "علشان توفر tokens.",
          ],
          correctIndex: 1,
          explanation: "Downstream node = برنامج، مش إنسان. لو الرد نص حر، البرنامج هيفشل في parsing والـ workflow هيقف.",
        },
        {
          id: "q3",
          bloom: "apply",
          question: "بتبني workflow بياخد رسائل واتساب من العملاء ويصنفها. الـ LLM-node لازم يرجع:",
          options: [
            "رد طويل بالعربي للعميل مباشرة.",
            "JSON فيه category + urgency + suggested_reply.",
            "تحليل مفصل في صفحتين عن الرسالة.",
          ],
          correctIndex: 1,
          explanation: "الـ workflow محتاج يفرّع بناءً على التصنيف ويسجّل في DB. JSON منظم هو اللي بيخلي ده ممكن.",
        },
        {
          id: "q4",
          bloom: "understand",
          question: "Prompt engineering في n8n بيختلف عن Builder في إن:",
          options: [
            "بيركز أكتر على نبرة وأسلوب الرد.",
            "بيركز أكتر على schema و output format.",
            "بيستخدم لغة إنجليزية بس.",
          ],
          correctIndex: 1,
          explanation: "في Builder الإنسان بيقرا فالنبرة تهم. في n8n النظام بيقرا فالـ schema هي اللي تهم.",
        },
        {
          id: "q5",
          bloom: "apply",
          question: "الـ LLM-node رجّع رد بنص حر بدل JSON. أنهي إصلاح صح؟",
          options: [
            "غير الموديل لموديل أغلى.",
            "فعّل JSON Mode + حدد schema واضح في الـ system prompt.",
            "اعمل retry حتى يرجع JSON بالصدفة.",
          ],
          correctIndex: 1,
          explanation: "JSON Mode + schema explicit هما الضمان. Retry بدون تغيير الـ prompt = نفس الـ failure متكرر.",
        },
      ],
    },
  },
];
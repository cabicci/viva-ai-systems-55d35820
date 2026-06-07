import {
  Sparkles,
  AlertCircle,
  PlayCircle,
  Lightbulb,
  Scale,
  Rocket,
  BookOpen,
  CheckCircle2,
  Image as ImageIcon,
} from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";
import automatorM3WebhooksApiScreenshot from "@/assets/lessons/unique/automator-m4-l2-webhooks-api.jpg";

/** Automator · M4 · L2 — Webhooks & API (v3: Lesson Shape pilot) */
export const AUTOMATOR_M4_L2_WEBHOOKS_API_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بداية الدرس",
    title: "هتفهم إيه النهاردة؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "هتفهم إيه؟ Webhook = تطبيق يقول لتطبيق تاني «حصل حاجة» — من غير ما تسأل كل شوية.",
        "ليه دلوقتي؟ بعد ما عرفت فين البيانات بتتخزّن، محتاج تعرف إزاي التطبيقات بتكلّم بعض.",
        "هتعمل إيه بعد الدرس؟ هتشرح use case واحد لـ webhook + إيه البيانات اللي بتتبعت.",
      ],
    },
  },
  {
    icon: AlertCircle,
    eyebrow: "موقف مألوف",
    title: "«الأوتوميشن بيسأل كل دقيقة: فيه جديد؟»",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "الـ workflow بيفضل يسأل الموقع كل دقيقة: «في طلب جديد؟» — ٩٩ مرة الجواب لأ. بياكل وقت ومهام على الفاضي.",
        "العميل دفع — بس الأوتوميشن عرف بعد ٦٠ ثانية. الرسالة الترحيبية اتأخّرت.",
        "العامل الافتراضي محتاج يتعلّم: إمتى يستنى يتبلّغ؟ (Webhook) — وإمتى يروح يسأل بنفسه؟ (API).",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "API = إنت بتسأل. Webhook = هما بيقولولك",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "API: إنت بتبعت request — «هاتلي الطلبات النهارده». إنت اللي بدأت.",
        "Webhook: التطبيق التاني بيبعتلك — «في طلب جديد دلوقتي!» — أول ما الحدث يحصل.",
        "الـ Payload = البيانات جوه الرسالة: اسم العميل، المبلغ، التاريخ.",
        "في Make وn8n فيه nodes جاهزة — مش لازم تكتب كود.",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "مثال من الحياة",
    title: "تسأل كل دقيقة vs يتبلّغك فورًا",
    block: {
      kind: "comparison",
      left: {
        label: "Polling — تسأل كل دقيقة",
        body: "الأوتوميشن يسأل «فيه طلب؟» ١٤٤٠ مرة في اليوم. بطيء، مكلف، ومتأخر.",
      },
      right: {
        label: "Webhook — يتبلّغك",
        body: "الموقع يبعتلك فور الدفع: اسم + مبلغ + إيميل. الأوتوميشن يشتغل في نفس الثانية.",
      },
    },
  },
  {
    icon: BookOpen,
    eyebrow: "كلمتين بس",
    title: "مصطلحين للتواصل",
    block: {
      kind: "concepts",
      items: [
        {
          term: "Webhook",
          meaning: "إشعار فوري: تطبيق يبعت لتطبيق تاني لما حدث يحصل.",
          example: "عميل دفع → الموقع يبعت webhook للأوتوميشن.",
        },
        {
          term: "Payload",
          meaning: "البيانات جوه الرسالة — اللي الأوتوميشن هيستخدمها.",
          example: "{ name: «أحمد», amount: 500, email: «...» }.",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج — Webhook vs API",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption:
        "الفرق بين «إنت بتسأل» و«هما بيقولولك» — وإزاي تستخدمهم في workflow. لو معندكش وقت، كمل قراية.",
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوفها ببساطة",
    title: "تطبيق بيكلّم تطبيق",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: automatorM3WebhooksApiScreenshot,
      alt: "مثال على endpoint يستقبل بيانات",
      caption:
        "التطبيقات بتتكلم عن طريق endpoints — نفس الفكرة في أي أوتوميشن: webhook يستقبل، API يبعت. البيانات = الـ Payload.",
      label: "Endpoint — نقطة استقبال البيانات",
    },
  },
  {
    icon: Rocket,
    eyebrow: "تأكيد سريع",
    title: "سؤال واحد — مش امتحان",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "automator-m4-l2-webhooks-api-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "عايز أول ما عميل يدفع على الموقع، الأوتوميشن يبعت رسالة ترحيب فورًا. إيه الأنسب؟",
          options: [
            "Webhook من بوابة الدفع — تبلّغك لحظة الدفع.",
            "الأوتوميشن يسأل الموقع كل ٥ دقايق لو فيه دفع جديد.",
            "تدخل يدوي كل ما تشوف إشعار دفع.",
          ],
          correctIndex: 0,
          explanation:
            "حدث لحظي محتاج webhook — «هما بيقولولك». Polling بطيء ومكلف.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمتك",
    title: "اشرح webhook use case واحد",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "المهمة دي شرح — مش بناء. اختار حدث حقيقي في شغلك واكتب: إيه اللي بيحصل؟ إيه البيانات اللي بتتبعت؟\n\nممكن الـ AI يقترح صياغة — إنت تختار النهائي.",
      prompt:
        "في تسليمك اكتب:\n\n١) الحدث (إيه اللي بيحصل — مثال: عميل سجّل / دفع / ملأ فورم):\n٢) مين بيبعت الـ webhook (أنهي تطبيق):\n٣) مين بيستقبل (الأوتوميشن بيعمل إيه بعدها):\n٤) الـ Payload — ٣ حقول على الأقل (اسم الحقل + مثال قيمة):\n٥) ليه webhook أحسن من «أسأل كل دقيقة» في الحالة دي:",
      buttonLabel: "انسخ خطوات المهمة",
      copiedLabel: "اتنسخت ✓",
      template:
        "الحدث:\n[إيه اللي بيحصل — مثال: عميل دفع أونلاين]\n\nمين بيبعت:\n[التطبيق — مثال: Stripe / Paymob / الموقع]\n\nمين بيستقبل:\n[الأوتوميشن — مثال: n8n workflow «ترحيب بعد الدفع»]\n\nPayload (٣ حقول):\n1. [customer_name] = «أحمد»\n2. [amount] = 500\n3. [email] = «ahmed@...»\n\nليه webhook:\n[جملة — مثال: الدفع لحظي — محتاج رد فوري مش استعلام كل دقيقة]",
      rubric: [
        {
          label: "حدث واتجاه",
          weight: 50,
          criteria: [
            "حدث محدّد — مش كلام عام.",
            "واضح مين بيبعت ومين بيستقبل.",
          ],
        },
        {
          label: "Payload",
          weight: 50,
          criteria: [
            "٣ حقول على الأقل بأمثلة قيم.",
            "سبب webhook واضح مقارنة بـ polling.",
          ],
        },
      ],
    },
  },
  {
    icon: CheckCircle2,
    eyebrow: "خلّصت Webhooks",
    title: "إيه اللي عندك دلوقتي؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "فهمت إيه؟ Webhook = تطبيق يقول لتطبيق «حصل حاجة» — والـ Payload هو البيانات اللي بتتبعت.",
        "تقدر تعمل إيه؟ عندك use case واحد جاهز تشرحه أو تبنيه.",
        "اللي جاي: Error Handling — لما الأتمتة تفشل، محتاج تنبيه قبل ما العميل يتأذى.",
      ],
    },
  },
];

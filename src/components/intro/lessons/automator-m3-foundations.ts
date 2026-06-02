import {
  Compass,
  PlayCircle,
  Lightbulb,
  Scale,
  Rocket,
  BookOpen,
} from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";

/**
 * Automator · M3 · Lesson 01 (Bridge) — قبل ما تربط بحاجة حقيقية
 *
 * Bridge lesson that softens the M2 → M3 cliff. Introduces the 5 infra
 * concepts (Credential, Schema, RLS, Endpoint vs Webhook, Failure)
 * BEFORE the learner is asked to wire Make/n8n to a real database.
 */
export const AUTOMATOR_M3_FOUNDATIONS_BLOCKS: IntroLessonContent = [
  {
    icon: Compass,
    eyebrow: "HERO",
    title: "قبل ما تربط بحاجة حقيقية",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "٥ مفاهيم لازم تعرفها قبل M3.",
        "كل واحد منهم بيظهر في كل درس جاي.",
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
          term: "Credential (الـ كريدنشيال)",
          meaning: "مفتاح أو توكن بتديه للأداة عشان تقدر تكلم خدمة تانية بدل اسمك.",
          example: "زي ما تدي مفتاح شقتك للعاملة عشان تدخل تنضف — مش مفتاح العمارة كله.",
        },
        {
          term: "Schema (التقسيمة)",
          meaning: "خريطة الجدول: أسماء الأعمدة وأنواع البيانات اللي بتدخل فيها.",
          example: "زي شيت Excel فيه أعمدة: الاسم (نص)، السن (رقم)، تاريخ التسجيل (تاريخ).",
        },
        {
          term: "RLS (Row-Level Security)",
          meaning: "قواعد بتخلي كل مستخدم يشوف صفوفه هو بس في الجدول.",
          example: "زي كشف الحساب في البنك — كل واحد بيشوف فلوسه، مش فلوس باقي العملاء.",
        },
        {
          term: "Endpoint vs Webhook",
          meaning: "Endpoint = إنت بتسأل الخدمة. Webhook = الخدمة بتبلغك أول ما يحصل حاجة.",
          example: "Endpoint زي ما تتصل بالمطعم تسأل الأوردر وصل لفين. Webhook زي لما الدليفري بنفسه يكلمك \"وصلت\".",
        },
        {
          term: "Failure (الفشل المتوقع)",
          meaning: "النت بيقطع، الـ API بيرجع 500، الأداة بترفض. ده طبيعي مش استثناء.",
          example: "زي ما النت في الكافيه بيفصل ثانيتين — التطبيق الكويس بيستنى ويحاول تاني.",
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
      caption: "٥ مفاهيم في ٣ دقايق — تأسيس قبل أي ربط حقيقي.",
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "ليه المفاهيم دي قبل أي درس في M3؟",
    block: {
      kind: "numberedList",
      items: [
        "Credential — بدونه أي ربط بأي خدمة هيرفض (401).",
        "Schema — بدونه مش هتعرف تكتب أو تقرا الـ DB صح.",
        "RLS — بدونه ممكن تكتب كود يشوف بيانات مش ليه.",
        "Endpoint vs Webhook — بدونه هتختار الـ trigger الغلط وتقعد تـ poll بدل ما تستنى.",
        "Failure — بدونه أول error هيوقف الـ workflow وأنت مش عارف ليه.",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "تبدأ M3 بإيه؟",
    block: {
      kind: "comparison",
      left: {
        label: "FAILURE — تدخل M3 مباشرة بدون أساس",
        body: "تفتح أول درس عن وصل الـ DB، تلاقي كلمات Service Role Key، RLS، Connection String. كل كلمة محتاجة تسأل ChatGPT. خلصت الدرس وأنت لسه مش فاهم الفكرة الأم.",
      },
      right: {
        label: "RIGHT — تقفل الـ ٥ مفاهيم الأول",
        body: "تخلص الدرس ده (٣-٥ دقايق)، وكل كلمة تقابلك في M3 يبقى عندك مرساة ذهنية ليها. الدروس الجاية بقت تطبيق على مفاهيم عارفها، مش مفاهيم جديدة كل ثانيتين.",
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
      lessonId: "automator-m3-foundations-check",
      items: [
        {
          id: "q1",
          bloom: "understand",
          question: "إيه أقرب وصف للـ Credential؟",
          options: [
            "كود يخلي الـ workflow أسرع.",
            "مفتاح/توكن بيدي للأداة صلاحية تكلم خدمة تانية بدل اسمك.",
            "اسم الجدول في الـ DB.",
          ],
          correctIndex: 1,
          explanation: "الـ Credential هو الـ identity اللي بتقدمه الأداة للخدمة عشان تسمحلها — مش performance ولا schema.",
        },
        {
          id: "q2",
          bloom: "understand",
          question: "RLS بتعمل إيه بالظبط؟",
          options: [
            "بتسرّع الـ queries.",
            "بتحدد كل مستخدم يشوف أنهي صفوف من الجدول.",
            "بتمنع الـ duplicates.",
          ],
          correctIndex: 1,
          explanation: "RLS = Row-Level Security: قواعد فلترة تلقائية بناءً على هوية المستخدم. الـ performance والـ uniqueness ليهم أدوات تانية.",
        },
        {
          id: "q3",
          bloom: "apply",
          question: "عايز الـ workflow يشتغل أول ما يحصل تعديل في الـ DB، من غير ما يقعد يسأل كل دقيقة. تحتاج تستخدم إيه؟",
          options: [
            "Endpoint (تسأل كل دقيقة).",
            "Webhook (الـ DB بتبلغك).",
            "Credential جديد.",
          ],
          correctIndex: 1,
          explanation: "Webhook = الخدمة بتدفع الإشعار ليك. الـ Endpoint بتسأله إنت، وده Polling — أبطأ وبيستهلك quota.",
        },
        {
          id: "q4",
          bloom: "understand",
          question: "Schema يعني إيه؟",
          options: [
            "خطة الـ workflow كاملة.",
            "خريطة الأعمدة وأنواع البيانات في الجدول.",
            "نوع التشفير المستخدم.",
          ],
          correctIndex: 1,
          explanation: "Schema = هيكل الجدول. لازم تعرفه قبل ما تكتب أو تقرا، وإلا الـ insert هيرفض أو الـ read هيرجع columns مش موجودة.",
        },
        {
          id: "q5",
          bloom: "understand",
          question: "Failure (فشل في الـ workflow) =",
          options: [
            "حاجة استثنائية ونادرة، لو حصلت يبقى الـ workflow غلط.",
            "حدث متوقع لازم يكون عنده خطة (retry / fallback / log).",
            "غلطة من المستخدم بس.",
          ],
          correctIndex: 1,
          explanation: "أي workflow بيشتغل 24/7 لازم يقابله failures. السؤال مش 'هل'، السؤال 'هتتعامل معاه إزاي' (وده موضوع آخر درس في M3).",
        },
      ],
    },
  },
];
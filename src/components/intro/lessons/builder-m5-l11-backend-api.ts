import {
  Sparkles,
  PlayCircle,
  Lightbulb,
  Image as ImageIcon,
  Scale,
  Rocket,
  BookOpen,
  FlaskConical,
  AlertTriangle,
} from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";
import backendScreenshot from "@/assets/lessons/builder-m5-l11-backend-api.jpg";

/**
 * Builder · M5 · Lesson 02 — Backend & API
 * V2
 */
export const BUILDER_M5_BACKEND_API_BLOCKS: IntroLessonContent = [
  {
    icon: AlertTriangle,
    eyebrow: "أكبر كارثة في تطبيقات الـ AI",
    title: "لو مفتاح الـ AI اتسرق، هتدفع آلاف",
    tone: "danger",
    block: {
      kind: "comparison",
      left: {
        label: "الغلطة القاتلة: تحط مفتاح الـ AI في الـ Frontend",
        body: "لو قلت \"خلاص هخلي الـ Frontend يكلم OpenAI على طول، ليه وجع الدماغ ده؟\" — دي كارثة. أي يوزر يقدر يفتح الـ DevTools ويشوف المفتاح، ويسرقه ويستخدمه على حسابك. هتصحي تلاقي فاتورة بآلاف الدولارات في يوم. ده بينطبق على أي حاجة سرّية: مفاتيح الدفع، باسووردات الداتابيز، أي حاجة.",
      },
      right: {
        label: "الحل الصح: الـ Backend هو البوّاب",
        body: "كل طلب للـ AI لازم يعدّي على الـ Backend الأول. الـ Backend هو اللي معاه المفتاح السرّي، يكلم الـ AI، وياخد منه الرد، وبعدين يرجّعه للـ Frontend من غير ما يكشف المفتاح أبدًا. قاعدة ذهبية: لو الكود بيستخدم حاجة سرّية، مكانه الـ Backend.",
      },
    },
  },
  {
    icon: Rocket,
    eyebrow: "جرّب بنفسك",
    title: "شوف الـ API وهي شغالة قدامك",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "builder-m5-l11-backend-api-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "لو بتدردش مع مساعد Lovable دلوقتي، ودوست \"إرسال\"، وإنت فاتح الـ Network tab في الـ DevTools، هتلاقي طلب طلع للـ Backend. تفتكر الـ Method بتاع الطلب ده غالبًا هيكون إيه؟",
          options: [
            "GET، عشان إنت بتجيب رد من الـ AI.",
            "POST، عشان إنت بتبعت رسالة جديدة للسيرفر.",
            "PATCH، عشان إنت بتعدّل على محادثة موجودة.",
          ],
          correctIndex: 1,
          explanation:
            "صح! لما بتبعت رسالة، إنت بتضيف داتا جديدة (رسالتك) للسيرفر، فده بيكون طلب POST. أما GET فبيكون لو بتطلب داتا موجودة أصلًا، زي لما تفتح صفحة فيسبوك ويحمّل البوستات القديمة.",
        },
      ],
    },
  },
  {
    icon: Sparkles,
    eyebrow: "التشبيه الأساسي",
    title: "الـ Backend هو المطبخ، والـ API هو الجرسون",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "تخيل إنك في مطعم.",
        "الترابيزة اللي قاعد عليها، والمنيو اللي في إيدك، والديكور... كل ده هو الـ **Frontend**. دي الواجهة اللي بتتعامل معاها.",
        "المطبخ اللي ورا اللي بيجهز الأكل بجد، وبيستخدم مكونات سرّية، ومحدش غريب بيدخله... ده هو الـ **Backend**.",
        "طب إزاي طلبك بيوصل من الترابيزة للمطبخ؟ عن طريق **الجرسون**. الجرسون ده هو الـ **API**. هو الوسيط اللي بياخد طلبك ويرجعلك بالأكل الجاهز، من غير ما تحتاج تعرف إيه اللي حصل في المطبخ.",
      ],
    },
  },
  {
    icon: BookOpen,
    eyebrow: "مصطلح الدرس",
    title: "API (Application Programming Interface)",
    block: {
      kind: "concepts",
      items: [
        {
          term: "API",
          meaning:
            "العقد أو الوسيط اللي بيسمح لجزئين في السيستم (زي الـ Frontend والـ Backend) يكلموا بعض بطريقة منظمة ومفهومة.",
          example:
            "لما بتطلب أوبر، الأبلكيشن بتاعك (Frontend) بيكلم الـ API بتاع أوبر ويقوله 'عايز عربية في المكان الفلاني'، والـ API يرد عليه بـ 'تمام، أقرب كابتن على بعد 5 دقايق'.",
        },
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "إزاي بنعمل ده في Lovable؟",
    title: "الـ Backend بتاعك هو مجرد Function",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "في Lovable، مش محتاج تعمل مشروع Backend منفصل. الموضوع أبسط من كده بكتير.",
        "بتكتب function عادية خالص، بس بتحط قبلها كلمة معينة بتقول إن الـ function دي بتشتغل على السيرفر (في الـ Backend).",
        "الـ Frontend بينادي الـ function دي كأنها function عادية، ومن ورا الكواليس، المنصة بتحوّلها لـ API request كامل يروح للـ Backend ويرجع بالرد.",
        "يعني إنت بتركز في كتابة الـ function، والمنصة بتعملك الـ API أوتوماتيك. مفتاح الـ AI بتاعك بتحطه في المكان ده، في الـ server function، وكده بيفضل في أمان.",
      ],
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "مثال حي من المنصة",
    title: "مساعد Lovable بيكلم الـ Backend",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: backendScreenshot,
      alt: "صفحة مساعد المنصة بتعمل loading للبيانات من السيرفر",
      caption:
        "الصفحة دي مثال حي. أول ما بتفتحها، الـ Frontend بيبعت طلب للـ Backend عشان يعرف إنت مين وفي أنهي درس (ده طلب GET). ولما بتكتب رسالة وتدوس \"إرسال\"، بيبعت طلب تاني فيه رسالتك (ده طلب POST). الـ Backend ياخد الرسالة، يكلم الـ AI بالمفتاح السرّي، ويرجعلك الرد. كل ده والـ Frontend مش شايف أي مفاتيح.",
      label: "منصة Lovable — صفحة /ai-assistant",
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمتك دلوقتي",
    title: "صمّم أهم API لتطبيقك",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "كل تطبيق له طلب أساسي واحد هو قلبه. مهمتك تحدد الطلب ده لتطبيقك.",
      prompt:
        "في جملة واحدة بس، جاوب على السؤال ده:\n\n**إيه أهم طلب الـ Frontend بتاعك هيطلبه من الـ Backend عشان فكرتك تشتغل؟**\n\nأمثلة:\n- لتطبيق فواتير: \"احفظ الفاتورة الجديدة دي بالبيانات دي في حساب اليوزر\".\n- لتطبيق شات مع AI: \"خد رسالة اليوزر دي وهاتلي رد مناسب من الـ AI\".\n- لتطبيق توصيات أفلام: \"بناءً على اختيارات اليوزر دي، رشحلي 3 أفلام جديدة\".",
      buttonLabel: "انسخ صيغة الإجابة",
      copiedLabel: "اتنسخت!",
      rubric: [
        {
          label: "تحديد الطلب الأساسي",
          weight: 70,
          criteria: [
            "الإجابة في جملة واحدة وواضحة.",
            "بتوصف طلب من الـ Frontend للـ Backend، مش العكس.",
            "الطلب بيعبر عن الوظيفة الأساسية للتطبيق.",
          ],
        },
        {
          label: "الوضوح والواقعية",
          weight: 30,
          criteria: [
            "مفيش مصطلحات تقنية معقدة ملهاش لازمة.",
            "الطلب منطقي وممكن تنفيذه في الـ Backend.",
          ],
        },
      ],
    },
  },
];
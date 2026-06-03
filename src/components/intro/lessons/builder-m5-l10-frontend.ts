import {
  Sparkles,
  Scale,
  Rocket,
  ImageIcon,
  FlaskConical,
} from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";
import frontendScreenshot from "@/assets/lessons/builder-m5-l10-frontend.jpg";

export const BUILDER_M5_FRONTEND_BLOCKS: IntroLessonContent = [
  {
    icon: Scale,
    eyebrow: "أكتر مشكلة بتضيّع وقت",
    title: "الزرار مش شغال... المشكلة فين؟",
    block: {
      kind: "comparison",
      left: {
        label: "الغلطة الشائعة",
        body: '"الزرار مش شغال" — جملة عامة قوي. مش شغال إزاي؟ مش بيظهر أصلًا؟ ولا بيظهر بس مينفعش تدوس عليه؟ ولا بتدوس ومفيش حاجة بتحصل؟ كل سؤال من دول إجابته في حتة مختلفة خالص.',
      },
      right: {
        label: "الطريقة الصح",
        body: "قبل ما تطلب مساعدة، لازم تحدد المشكلة في أنهي طبقة. لو الزرار شكله بايظ أو مش موجود، دي مشكلة Frontend. لو بتدوس وبيحمّل وبعدين يدي error، غالبًا المشكلة Backend. أول خطوة دايمًا: حدد الطبقة.",
      },
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "جرّب دلوقتي في 30 ثانية",
    title: "اكشف أي موقع بالـ Inspector",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: frontendScreenshot,
      alt: "صورة للـ Inspector بتاع جوجل كروم وهو فاتح على موقع Lovable وبايّن فيه كود الـ HTML و الـ CSS.",
      caption:
        "روح على أي موقع بتحبه دلوقتي، ودوس كليك يمين واختار \"Inspect\". الشاشة اللي هتتفتحلك دي هي الـ Inspector، واللي بتوريك كواليس أي موقع. كل الكلام اللي شبه الإنجليزي ده (HTML و CSS) هو ده الـ Frontend. جرّب بنفسك.",
      label: "دوس F12 أو كليك يمين → Inspect",
    },
  },
  {
    icon: Sparkles,
    eyebrow: "تشبيه بسيط",
    title: "الـ Frontend عامل زي واجهة المحل",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "تخيل إنك داخل مطعم. الديكور، المنيو، الترابيزة اللي بتقعد عليها، طريقة تقديم الأكل... كل اللي عينك شايفاه ده هو الـ Frontend بتاع المطعم.",
        "نفس الكلام في أي تطبيق. الـ Frontend هو كل بكسل بتشوفه وتتفاعل معاه: الزراير، الألوان، النصوص، الصور. لما بتدوس على زرار والصفحة شكلها بيتغير، ده شغل Frontend.",
        "الكواليس دي بتتطبخ بـ 3 حاجات أساسية: HTML (الهيكل العظمي للصفحة)، CSS (الديكور والألوان)، و JavaScript (التفاعل والحركة). معظم الشغل الحديث بيستخدم \"أدوات\" جاهزة زي React عشان تسرّع البناء ده.",
        "نقطة مهمة جدًا: الكود ده كله بيشتغل على جهازك إنت (المتصفح)، مش على سيرفرات الشركة. عشان كده، أي حاجة سرية زي كلمات السر أو مفاتيح الـ API، ممنوع تتحط في الـ Frontend لإن أي حد ممكن يشوفها بالـ Inspector اللي لسة فاتحه.",
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك تطبّق",
    title: "حلل شاشة واحدة من موقع بتحبه",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "بعد ما فهمت إن الـ Frontend هو \"الواجهة\"، مهمتك بسيطة: هتحلل واجهة أي شاشة بتستخدمها كل يوم.",
      prompt:
        "١. اختار شاشة واحدة من أي موقع أو تطبيق بتحبه (مثلاً: صفحة منتج في أمازون، بوست في فيسبوك، فيديو في يوتيوب).\n٢. ايه أهم ٣ عناصر شايفها في الشاشة دي؟ (مثلاً: الصورة الكبيرة، زرار \"أضف للسلة\"، السعر).\n٣. لو النت قطع فجأة وانت بتحمّل الصفحة دي، تخيل شكلها هيبقى إيه؟ اوصف الـ Error State ده.",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "تحليل العناصر",
          weight: 60,
          criteria: [
            "وصفت ٣ عناصر واضحة ومحددة في الشاشة.",
            "العناصر دي هي فعلًا أهم حاجة في الصفحة.",
          ],
        },
        {
          label: "تخيل الـ Error State",
          weight: 40,
          criteria: [
            "وصفت شكل الشاشة لو حصل خطأ في تحميل البيانات.",
            "الوصف منطقي ومفهوم.",
          ],
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "من كواليسنا",
    title: "كل صفحة في المنصة هي Frontend",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "كل صفحة في المنصة هي Frontend",
      summary:
        "الجزء اللي انت شايفه من المنصة ده معمول بنفس المسار اللي بتتعلمه. صفحة الـ Dashboard اللي بتفتحها كل يوم هي Frontend معمول بـ React. الـ AI طلّع أول نسخة منها، واحنا عدّلنا وكملنا عليها — نفس الطريقة اللي هتشتغل بيها.",
      bullets: [
        "كل جزء في الـ dashboard هو component معمول بـ React.",
        "الألوان والستايل كلها معمولة بـ Tailwind CSS.",
        "جرّب تفتح الـ Inspector على أي حتة في الصفحة وهتشوف بنفسك الكود بتاعها.",
      ],
      pathAngle: "builder",
      link: { label: "بص على الـ Dashboard", href: "/dashboard" },
    },
  },
];
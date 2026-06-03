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
import jwtDiagram from "@/assets/lessons/concepts/jwt-diagram.jpg";

/**
 * Builder · M7 · Lesson 01 — Sessions & JWT
 * V2 Editor: [AI]
 *
 * Rules:
 * 1. No Theory Without Tension — DONE
 * 2. Quick Win in 30s — DONE
 * 3. Example before Term — DONE
 * 4. One Term Max (JWT) — DONE
 * 5. Mission ≤ 10 mins — DONE
 * 6. Pure Egyptian Ammiya — DONE
 * 7. No Repetition — DONE
 * 8. Momentum — DONE
 */
export const BUILDER_M7_SESSIONS_JWT_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "المشكلة",
    title: "إزاي السيرفر بيعرف إن \"ده إنت\"؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "أكيد لاحظت إنك بتدخل بإيميل وباسورد مرة واحدة بس. بعدها، كل صفحة بتفتحها في الموقع بتبقى عارفاك من غير ما تكتبهم تاني.",
        "مع كل طلب جديد بتبعته، السيرفر بطريقة ما بيعرف إنت مين، وبياناتك إيه، وإيه اللي مسموح لك تشوفه.",
        "السحر ده بيحصل بحاجة اسمها Sessions و JWT. ومن غيرهم، مفيش أي ابلكيشن فيه حسابات مستخدمين يقدر يشتغل.",
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جرّب دلوقتي",
    title: "شوف الـ'ختم' بتاعك بعينك",
    tone: "accent",
    block: {
      kind: "caseStudy",
      title: "اكتشف الـJWT بتاعك في 30 ثانية",
      summary:
        "كل مرة بتفتح صفحة في Lovable، السيرفر بيعرفك عن طريق كود سري اسمه JWT. الكود ده متخزّن عندك في المتصفح. في الـ30 ثانية الجايين، هتطلّعه بنفسك.",
      bullets: [
        "دوس F12 (أو right-click → Inspect) عشان تفتح الـDevTools.",
        "روح على تاب Application، وعلى الشمال افتح Local Storage → lovable.app.",
        "هتلاقي key اسمه `sb-....-auth-token`. القيمة اللي جنبه هي الـJWT بتاعك! ده الـ'ختم' اللي السيرفر بيعرفك بيه.",
      ],
      pathAngle: "builder",
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "المصطلح الوحيد للدرس",
    title: "إيه هو الـ JWT ده؟",
    block: {
      kind: "concepts",
      term: "JWT (JSON Web Token)",
      meaning:
        "كود طويل متشفّر فيه بياناتك (زي الـID بتاعك). المتصفح بيبعته للسيرفر مع كل طلب عشان يثبت له 'أنا فلان'، من غير ما تحتاج تكتب الباسورد كل مرة.",
      example:
        "زي الأساور اللي عليها اسمك في الـEvents. بدل ما كل شوية تطلّع بطاقتك عند كل بوابة، الأمن بيبص على الإسورة ويعرف إنك تبعهم وبيعدّيك على طول.",
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "الفكرة بالتفصيل",
    title: "رحلة الـJWT من أول Login لكل طلب",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: jwtDiagram,
      alt: "رسم بياني لدورة حياة الـJWT: المستخدم بيعمل login، السيرفر بيرد بـtoken. بعد كده كل طلب للسيرفر بيتبعت معاه الـtoken ده في الـAuthorization header.",
      caption:
        "لما بتعمل Login صح، السيرفر بيولّد الـJWT ده وبيختمه بـ'توقيع' سري محدش يعرفه غيره. التوقيع ده بيضمن إن محتوى الـtoken سليم ومحدش لعب فيه. الـFrontend بياخد الـtoken ده ويخزّنه، ومع كل طلب جديد (زي فتح صفحة)، بيبعته في الـHeader. السيرفر بيتأكد من التوقيع، لو سليم، بيثق في البيانات اللي جواه (زي الـuser ID بتاعك) وينفذ الطلب. الميزة هنا إن السيرفر مش محتاج يرجع للداتابيز كل مرة يتأكد إنت مين، وده بيخلّي الدنيا أسرع.",
      label: "JSON Web Token — الدورة الكاملة",
    },
  },
  {
    icon: Scale,
    eyebrow: "صح وغلط",
    title: "أكتر غلطتين بيقع فيهم المبتدئين في الـAuth",
    block: {
      kind: "comparison",
      left: {
        label: "غلط — تخزّن user_id بس في الـFrontend",
        body: "\"بعد ما يعمل login، هحفظ الـuserId في localStorage وأبعته مع كل طلب.\" دي كارثة. أي حد يقدر يفتح الـDevTools ويغيّر الـuserId لأي رقم تاني ويبعت طلب للسيرفر. السيرفر معندوش أي طريقة يتأكد بيها إن الرقم ده بتاعك فعلًا، لإن مفيش 'توقيع' أو ختم. كده الـAuthentication بايظة تمامًا.",
      },
      right: {
        label: "صح — السيرفر هو اللي بيختم وبيتحقق",
        body: "السيرفر بس هو اللي معاه المفتاح السري اللي بيختم بيه الـJWT. الـFrontend بيستلم الـtoken كامل ويخزّنه زي ما هو، وميقدرش يعدّل فيه أي حرف، لإن أي تعديل هيبوّظ التوقيع. كل طلب بيبقى متأمّن، والـBackend بيقرأ الـuser_id من الـtoken اللي هو واثق فيه، مش من حاجة جاية من المستخدم ممكن تكون متعدّلة. الـtoken كمان بيكون له مدة صلاحية قصيرة (زي ساعة)، فلو اتسرق، ضرره محدود بالوقت ده.",
      },
    },
  },
  {
    icon: BookOpen,
    eyebrow: "تفصيلة مهمة",
    title: "Cookie ولا Local Storage؟ الأأمن إيه؟",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "بعد ما السيرفر يديك الـJWT، الـFrontend لازم يخزّنه في حتة. عندك اختيارين مشهورين:",
        "• **localStorage** — سهل، والجافاسكريبت بتقدر تقراه وتكتبه. بس مشكلته إن أي script تاني في الصفحة (زي كود خبيث من إعلان أو extension) يقدر يوصل له ويسرقه. خطر الـXSS عالي. ينفع في التطبيقات الداخلية أو لو الـtoken عمره قصير قوي.",
        "• **httpOnly Cookie** — السيرفر هو اللي بيبعت الـtoken كـCookie ومتعلّم عليه علامة `HttpOnly`. دي بتمنع الجافاسكريبت تمامًا إنها تقراه. المتصفح بيبعته لوحده مع كل طلب للسيرفر. ده أأمن بكتير، وهو الاختيار الأساسي في معظم الـframeworks الجديدة (زي Supabase Auth).",
        "الخلاصة: لو بتبني تطبيق حقيقي عليه ناس بتستخدمه → استخدم httpOnly Cookie. الـlocalStorage خليه للتجارب أو الأدوات الداخلية.",
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "اختبر فهمك",
    title: "جاوب على الأسئلة دي",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "builder-m8-l22-sessions-jwt-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "لو لقيت JWT في Local Storage بتاع موقع، ومكتوب فيه جزء 'exp' (expiration) بعد ساعة من دلوقتي، ده معناه إيه غالبًا؟",
          options: [
            "إن ده access token ووقته هيخلص بسرعة عشان أمان حسابك.",
            "إن ده refresh token وهيفضل شغال فترة طويلة عشان متعملش login كل شوية.",
            "إن فيه مشكلة في الموقع، والـtoken المفروض ميكونش له صلاحية محدودة.",
          ],
          correctIndex: 0,
          explanation:
            "الـaccess token صلاحيته بتبقى قصيرة (زي ساعة) عشان لو اتسرق ضرره يبقى محدود، والـrefresh token هو اللي صلاحيته بتبقى أطول عشان متعملش login كل شوية.",
        },
        {
          id: "apply2",
          bloom: "apply",
          question:
            "لو غيرت حرف واحد في الـJWT اللي في الـLocal Storage وعملت refresh، الموقع عملك logout. إيه السبب المنطقي لده؟",
          options: [
            "لإن السيرفر اكتشف إن 'التوقيع' (signature) بتاع الـtoken بقى غلط بعد التعديل.",
            "لإن السيرفر بيعتبر أي تغيير في الـtoken محاولة اختراق فبيطردك على طول.",
            "لإن الـtoken الأصلي كان صلاحيته خلصت بالصدفة وقت التعديل.",
          ],
          correctIndex: 0,
          explanation:
            "الـJWT بيتوقّع بمفتاح سري عند السيرفر بس. أي تعديل، مهما كان صغير، بيبوّظ التوقيع ده. فالسيرفر بيرفض الـtoken وبيعتبرك مش عامل login.",
        },
        {
          id: "apply3",
          bloom: "apply",
          question:
            "لما بتخزّن JWT في Local Storage، إيه أهم حاجة تاخد بالك منها عشان تقلل الخطر لو الـtoken ده اتسرق؟",
          options: [
            "لازم الـJWT يكون له مدة صلاحية (expiration time) قصيرة.",
            "لازم الـJWT يكون متشفر بالكامل عشان محدش يقدر يقرأ محتواه.",
            "لازم تخزن معاه refresh token يكون هو كمان صلاحيته قصيرة جدًا.",
          ],
          correctIndex: 0,
          explanation:
            "مدة الصلاحية القصيرة أهم حاجة. لو الـtoken اتسرق، ضرره بيبقى محدود بالوقت القصير ده. التشفير الكامل مش هو الهدف الأساسي من الـJWT، هو بس بيبقى encoded.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمتك دلوقتي",
    title: "فك شفرة الـJWT بتاعك",
    tone: "primary",
    block: {
      kind: "mission",
      intro:
        "كل JWT هو نص طويل، بس الجزء اللي في النص منه (اسمه الـPayload) مش سري وممكن أي حد يقرأه. مهمتك دلوقتي إنك تفك شفرة الـtoken بتاعك وتطلّع الـUser ID بتاعك منه.",
      prompt:
        "1. ارجع للخطوات اللي عملتها في 'جرّب دلوقتي' وانسخ القيمة بتاعة الـJWT بتاعك من الـLocal Storage.\n2. روح على موقع `jwt.io` واعمل paste للكود اللي نسخته في مربع 'Encoded' اللي على الشمال.\n3. بص في مربع 'Decoded' اللي على اليمين، جوه قسم الـ`PAYLOAD`. هتلاقي حاجة اسمها `sub`، القيمة اللي جنبها هي الـUser ID بتاعك!\n\nفي التسليم، اكتب الـUser ID اللي لقيته.",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخت",
      rubric: [
        {
          label: "تم فك الشفرة بنجاح",
          weight: 100,
          criteria: [
            "سلمت الـ user ID اللي لقيته في الـ payload بتاع الـtoken.",
          ],
        },
      ],
    },
  },
];
import {
  Sparkles,
  PlayCircle,
  Lightbulb,
  Image as ImageIcon,
  Scale,
  Rocket,
  BookOpen, FlaskConical } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";
import jwtDiagram from "@/assets/lessons/concepts/jwt-diagram.jpg";

/**
 * Builder · M7 · Lesson 01 — Sessions & JWT
 * Format: Hero → Video → Concept → Platform Screenshot → Failure×Right → Mission
 *
 * يبني على M5.2 (Backend/API) و M5.3 (Database) — إزاي السيرفر بيعرف "إنت مين".
 */
export const BUILDER_M7_SESSIONS_JWT_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "HERO",
    title: "إزاي السيرفر بيعرف إن \"ده إنت\"؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "دخلت بإيميل وكلمة سر مرة واحدة. بعدها كل صفحة بتفتحها بتعرفك من غير ما تكتب تاني.",
        "كل request جديد، السيرفر بيعرف إنت مين، وإنت داخل لبياناتك إنت بس.",
        "ده شغل Sessions و JWT — وبدونه مفيش app فيه حسابات.",
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
        { term: "Stateless/Scalable", meaning: "السيرفر مش بيشيل بياناتك عنده، كل طلب بيبعت هويته من جديد.", example: "زي الموظف اللي بيدخل البنك يخلص حاجته ويخرج، الموظف مش محتاج يشيل صورته معاه طول اليوم." },
        { term: "Header vs Payload", meaning: "الـ Header نوع التوكن، والـ Payload هي بياناتك المشفرة زي اسمك.", example: "زي فاتورة المحل.. الـ Header نوع الورقة، والـ Payload هو اسم العميل والأصناف اللي اشتراها." },
        { term: "Signature", meaning: "كود سري بيأكد إن البيانات سليمة ومحدش عدل فيها من ورا السيرفر.", example: "زي ختم النسر على الشهادة، لو حد غير في البيانات الختم هيبان إنه مزور." },
        { term: "Refresh Token", meaning: "توكن احتياطي بيجيب توكن جديد لما الأول وقته يخلص عشان متسجلش دخول تاني.", example: "زي الكارنيه اللي معاك (JWT) وتصريح استخراج كارنيه جديد لو ضاع أو انتهى." },
        { term: "XSS (Cross-Site Scripting)", meaning: "هجمة هكر بيحاول يسرق بياناتك أو التوكن بتاعك عن طريق كود خبيث.", example: "زي واحد حرامي بيستغل إنك سايب باب محلك موارب، فيقوم زارع ورقة مزورة وسط ورقك." },
        { term: "JWT (JSON Web Token)", meaning: "كود مشفر فيه بياناتك، المتصفح بيبعته للسيرفر عشان يعرف إنت مين.", example: "زي لما تروح الجيم ويدوك \"تاغ\" على إيدك، ده اللي بيعرفهم إنك مشترك." },
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
      caption: "إيه الفرق بين تسجيل الدخول والـ session، وإيه دور الـ JWT في كل request.",
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "JWT = ختم بيتختمك بيه السيرفر",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "HTTP في الأصل بروتوكول stateless — يعني السيرفر بينسى مين كلّمه بمجرد ما يرد. كل request جديد = شخص جديد بالنسبة له. عشان يفتكرك بين requests، محتاجين Session — حالة تقول \"الشخص ده مسجّل دخول\".",
        "JWT (JSON Web Token) = string طويل بيتولّد بعد أول login ناجح. جوّاه ٣ أجزاء: header + payload (فيه user_id و expires_at) + signature متختّمة بمفتاح سرّي عند السيرفر بس. الـ Frontend بيخزّنه (في localStorage أو cookie آمن).",
        "كل request جديد للـ Backend (M5.2) بيبعت الـ JWT في header اسمه Authorization: Bearer <token>. السيرفر بيقرأ الـ payload (user_id) ويتأكد إن الـ signature صحيحة. لو صحيحة → أكيد ده إنت. لو الـ token اتعدّل بأي bit، الـ signature تكسر، والـ request يتم رفضه.",
        "Expiration مهم جدًا: الـ token بينتهي صلاحيته بعد فترة (ساعة لـ access token، أسابيع لـ refresh token). لو سُرق، الضرر محدود بالوقت. لما ينتهي، الـ Frontend بيستخدم refresh token عشان يجيب access token جديد بدون ما تكتب باسورد.",
      ],
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوف بنفسك",
    title: "دورة حياة الـ JWT من تسجيل الدخول لكل request",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: jwtDiagram,
      alt: "Diagram لدورة JWT: المستخدم بيعمل login، السيرفر بيولّد token من 3 أجزاء (Header.Payload.Signature)، وبعدين كل request جاي بيحمل الـ token في الـ Authorization header",
      caption:
        "الـ diagram ده بيوضّح الـ flow كامل. لما تكتب الباسورد، السيرفر بيتحقق منها وبيولّد JWT متختّم — 3 أجزاء بـ dot بينهم. الـ Frontend بيخزّنه ومع كل request بعد كده بيبعته في الـ Authorization header. السيرفر بيتحقق من التوقيع بدون ما يرجع للـ DB كل مرة — ده اللي بيخلّي JWT stateless و scalable.",
      label: "JSON Web Token — الدورة الكاملة",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "أكتر غلطتين بيقع فيهم المبتدئين في الـ Auth",
    block: {
      kind: "comparison",
      left: {
        label: "FAILURE — تخزّن user_id بس في الـ Frontend",
        body: "\"بعد ما يدخل، هحفظ userId في localStorage وأبعته مع كل request.\" كارثة. أي مستخدم يقدر يفتح DevTools ويغيّر الـ userId في localStorage لـ id حد تاني، ويبعته للـ API. السيرفر مفيش طريقة يتأكد إن الرقم ده فعلاً ليه — مفيش signature. Authentication مفقودة بالكامل.",
      },
      right: {
        label: "RIGHT — السيرفر هو اللي بيختم وبيتحقق",
        body: "السيرفر بس عنده المفتاح السرّي اللي بيختم بيه الـ JWT. الـ Frontend بيخزّن الـ token كامل (مش بياناته)، ومش بيقدر يعدّله — أي تعديل يكسر الـ signature. كل request محمي، الـ Backend بيقرأ الـ user_id من الـ token المحقّق منه، مش من حاجة جاية من المستخدم. + ميزة مهمة: JWT stateless — السيرفر مش بيرجّع لـ DB لكل request. بس المقابل: لو الـ access token اتسرق، الضرر محدود بـ مدة صلاحيته القصيرة (ساعة مثلاً)، لكن بنقدر نلغي الـ refresh token من السيرفر — فالمهاجم بعد الساعة مش هيقدر يجدّده.",
      },
    },
  },
  {
    icon: BookOpen,
    eyebrow: "تفصيلة مهمة",
    title: "Cookie ولا localStorage لتخزين الـ JWT؟",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "بعد ما السيرفر يديك الـ JWT، الـ Frontend لازم يخزّنه في حتة. عندك خياران:",
        "• **localStorage** — سهل وبيشتغل من JavaScript. بس أي script في الصفحة (حتى script خبيث من إعلان أو extension) يقدر يقراه. خطر XSS عالي. مناسب لتطبيقات داخلية أو لما الـ token قصير العمر جدًا.",
        "• **httpOnly Cookie** — السيرفر بيبعت الـ token كـ Cookie بـ flag اسمه HttpOnly. JavaScript مش بيقدر يقراها أبدًا. المتصفح بيبعتها تلقائيًا مع كل request. أأمن، وده الـ default في معظم الـ stacks الحديثة (بما فيها Supabase Auth).",
        "القاعدة: لو بتبني تطبيق production لمستخدمين حقيقيين → httpOnly Cookie. localStorage بس لتجارب وأدوات داخلية.",
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "افتح DevTools وشوف JWT بتاعك",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "builder-m8-l22-sessions-jwt-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "لو إنت بتعمل نفس الخطوات اللي فاتت عشان تشوف الـ JWT بتاع موقع معين، ولقيته متخزّن في الـ 'Application' تاب تحت 'Local Storage' ومكتوب فيه جزء 'exp' (expiration time) بعد ساعة من دلوقتي، ده معناه إيه؟",
          options: [
            "إن الـ token ده access token وهينتهي بعد مدة قصيرة عشان يحافظ على أمان حسابك.",
            "إن الـ token ده refresh token وهيفضل صالح لفترة طويلة عشان ميطلبش منك تسجيل دخول كل شوية.",
            "إن فيه مشكلة في الموقع، والـ token المفروض ميكونش ليه صلاحية محدودة."
          ],
          correctIndex: 0,
          explanation: "الـ access token بيكون ليه صلاحية قصيرة (زي ساعة) عشان لو اتسرق ضرره يكون محدود، والـ refresh token هو اللي بيكون صلاحيته أطول."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "في التمرين، لما غيرت حرف واحد بس في الـ JWT اللي متخزّن في الـ Local Storage وعملت refresh للصفحة، الموقع عمل logout ليك. إيه السبب المنطقي لده؟",
          options: [
            "لأن السيرفر اكتشف إن الـ signature بتاعة الـ token بقت مش صحيحة بعد التعديل.",
            "لأن السيرفر بيعتبر أي تغيير في الـ token محاولة اختراق فبيطردك على طول.",
            "لأن الـ token الأصلي كان معاه expiration time قصير وخلص أثناء التعديل."
          ],
          correctIndex: 0,
          explanation: "الـ JWT بيتم توقيعه بمفتاح سري عند السيرفر، وأي تعديل بسيط في محتوى الـ token بيكسر الـ signature، فالسيرفر بيرفض الـ token وبيعتبره غير صالح."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "إنت شغال على تطبيق جديد، والمفروض لما المستخدم يعمل login، بيتبعت له JWT. لو قررت تخزّن الـ JWT ده في 'LocalStorage' في المتصفح عشان يبقى سهل الوصول ليه بالجافاسكريبت، إيه أهم حاجة لازم تاخد بالك منها عشان تحافظ على الأمان في حالة إن السيرفر ده اتسرق؟",
          options: [
            "لازم الـ JWT يكون ليه expiration time قصير عشان لو اتسرق ميقدرش يتستخدم لفترة طويلة.",
            "لازم الـ JWT يكون encrypted (متشفر) بالكامل عشان محدش يقدر يقرأ محتواه.",
            "لازم تخزن معاه refresh token يكون هو كمان صلاحيته قصيرة جداً."
          ],
          correctIndex: 0,
          explanation: "الـ expiration time مهم جداً، لو الـ token اتسرق، ضرر السرقة بيكون محدود بالوقت اللي صلاحيته فيه شغالة. التشفير مش الهدف الأساسي للـ JWT هو بس بيكون encoded."
        }
      ]
    },
  },
  {
    icon: Rocket,
    eyebrow: "Mission",
    title: "ارسم Auth Flow كامل من Signup للـ Refresh",
    tone: "primary",
    block: {
      kind: "mission",
      intro:
        "Auth = بوابة المشروع. هترسم flow كامل: Signup → Login → Token → API Request → Refresh.",
      prompt:
        "في تسليمك diagram نصي بالـ steps:\n\n١) Signup — المستخدم بيكتب إيه + الـ backend بيعمل إيه + إيه اللي بيترجع؟\n٢) Login — نفس الشكل:\n٣) Storing token — فين بنحفظه؟ (localStorage / cookie / memory) + ليه؟\n٤) API request — الـ frontend بيرسل التوكن إزاي؟ (Header اسمه إيه؟)\n�5) Token expired — إيه يحصل؟ Refresh flow كامل.\n٦) Logout — إيه يتمسح وفين؟",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "Flow كامل بـ ٦ خطوات",
          weight: 60,
          criteria: [
            "كل step فيها frontend/backend بوضوح.",
            "Storage location معها سبب أمني.",
          ],
        },
        {
          label: "Refresh + Logout",
          weight: 40,
          criteria: [
            "Refresh flow موصوف مش «هيعمل refresh».",
            "Logout بيمسح كل اللي محتاج يتمسح.",
          ],
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جزء من المنصة",
    title: "JWT شغّال كل مرة بتفتح فيها صفحة",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "JWT شغّال كل مرة بتفتح فيها صفحة",
      summary:
        "الجزء ده من المنصة اتبنى بمسار Builder — نفس اللي بتتعلمه. أول ما تسجّل دخول، السيرفر بيديك JWT بيتخزّن في localStorage. كل request بعد كده بيحمل الـ JWT ده في الـ Authorization header. ده اللي بيخلّيك ميسجّلش دخول كل صفحة.",
      bullets: [
        "Supabase Auth بيتولّى issue + refresh للـ JWT.",
        "attachSupabaseAuth middleware بيحقن الـ token في كل serverFn.",
        "افتح DevTools → Application → Local Storage هتلاقي الـ JWT.",
      ],
      pathAngle: "builder",
      link: { label: "افتح /account", href: "/account" },
    },
  }
];

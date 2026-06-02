import {
  Sparkles,
  PlayCircle,
  Lightbulb,
  Image as ImageIcon,
  Scale,
  Rocket,
  BookOpen, FlaskConical } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";
import backendScreenshot from "@/assets/lessons/builder-m5-backend-api.jpg";

/**
 * Builder · M5 · Lesson 02 — Backend & API
 * Format: Hero → Video → Concept → Platform Screenshot → Failure×Right → Mission
 *
 * يكمل من M5.1 (Frontend) ويمهد لـ M5.3 (Database).
 */
export const BUILDER_M5_BACKEND_API_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "تشبيه واحد",
    title: "Backend = المطبخ · API = الجرسون",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "تخيل مطعم: الطاولة اللي قاعد عليها = Frontend (اللي شفته الدرس اللي فات).",
        "المطبخ في الورا اللي بيطبخ الأكل = Backend.",
        "الجرسون اللي بياخد طلبك ويرجعلك بالأكل = API.",
        "هتلاقي التشبيه ده بيتكرر في كل بلوك — عشان مفيش حاجة محتاجة تتحفظ.",
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
        { term: "JSON", meaning: "طريقة لكتابة البيانات زي قايمة الطلبات، الكل بيفهمها عشان منظمة.", example: "زي الملف اللي بتبعت فيه بيانات الفاتورة للمورد، بيبقى مفهوم للكمبيوتر وسهل يتنظم." },
        { term: "Endpoint / API URL", meaning: "عنوان محدد لخدمة معينة جوه الموقع بتنفذ حاجة واحدة بس.", example: "زي ما تروح للسجل المدني تسأل عن \"شهادة ميلاد\"، الخدمة دي لها عنوان ومكان مخصص." },
        { term: "Method (GET/POST)", meaning: "نوع الطلب؛ GET يعني بتجيب داتا، وPOST يعني بتبعت داتا تتسجل.", example: "لو بتبحث عن فاتورة قديمة ده GET، ولو بتسجل فاتورة جديدة في الدفتر ده POST." },
        { term: "DevTools / Network Tab 🌐", meaning: "لوحة التحكم في المتصفح اللي بتراقب منها كواليس الموقع وطلباته.", example: "لو الموقع بطيء، بتفتحه عشان تشوف الطلب \"اترفض\" ولا \"اتقبل\" والبيانات راحت فين." },
        { term: "Request / Response", meaning: "دي دورة التواصل؛ الزبون يطلب حاجة والسيرفر يرد عليه بالنتيجة.", example: "زي ما تسأل البنك عن \"رصيد حسابك\" (طلب)، يقوم الموظف رادد عليك بالرقم (رد)." },
        { term: "Placeholder / Mock Data", meaning: "بيانات وهمية بنحطها تسد خانة لحد ما نربط البيانات الحقيقية.", example: "لما المحاسب يكتب \"فلان الفلاني\" في الخانة لحد ما يجيله اسم العميل الحقيقي." },
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
      caption: "إيه الـ Backend، وإزاي الـ Frontend بيكلمه عن طريق API، وفين الـ AI بيعيش فعلاً.",
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "Backend = العقل، API = البريد",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "Backend = كود بيشتغل على سيرفر (مش على جهاز المستخدم). مسؤول عن: الحسابات الجادة، حفظ البيانات، التحقق من الصلاحيات، والاتصال بالـ AI models. أي حاجة سرّية (API keys، أسرار) بتعيش هنا — لأن المستخدم مش بيقدر يشوف الكود.",
        "API (Application Programming Interface) = العقد بين الـ Frontend والـ Backend. الـ Frontend بيبعت request (\"أنا عايز كذا\") على endpoint (مثلاً /api/chat)، والـ Backend بيرد بـ response (JSON غالبًا). كل request له method: GET (هات بيانات)، POST (ابعت بيانات جديدة)، PATCH/DELETE (عدّل/امسح).",
        "في Stack بتاعنا الـ Backend بيتكتب جوّه نفس المشروع كـ Server Functions — مش مشروع منفصل. تخيّلها زي function عادية بتكتبها (sendMessage مثلاً)، بس بـ marker بيقول «أنا أشتغل على السيرفر». الـ Frontend بيناديها بـ sendMessage({ text: \"hi\" }) — ورا الكواليس Lovable بيلفّها في HTTP request تلقائيًا، يبعتها لـ endpoint مولّد، والـ Backend يردّ. إنت بتكتب function، النظام بيعمل API.",
        "الـ AI نفسه (LLM من M1) بيعيش في API بتاعت شركة تانية (OpenAI/Google). الـ Backend بتاعك هو اللي بيكلمه — مش الـ Frontend. ليه؟ لأن مفتاح الـ AI سرّي. لو حطيته في الـ Frontend، أي حد هيسرقه في دقيقة.",
      ],
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوف بنفسك",
    title: "مساعد المنصة بيكلّم Backend في الوقت الحقيقي",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: backendScreenshot,
      alt: "صفحة مساعد المنصة — كرت 'سياق المتعلم الحالي' بـ badge LOADING، وحقول المسار/الموديول/الدرس فاضية لحد ما البيانات توصل من السيرفر",
      caption:
        "الصفحة دي مثال حيّ على الفرق بين الطبقتين. الكرت بتاع \"سياق المتعلم الحالي\" بيقولك LOADING — يعني الـ Frontend بعت request للـ Backend (مين المستخدم ده؟ في إيه دلوقتي؟) ولسه مستنّي الـ response. الحقول الفاضية (٤/٠، —) دي placeholders لحد ما الـ JSON يرجع. لما تكتب رسالة وتدوس \"إرسال\"، بيحصل request تاني (POST /api/assistant) فيه: نص رسالتك + سياقك. الـ Backend بياخد ده، يعمل prompt (M2)، يبعته للـ AI model عن طريق API key سرّية، يستنّى الرد، ويرجّعهولك. كل ده والـ Frontend مش شايف مفتاح ولا سيرفر — هو بس بينادي function ويستنى رد.",
      label: "من الموقع — صفحة /ai-assistant",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "أكبر غلطة Backend بتقع فيها وإنت مبتدئ",
    block: {
      kind: "comparison",
      left: {
        label: "FAILURE — تحط الـ API key في الـ Frontend",
        body: "\"خلاص هخلي الـ Frontend ينادي OpenAI على طول، ليه أعمل Backend؟\" — كارثة. أي مستخدم يقدر يفتح Network tab ويشوف المفتاح، ويستخدمه في حسابه. هتلاقي فاتورة آلاف الدولارات في يوم. ده ينطبق على أي secret: مفاتيح Stripe، Database passwords، Webhooks.",
      },
      right: {
        label: "RIGHT — Backend = البوّاب",
        body: "كل request للـ AI (أو لأي خدمة فيها مفتاح) لازم يعدّي على Server Function. الـ Function بتقرا المفتاح من environment variable (process.env)، تنادي الـ AI، وترجّع للـ Frontend الرد بس — من غير ما يشوف المفتاح أبدًا. قاعدة ذهبية: لو الكود بيستخدم secret، مكانه Backend مش Frontend.",
      },
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "افتح Network tab وشوف API بتشتغل قدامك",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "builder-m5-backend-api-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "لو بتدردش مع الـ AI Assistant بتاعنا، ودوست زرار \"ابعث رسالة\"، وإنت فاتح Network tab في الـ DevTools، هتلاقي request طلع للـ Backend. تفتكر الـ Method بتاع الـ request ده غالبًا هيكون إيه وليه؟",
          options: [
            "GET، عشان أنت بتجيب رد من الـ AI",
            "POST، عشان أنت بتبعت رسالة جديدة للـ Backend",
            "PATCH، عشان أنت بتعدّل على محادثة موجودة"
          ],
          correctIndex: 1,
          explanation: "لما بتبعت رسالة، أنت بتضيف بيانات جديدة (الرسالة بتاعتك) للسيرفر، وده بيتم عن طريق الـ POST method."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "لو موقع زي Notion بيعرضلك قائمة بالمستندات بتاعتك أول ما تفتح الصفحة، ممكن تشوف نوع الـ request اللي بيجيب القائمة دي إيه في الـ Network tab؟ وهل ده طبيعي؟",
          options: [
            "POST، عشان بيحمّل كل المستندات كبيانات جديدة",
            "GET، عشان بيطلب البيانات الموجودة على السيرفر لعرضها",
            "DELETE، عشان بيمسح أي ملفات قديمة قبل ما يجيب الجديد"
          ],
          correctIndex: 1,
          explanation: "عشان الموقع بيطلب بيانات موجودة بالفعل على السيرفر عشان يعرضها للمستخدم، وده بيتم بالـ GET request اللي وظيفته يجيب بيانات."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "إنت فاتح الـ DevTools وبتبص على الـ Network tab، لقيت إن في request بيجيب مفتاح الـ API بتاع الـ AI من الـ Frontend مباشرة. إيه أكبر مشكلة في ده وبيخالف أهم مبدأ في الـ Backend؟",
          options: [
            "المفتاح ده المفروض يتخزن في الـ Database مش في الـ Frontend",
            "المفتاح ده سرّي ومكانه الـ Backend، عشان أي حد ممكن يسرقه من الكود في الـ Frontend",
            "المفتاح ملوش لازمة أصلاً والـ Backend بيكون الـ AI لوحده"
          ],
          correctIndex: 1,
          explanation: "المعلومات الحساسة زي الـ API keys لازم تكون في الـ Backend عشان متكونش باينة للمستخدم، ولو كانت في الـ Frontend أي حد يقدر يشوفها ويستخدمها."
        }
      ]
    },
  },
  {
    icon: Rocket,
    eyebrow: "Mission",
    title: "صمّم ٣ API endpoints لتطبيقك",
    tone: "primary",
    block: {
      kind: "mission",
      intro:
        "API = العقد بين Frontend والـ Backend. هتصمم ٣ endpoints أساسية بكل تفاصيلهم.",
      prompt:
        "في تسليمك لكل endpoint من ٣:\n\nEndpoint X:\n- Method + Path (مثال: POST /api/posts)\n- إيه بيعمل في جملة:\n- Input (الـ body/params + types):\n- Output (الـ response shape):\n- Auth required? (yes/no + ليه):\n- ٢ Errors محتملين:\n\nفي الآخر: أنهي endpoint هو الـ critical اللي لو وقع التطبيق يقف، ولِيه؟",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "٣ endpoints مكتملين",
          weight: 60,
          criteria: [
            "كل endpoint فيه Method/Path/Input/Output.",
            "Auth + Errors محددين، مش «احتمال أي error».",
          ],
        },
        {
          label: "الـ Critical Path",
          weight: 40,
          criteria: [
            "حدّدت الـ critical endpoint بسبب مربوط بتجربة المستخدم.",
            "Errors واقعية (مش بس 500).",
          ],
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جزء من المنصة",
    title: "كل زرار «احفظ» بيستدعي serverFn جوّاني",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "كل زرار «احفظ» بيستدعي serverFn جوّاني",
      summary:
        "الجزء ده من المنصة اتبنى بمسار Builder — نفس اللي بتتعلمه. لما بتسجّل تقدّمك في درس، أو بتبعت mission، الـ Frontend بيستدعي serverFn (دي الـ backend بتاعتنا). تقدر تشوف كل serverFn بتشتغل في /build-logs.",
      bullets: [
        "بنستخدم TanStack Start serverFn بدل REST endpoints تقليدية.",
        "كل serverFn بتمر على auth middleware قبل ما تشتغل.",
        "/build-logs بيوريك التايملاين الكامل لكل request وردّه.",
      ],
      pathAngle: "builder",
      link: { label: "افتح /build-logs", href: "/build-logs" },
    },
  }
];

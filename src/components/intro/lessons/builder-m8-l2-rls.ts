import {
  Sparkles,
  PlayCircle,
  Lightbulb,
  Image as ImageIcon,
  Scale,
  Rocket,
  BookOpen,
  FlaskConical,
  ShieldCheck,
  BrainCircuit,
} from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";
import rlsDiagram from "@/assets/lessons/concepts/rls-diagram.jpg";

/**
 * Builder · M7 · Lesson 02 — RLS وحماية بيانات المستخدم
 * V2 Format: Tension → Quick Win → Concept → Video → How-it-works → Failure×Right → Mission → Quiz → Case Study
 *
 * يبني على M7.1 (JWT بيقول للسيرفر "إنت مين") و M5.3 (DB، جداول).
 */
export const BUILDER_M7_RLS_BLOCKS: IntroLessonContent = [
  {
    icon: Lightbulb,
    eyebrow: "اختياري — للمتقدمين",
    title: "لو هدفك استخدام AI في شغلك فقط، تقدر تعدّي الدرس ده بأمان",
    tone: "accent",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "الدرس ده فيه مفاهيم أمان للناس اللي بتبني تطبيقات حقيقية. لو لسه بتتعلم الأساسيات، تقدر تعدّيه دلوقتي وترجعله بعدين — مش هيأثر على باقي رحلتك.",
        "لو فعلًا عايز تبني — يلا نكمل.",
      ],
    },
  },
  {
    icon: Sparkles,
    eyebrow: "بعد الدرس ده هتقدر",
    title: "العميل A ميشوفش بيانات العميل B",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "هتعرف إزاي تحمي بيانات كل عميل حتى لو في غلطة في الكود.",
      ],
    },
  },
  {
    icon: Sparkles,
    eyebrow: "المشكلة",
    title: "إزاي تضمن إن أسرار عميلك مع الـ AI متظهرش لعميل تاني؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "تخيل عملت AI شخصي بيتعلم من ملاحظات العميل عشان يساعده. عميل سجّل فيه أسرار شغله وخططه. فجأة، عميل تاني فتح التطبيق لقى أسرار الأولاني كلها قدامه، والـ AI بتاعه بدأ يقترح عليه حاجات بناءً على أسرار غيره.",
        "دي كارثة خصوصية ممكن تقفل أي بيزنس. مجرد إنك عارف الـ ID بتاع حاجة، مش المفروض يديلك الحق تشوفها.",
        "**كارت الدخول المؤقت (JWT)** بيتأكد «إنت مين» قدام السيرفر. النهاردة هنعرف إزاي **المخزن الذكي (Database)** نفسه بيتأكد «إنت مسموح لك تشوف إيه؟».",
      ],
    },
  },
  {
    icon: ShieldCheck,
    eyebrow: "جرّب بنفسك",
    title: "إيه أنسب شرط عشان كل عميل يشوف محادثاته بس؟",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "builder-m8-l2-rls-quick-win",
      items: [
        {
          id: "quick-win-1",
          bloom: "apply",
          question:
            "لو عندك جدول `conversations` فيه محادثات كل عميل مع الـ AI بتاعه، وكل محادثة متسجل جنبها `user_id` بتاع صاحبها، إيه الشرط المنطقي اللي تحطه عشان كل عميل يشوف محادثاته هو بس؟",
          options: [
            "الـ `user_id` بتاع المحادثة لازم يساوي الـ `user_id` بتاع العميل اللي فاتح التطبيق دلوقتي.",
            "أي حد يقدر يشوف أي محادثة طالما معاه الـ ID بتاعها.",
            "لازم العميل يكون admin عشان يشوف أي محادثة.",
          ],
          correctIndex: 0,
          explanation:
            "بالظبط كده. دي فكرة الـ RLS ببساطة: بنربط كل سطر بصاحبه، والشرط ده بنسميه Policy، وده بيبقى زي **الحارس الشخصي لكل سطر** في المخزن.",
        },
      ],
    },
  },
  {
    icon: BrainCircuit,
    eyebrow: "المصطلح الوحيد",
    title: "الحارس الشخصي لكل سطر (RLS Policy)",
    block: {
      kind: "concepts",
      items: [
        {
          term: "RLS Policy (سياسة أمان)",
          meaning:
            "قاعدة أمان بتتكتب على مستوى **المخزن الذكي (Database)** نفسه، مش في كود التطبيق بتاعك. القاعدة دي بتتنفذ تلقائيًا على أي **سؤال للمخزن (Query)** عشان تفلتر نتايجه.",
          example:
            "تخيل المخزن الذكي بتاعك عبارة عن دولاب ملفات عملاق، وكل ملف (سطر) عليه حارس شخصي واقف. الحارس ده معاه ورقة فيها شرط واحد: 'ممنوع أي حد يفتح الملف ده إلا لو رقم البطاقة بتاعه هو نفس الرقم اللي مكتوب في خانة صاحب الملف'. لو الشرط متحققش، الحارس بيمنعه فورًا. الورقة اللي مع الحارس دي هي الـ Policy.",
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
      caption:
        "شوف بعينك إزاي بنعيّن **حارس شخصي لكل سطر** في المخزن، وليه ده أقوى بكتير من إنك تأمّن الكود بس.",
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "بتشتغل إزاي؟",
    title: "كأن كل عميل لابس نضارة بتوريه حاجته بس",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: rlsDiagram,
      alt: "رسم بياني بيوضح فكرة الـ Row Level Security: جدول فيه بيانات كل المستخدمين، وفي النص درع بيمثل الـ RLS Policy، وكل مستخدم بيشوف بس السطور بتاعته.",
      caption:
        "الـ **مخزن الذكي (Database)** واحد، وفيه بيانات كل الناس على بعض. بس لما العميل 'أحمد' يطلب محادثاته مع الـ AI، الـ Policy بتشتغل كفلتر وتوريله سطوره هو بس. كأن المخزن بيلبّس كل واحد نضارة سحرية بتوريه حاجته بس. الفلتر ده بيحصل جوه المخزن نفسه، مش في **كواليس التطبيق (Backend)**.",
      label: "الحارس الشخصي لكل سطر — الفلتر السحري",
    },
  },
  {
    icon: Scale,
    eyebrow: "الغلطة الصح",
    title: "ليه الأمان في الكود لوحده مش كفاية؟",
    block: {
      kind: "comparison",
      left: {
        label: "غلط: الأمان في الكود بس",
        body: "هكتب `WHERE user_id = currentUser.id` في كل حتة في الكود. المشكلة: لو نسيتها في مكان واحد بس، أسرار عميلك اتكشفت لعميل تاني. زي ما تكون قافل كل بيبان الشقة وسايب شباك المطبخ مفتوح على الشارع.",
      },
      right: {
        label: "صح: RLS خط دفاع أخير",
        body: "الـ RLS هو الباب الحديد على **المخزن الذكي** نفسه. حتى لو حصلت غلطة في **كواليس التطبيق (Backend)**، الحارس الشخصي اللي على كل سطر هيمنع أي حد يشوف بيانات مش بتاعته. ده بيضمن إن أسرار العميل اللي بيشاركها مع الـ AI بتاعه تفضل أسراره هو بس.",
      },
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمتك",
    title: "اكتب Policy واحدة تحمي إبداعات عملائك",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "دلوقتي هتكتب بنفسك policy بسيطة عشان تضمن إن محدش يقدر يمسح حاجة مش بتاعته.",
      prompt:
        "تخيل إن الـ AI بتاعك بيولّد صور بناءً على طلبات المستخدمين، وكل صورة بتتخزن في جدول اسمه `generated_images` ومعاها الـ `user_id` بتاع اللي طلبها.\n\n**مهمتك:** اكتب الـ Policy اللي تضمن إن محدش يقدر يمسح (DELETE) صورة إلا لو هو صاحبها.\n\nاكتب الشرط بس، مش محتاج تكتب كود كامل بلغة **سؤال المخزن (SQL)**. (مثال: `user_id` بتاع الصورة لازم يساوي `id` المستخدم الحالي).",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخت",
      rubric: [
        {
          label: "Policy واضحة وصحيحة",
          weight: 70,
          criteria: [
            "الشرط بيركز على عملية المسح (DELETE).",
            "الشرط بيقارن بين الـ `user_id` في الصورة والـ `user_id` بتاع المستخدم اللي بيحاول يمسح.",
          ],
        },
        {
          label: "شرح بسيط",
          weight: 30,
          criteria: [
            "شرح في سطر واحد ليه الـ policy دي مهمة عشان تمنع التخريب وحماية ملكية المستخدم.",
          ],
        },
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "اختبر فهمك",
    title: "جاوب على سيناريوهات الـ AI دي",
    block: {
      kind: "quiz",
      lessonId: "builder-m8-l2-rls-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "في تطبيق AI بيساعدك ترتب أولوياتك، المهام بتاعتك متخزنة في جدول `tasks`. إيه أنسب policy لعملية الـ SELECT عشان كل واحد يشوف مهامه بس؟",
          options: [
            "USING (user_id = auth.uid())",
            "USING (true)",
            "USING (user_id IS NOT NULL)",
          ],
          correctIndex: 0,
          explanation:
            "الـ `auth.uid()` دي طريقة سريعة عشان نجيب الـ ID بتاع المستخدم اللي باعت **كارت الدخول المؤقت (JWT)** بتاعه مع الطلب. الشرط ده بيضمن إن المخزن مش هيرجّع غير السطور اللي الـ `user_id` بتاعها مطابق للـ ID ده.",
        },
        {
          id: "apply2",
          bloom: "apply",
          question:
            "في تطبيق شات بوت (AI chatbot)، إيه الـ policy اللي تضمن إن محدش يقدر يبعت رسالة باسم حد تاني (يعني الـ `user_id` اللي بيتسجل لازم يكون بتاع اللي بيبعت)؟",
          options: [
            "WITH CHECK (auth.uid() = user_id) OR USING (is_admin = true)",
            "WITH CHECK (user_id = auth.uid())",
            "USING (true)",
          ],
          correctIndex: 1,
          explanation:
            "الـ `WITH CHECK` دي جزء من الـ policy بتشتغل وقت الإضافة (INSERT). وظيفتها تتأكد إن البيانات الجديدة اللي هتتخزن مطابقة للشرط. هنا هي بتتأكد إن الـ `user_id` اللي جاي مع الرسالة الجديدة هو هو نفس الـ ID بتاع المستخدم اللي عامل login، وده بيمنع أي تزوير.",
        },
        {
          id: "apply3",
          bloom: "apply",
          question:
            "في تطبيق AI بيساعد الفرق تنظم شغلها، أي عضو في مشروع يقدر يشوف كل محادثات الـ AI الخاصة بالمشروع ده. إزاي ممكن تعمل policy تسمح لأعضاء المشروع بس يشوفوا المحادثات دي؟ (ملحوظة: فيه جدول `project_members` بيربط المستخدمين بالمشاريع)",
          options: [
            "USING (user_id = auth.uid())",
            "USING (project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid()))",
            "USING (true)",
          ],
          correctIndex: 1,
          explanation:
            "ده مثال متقدم شوية. الـ Policy دي بتستخدم **سؤال جوه سؤال** للمخزن عشان تتأكد إن المحادثة اللي بيحاول يشوفها موجودة في مشروع هو أصلًا عضو فيه. دي طريقة ممتازة لتأمين السيناريوهات اللي فيها فرق عمل.",
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جزء من المنصة",
    title: "كل جدول عندنا عليه حارس شخصي",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "كل جدول عندنا عليه حارس شخصي (RLS Policy)",
      summary:
        "الجزء اللي انت شايفه ده في المنصة اتبنى بنفس الأدوات اللي بتتعلمها. لو حاولت دلوقتي تفتح أدوات المطورين (DevTools) وتطلب بيانات مش بتاعتك، **المخزن الذكي** بتاعنا هيرفض طلبك فورًا. ليه؟ عشان كل جدول فيه بيانات مستخدمين عليه **حارس شخصي (RLS policy)** بنفس الطريقة اللي اتعلمتها بالظبط.",
      bullets: [
        "جداول زي `lesson_progress` و `mission_submissions` كلها محمية بـ RLS.",
        "الـ Policy المستخدمة: USING (auth.uid() = user_id) — ممنوع تشوف غير بياناتك.",
        "حتى لو الكود بتاعنا فيه غلطة، المخزن الذكي نفسه هو خط الدفاع الأخير اللي هيمنع تسريب أي بيانات.",
      ],
      pathAngle: "builder",
      link: { label: "افتح صفحة حسابك وشوف بنفسك", href: "/account" },
    },
  },
];
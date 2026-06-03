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
    icon: Sparkles,
    eyebrow: "المشكلة",
    title: "إزاي تمنع بيانات عميل تظهر لعميل تاني؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "تخيل عملت أبلكيشن ملاحظات، وعميل سجّل فيه أسرار شغله. فجأة، عميل تاني فتح الأبلكيشن لقى ملاحظات الأولاني قدامه.",
        "دي كارثة ممكن تقفل أي بيزنس. مجرد إنك عارف الـ ID بتاع حاجة، مش المفروض يديلك الحق تشوفها.",
        "الدرس اللي فات عرفنا إزاي السيرفر بيتأكد \"إنت مين\" بالـ JWT. النهاردة هنعرف إزاي الداتابيز نفسها بتتأكد \"إنت مسموح لك تشوف إيه؟\".",
      ],
    },
  },
  {
    icon: ShieldCheck,
    eyebrow: "جرّب بنفسك",
    title: "إيه أنسب شرط عشان كل واحد يشوف حاجته بس؟",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "builder-m8-l23-rls-quick-win",
      items: [
        {
          id: "quick-win-1",
          bloom: "apply",
          question:
            "لو عندك جدول `notes` فيه عمود `user_id`، وعايز تتأكد إن كل مستخدم بيشوف ملاحظاته هو بس، إيه الشرط المنطقي اللي تحطه؟",
          options: [
            "الـ `user_id` بتاع الملاحظة لازم يساوي الـ `user_id` بتاع المستخدم اللي فاتح الأبلكيشن دلوقتي.",
            "أي حد يقدر يشوف أي ملاحظة طالما معاه الـ ID بتاعها.",
            "لازم المستخدم يكون admin عشان يشوف أي ملاحظة.",
          ],
          correctIndex: 0,
          explanation:
            "بالظبط كده. دي فكرة الـ Row Level Security ببساطة: بنربط كل سطر بصاحبه، ومنخلّيش أي حد تاني يشوفه. الشرط ده هو اللي هنسميه Policy.",
        },
      ],
    },
  },
  {
    icon: BrainCircuit,
    eyebrow: "المصطلح الوحيد",
    title: "الـ Policy: حارس شخصي لكل سطر",
    block: {
      kind: "concepts",
      term: "Policy (سياسة أمان)",
      meaning:
        "قاعدة أمان بتتكتب على مستوى الداتابيز نفسها، مش في الكود بتاعك. القاعدة دي بتتنفذ تلقائيًا على أي طلب بيانات عشان تفلتره.",
      example:
        "تخيل كل سطر في الإكسيل بتاعك عليه حارس شخصي. الحارس ده معاه ورقة فيها شرط واحد: 'ممنوع أي حد يقرأ السطر ده إلا لو الـ ID بتاعه هو نفس الـ ID اللي في خانة صاحب السطر'. لو الشرط متحققش، الحارس بيمنعه فورًا. الورقة دي هي الـ Policy.",
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
        "شوف بعينك إزاي الـ RLS بتشتغل كحارس على كل سطر، وليه الأمان في الكود لوحده مش كفاية.",
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "بتشتغل إزاي؟",
    title: "كأن كل مستخدم لابس نضارة بتوريه حاجته بس",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: rlsDiagram,
      alt: "رسم بياني بيوضح فكرة الـ Row Level Security: جدول فيه بيانات كل المستخدمين، وفي النص درع بيمثل الـ RLS Policy، وكل مستخدم بيشوف بس السطور بتاعته.",
      caption:
        "الداتابيز واحدة، وفيها بيانات كل الناس متلخبطة على بعض. بس لما المستخدم 'أحمد' يطلب بياناته، الـ Policy بتشتغل كفلتر وتوريله سطوره هو بس. كأن الداتابيز بتلبّس كل واحد نضارة سحرية بتوريه حاجته بس. الفلتر ده بيحصل في الداتابيز نفسها، مش في الكود.",
      label: "Row Level Security — الفلتر السحري",
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
        body: "هكتب `WHERE user_id = currentUser.id` في كل حتة في الكود. المشكلة: لو نسيتها في مكان واحد بس، الأبلكيشن كله اتفتح. زي ما تكون قافل كل بيبان الشقة وسايب شباك المطبخ مفتوح على الشارع.",
      },
      right: {
        label: "صح: RLS خط دفاع أخير",
        body: "الـ RLS زي باب حديد على الداتابيز نفسها. حتى لو حرامي نط من شباك الكود المفتوح، هيلاقي الباب الحديد ده مقفول في وشه. ده اسمه 'الأمان متعدد الطبقات' (Defense in Depth)، وهو أساس أي سيستم محترم.",
      },
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمتك",
    title: "اكتب Policy واحدة تحمي بيانات المستخدمين",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "دلوقتي هتكتب بنفسك policy بسيطة عشان تضمن إن محدش يقدر يمسح حاجة مش بتاعته.",
      prompt:
        "تخيل عندك أبلكيشن زي تويتر، وجدول اسمه `posts` فيه عمود `user_id`.\n\n**مهمتك:** اكتب الـ Policy اللي تضمن إن محدش يقدر يمسح (DELETE) بوست إلا لو هو صاحبه.\n\nاكتب الشرط بس، مش محتاج تكتب كود SQL كامل. (مثال: `user_id` لازم يساوي `id` المستخدم الحالي).",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخت",
      rubric: [
        {
          label: "Policy واضحة وصحيحة",
          weight: 70,
          criteria: [
            "الشرط بيركز على عملية الـ DELETE.",
            "الشرط بيقارن بين الـ `user_id` في البوست والـ `user_id` بتاع المستخدم اللي بيحاول يمسح.",
          ],
        },
        {
          label: "شرح بسيط",
          weight: 30,
          criteria: [
            "شرح في سطر واحد ليه الـ policy دي مهمة عشان تمنع التخريب.",
          ],
        },
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "اختبر فهمك",
    title: "جاوب على السيناريوهات دي",
    block: {
      kind: "quiz",
      lessonId: "builder-m8-l23-rls-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "في أبلكيشن إدارة المهام (To-Do List)، إيه أنسب policy لعملية الـ SELECT على جدول الـ `tasks` عشان كل واحد يشوف مهامه بس؟",
          options: [
            "USING (user_id = auth.uid())",
            "USING (true)",
            "USING (user_id IS NOT NULL)",
          ],
          correctIndex: 0,
          explanation:
            "الـ `auth.uid()` بترجع الـ ID بتاع المستخدم اللي عامل Log in دلوقتي. الشرط ده بيضمن إن الداتابيز مش هترجّع غير السطور اللي الـ `user_id` بتاعها مطابق للـ ID ده.",
        },
        {
          id: "apply2",
          bloom: "apply",
          question:
            "في أبلكيشن شات، إيه الـ policy اللي تضمن إن محدش يقدر يبعت رسالة باسم حد تاني (يعني الـ `user_id` اللي بيتسجل لازم يكون بتاع اللي بيبعت)؟",
          options: [
            "WITH CHECK (auth.uid() = user_id) OR USING (is_admin = true)",
            "WITH CHECK (user_id = auth.uid())",
            "USING (true)",
          ],
          correctIndex: 1,
          explanation:
            "الـ `WITH CHECK` في الـ INSERT policy بتعمل تدقيق على البيانات الجديدة قبل ما تتضاف. هنا هي بتتأكد إن الـ `user_id` اللي جاي مع الرسالة الجديدة هو هو نفس الـ ID بتاع المستخدم اللي عامل login، وده بيمنع أي تزوير.",
        },
        {
          id: "apply3",
          bloom: "apply",
          question:
            "في أبلكيشن لإدارة المشاريع، أي عضو في مشروع يقدر يعدّل أي مهمة جوه المشروع ده. إزاي ممكن تعمل UPDATE policy تسمح لأعضاء المشروع بس بالتعديل؟ (ملحوظة: فيه جدول `project_members` بيربط المستخدمين بالمشاريع)",
          options: [
            "USING (user_id = auth.uid())",
            "USING (project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid()))",
            "USING (true)",
          ],
          correctIndex: 1,
          explanation:
            "ده مثال متقدم شوية. الـ Policy دي بتستخدم Subquery (استعلام فرعي) عشان تتأكد إن المهمة اللي بيحاول يعدّلها موجودة في مشروع هو أصلًا عضو فيه. دي طريقة ممتازة لتأمين السيناريوهات المعقدة.",
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جزء من المنصة",
    title: "كل جدول عندنا عليه حارس RLS",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "كل جدول عندنا عليه حارس RLS",
      summary:
        "الجزء ده من المنصة اتبنى بمسار Builder — نفس اللي بتتعلمه. لو حاولت تقرا تقدّم متعلّم تاني من الـ DevTools، الداتابيز هترفض طلبك. كل جدول فيه بيانات مستخدمين عليه RLS policy بنفس الطريقة اللي اتعلمتها بالظبط.",
      bullets: [
        "جداول زي `lesson_progress` و `mission_submissions` كلها محمية بـ RLS.",
        "الـ Policy المستخدمة: USING (auth.uid() = user_id) — ممنوع تشوف غير بياناتك.",
        "حتى لو الكود بتاعنا فيه غلطة، الداتابيز نفسها هي خط الدفاع الأخير اللي هيمنع تسريب أي بيانات.",
      ],
      pathAngle: "builder",
      link: { label: "افتح صفحة حسابك وشوف بنفسك", href: "/account" },
    },
  },
];
import {
  Sparkles,
  PlayCircle,
  Lightbulb,
  Image as ImageIcon,
  Scale,
  Rocket,
  BookOpen, FlaskConical } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";
import gridImg from "@/assets/lessons/unique/creator-m6-grid-consistency.jpg";

export const CREATOR_M6_GRID_CONSISTENCY_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "HERO",
    title: "الـ Profile هو الـ Landing Page بتاعك",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "زائر جديد بيشوف Bio + ٩ بوستات قبل ما يقرّر يـFollow ولا لأ.",
        "٣ ثواني فقط. لازم الـ Grid يدّيله إحساس واحد واضح.",
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
        { term: "Landing Page", meaning: "صفحة الهبوط، أول صفحة بيوصلها الزبون وتاخد عينه.", example: "زي البياع اللي بيفرد فرشته قدام المحل عشان يشد الزبون يدخل يشتري." },
        { term: "Grid/Layout/Pattern", meaning: "رصة البوستات جنب بعضها في بروفايلك وشكلها العام.", example: "تاجر القماش اللي بيرص تاتوابه جنب بعض بانتظام عشان يبان إنه منظم." },
        { term: "Primary/Accent colors", meaning: "اللون الأساسي للبراند، واللون الفرعي اللي بينطق التصميم.", example: "المحاسب اللي بيستخدم قلم أحمر للهوامش (Accent) وقلم أزرق للكتابة الأساسية." },
        { term: "Audit", meaning: "مراجعة وجرد لبروفايلك عشان تشوف إيه اللي محتاج يتصلح.", example: "صاحب محل بيجرد البضاعة اللي عنده عشان يشوف إيه شغال وإيه لا." },
        { term: "Overlay/Filters", meaning: "طبقة لون خفيفة بتتحط فوق الصورة عشان توضح الكلام.", example: "براند ملابس بيحط طبقة ظل سوداء خفيفة فوق صورة الموديل عشان الكلام يبان." },
        { term: "Hero post/Pinned post", meaning: "البوست اللي بتثبته في أول البروفايل عشان يعرّف الناس بيك.", example: "صاحب مطعم بيثبت بوست المنيو أو العروض فوق خالص عشان أي حد يشوفها." },
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
      caption: "أمثلة لـ profiles ناجحة — إيه الـ patterns المشتركة؟",
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "Grid Consistency — ٤ مبادئ",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "١. لون مهيمن واحد على الـ Grid. ٧٠٪ من البوستات لازم يكونوا بالـ Primary color (من brand_v1). الـ ٣٠٪ التانيين Accents. الـ Grid اللي فيه ٩ ألوان مختلفة = chaos.",
        "٢. Covers موحّدة. كل Reel لازم يبقى عنده Cover مصمّم (مش screenshot عشوائي). نفس الـ template، نفس الخط، نفس الـ layout. CapCut و Canva فيهم Cover templates.",
        "٣. Rhythm في الـ Layout. ممكن تعمل: صورة - reel - صورة - reel، أو ٣ بوستات نفس الموضوع تحت بعض. الـ Grid له إيقاع، مش عشوائي.",
        "٤. Hero Posts متثبّتة (Pinned). أهم ٣ بوستات (الأنجح/اللي بيقدّم نفسك) بتثبتهم فوق. الزائر بيشوفهم الأول — لازم يلخّصوا قيمتك في ٣ ثواني.",
        "للتخطيط: استخدم Preview app (مثل Plann أو Later) — بترفع البوستات قبل النشر وتشوف شكلهم في الـ grid. ممكن تعدّل الترتيب قبل النشر.",
      ],
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوف بنفسك",
    title: "Grid متّسق = ثقة فورية",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: gridImg,
      alt: "Instagram Profile Grid — ٩ بوستات بنفس الـ palette والخط",
      caption:
        "لاحظ كل التايل بـ نفس مدى الألوان (cream + terracotta + black). نفس الخط في العناوين. الزائر بيشوف الـ profile ده ويعرف فوراً: «ده Creator في الـ lifestyle بـ هوية واضحة». الثقة بتبني نفسها.",
      label: "Instagram — Consistent Grid",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "زائر جديد — رد فعل مختلف",
    block: {
      kind: "comparison",
      left: {
        label: "FAILURE — Grid عشوائي",
        body: "كل بوست بلون مختلف، خط مختلف، style مختلف. الزائر يـscroll، يحس بـ chaos، مش بيفهم إنت بتعمل إيه، يرجع. مفيش Follow.",
      },
      right: {
        label: "RIGHT — Grid موحّد",
        body: "نفس الـ palette، نفس الخط، Covers مصمّمة لكل Reel. الزائر يشوف الـ Grid ٣ ثواني، يفهم القيمة، يضغط Follow. الـ Brand بيشتغل قبل ما يقرا حتى Caption واحد.",
      },
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "خطّط أول ٩ بوستات بـ Grid موحّد",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "creator-m6-grid-consistency-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "ولاء بتخطط للـ 9 بوستات الجاية على صفحتها، وعايزة الـ Grid بتاعها يدّي إحساس بالهدوء والاحترافية. هي عندها Primary color لبني هادي، و Accent color أصفر فاقع. تفتكر إيه أفضل طريقة توزع بيها الألوان دي عشان تحقق هدفها في الـ Grid؟",
          options: [
            "تخلي 7 بوستات باللون اللبني و 2 باللون الأصفر، مع استخدام قوالب موحدة لـ Reels.",
            "تخلي 5 بوستات باللون اللبني و 4 باللون الأصفر عشان يبقى فيه تنوع أكبر.",
            "تستخدم الأصفر والأزرق بالتساوي في كل البوستات عشان تبين حيوية الصفحة."
          ],
          correctIndex: 0,
          explanation: "القاعدة بتقول 70% من البوستات بالـ Primary color و 30% من البوستات بالـ Accent color. ده بيوفر اتساق وهدوء بصري في الـ Grid اللي هو الـ Landing Page بتاعك."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "أحمد بيعمل Grid جديد لصفحته وبيلاحظ إن الزوار بيقضوا 3 ثواني بس قبل ما ياخدوا قرار. هو عنده 3 بوستات قديمة حققت نجاح كبير وجابتله متابعين كتير. إيه أحسن حاجة يعملها بالـ 3 بوستات دي عشان يشد الزوار الجداد؟",
          options: [
            "يعملهم Hero Posts متثبتين فوق الـ Grid عشان الزائر يشوفهم أول ما يدخل.",
            "ينشرهم تاني كجزء من الـ 9 بوستات الجديدة في النص عشان يكونوا جزء من التدفق الطبيعي للـ Grid.",
            "يعملهم في Story Highlight عشان يفضلوا متاحين دايماً بس مش في الـ Grid نفسه."
          ],
          correctIndex: 0,
          explanation: "الـ Hero Posts المتثبتة هي أهم 3 بوستات بتقابل الزائر الأول وبتلخص قيمتك في 3 ثواني، وده بيساعد الزائر الجديد ياخد قرار بالـ Follow."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "منى لاحظت إن الـ Reels بتاعتها اللي بتظهر في الـ Grid شكلها مش موحد، كل Reel ليها صورة غلاف عشوائية متتاخدة من نص الفيديو. ده بيدي إحساس بعدم الاحترافية. إيه الحل الأمثل للمشكلة دي عشان تحافظ على الـ Consistency في الـ Visual identity بتاعتها؟",
          options: [
            "تصمم Cover موحد لكل Reel باستخدام نفس الـ template والخط والـ layout وتتأكد إنه بيظهر في الـ Grid.",
            "تختار أفضل لقطة من كل Reel وتخليها هي الـ Cover، لكن من غير تصميم موحد.",
            "تعمل كل الـ Reels بصور ثابتة عشان مايكونش فيه مشكلة Covers خالص."
          ],
          correctIndex: 0,
          explanation: "لتوحيد شكل الـ Covers، لازم يبقى فيه قالب تصميم موحد (نفس الـ template، الخط، والـ layout) لكل الـ Reels. ده بيضمن الاتساق البصري في الـ Grid وبيخلي شكلها احترافي."
        }
      ]
    },
  },
  {
    icon: Rocket,
    eyebrow: "Mission",
    title: "Audit للـ Grid الحالي + خطة آخر ٩ بوستات قادمة",
    tone: "primary",
    block: {
      kind: "mission",
      intro:
        "Profile = Landing Page. هتعمل Audit للـ ٩ بوستات الظاهرين دلوقتي، وتخطّط الـ ٩ القادمين كـ Grid متّسق.",
      prompt:
        "في تسليمك:\n\nالجزء ١ — Audit الـ ٩ الحاليين:\n١) فيهم Visual Pattern مشترك (لون/Font/Style)؟ صف في سطر.\n٢) أنهي بوست شاذ بصريًا؟ (الـ Outlier)\n٣) لو شخص دخل Profile دلوقتي، هيقدر يحدّد بتعمل إيه في ٣ ثواني؟\n\nالجزء ٢ — خطة الـ ٩ القادمين:\n٤) القاعدة البصرية الواحدة اللي هتمشي عليها (مثال: نفس الـ Overlay، نفس الـ Font).\n٥) صف الـ ٩ القادمين (موضوع كل بوست + بنفس الـ Pattern):\n   - بوست ١-٩ (عناوين):\n٦) لو فكرة جت برّا الـ Pattern البصري — هتعمل بيها إيه؟",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "Audit حقيقي للحالي",
          weight: 50,
          criteria: [
            "حدّدت Visual Pattern (أو غيابه) بدليل، مش وصف عام.",
            "حدّدت Outlier بالاسم، أو قلت «مفيش outlier» بسبب.",
          ],
        },
        {
          label: "خطة الـ ٩ القادمين",
          weight: 50,
          criteria: [
            "القاعدة البصرية محدّدة (مش «هخلّيهم متشابهين»).",
            "الـ ٩ بوستات بعناوين، مش «أفكار حسب الوقت».",
          ],
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جزء من المنصة",
    title: "Grid system واحد في كل صفحات المنصة",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "Grid system واحد في كل صفحات المنصة",
      summary:
        "الجزء ده من المنصة اتبنى بمسار Creator — نفس اللي بتتعلمه. /dashboard، /curriculum، /dashboard — كلهم بيستخدموا نفس الـ container max-width و نفس الـ gutter. لما تتنقل بين الصفحات، ميحصلش shift في الـ layout — لأن الـ grid ثابت.",
      bullets: [
        "Container max-width: 1280px ثابت.",
        "Gutter: 24px على desktop، 16px على mobile.",
        "Cards بنفس aspect ratio لكل الـ grids.",
      ],
      pathAngle: "creator",
      link: { label: "افتح /dashboard", href: "/dashboard" },
    },
  }
];
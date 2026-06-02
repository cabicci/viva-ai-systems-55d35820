import {
  Sparkles,
  PlayCircle,
  Lightbulb,
  Image as ImageIcon,
  Scale,
  Rocket,
  BookOpen, FlaskConical } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";
import deployScreenshot from "@/assets/lessons/builder-m10-deploy-domain.jpg";

/**
 * Builder · M10 · Lesson 01 — Deploy & Domain
 * Format: Hero → Video → Concept → Platform Screenshot → Failure×Right → Mission
 *
 * يبني على M5-M9 — التطبيق جاهز، دلوقتي بنخرّجه للناس.
 */
export const BUILDER_M10_DEPLOY_DOMAIN_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "HERO",
    title: "تطبيق على localhost = تطبيق مش موجود",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "بنيت Frontend (M5.1)، Backend (M5.2)، Database (M8)، Auth (M7)، RAG (M9). كله شغّال على localhost:5173.",
        "بس مفيش حد غيرك يقدر يفتحه. عشان تطبيقك يبقى \"موجود\" — لازم يكون عنده URL ثابت، server شغّال 24/7، وdomain إنت بتمتلكه.",
        "Deploy = تخليه live. Domain = اسم الناس بتفتكره بيه. الاتنين رخاص، بسيطين، ومش هتعدّي عليهم بدونهم.",
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
        { term: "Deploy", meaning: "عملية نقل كودك من جهازك للسيرفر عشان الناس تشوفه.", example: "زي ما التاجر بيبعت بضاعته من المخزن للمحل عشان الزبائن تشتري، إنت بتبعث كودك للسيرفر." },
        { term: "Domain Name", meaning: "عنوان موقعك اللي الناس بتكتبه في المتصفح (example.com).", example: "زي ما يكون عندك محل اسمه 'صيدلية الأمانة'، ده الاسم اللي الناس بتبحث بيه عنك." },
        { term: "DNS Records (A & CNAME)", meaning: "إعدادات بتربط اسم الدومين بعنوان السيرفر الحقيقي عشان الموقع يفتح.", example: "عشان تربط اسم محلك بالعنوان، الـ A Record هو العنوان والـ CNAME هو الاسم البديل." },
        { term: "SSL Certificate (HTTPS)", meaning: "شهادة أمان بتخلي موقعك مشفر ومحمي وبتبدأ بـ https.", example: "زي القفل اللي على باب المحل بيطمن الزبائن إن فلوسهم وبياناتهم في أمان." },
        { term: "Bundle & Tree-shaking", meaning: "تنظيف وتصغير حجم ملفات موقعك عشان يفتح بسرعة للناس.", example: "زي برنامج الحسابات اللي بيشيل الكراكيب والعمليات اللي ملهاش لازمة عشان يبقى خفيف وسريع." },
        { term: "Environment Variables", meaning: "خزنة بتشيل فيها بياناتك السرية (زي كلمة سر الداتا بيز).", example: "زي الرقم السري لدرج الكاشير، بتحطه في إعدادات Vercel بعيد عن عين أي حد." },
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
      caption: "ازاي Lovable/Vercel بيـ deploy في ثواني، وإزاي تربط domain، و SSL، و env vars في production.",
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "Deployment = Build + Host + DNS + SSL",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "1) Build: الكود اللي بتكتبه (TypeScript, JSX, CSS) مش الـ browser بيفهمه مباشرة. الـ build process بيحوّله لـ HTML/JS/CSS مضغوط (bundles)، يحذف اللي مش مستخدم (tree-shaking)، ويشغّل tests. النتيجة: مجلّد dist/ صغير وسريع.",
        "2) Host: الـ bundle محتاج server يقدّمه للعالم. زمان كان معناها server فيزيائي. دلوقتي Lovable و Vercel و Cloudflare بيوفّروا hosting على edge network: نسخة من تطبيقك في ١٠٠+ مدينة، المستخدم بياخد أقرب نسخة. Deploy = git push → build → publish في < ٦٠ ثانية.",
        "3) DNS + Domain: domain (yourapp.com) = اسم. الـ DNS = دفتر تليفون بيحوّل الاسم لـ IP. بتشتري الدومين من Namecheap/Cloudflare ($10/سنة)، تضيف CNAME أو A record بيشاور على الـ host. الـ propagation ياخد ٥ دقايق - ٢٤ ساعة.",
        "4) SSL (HTTPS): الـ browsers الحديثة بترفض أي حاجة بدون HTTPS. كل host محترم بيوفّر SSL تلقائي عبر Let's Encrypt — مش هتعمل حاجة، هي بتتفعّل لما الدومين يربط. لو لقيت تطبيقك http:// بدل https:// = إنت في مشكلة.",
        "5) Environments: عندك ٣ بيئات على الأقل: local (الكود اللي بتكتبه)، preview (كل branch بياخد URL مؤقت تختبر فيه قبل merge)، production (الـ live اللي المستخدمين بيشوفوه). كل بيئة لها env vars مختلفة — مش تستخدم production keys في local.",
      ],
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوف بنفسك",
    title: "\"سجل البناء\" = تاريخ كل deploy",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: deployScreenshot,
      alt: "صفحة /build-logs — هيدر BUILD LOGS RUNTIME وعنوان سجل البناء، تحتها كرت 'رحلة البناء لم تبدأ بعد' وزرار ابدأ من المنهج",
      caption:
        "الصفحة دي بتعرض فلسفة الـ deployment الحديث: كل deploy = entry في build log. Lovable بنفسه بيـ deploy تطبيقك في ثواني — كل تعديل بتعمله بيـ build و publish تلقائيًا على preview URL (https://id-preview--{id}.lovable.app). لما تضغط Publish، نسخة جديدة بتروح للـ production URL (https://{name}.lovable.app). تقدر تربط custom domain من الإعدادات. الفايدة من الـ build log: لو deploy وقع، تشوف بالظبط في أي خطوة (typescript error؟ missing env var؟ build timeout؟). من غير الـ log، الـ deployment يبقى صندوق أسود.",
      label: "من الموقع — صفحة /build-logs",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "\"شغّال عندي\" vs Deployment Pipeline حقيقي",
    block: {
      kind: "comparison",
      left: {
        label: "FAILURE — تـ deploy يدوي وتغيّر env في production مباشرة",
        body: "بتعدّل في الكود في production server بإيدك. بتحط الـ Stripe production key في .env على local وتـ commit بالغلط على GitHub. مفيش preview environment — أي تعديل بيظهر للمستخدمين فورًا. لو deploy فشل، مفيش rollback. النتيجة: leaked secrets، downtime متوقّع، خوف من أي تعديل = تطبيق متجمّد.",
      },
      right: {
        label: "RIGHT — Git-based deploys + previews + secrets مفصولة",
        body: "git push → CI builds → preview URL تلقائي لكل branch → tests تشتغل → merge to main → production deploy تلقائي. Secrets في dashboard الـ host (مش في git). كل deploy ليه commit hash و rollback button. لو شي بقى وحش بعد ٥ دقايق، rollback في كليك. النتيجة: تقدر تـ ship يوميًا بدون خوف.",
      },
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "اعمل Deploy حقيقي — وافحص الـ ٧ نقاط",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "builder-m10-deploy-domain-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "إنت خلاص خلصت تطبيقك العظمة، Frontend و Backend وكل حاجة شغالة زي الفل على جهازك (localhost). دلوقتي عايز تخليه متاح للناس كلها تشوفه. إيه أول خطوة منطقية لازم تعملها عشان تطبيقك يطلع للنور؟",
          options: [
            "أرفع الكود بتاعي على Lovable أو Vercel عشان أعمل Deploy.",
            "أشتري دومين جديد زي yourapp.com وأربطه بالتطبيق فورًا.",
            "أبعت اللينك بتاع localhost:5173 لأصحابي يشوفوه."
          ],
          correctIndex: 0,
          explanation: "أول خطوة هي Deploy عشان تطبيقك يبقى في مكان public الناس تقدر توصله، وبعدين تشوف حتة الدومين."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "بعد ما عملت deploy لتطبيقك، فتحت الـ URL بتاع الـ Hosting (مثلاً lovableapp.lovable.ai)، لقيت إن الـ URL بيبدأ بـ http:// مش https://، وإنه عمال يطلّع تحذيرات أمان في المتصفح. إيه أول حاجة المفروض تعملها عشان تحل المشكلة دي وتبتدي تربط الدومين بتاعك؟",
          options: [
            "أشتري شهادة SSL مدفوعة وأثبتها يدوي على السيرفر.",
            "أول خطوة هي تربيط الدومين بتاعي (yourdomain.com) بالـ Host، ساعتها الـ HTTPS بيتفعّل تلقائياً في أغلب خدمات الـ Hosting.",
            "أعدّل الكود بتاعي عشان يجبر المتصفح يستخدم HTTPS حتى لو مش متوفر."
          ],
          correctIndex: 1,
          explanation: "معظم خدمات الـ Hosting المحترمة بتوفر SSL (HTTPS) تلقائيًا عبر Let's Encrypt أول ما تربط الدومين بتاعك، مفيش داعي لشراء أو تثبيت يدوي."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "رفعت تطبيقك على Vercel، وربطت الدومين بتاعك، وكل حاجة تمام. دلوقتي عايز تبعت اللينك لمديرك يشوف الشغل. قبل ما تبعتله، إيه أهم حاجة لازم تتأكد منها الأول من ضمن الـ production checklist، تحديداً لو تطبيقك بيستخدم أكواد API لتطبيقات تانية زي Supabase أو OpenAI؟",
          options: [
            "أتأكد إن الـ analytics شغّالة وبتسجّل الزيارات.",
            "أتأكد إن كل الـ environment variables في الـ production مظبوطة (مثلًا Supabase URL/keys، AI API key) وإن مفيش keys مكشوفة في الـ frontend bundle.",
            "أتأكد إن صفحة الـ 404 موجودة وشكلها حلو."
          ],
          correctIndex: 1,
          explanation: "أهم حاجة هي تتأكد إن الـ environment variables صحيحة ومفيش keys حساسة مكشوفة، عشان التطبيق يشتغل صح وميبقاش فيه ثغرات أمنية."
        }
      ]
    },
  },
  {
    icon: Rocket,
    eyebrow: "Mission",
    title: "اعمل Deployment Checklist قبل النشر",
    tone: "primary",
    block: {
      kind: "mission",
      intro:
        "النشر = اللحظة اللي البرنامج بيقابل العالم. هتكتب checklist من ٨ بنود لازم تعدّي عليهم.",
      prompt:
        "في تسليمك checklist من ٨ بنود مرتبة بأولوية:\n\n١) Domain + DNS — ايه إعدادك؟\n٢) HTTPS — متفعّل؟ Certificate من فين؟\n٣) Environment variables — كلها متضافة في الـ production env؟\n٤) Database backups — مفعّلين؟ كل قد إيه؟\n٥) Error monitoring — أنهي tool؟ (Sentry / Logflare...)\n٦) Performance baseline — قست إيه قبل النشر؟\n٧) Rollback plan — لو حصل مشكلة، هترجع إزاي؟\n٨) ايه آخر بند قبل ما تضغط Deploy؟",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "٨ بنود محددة",
          weight: 60,
          criteria: [
            "كل بند فيه action حقيقي مش «هتأكد».",
            "Environment + Backups + Monitoring كلهم موجودين.",
          ],
        },
        {
          label: "Rollback + Final check",
          weight: 40,
          criteria: [
            "Rollback plan فيه خطوات محددة.",
            "البند الأخير حقيقي مش «هصلي».",
          ],
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جزء من المنصة",
    title: "المنصة دي شغّالة على lovable.app — مش localhost",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "المنصة دي شغّالة على lovable.app — مش localhost",
      summary:
        "الجزء ده من المنصة اتبنى بمسار Builder — نفس اللي بتتعلمه. نفس الـ flow اللي اتعلّمته: build → deploy → custom domain. المنصة دي اتنشرت من زرار Publish، والـ URL ai-ecosystem-hub-72.lovable.app متاح لأي حد في العالم.",
      bullets: [
        "Production URL: ai-ecosystem-hub-72.lovable.app — stable و SSL.",
        "Preview URL منفصل للتجريب قبل النشر.",
        "كل push بيشغّل build جديد automatically.",
      ],
      pathAngle: "builder",
      link: { label: "افتح الصفحة الرئيسية", href: "/" },
    },
  }
];

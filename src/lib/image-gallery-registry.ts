import img1 from "@/assets/lessons/intro-m1-l3-setup-your-ai.jpg";
import img2 from "@/assets/lessons/intro-m1-l1-what-is-ai-assistant.jpg";
import img3 from "@/assets/lessons/intro-m1-l5-ai-vs-software.jpg";
import img4 from "@/assets/lessons/intro-m1-l4-ai-can-cannot.jpg";
import img5 from "@/assets/lessons/intro-m1-l6-learn-without-fear.jpg";
import img6 from "@/assets/lessons/intro-m1-l2-first-prompt.jpg";
import img7 from "@/assets/lessons/intro-m1-l7-choose-your-path.jpg";

import img8 from "@/assets/lessons/builder-m1-ai-predicts.jpg";
import img9 from "@/assets/lessons/builder-m1-l1-what-is-llm.jpg";
import img10 from "@/assets/lessons/builder-m1-tokens.jpg";

import img11 from "@/assets/lessons/builder-m1-prompt-clarity.jpg";
import img12 from "@/assets/lessons/builder-m2-l2-instructions-examples.jpg";
import img13 from "@/assets/lessons/builder-m2-l3-style-control.jpg";

import img14 from "@/assets/lessons/builder-m3-l1-context-layer.jpg";
import img15 from "@/assets/lessons/builder-m3-l2-memory-limits.jpg";

import img16 from "@/assets/lessons/builder-m4-l1-parameters.jpg";
import img17 from "@/assets/lessons/builder-m4-l1-parameters.jpg";

import img18 from "@/assets/lessons/builder-m5-l2-frontend.jpg";
import img19 from "@/assets/lessons/builder-m5-l3-backend-api.jpg";
import img20 from "@/assets/lessons/builder-m5-l4-database-intro.jpg";
import imgM5Transition from "@/assets/lessons/unique/builder-m5-l1-transition.jpg";

import img21 from "@/assets/lessons/builder-m6-l1-idea-to-page.jpg";
import img22 from "@/assets/lessons/builder-m6-l4-components-routes.jpg";
import img23 from "@/assets/lessons/unique/builder-m6-l2-wireframe.jpg";
import img24 from "@/assets/lessons/unique/builder-m6-first-prompt.jpg";
import img25 from "@/assets/lessons/unique/builder-m6-l5-iteration.jpg";
import img26 from "@/assets/lessons/unique/builder-m6-l6-debugging.jpg";

import img27 from "@/assets/lessons/concepts/jwt-diagram.jpg";
import img28 from "@/assets/lessons/concepts/rls-diagram.jpg";

import img29 from "@/assets/lessons/builder-m7-l1-tables-columns.jpg";
import img30 from "@/assets/lessons/concepts/relations-diagram.jpg";
import img31 from "@/assets/lessons/builder-m7-l3-queries.jpg";

import img32 from "@/assets/lessons/concepts/embeddings-diagram.jpg";
import img33 from "@/assets/lessons/concepts/rag-diagram.jpg";
import img34 from "@/assets/lessons/concepts/agents-diagram.jpg";

import img35 from "@/assets/lessons/builder-m10-deploy-domain.jpg";
import img36 from "@/assets/lessons/builder-m10-first-users.jpg";

// Creator Path
import cr1 from "@/assets/lessons/creator-m1-l1-why-content.jpg";
import cr2 from "@/assets/lessons/creator-m1-l2-attention-economy.jpg";
import cr3 from "@/assets/lessons/creator-m3-l1-hook.jpg";
import cr4 from "@/assets/lessons/creator-m3-l2-script-structure.jpg";
import cr5 from "@/assets/lessons/creator-m3-l3-cta.jpg";
import cr6 from "@/assets/lessons/creator-m4-l1-reality-check.jpg";
import cr7 from "@/assets/lessons/creator-m4-l2-mobile-shooting.jpg";
import cr8 from "@/assets/lessons/creator-m4-l3-ai-writing.jpg";
import cr9 from "@/assets/lessons/unique/creator-m5-l1-editing.jpg";
import cr10 from "@/assets/lessons/unique/creator-m5-l2-thumbnails-captions.jpg";
import cr11 from "@/assets/lessons/unique/creator-m7-l1-brand-basics.jpg";
import cr12 from "@/assets/lessons/unique/creator-m7-l2-grid-consistency.jpg";

// Creator SVG diagrams (M3 & M5) — kept as SVGs to preserve their conceptual look
import cr13 from "@/assets/lessons/diagrams/creator-m3-audience-persona.svg";
import cr14 from "@/assets/lessons/diagrams/creator-m2-l2-content-pillars.svg";
import cr15 from "@/assets/lessons/diagrams/creator-m6-l1-platforms-grid.svg";
import cr16 from "@/assets/lessons/diagrams/creator-m6-l2-scheduling-calendar.svg";
import cr17 from "@/assets/lessons/diagrams/creator-m6-l3-analytics-triangle.svg";
import cr18 from "@/assets/lessons/diagrams/creator-m6-l4-leads-funnel.svg";

// Automator Path
import au1 from "@/assets/lessons/unique/automator-m0-l1-where-you-are.jpg";
import au2 from "@/assets/lessons/unique/automator-m1-l3-decide-what-to-automate.jpg";
import au3 from "@/assets/lessons/unique/automator-m1-l2-spot-patterns.jpg";
import au4 from "@/assets/lessons/unique/automator-m1-l1-systems-view.jpg";
import au5 from "@/assets/lessons/unique/automator-m2-l1-tools-landscape.jpg";
import au6 from "@/assets/lessons/unique/automator-m2-l2-triggers-actions.jpg";
import au7 from "@/assets/lessons/unique/automator-m2-l3-filters-routers.jpg";
import au8 from "@/assets/lessons/unique/automator-m3-l2-webhooks-api.jpg";
import au9 from "@/assets/lessons/unique/automator-m3-l1-connect-database.jpg";
import au10 from "@/assets/lessons/unique/automator-m3-l3-error-handling.jpg";
import au11 from "@/assets/lessons/unique/automator-m4-l1-llm-in-flow.jpg";
import au12 from "@/assets/lessons/unique/automator-m4-l2-rag-in-n8n.jpg";
import au13 from "@/assets/lessons/unique/automator-m4-l3-agents.jpg";
import au14 from "@/assets/lessons/unique/automator-m5-l1-lead-capture.jpg";
import au15 from "@/assets/lessons/unique/automator-m5-l2-whatsapp-flow.jpg";
import au16 from "@/assets/lessons/unique/automator-m5-l3-follow-up.jpg";
import au17 from "@/assets/lessons/unique/automator-m6-l1-closing-loop.jpg";

import type { LessonDiagramId } from "@/components/intro/diagrams/LessonDiagrams";

export type GalleryItem = {
  number: number;
  slug: string;
  lessonSlug?: string;
  title: string;
  group: string;
  image?: string;
  diagramId?: LessonDiagramId;
};

export type GalleryPath = "intro" | "business" | "creator" | "analyst" | "automator" | "builder";

export const GALLERY_PATHS: { id: GalleryPath; label: string; description: string }[] = [
  { id: "intro", label: "الإنترو", description: "دروس تأسيسية للبداية مع الـ AI." },
  { id: "business", label: "البيزنس", description: "دروس الـ AI للبيزنس — قيادة، عملاء، تفويض، توسع." },
  { id: "creator", label: "الكرييتور", description: "دروس صناعة المحتوى — Hook, Script, CTA, تصوير ومونتاج، Brand." },
  { id: "analyst", label: "الأناليست", description: "دروس تحليل البيانات بالـ AI." },
  { id: "automator", label: "الأوتوميتور", description: "دروس الأتمتة — n8n, Triggers/Actions, Webhooks, LLM في الـ Flow، Agents، Lead Capture و WhatsApp." },
  { id: "builder", label: "البليدر", description: "دروس بناء أول تطبيق بـ Lovable." },
];

export function getGalleryPath(item: GalleryItem): GalleryPath {
  if (item.group === "Intro") return "intro";
  if (item.group.startsWith("Builder")) return "builder";
  if (item.group.startsWith("Creator")) return "creator";
  if (item.group.startsWith("Automator")) return "automator";
  if (item.group.startsWith("Analyst")) return "analyst";
  return "business";
}

export function getGalleryItemsByPath(path: GalleryPath): GalleryItem[] {
  return IMAGE_GALLERY.filter((i) => getGalleryPath(i) === path);
}

export const IMAGE_GALLERY: GalleryItem[] = [
  { number: 1, slug: "intro-m1-l3-setup-your-ai", title: "تهيئة الذكاء الاصطناعي", group: "Intro", image: img1 },
  { number: 2, slug: "intro-m1-l1-what-is-ai", title: "ما هو الذكاء الاصطناعي؟", group: "Intro", image: img2 },
  { number: 3, slug: "intro-m1-l5-ai-vs-software", title: "AI vs Software", group: "Intro", image: img3 },
  { number: 4, slug: "intro-m1-l4-ai-can-cannot", title: "ما يقدر وما لا يقدر", group: "Intro", image: img4 },
  { number: 5, slug: "intro-m1-l6-learn-without-fear", title: "اتعلّم بدون خوف", group: "Intro", image: img5 },
  { number: 6, slug: "intro-m1-l2-first-prompt", title: "أول برومبت", group: "Intro", image: img6 },
  { number: 7, slug: "intro-m1-l7-choose-your-path", title: "اختر مسارك", group: "Intro", image: img7 },

  { number: 8, slug: "builder-m1-l1-what-is-llm", title: "ما هو الـ LLM", group: "Builder M1", image: img9 },
  { number: 9, slug: "builder-m1-l2-tokens-training", title: "Tokens و Training", group: "Builder M1", image: img10 },

  { number: 10, slug: "builder-m2-l1-prompt-layer", title: "طبقة البرومبت", group: "Builder M2", image: img11 },
  { number: 11, slug: "builder-m2-l2-instructions-examples", title: "Instructions و Examples", group: "Builder M2", image: img12 },
  { number: 12, slug: "builder-m2-l3-style-control", title: "التحكم في الـ Style", group: "Builder M2", image: img13 },

  { number: 13, slug: "builder-m3-l1-context-layer", title: "طبقة الـ Context", group: "Builder M3", image: img14 },
  { number: 14, slug: "builder-m3-l2-memory-limits", title: "حدود الذاكرة", group: "Builder M3", image: img15 },

  { number: 15, slug: "builder-m4-l1-parameters", title: "Temperature", group: "Builder M4", image: img16 },
  { number: 16, slug: "builder-m4-l1-parameters", title: "Parameters", group: "Builder M4", image: img17 },

  { number: 17, slug: "builder-m5-l2-frontend", title: "Frontend", group: "Builder M5", image: img18 },
  { number: 18, slug: "builder-m5-l3-backend-api", title: "Backend و API", group: "Builder M5", image: img19 },
  { number: 19, slug: "builder-m5-l4-database-intro", title: "مقدمة Database", group: "Builder M5", image: img20 },
  { number: 71, slug: "builder-m5-l1-transition", title: "Transition من Prompting للـ App", group: "Builder M5", image: imgM5Transition },

  { number: 20, slug: "builder-m6-l1-idea-to-page", title: "من فكرة لصفحة", group: "Builder M6", image: img21 },
  { number: 21, slug: "builder-m6-l2-wireframe", title: "Wireframe", group: "Builder M6", image: img23 },
  { number: 22, slug: "builder-m6-l4-components-routes", title: "Components و Routes", group: "Builder M6", image: img22 },
  { number: 23, slug: "builder-m6-l3-first-prompt-to-lovable", title: "أول برومبت لـ Lovable", group: "Builder M6", image: img24 },
  { number: 24, slug: "builder-m6-l5-iteration", title: "Iteration", group: "Builder M6", image: img25 },
  { number: 25, slug: "builder-m6-l6-debugging", title: "Debugging", group: "Builder M6", image: img26 },

  { number: 26, slug: "builder-m8-l1-sessions-jwt", title: "Sessions و JWT", group: "Builder M7", image: img27 },
  { number: 27, slug: "builder-m8-l2-rls", title: "RLS", group: "Builder M7", image: img28 },

  { number: 28, slug: "builder-m7-l1-tables-columns", title: "Tables و Columns", group: "Builder M8", image: img29 },
  { number: 29, slug: "builder-m7-l2-relations", title: "Relations", group: "Builder M8", image: img30 },
  { number: 30, slug: "builder-m7-l3-queries", title: "Queries", group: "Builder M8", image: img31 },

  { number: 31, slug: "builder-m9-l2-embeddings", title: "Embeddings", group: "Builder M9", image: img32 },
  { number: 32, slug: "builder-m9-l1-rag", title: "RAG", group: "Builder M9", image: img33 },
  { number: 33, slug: "builder-m9-l3-agents", title: "Agents", group: "Builder M9", image: img34 },

  { number: 34, slug: "builder-m10-deploy-domain", title: "Deploy و Domain", group: "Builder M10", image: img35 },
  { number: 35, slug: "builder-m10-first-users", title: "أول مستخدمين", group: "Builder M10", image: img36 },

  // Creator Path
  { number: 36, slug: "creator-m1-l1-why-content", title: "المحتوى مش Posting", group: "Creator M1", image: cr1 },
  { number: 37, slug: "creator-m1-l2-attention-economy", title: "اقتصاد الانتباه", group: "Creator M1", image: cr2 },
  { number: 38, slug: "creator-m3-l1-hook", title: "أول 3 ثواني", group: "Creator M2", image: cr3 },
  { number: 39, slug: "creator-m3-l2-script-structure", title: "بنية السكريبت", group: "Creator M2", image: cr4 },
  { number: 40, slug: "creator-m3-l3-cta", title: "CTA واحد قوي", group: "Creator M2", image: cr5 },
  { number: 41, slug: "creator-m4-l1-reality-check", title: "Reality Check", group: "Creator M4", image: cr6 },
  { number: 42, slug: "creator-m4-l2-mobile-shooting", title: "التصوير بالموبايل", group: "Creator M4", image: cr7 },
  { number: 43, slug: "creator-m4-l3-ai-writing", title: "AI كمساعد كتابة", group: "Creator M4", image: cr8 },
  { number: 44, slug: "creator-m5-l1-editing", title: "المونتاج", group: "Creator M4", image: cr9 },
  { number: 45, slug: "creator-m5-l2-thumbnails-captions", title: "Thumbnails و Captions", group: "Creator M4", image: cr10 },
  { number: 46, slug: "creator-m7-l1-brand-basics", title: "Brand Basics", group: "Creator M6", image: cr11 },
  { number: 47, slug: "creator-m7-l2-grid-consistency", title: "Grid Consistency", group: "Creator M6", image: cr12 },

  { number: 48, slug: "creator-m3-audience-persona", lessonSlug: "creator-m2-l1-know-audience", title: "Audience Persona", group: "Creator M3", image: cr13 },
  { number: 49, slug: "creator-m2-l2-content-pillars", lessonSlug: "creator-m2-l2-content-pillars", title: "Content Pillars", group: "Creator M3", image: cr14 },
  { number: 50, slug: "creator-m6-l1-platforms-grid", lessonSlug: "creator-m6-l1-platforms", title: "٤ فورمات — ٤ منصات", group: "Creator M5", image: cr15 },
  { number: 51, slug: "creator-m6-l2-scheduling-calendar", lessonSlug: "creator-m6-l2-scheduling", title: "Scheduling — أسبوع مستدام", group: "Creator M5", image: cr16 },
  { number: 52, slug: "creator-m6-l3-analytics-triangle", lessonSlug: "creator-m6-l3-analytics", title: "Analytics Triangle", group: "Creator M5", image: cr17 },
  { number: 53, slug: "creator-m6-l4-leads-funnel", lessonSlug: "creator-m6-l4-leads", title: "Leads Funnel", group: "Creator M5", image: cr18 },

  // Automator Path
  { number: 54, slug: "automator-m0-l1-where-you-are", title: "أنت فين في الخريطة؟", group: "Automator M0", image: au1 },
  { number: 55, slug: "automator-m1-l3-decide-what-to-automate", title: "تأتمت إيه بالظبط؟", group: "Automator M1", image: au2 },
  { number: 56, slug: "automator-m1-l2-spot-patterns", title: "اكتشاف الأنماط", group: "Automator M1", image: au3 },
  { number: 57, slug: "automator-m1-l1-systems-view", title: "كل شغل = System", group: "Automator M1", image: au4 },
  { number: 58, slug: "automator-m2-l1-tools-landscape", title: "Tools Landscape", group: "Automator M2", image: au5 },
  { number: 59, slug: "automator-m2-l2-triggers-actions", title: "Triggers و Actions", group: "Automator M2", image: au6 },
  { number: 60, slug: "automator-m2-l3-filters-routers", title: "Filters و Routers", group: "Automator M2", image: au7 },
  { number: 61, slug: "automator-m3-l2-webhooks-api", title: "Webhooks و API", group: "Automator M3", image: au8 },
  { number: 62, slug: "automator-m3-l1-connect-database", title: "اربط بـ Database", group: "Automator M3", image: au9 },
  { number: 63, slug: "automator-m3-l3-error-handling", title: "Error Handling", group: "Automator M3", image: au10 },
  { number: 64, slug: "automator-m4-l1-llm-in-flow", title: "LLM في الـ Flow", group: "Automator M4", image: au11 },
  { number: 65, slug: "automator-m4-l2-rag-in-n8n", title: "RAG في n8n", group: "Automator M4", image: au12 },
  { number: 66, slug: "automator-m4-l3-agents", title: "Agents", group: "Automator M4", image: au13 },
  { number: 67, slug: "automator-m5-l1-lead-capture", title: "استقبال Leads", group: "Automator M5", image: au14 },
  { number: 68, slug: "automator-m5-l2-whatsapp-flow", title: "WhatsApp Flow", group: "Automator M5", image: au15 },
  { number: 69, slug: "automator-m5-l3-follow-up", title: "متابعة تلقائية + CRM", group: "Automator M5", image: au16 },
  { number: 70, slug: "automator-m6-l1-closing-loop", title: "إغلاق الـ Loop", group: "Automator M6", image: au17 },

  // Analyst Path (inline SVG diagrams)
  { number: 72, slug: "analyst-m0-l1-from-automation-to-insight", lessonSlug: "analyst-m0-l1-from-automation-to-insight", title: "بياناتك جاهزة — دلوقتي بتسأل", group: "Analyst M0", diagramId: "decision-loop" },
  { number: 73, slug: "analyst-m1-l1-feeling-to-question", lessonSlug: "analyst-m1-l1-feeling-to-question", title: "حوّل الشعور لسؤال", group: "Analyst M1", diagramId: "feeling-to-question-table" },
  { number: 74, slug: "analyst-m1-l2-right-question-rule", lessonSlug: "analyst-m1-l2-right-question-rule", title: "السؤال الصح أهم من الإجابة", group: "Analyst M1", diagramId: "question-scorecard" },
  { number: 75, slug: "analyst-m2-l1-three-sources", lessonSlug: "analyst-m2-l1-three-sources", title: "المصادر الثلاثة", group: "Analyst M2", diagramId: "three-sources-merge" },
  { number: 76, slug: "analyst-m2-l2-ai-summarization", lessonSlug: "analyst-m2-l2-ai-summarization", title: "AI = أسرع محلّل عندك", group: "Analyst M2", diagramId: "ai-summarization-flow" },
  { number: 77, slug: "analyst-m3-l1-pattern-vs-outlier", lessonSlug: "analyst-m3-l1-pattern-vs-outlier", title: "Pattern أم Outlier؟", group: "Analyst M3", diagramId: "pattern-vs-outlier" },
  { number: 78, slug: "analyst-m3-l2-decision-rule", lessonSlug: "analyst-m3-l2-decision-rule", title: "كل تفسير ينتهي بقرار", group: "Analyst M3", diagramId: "decision-chain" },
  { number: 79, slug: "analyst-m4-l1-four-numbers-dashboard", lessonSlug: "analyst-m4-l1-four-numbers-dashboard", title: "٤ أرقام بس", group: "Analyst M4", diagramId: "four-kpi-dashboard" },
  { number: 80, slug: "analyst-m4-l2-weekly-review-ritual", lessonSlug: "analyst-m4-l2-weekly-review-ritual", title: "Review أسبوعي = ١٥ دقيقة", group: "Analyst M4", diagramId: "weekly-review-timeline" },
  { number: 81, slug: "analyst-m5-l1-question-mistakes", lessonSlug: "analyst-m5-l1-question-mistakes", title: "أخطاء الأسئلة", group: "Analyst M5", diagramId: "question-rewrite" },
  { number: 82, slug: "analyst-m5-l2-interpretation-mistakes", lessonSlug: "analyst-m5-l2-interpretation-mistakes", title: "أخطاء التفسير", group: "Analyst M5", diagramId: "correlation-causation" },
  { number: 83, slug: "analyst-m6-l1-from-decisions-to-business", lessonSlug: "analyst-m6-l1-from-decisions-to-business", title: "قراراتك جاهزة → Business", group: "Analyst M6", diagramId: "decision-backlog" },

  // Business Path (inline SVG diagrams)
  { number: 84, slug: "business-m0-l1-from-decisions-to-leadership", lessonSlug: "business-m0-l1-from-decisions-to-leadership", title: "من Operator لـ Leader", group: "Business M0", diagramId: "operator-vs-leader" },
  { number: 85, slug: "business-m1-l1-reactive-vs-proactive", lessonSlug: "business-m1-l1-reactive-vs-proactive", title: "Reactive vs Proactive", group: "Business M1", diagramId: "reactive-vs-proactive-day" },
  { number: 86, slug: "business-m1-l2-weekly-rhythm", lessonSlug: "business-m1-l2-weekly-rhythm", title: "أسبوعك = ٤ مسارات", group: "Business M1", diagramId: "weekly-theme-days" },
  { number: 87, slug: "business-m2-l1-customer-lifecycle", lessonSlug: "business-m2-l1-customer-lifecycle", title: "دورة حياة العميل", group: "Business M2", diagramId: "customer-lifecycle-funnel" },
  { number: 88, slug: "business-m2-l2-retention-flow", lessonSlug: "business-m2-l2-retention-flow", title: "Follow-up Flow", group: "Business M2", diagramId: "followup-cadence" },
  { number: 89, slug: "business-m3-l1-strategic-operational-admin", lessonSlug: "business-m3-l1-strategic-operational-admin", title: "٣ أنواع شغل", group: "Business M3", diagramId: "soa-bars" },
  { number: 90, slug: "business-m3-l2-delegate-or-automate", lessonSlug: "business-m3-l2-delegate-or-automate", title: "Delegate ولا Automate؟", group: "Business M3", diagramId: "delegate-automate-matrix" },
  { number: 91, slug: "business-m4-l1-readiness-signals", lessonSlug: "business-m4-l1-readiness-signals", title: "علامات الجاهزية للتوسع", group: "Business M4", diagramId: "readiness-signals" },
  { number: 92, slug: "business-m4-l2-system-then-people", lessonSlug: "business-m4-l2-system-then-people", title: "System الأول — الناس بعدين", group: "Business M4", diagramId: "system-then-people" },
  { number: 93, slug: "business-m5-l1-reactive-relapse", lessonSlug: "business-m5-l1-reactive-relapse", title: "الرجوع لـ Reactive Mode", group: "Business M5", diagramId: "reactive-relapse-cycle" },
  { number: 94, slug: "business-m5-l2-premature-scaling", lessonSlug: "business-m5-l2-premature-scaling", title: "توسع قبل الأوان", group: "Business M5", diagramId: "premature-scaling-cliff" },
  { number: 95, slug: "business-m6-l1-full-ecosystem", lessonSlug: "business-m6-l1-full-ecosystem", title: "الـ ٥ مسارات في يومك", group: "Business M6", diagramId: "ecosystem-loop" },
];
import type { LucideIcon } from "lucide-react";
import type { IntroSectionTone } from "./IntroSection";

/**
 * Block-based content schema for Introduction lessons.
 * Each lesson is a list of sections; the renderer picks the
 * right visual for each block kind. To add a new lesson, write
 * a content array — no extra UI code needed.
 */
export type IntroBlock =
  | { kind: "paragraphs"; paragraphs: readonly string[] }
  | {
      kind: "comparison";
      left: { label: string; body: string };
      right: { label: string; body: string };
    }
  | { kind: "quote"; quote: string }
  | { kind: "flow"; steps: readonly [string, string, string] }
  | {
      kind: "mission";
      intro: string;
      prompt: string;
      buttonLabel: string;
      copiedLabel: string;
      /**
       * Optional grading rubric. When present, the mission UI shows:
       *  - a collapsible "إزاي هاتقيّم نفسك؟" panel with the criteria
       *  - a submit form that sends the learner's work to AI evaluation
       *    (mission_submissions + Lovable AI gateway).
       */
      rubric?: readonly {
        label: string;          // e.g. "وضوح السؤال"
        weight: number;         // 0-100, totals should be 100
        criteria: readonly string[]; // bullet expectations
      }[];
      /** Stable mission id; defaults to `${lessonId}::mission` in the renderer. */
      missionId?: string;
      /** Optional lessonId override; usually injected by the parent renderer. */
      lessonId?: string;
      /**
       * Optional pre-filled scaffold/template the learner can drop into the
       * submission textarea (via "ابدأ من تيمبليت" button). When omitted, the
       * UI auto-generates one from `prompt` by detecting numbered sections.
       */
      template?: string;
    }
  | { kind: "checklist"; items: readonly string[] }
  | { kind: "numberedList"; items: readonly string[] }
  | { kind: "rule"; statement: string }
  /* ---- Future-ready block kinds (renderer skips when empty) ---- */
  | {
      kind: "video";
      url?: string;
      caption?: string;
      poster?: string;
    }
  | {
      /**
       * Canonical lesson video block — part of the unified lesson
       * rhythm (Hero → lessonVideo → paragraphs → comparison →
       * screenshot → mission). Always present, even as placeholder.
       */
      kind: "lessonVideo";
      url?: string;          // staticFile path or external URL; empty = placeholder
      poster?: string;       // image shown before play
      caption?: string;      // short description under the video
      durationLabel?: string; // e.g. "1:30"
    }
  | {
      kind: "executionTask";
      title?: string;
      steps?: readonly string[];
      expectedResult?: string;
    }
  | {
      kind: "toolBlock";
      name?: string;
      description?: string;
      url?: string;
    }
  | {
      kind: "warning";
      title?: string;
      body?: string;
    }
  | {
      /**
       * Platform screenshot block — slot #3 in the unified lesson rhythm.
       * Shows a real screenshot from inside the Lovable platform that
       * demonstrates the concept. Renders a placeholder when src is empty.
       */
      kind: "screenshot";
      src?: string;
      alt?: string;
      caption?: string;
      label?: string;
    }
  | {
      /**
       * Concepts / glossary block — terminology used in this lesson with
       * Arabic meaning. Placed early in every lesson so the learner never
       * meets an English term without a translation.
       */
      kind: "concepts";
      items: readonly { term: string; meaning: string; example?: string }[];
    }
  | {
      /**
       * Inline SVG/React diagram block — used for conceptual visuals where
       * Arabic text must render perfectly (AI-generated images garble Arabic).
       * `id` maps to a component in the diagram registry.
       */
      kind: "diagram";
      id:
        | "audience-persona"
        | "content-pillars"
        | "platforms-grid"
        | "scheduling-calendar"
        | "analytics-triangle"
        | "leads-funnel"
        | "pattern-vs-outlier"
        | "customer-lifecycle-funnel"
        | "feeling-to-question-table"
        | "decision-loop"
        | "question-scorecard"
        | "ai-summarization-flow"
        | "three-sources-merge"
        | "decision-chain"
        | "four-kpi-dashboard"
        | "weekly-review-timeline"
        | "correlation-causation"
        | "question-rewrite"
        | "decision-backlog"
        | "operator-vs-leader"
        | "reactive-vs-proactive-day"
        | "weekly-theme-days"
        | "followup-cadence"
        | "delegate-automate-matrix"
        | "soa-bars"
        | "readiness-signals"
        | "system-then-people"
        | "premature-scaling-cliff"
        | "reactive-relapse-cycle"
        | "ecosystem-loop";
      label?: string;
      caption?: string;
    }
  | {
      /**
       * Active-recall quiz block — slot after `concepts` in the unified
       * lesson rhythm. Three Bloom-level questions: Remember, Understand,
       * Apply. Renderer is interactive and stores attempts in
       * `lesson_quiz_attempts` (best-effort, ignores errors when offline).
       */
      kind: "quiz";
      lessonId: string;
      items: readonly {
        id: string;
        bloom: "remember" | "understand" | "apply";
        question: string;
        options: readonly string[];
        correctIndex: number;
        explanation: string;
      }[];
    }
  | {
      /**
       * Case Study block — تطبيق عملي على المنصة نفسها.
       * Placed as the LAST block in every Intro lesson, after the mission.
       * Visually distinct (accent border + FlaskConical icon) so it reads
       * as "proof: this is applied here", not as another concept block.
       */
      kind: "caseStudy";
      title: string;
      summary: string;
      bullets: readonly string[];
      pathAngle?: "business" | "creator" | "analyst" | "automator" | "builder";
      link?: { label: string; href: string };
    };

export type IntroLessonSection = {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  tone?: IntroSectionTone;
  block: IntroBlock;
};

export type IntroLessonContent = readonly IntroLessonSection[];
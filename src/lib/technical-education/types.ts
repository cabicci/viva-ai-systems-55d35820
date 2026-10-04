import type { SupportedLocale } from "../locale/types";

export type TechnicalDiagramKind =
  | "brief"
  | "survey"
  | "scope"
  | "workflow"
  | "brief-use"
  | "brief-constraints"
  | "brief-acceptance"
  | "survey-reference"
  | "survey-obstacles"
  | "survey-check"
  | "scope-construction"
  | "scope-customization"
  | "scope-responsibility"
  | "workflow-deliverables"
  | "workflow-approval"
  | "workflow-revisions"
  | "cabinet-brief"
  | "cabinet-width"
  | "cabinet-depth"
  | "cabinet-openings"
  | "cabinet-list"
  | "cabinet-review";

export type LocalizedText = Record<SupportedLocale, string>;
export type TechnicalLesson = {
  id: string;
  locale: SupportedLocale;
  title: string;
  intro: string;
  goals: string[];
  sections: {
    id: string;
    title: string;
    text: string;
    diagram: TechnicalDiagramKind;
    caption: string;
  }[];
  example: { title: string; text: string; decision: string };
  quiz: { id: string; question: string; options: string[]; correct: number; explanation: string }[];
  assignment: { prompt: string; fields: string[]; criteria: string[] };
  faq: { question: string; answer: string; sectionId: string }[];
};

import type { SupportedLocale } from "@/lib/locale/types";

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
    diagram: "brief" | "survey" | "scope" | "workflow";
    caption: string;
  }[];
  example: { title: string; text: string; decision: string };
  quiz: { id: string; question: string; options: string[]; correct: number; explanation: string }[];
  assignment: { prompt: string; fields: string[]; criteria: string[] };
  faq: { question: string; answer: string; sectionId: string }[];
};

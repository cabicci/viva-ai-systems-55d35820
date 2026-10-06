import type { ReadingVisualSpec } from "@/components/academic-education/ReadingVisual";
export type AcademicCourse = {
  id: string;
  title: string;
  reviewOnly?: boolean;
  released?: boolean;
  lessons: {
    id: string;
    title: string;
    moduleId: string;
    position: number;
    introductory: boolean;
  }[];
};
export type AcademicLesson = {
  id: string;
  locale: string;
  title: string;
  intro: string;
  goals: string[];
  sections: { id: string; title: string; text: string; reflection: string }[];
  example: { title: string; text: string; decision: string; steps?: string[] };
  quiz: { id: string; question: string; options: string[] }[];
  assignment: {
    prompt: string;
    fields: string[];
    criteria: string[];
    rubric?: { criterion: string; excellent: string; adequate: string; needsRevision: string }[];
  };
  faq: { question: string; answer: string }[];
  summary: string[];
  readingVisuals?: ReadingVisualSpec[];
};
export type AcademicDelivery =
  | { allowed: false }
  | {
      allowed: true;
      reviewOnly?: boolean;
      lesson: AcademicLesson;
      video: string | null;
      files: { kind: string; path: string }[];
      assistantAllowed: boolean;
    };
export type AcademicQuizResult = {
  allowed: boolean;
  score: number;
  total: number;
  passed: boolean;
  feedback: { id: string; correct: boolean; explanation: string }[];
};

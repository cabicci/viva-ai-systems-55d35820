import { describe, expect, it } from "vitest";
import { BookOpen, CircleCheck, Compass, Rocket, Route, Sparkles } from "lucide-react";
import { resolveLearnerLessonIcon } from "@/components/intro/resolve-learner-lesson-icon";

describe("resolveLearnerLessonIcon", () => {
  it("maps Sparkles section headers to Compass", () => {
    expect(resolveLearnerLessonIcon(Sparkles, "paragraphs")).toBe(Compass);
  });

  it("maps Rocket quiz headers to CircleCheck and mission headers to Route", () => {
    expect(resolveLearnerLessonIcon(Rocket, "quiz")).toBe(CircleCheck);
    expect(resolveLearnerLessonIcon(Rocket, "mission")).toBe(Route);
  });

  it("maps concepts blocks to BookOpen regardless of source icon", () => {
    expect(resolveLearnerLessonIcon(Sparkles, "concepts")).toBe(BookOpen);
  });

  it("preserves non-generic icons", () => {
    expect(resolveLearnerLessonIcon(BookOpen, "paragraphs")).toBe(BookOpen);
  });
});

import { describe, expect, it } from "vitest";
import {
  sanitizeFinalLessonPackage,
  stripQuizPrefix,
  balanceBoldMarkers,
  PRODUCTION_LEAK_SUBSTRINGS,
} from "../../../scripts/locale-lessons/lib/sanitize-final-lesson-package";

const samplePkg = {
  locale: "en" as const,
  lessonId: "demo-l1",
  canonicalVersion: "x",
  title: "Demo",
  sourceFile: "x",
  generatedAt: "2026-01-01",
  sections: [
    {
      role: "Orientation",
      heading: "Lesson Start",
      contentMarkdown: "Hello **world",
      bullets: ["Option 1: foo", "**Correct answer (Option 2):** bar"],
      tables: [
        {
          headers: ["a", "b"],
          rows: [["**unbalanced", "خيار ١: text"]],
        },
      ],
    },
    {
      role: "Video block (production reference only)",
      heading: "Video block (production reference only)",
      contentMarkdown: "> في الإنتاج: فيديو Bunny. **لا يُعاد توليده.**",
      bullets: [],
      tables: [],
    },
    {
      role: "Quiz",
      heading: "Quiz",
      contentMarkdown: "- Option 1: A\n- **Correct answer (Option 2):** B",
      bullets: ["Option 1: A", "**Correct answer (Option 2):** B"],
      tables: [],
      quiz: {
        question: "Q?",
        correctIndex: 1,
        options: [
          "Option 1: A",
          "**Correct answer (Option 2):** B",
          "خيار ٣: C",
        ],
      },
    },
  ],
};

describe("stripQuizPrefix", () => {
  it("removes English Option prefix", () => {
    expect(stripQuizPrefix("Option 1: hello")).toBe("hello");
    expect(stripQuizPrefix("**Correct answer (Option 2):** hello")).toBe("hello");
  });
  it("removes Arabic خيار prefix", () => {
    expect(stripQuizPrefix("خيار ١: مرحبا")).toBe("مرحبا");
    expect(stripQuizPrefix("الإجابة الصحيحة (خيار ٢): مرحبا")).toBe("مرحبا");
  });
  it("handles list-dash and bold variants", () => {
    expect(stripQuizPrefix("- **Option 3:** foo")).toBe("foo");
  });
});

describe("balanceBoldMarkers", () => {
  it("appends ** when odd", () => {
    expect(balanceBoldMarkers("hello **world")).toBe("hello **world**");
  });
  it("leaves even alone", () => {
    expect(balanceBoldMarkers("hello **world**")).toBe("hello **world**");
  });
});

describe("sanitizeFinalLessonPackage", () => {
  const out = sanitizeFinalLessonPackage(samplePkg);

  it("removes production/video/Bunny sections", () => {
    const joined = JSON.stringify(out);
    for (const needle of PRODUCTION_LEAK_SUBSTRINGS) {
      expect(joined).not.toContain(needle);
    }
  });

  it("strips Option/Correct answer prefixes in bullets, contentMarkdown, and quiz.options", () => {
    const joined = JSON.stringify(out);
    expect(joined).not.toContain("Option 1:");
    expect(joined).not.toContain("Option 2:");
    expect(joined).not.toContain("Option 3:");
    expect(joined).not.toContain("Correct answer (Option");
    expect(joined).not.toContain("خيار ١:");
    expect(joined).not.toContain("خيار ٣:");
    const quizSection = out.sections.find((s) => s.role === "Quiz");
    expect(quizSection?.quiz?.options).toEqual(["A", "B", "C"]);
    expect(quizSection?.bullets).toEqual(["A", "B"]);
  });

  it("balances unbalanced ** in table cells", () => {
    const orient = out.sections.find((s) => s.role === "Orientation");
    const cell = orient?.tables[0].rows[0][0] ?? "";
    const count = (cell.match(/\*\*/g) ?? []).length;
    expect(count % 2).toBe(0);
  });

  it("balances unbalanced ** in contentMarkdown", () => {
    const orient = out.sections.find((s) => s.role === "Orientation");
    const count = ((orient?.contentMarkdown ?? "").match(/\*\*/g) ?? []).length;
    expect(count % 2).toBe(0);
  });
});

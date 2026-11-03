import { describe, expect, it } from "vitest";
import type { IntakeSection } from "./package";
import {
  blockSource,
  exampleLayout,
  groupSections,
  lessonLead,
  parseBlock,
  parseBlocks,
  resolveGroup,
} from "./presentation";

const s = (id: string, kind: IntakeSection["kind"], paragraphs: string[] = ["x"]) =>
  ({
    id,
    kind,
    title: id,
    paragraphs,
    questions: [],
    assets: [],
    fields: [],
    required: false,
    completion: "read",
  }) as IntakeSection;

// Exact section shape of the admitted AC-FATE step FATE2-S02 (12 sections).
const fate = [
  s("reading", "explanation"),
  s("example", "example"),
  s("video", "video"),
  s("diagnostic", "questions"),
  s("post", "questions"),
  s("bank", "questions"),
  s("guided", "practice"),
  s("intake-menu", "practice"),
  s("intake-transfer", "practice"),
  s("independent", "practice"),
  s("faq", "faq"),
  s("downloads", "downloads"),
];

describe("seven AC-BUS section groups", () => {
  it("keeps every section id exactly once, in author order inside groups", () => {
    const groups = groupSections(fate);
    expect(groups.map((g) => g.group)).toEqual([
      "explanation",
      "example",
      "video",
      "check",
      "practice",
      "faq",
      "downloads",
    ]);
    expect(groups.flatMap((g) => g.sections.map((x) => x.id)).sort()).toEqual(
      fate.map((x) => x.id).sort(),
    );
    expect(groups.find((g) => g.group === "check")!.sections.map((x) => x.id)).toEqual([
      "diagnostic",
      "post",
      "bank",
    ]);
    expect(groups.find((g) => g.group === "practice")!.sections).toHaveLength(4);
  });
  it("resolves old section-id links to their group", () => {
    expect(resolveGroup(fate, "bank")).toBe("check");
    expect(resolveGroup(fate, "intake-menu")).toBe("practice");
    expect(resolveGroup(fate, "")).toBe("explanation");
  });
  it("omits groups without sections", () => {
    expect(groupSections([s("a", "faq"), s("b", "exam")]).map((g) => g.group)).toEqual([
      "check",
      "faq",
    ]);
  });
});

describe("lossless semantic parsing", () => {
  const paragraphs = [
    "إزاي تقرأ نتيجة معمل؟",
    "بعد الخطوة هتقدر\n• تميّز بين متبقي المبيد.\n• تحوّل كتلة الغذاء.",
    "١. رقم صحيح ممكن يتبني عليه استنتاج غلط",
    "الخلاصة\n• ابدأ بالمادة.\n• اكتب الوحدة.",
    "`m_R = C_R * m_food`",
    "مثال استدلال: تقرير غذاء يدعم وجود متبقٍ.",
    "الخطوة التالية:  حدود المتبقيات.",
    "وجود رقم تحليلي ما يحدّدش لوحده سبب وجود المادة: ممكن نحتاج سجلات.",
    "<script>alert(1)</script>",
    "  leading spaces and\n\ntrailing  ",
  ];
  it("rebuilds every authored paragraph character for character", () => {
    for (const p of paragraphs) expect(blockSource(parseBlock(p))).toBe(p);
    for (const p of paragraphs) expect(blockSource(parseBlock(p, true))).toBe(p);
  });
  it("recognises headings, lists, outcomes, formulas and callouts", () => {
    expect(parseBlocks(paragraphs).map((b) => b.type)).toEqual([
      "text",
      "list",
      "heading",
      "list",
      "formula",
      "callout",
      "callout",
      "text",
      "text",
      "text",
    ]);
    const outcome = parseBlock(paragraphs[3]);
    expect(outcome.type === "list" && outcome.tone).toBe("outcome");
    const example = parseBlock(paragraphs[5]);
    expect(example.type === "callout" && example.tone).toBe("case");
  });
  it("splits FAQ question/answer pairs only in FAQ sections", () => {
    const pair = "هل وجود متبقي يساوي حدوث تسمم؟\nوجود المادة يثبت نتيجة تحليلية.";
    expect(parseBlock(pair, true)).toMatchObject({
      type: "faq",
      question: "هل وجود متبقي يساوي حدوث تسمم؟",
      answer: "وجود المادة يثبت نتيجة تحليلية.",
    });
    expect(parseBlock(pair).type).toBe("text");
    expect(parseBlock("No question mark\nanswer", true).type).toBe("text");
  });
  it("lays out a worked example as case, steps and closing", () => {
    const layout = exampleLayout(
      parseBlocks(["Case data.", "Convert.", "`250 g = 0.250 kg`", "Multiply.", "`a*b`", "So."]),
    )!;
    expect(layout.opening?.source).toBe("Case data.");
    expect(layout.steps.map((x) => [x.lead?.source, x.formulas.length])).toEqual([
      ["Convert.", 1],
      ["Multiply.", 1],
    ]);
    expect(layout.closing.map((b) => b.source)).toEqual(["So."]);
    expect(exampleLayout(parseBlocks(["No formulas", "here"]))).toBeNull();
  });
  it("uses only a plain first explanation paragraph as the hero intro", () => {
    expect(lessonLead([s("r", "explanation", ["Lead?", "more"])])).toEqual({
      sectionId: "r",
      text: "Lead?",
    });
    expect(lessonLead([s("r", "explanation", ["1. Heading"])])).toBeNull();
    expect(lessonLead([s("f", "faq")])).toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import { splitTechnicalText } from "./technical-text";

describe("technical text inside RTL prose", () => {
  it.each([
    ["نطرح 600 − 18 − 18 = 564 من العرض.", "600 − 18 − 18 = 564"],
    ["الفتحة 546 ÷ 2 = 273 بالمليمتر.", "546 ÷ 2 = 273"],
    ["الاختيار 564 mm هنا.", "564 mm"],
  ])("isolates arithmetic without changing content: %s", (source, expression) => {
    const parts = splitTechnicalText(source);
    expect(parts.map((p) => p.text).join("")).toBe(source);
    expect(parts.filter((p) => p.ltr).map((p) => p.text)).toEqual([expression]);
  });
  it("leaves ordinary Arabic prose unchanged", () => {
    expect(splitTechnicalText("اقرأ الرسم أولًا.")).toEqual([
      { text: "اقرأ الرسم أولًا.", ltr: false },
    ]);
  });
});

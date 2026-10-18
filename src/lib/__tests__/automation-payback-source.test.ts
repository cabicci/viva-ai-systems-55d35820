import { expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { AUTOMATOR_M2_L3_DECIDE_WHAT_TO_AUTOMATE_BLOCKS } from "@/components/intro/lessons/automator-m2-l3-decide-what-to-automate";
const read = (locale: string) =>
  JSON.parse(
    readFileSync(
      `src/lib/locale-lessons/${locale}/lessons/automator-m2-l3-decide-what-to-automate.json`,
      "utf8",
    ),
  );
it("keeps the Egyptian live authoring glossary synchronized with its generated overlay", () => {
  const block = AUTOMATOR_M2_L3_DECIDE_WHAT_TO_AUTOMATE_BLOCKS.find(
    (section) => section.block.kind === "concepts",
  )?.block;
  if (block?.kind !== "concepts") throw Error("Missing concepts");
  const item = block.items[1],
    row = read("ar-EG").sections[4].tables[0].rows[1];
  expect(row).toEqual([item.term, item.meaning, item.example]);
  expect(item.meaning).toContain("صافي");
  expect(item.meaning).toContain("الصيانة");
  expect(item.meaning).toContain("المخاطر");
});
it.each(["ar-EG", "ar-MSA", "ar-Gulf", "en"])(
  "uses a monthly payback duration in %s while retaining the structured mission and quiz",
  (locale) => {
    const source = read(locale),
      glossary = source.sections[4];
    const row = glossary.tables[0].rows[1] as string[];
    expect(row[0]).toContain("Build-effort payback period");
    expect(JSON.stringify(glossary)).not.toContain("ROI");
    expect(row[2]).toContain(locale === "en" ? "0.25 month" : "٠٫٢٥ شهر");
    expect(row[1]).toContain(locale === "en" ? "hours/month" : "بالساعات/شهر");
    expect(source.sections.some((section: { mission?: unknown }) => !!section.mission)).toBe(true);
    expect(source.sections.some((section: { quiz?: unknown }) => !!section.quiz)).toBe(true);
    const buildHours = 30 / 60,
      netMonthlyHours = 2;
    expect(buildHours / netMonthlyHours).toBe(0.25);
  },
);

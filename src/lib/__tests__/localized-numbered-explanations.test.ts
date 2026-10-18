import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { adaptLocalizedPackageToIntroContent } from "@/lib/locale-lessons/adapt-localized-package-to-intro-content";
import { loadIntroLessonContent } from "@/components/intro/lessons";
import type { LocalizedLessonPackage } from "@/lib/locale-lessons/types";

describe("localized numbered explanations", () => {
  for (const locale of ["en", "ar-MSA", "ar-Gulf"] as const) {
    it(
      locale + " shows all four feeling-to-question steps in the core slot",
      async () => {
        const lessonId = "analyst-m2-l1-feeling-to-question";
        const pkg = JSON.parse(
          readFileSync(
            path.resolve(
              "src/lib/locale-lessons",
              locale,
              "lessons",
              lessonId + ".json",
            ),
            "utf8",
          ),
        ) as LocalizedLessonPackage;
        const canonical = await loadIntroLessonContent(lessonId);
        const before = JSON.stringify(pkg);
        const result = adaptLocalizedPackageToIntroContent(pkg, canonical);
        const lists = result.filter(
          (section) => section.block.kind === "numberedList",
        );
        expect(lists).toHaveLength(1);
        const core = lists[0].block;
        expect(core.kind).toBe("numberedList");
        if (core.kind !== "numberedList") throw new Error("Missing core steps");
        expect(core.items).toHaveLength(4);
        expect(
          core.items.every((item) => !/^\s*[0-9٠-٩]+[.)]\s/.test(item)),
        ).toBe(true);
        expect(
          core.items.every(
            (item) => !/You understood|You can|Next:/.test(item),
          ),
        ).toBe(true);
        expect(result.indexOf(lists[0])).toBeLessThan(
          result.findIndex((section) => section.block.kind === "comparison"),
        );
        expect(result.at(-1)?.block.kind).toBe("paragraphs");
        expect(JSON.stringify(pkg)).toBe(before);
      },
    );
  }
});

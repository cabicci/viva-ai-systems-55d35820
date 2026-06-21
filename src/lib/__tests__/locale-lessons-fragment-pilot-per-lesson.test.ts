import { describe, expect, it } from "vitest";
import { extractLocalizableFields } from "../../../scripts/locale-lessons/lib/extract-localizable-fields.ts";
import { injectLocalizedFields } from "../../../scripts/locale-lessons/lib/inject-localized-fields.ts";
import { mockLocalizeTextMap } from "../../../scripts/locale-lessons/lib/mock-localize-text-map.ts";
import { getValueAtFieldPath } from "../../../scripts/locale-lessons/lib/inject-localized-fields.ts";
import {
  buildFragmentLocalizationPrompt,
  OpenAiFragmentParseError,
  parseOpenAiFragmentResponse,
} from "../../../scripts/locale-lessons/lib/openai-fragment-adapter.ts";
import {
  buildFragmentPilotMatrix,
  fragmentPilotArtifactName,
  parseLessonIdsArg,
  resolveFragmentPilotLessonIds,
} from "../../../scripts/locale-lessons/lib/resolve-fragment-pilot-lesson-ids.ts";
import { runFragmentLocalizationPipeline } from "../../../scripts/locale-lessons/lib/fragment-localization-pipeline.ts";
import { validateStructuralParity } from "../../../scripts/locale-lessons/lib/validate-structural-parity.ts";
import { loadMsaLessonPackage } from "../../../scripts/locale-lessons/lib/source-package.ts";
import type { LocalizedLessonPackage } from "@/lib/locale-lessons/types";

describe("fragment pilot per-lesson workflow support", () => {
  it("filters pilot lesson IDs when lesson_ids override is provided", async () => {
    const ids = await resolveFragmentPilotLessonIds({
      count: 10,
      lessonIdsOverride: [
        "analyst-m2-l1-feeling-to-question",
        "builder-m6-l1-idea-to-page",
      ],
    });
    expect(ids).toEqual([
      "analyst-m2-l1-feeling-to-question",
      "builder-m6-l1-idea-to-page",
    ]);
  });

  it("builds one matrix cell per locale+lesson for target=en", async () => {
    const matrix = await buildFragmentPilotMatrix({
      target: "en",
      count: 3,
      lessonIdsOverride: ["intro-m1-l1-what-is-ai"],
    });
    expect(matrix).toEqual([
      { locale: "en", lesson_id: "intro-m1-l1-what-is-ai" },
    ]);
  });

  it("names artifacts per locale and lesson", () => {
    expect(fragmentPilotArtifactName("en", "intro-m1-l1-what-is-ai")).toBe(
      "locale-fragment-pilot-en-intro-m1-l1-what-is-ai",
    );
  });

  it("parses comma-separated lesson_ids input", () => {
    expect(parseLessonIdsArg("a,b, c")).toEqual(["a", "b", "c"]);
  });
});

describe("empty source text extraction", () => {
  it("skips empty and whitespace-only fields during extraction", () => {
    const pkg = {
      lessonId: "test-empty-fields",
      canonicalVersion: "test",
      locale: "ar-MSA",
      title: "عنوان",
      titleEn: "Title",
      summary: "   ",
      sections: [
        {
          role: "Orientation",
          heading: "Heading",
          subtitle: "",
          contentMarkdown: "",
          bullets: ["", "  "],
          tables: [
            {
              headers: ["", "H2"],
              rows: [["", "cell"]],
            },
          ],
        },
      ],
    } as unknown as LocalizedLessonPackage;

    const map = extractLocalizableFields(pkg);
    const paths = map.fields.map((field) => field.fieldPath);

    expect(paths).toContain("title");
    expect(paths).not.toContain("summary");
    expect(paths).not.toContain("sections[0].contentMarkdown");
    expect(paths).not.toContain("sections[0].bullets[0]");
    expect(paths).not.toContain("sections[0].tables[0].headers[0]");
    expect(paths).not.toContain("sections[0].tables[0].rows[0][0]");
    expect(paths).toContain("sections[0].tables[0].headers[1]");
    expect(paths).toContain("sections[0].tables[0].rows[0][1]");
  });

  it("does not include empty fields in OpenAI fragment prompt payload", () => {
    const pkg = {
      lessonId: "test-empty-fields",
      canonicalVersion: "test",
      locale: "ar-MSA",
      title: "عنوان",
      sections: [
        {
          role: "Orientation",
          heading: "Heading",
          contentMarkdown: "",
          bullets: [],
          tables: [],
        },
      ],
    } as unknown as LocalizedLessonPackage;

    const map = extractLocalizableFields(pkg);
    const prompt = buildFragmentLocalizationPrompt(map, "en");

    expect(map.fields.some((field) => field.fieldPath.endsWith("contentMarkdown"))).toBe(
      false,
    );
    expect(prompt.userPrompt).not.toContain("sections[0].contentMarkdown");
  });

  it("leaves skipped empty fields unchanged after injection", () => {
    const pkg = {
      lessonId: "test-empty-fields",
      canonicalVersion: "test",
      locale: "ar-MSA",
      title: "عنوان",
      sections: [
        {
          role: "Orientation",
          heading: "Heading",
          contentMarkdown: "",
          bullets: [],
          tables: [],
        },
      ],
    } as unknown as LocalizedLessonPackage;

    const textMap = extractLocalizableFields(pkg);
    const localized = mockLocalizeTextMap(textMap, { targetLocale: "en" });
    const artifact = injectLocalizedFields(
      pkg,
      localized,
      "en",
      "2026-06-22T00:00:00.000Z",
    );

    expect(getValueAtFieldPath(artifact, "sections[0].contentMarkdown")).toBe("");
  });

  it("analyst-m2-l1 sections[3].contentMarkdown is non-empty in source and extracted", async () => {
    const source = await loadMsaLessonPackage("analyst-m2-l1-feeling-to-question");
    const field = extractLocalizableFields(source).fields.find(
      (item) => item.fieldPath === "sections[3].contentMarkdown",
    );

    expect(source.sections[3]?.contentMarkdown.trim().length).toBeGreaterThan(0);
    expect(field?.sourceText.trim().length).toBeGreaterThan(0);
  });

  it("still rejects empty localizedText for non-empty sourceText", async () => {
    const source = await loadMsaLessonPackage("analyst-m2-l1-feeling-to-question");
    const textMap = extractLocalizableFields(source);

    expect(() =>
      parseOpenAiFragmentResponse(
        JSON.stringify({
          lessonId: textMap.lessonId,
          fields: textMap.fields.map((field) => ({
            fieldPath: field.fieldPath,
            localizedText:
              field.fieldPath === "sections[3].contentMarkdown"
                ? "   "
                : "Localized text",
          })),
        }),
        textMap,
      ),
    ).toThrow(OpenAiFragmentParseError);
  });
});

describe("one-lesson fragment pipeline", () => {
  it("preserves structure for a single lesson mock run", async () => {
    const source = await loadMsaLessonPackage("intro-m1-l1-what-is-ai");
    const result = runFragmentLocalizationPipeline(source, "en");
    const parity = validateStructuralParity(source, result.artifact);

    expect(result.artifact.lessonId).toBe("intro-m1-l1-what-is-ai");
    expect(parity.ok).toBe(true);
    expect(result.validation.ok).toBe(true);
  });
});

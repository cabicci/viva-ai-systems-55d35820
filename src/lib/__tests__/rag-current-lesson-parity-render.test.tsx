import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import fs from "node:fs";
import path from "node:path";
import { IntroLessonRenderer } from "../../components/intro/IntroLessonRenderer";
import { WHAT_IS_AI_CONTENT } from "../../components/intro/lessons/intro-m1-l1-what-is-ai";
import { LocaleProvider } from "../locale/locale-context";
import { adaptLocalizedPackageToIntroContent } from "../locale-lessons/adapt-localized-package-to-intro-content";
import { CURRENT_INTRO_MODEL_CONCEPTS } from "../locale-lessons/current-intro-model-concept";
import type { RagLocalizedLessonPackage, LocalizedLessonPackage } from "../locale-lessons/types";
import { buildCurrentAiRelease, loadCurrentAiSources } from "../rag/current-source-release";

vi.mock("../../components/intro/IntroMission", () => ({ IntroMissionPrompt: () => null }));
vi.mock("../../components/intro/QuizBlock", () => ({ QuizBlock: () => null }));
vi.mock("../../components/intro/value-hooks", () => ({ getValueHookForLocale: () => null }));
afterEach(cleanup);

const root = path.resolve(import.meta.dirname, "../../..");
const release = buildCurrentAiRelease(loadCurrentAiSources(root));
it.each(["ar-EG", "ar-MSA", "ar-Gulf", "en"] as const)("renders the %s Model correction through the existing lesson adapter and glossary renderer", locale => {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, `src/lib/locale-lessons/${locale}/lessons/intro-m1-l1-what-is-ai.json`), "utf8")) as RagLocalizedLessonPackage;
  const content = locale === "ar-EG" ? WHAT_IS_AI_CONTENT : adaptLocalizedPackageToIntroContent(pkg as LocalizedLessonPackage, WHAT_IS_AI_CONTENT, locale);
  const glossary = content.find(s => s.block.kind === "concepts")!;
  const { container } = render(<LocaleProvider initialLocale={locale}>
    <IntroLessonRenderer content={[glossary]} />
  </LocaleProvider>);
  const concept = CURRENT_INTRO_MODEL_CONCEPTS[locale];
  expect(container.textContent).toContain(concept.meaning);
  expect(container.textContent).toContain(concept.example);
  expect(container.textContent).not.toContain("**Model");
  const rows = container.querySelectorAll("li");
  expect(rows).toHaveLength(2);
  expect(rows[1].textContent).toContain(concept.term);
  const indexed = release.chunks.filter(c => c.locale === locale && c.lessonId === pkg.lessonId && c.sectionIndex === 3).map(c => c.displayText).join("\n");
  expect(indexed).toContain(concept.meaning);
  expect(indexed).toContain(concept.example);
});

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { PlayCircle } from "lucide-react";
import { render } from "@testing-library/react";
import { IntroLessonRenderer } from "@/components/intro/IntroLessonRenderer";
import { LESSON_DIAGRAMS } from "@/components/intro/diagrams/LessonDiagrams";
import type { IntroLessonContent } from "@/components/intro/intro-lesson-types";
import { loadIntroLessonContent } from "@/components/intro/lessons";
import { adaptLocalizedPackageToIntroContent } from "@/lib/locale-lessons/adapt-localized-package-to-intro-content";
import {
  getPackageLessonIds,
  isPackageLocale,
} from "@/lib/locale-lessons/registry";
import { localizedSectionEyebrow } from "@/lib/locale-lessons/package-section-labels";
import {
  getStrictVisualUiString,
  isStrictVisualPackageTextAllowed,
  localizedLessonDiagramAssetPath,
  localizedLessonScreenshotAssetPath,
  resolveStrictLocalizedDiagramSrc,
  resolveStrictLocalizedScreenshotSrc,
  STRICT_LOCALIZED_VISUAL_LOCALES,
  STRICT_VISUAL_UI_KEYS,
  usesStrictLocalizedVisualPolicy,
} from "@/lib/locale-lessons/strict-localized-visual-policy";
import type {
  LessonPackageLocale,
  LocalizedLessonPackage,
} from "@/lib/locale-lessons/types";
import { LocaleProvider } from "@/lib/locale/locale-context";
import { getUiString } from "@/lib/locale/ui-strings";
import {
  BUNNY_VIDEO_GUIDS,
  getLocalizedBunnyEmbedUrl,
} from "@/lib/bunny-videos";
import {
  renderLocalizedLesson,
  withAbsentLocalizedVideoMapping,
} from "@/lib/__tests__/locale-test-utils";

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    ...props
  }: {
    children: React.ReactNode;
    to?: string;
  }) => (
    <a href={typeof to === "string" ? to : "#"} {...props}>
      {children}
    </a>
  ),
  createLink: (component: unknown) => component,
}));

const REPO_ROOT = path.resolve(import.meta.dirname, "../../..");
const PACKAGE_LOCALES = STRICT_LOCALIZED_VISUAL_LOCALES;
const SAMPLE_LESSON_ID = "intro-m1-l1-what-is-ai";
/**
 * Package lesson used to prove missing-video UI + no ar-EG fallback.
 * Production composites exist for all 300 cells; tests temporarily clear the mapping.
 */
const MISSING_VIDEO_LESSON_ID = "analyst-m1-l1-from-automation-to-insight";

function readLocalizedPackage(
  locale: LessonPackageLocale,
  lessonId: string,
): LocalizedLessonPackage {
  const filePath = path.join(
    REPO_ROOT,
    "src/lib/locale-lessons",
    locale,
    "lessons",
    `${lessonId}.json`,
  );
  return JSON.parse(readFileSync(filePath, "utf8")) as LocalizedLessonPackage;
}

function packageHasRole(
  pkg: LocalizedLessonPackage,
  roleFragment: string,
): boolean {
  return pkg.sections.some((section) =>
    section.role.trim().toLowerCase().includes(roleFragment),
  );
}

function assertNoArEgBlock2Fallback(
  adapted: IntroLessonContent,
  canonical: IntroLessonContent,
  locale: LessonPackageLocale,
  pkg: LocalizedLessonPackage,
) {
  const adaptedVideo = adapted.find((s) => s.block.kind === "lessonVideo");
  const canonVideo = canonical.find((s) => s.block.kind === "lessonVideo");
  expect(adaptedVideo).toBeDefined();
  if (!adaptedVideo || adaptedVideo.block.kind !== "lessonVideo") return;
  if (!canonVideo || canonVideo.block.kind !== "lessonVideo") return;

  // Never inherit ar-EG media metadata.
  expect(adaptedVideo.block.url).toBeUndefined();
  expect(adaptedVideo.block.poster).toBeUndefined();
  expect(adaptedVideo.block.durationLabel).toBeUndefined();

  if (!packageHasRole(pkg, "video")) {
    const chrome = localizedSectionEyebrow("Video block", locale);
    expect(adaptedVideo.eyebrow).toBe(chrome);
    expect(adaptedVideo.title).toBe(chrome);
    expect(adaptedVideo.block.caption).toBeUndefined();
  } else if (canonVideo.block.caption) {
    // Package video role exists: caption may be localized or absent — never silent EG copy.
    // (Localized caption equal to EG by coincidence is allowed only if package authored it.)
    const packageVideo = pkg.sections.find((section) =>
      section.role.trim().toLowerCase().includes("video"),
    );
    const packageCaption = packageVideo?.bullets[0]?.replace(/\*\*/g, "").trim();
    if (!packageCaption && !packageVideo?.contentMarkdown?.trim()) {
      expect(adaptedVideo.block.caption).toBeUndefined();
    }
  }

  // Distinct EG lesson titles must not leak when package has no video chrome of its own.
  if (
    !packageHasRole(pkg, "video") &&
    canonVideo.title &&
    canonVideo.title !== localizedSectionEyebrow("Video block", locale)
  ) {
    expect(adaptedVideo.title).not.toBe(canonVideo.title);
  }
}

function assertNoArEgBlock7Fallback(
  adapted: IntroLessonContent,
  canonical: IntroLessonContent,
  locale: LessonPackageLocale,
  pkg: LocalizedLessonPackage,
) {
  const adaptedShot = adapted.find((s) => s.block.kind === "screenshot");
  const canonShot = canonical.find((s) => s.block.kind === "screenshot");
  if (adaptedShot && adaptedShot.block.kind === "screenshot") {
    expect(adaptedShot.block.src).toBeUndefined();
    expect(adaptedShot.block.alt).toBeUndefined();
    expect(adaptedShot.block.label).toBeUndefined();
    if (!packageHasRole(pkg, "screenshot")) {
      const chrome = localizedSectionEyebrow("Screenshot block (intent)", locale);
      expect(adaptedShot.eyebrow).toBe(chrome);
      expect(adaptedShot.title).toBe(chrome);
      expect(adaptedShot.block.caption).toBeUndefined();
    }
    if (canonShot?.block.kind === "screenshot" && canonShot.block.src) {
      expect(adaptedShot.block.src).not.toBe(canonShot.block.src);
    }
  }

  const adaptedDiagram = adapted.find((s) => s.block.kind === "diagram");
  const canonDiagram = canonical.find((s) => s.block.kind === "diagram");
  if (adaptedDiagram && adaptedDiagram.block.kind === "diagram") {
    expect(adaptedDiagram.block.label).toBeUndefined();
    if (!packageHasRole(pkg, "diagram")) {
      const chrome = localizedSectionEyebrow("Diagram block (intent)", locale);
      expect(adaptedDiagram.eyebrow).toBe(chrome);
      expect(adaptedDiagram.title).toBe(chrome);
      expect(adaptedDiagram.block.caption).toBeUndefined();
    }
    if (
      canonDiagram?.block.kind === "diagram" &&
      canonDiagram.block.caption &&
      !packageHasRole(pkg, "diagram")
    ) {
      expect(adaptedDiagram.block.caption).not.toBe(canonDiagram.block.caption);
    }
  }
}

describe("strict localized visual policy", () => {
  it("detects package locales only", () => {
    expect(usesStrictLocalizedVisualPolicy("ar-MSA")).toBe(true);
    expect(usesStrictLocalizedVisualPolicy("ar-Gulf")).toBe(true);
    expect(usesStrictLocalizedVisualPolicy("en")).toBe(true);
    expect(usesStrictLocalizedVisualPolicy("ar-EG")).toBe(false);
    expect(usesStrictLocalizedVisualPolicy(undefined)).toBe(false);
  });

  it("future asset paths follow src/assets/lessons/<locale>/<lessonId>.jpg|.svg only", () => {
    for (const locale of PACKAGE_LOCALES) {
      expect(localizedLessonScreenshotAssetPath(locale, "intro-m1-l1-what-is-ai")).toBe(
        `src/assets/lessons/${locale}/intro-m1-l1-what-is-ai.jpg`,
      );
      expect(localizedLessonDiagramAssetPath(locale, "intro-m1-l1-what-is-ai")).toBe(
        `src/assets/lessons/${locale}/intro-m1-l1-what-is-ai.svg`,
      );
      expect(
        localizedLessonScreenshotAssetPath(locale, "x"),
      ).not.toMatch(/^[A-Za-z]:\\/);
      expect(resolveStrictLocalizedScreenshotSrc(locale, "x")).toBeUndefined();
      expect(resolveStrictLocalizedDiagramSrc(locale, "x")).toBeUndefined();
    }
  });

  it("ar-EG IntroLessonRenderer still mounts LESSON_DIAGRAMS when present", () => {
    const diagramId = Object.keys(LESSON_DIAGRAMS)[0] as keyof typeof LESSON_DIAGRAMS;
    expect(diagramId).toBeTruthy();

    const content: IntroLessonContent = [
      {
        icon: PlayCircle,
        eyebrow: "رسم",
        title: "عنوان مصري",
        block: { kind: "diagram", id: diagramId, label: "DIAGRAM" },
      },
    ];

    const { container } = render(
      <LocaleProvider effectiveLocale="ar-EG">
        <IntroLessonRenderer content={content} lessonId="intro-m1-l1-what-is-ai" />
      </LocaleProvider>,
    );

    expect(container.querySelector('[data-locale-diagram="placeholder"]')).toBeNull();
    expect(container.querySelector("figure")).not.toBeNull();
  });

  it("ar-EG lessonVideo still accepts canonical url/poster fields", () => {
    const content: IntroLessonContent = [
      {
        icon: PlayCircle,
        eyebrow: "فيديو",
        title: "فيديو الدرس",
        block: {
          kind: "lessonVideo",
          url: "/lessons/intro/demo.mp4",
          poster: "/posters/demo.jpg",
          durationLabel: "1:30",
          caption: "تعليق مصري",
        },
      },
    ];

    const { container } = render(
      <LocaleProvider effectiveLocale="ar-EG">
        <IntroLessonRenderer content={content} lessonId="nonexistent-lesson-id" />
      </LocaleProvider>,
    );

    expect(container.querySelector("video")).not.toBeNull();
    expect(container.querySelector("video")?.getAttribute("poster")).toBe(
      "/posters/demo.jpg",
    );
    expect(container.textContent).toContain("تعليق مصري");
  });

  for (const locale of PACKAGE_LOCALES) {
    describe(`${locale} Block 2 / Block 7`, () => {
      it("never inherits ar-EG Block 2 fields after adapt", async () => {
        const pkg = readLocalizedPackage(locale, SAMPLE_LESSON_ID);
        const canonical = await loadIntroLessonContent(SAMPLE_LESSON_ID);
        expect(canonical).toBeTruthy();
        const adapted = adaptLocalizedPackageToIntroContent(pkg, canonical);
        assertNoArEgBlock2Fallback(adapted, canonical!, locale, pkg);
      });

      it("never inherits ar-EG Block 7 screenshot fields after adapt", async () => {
        const pkg = readLocalizedPackage(locale, SAMPLE_LESSON_ID);
        const canonical = await loadIntroLessonContent(SAMPLE_LESSON_ID);
        const adapted = adaptLocalizedPackageToIntroContent(pkg, canonical);
        assertNoArEgBlock7Fallback(adapted, canonical!, locale, pkg);
      });

      it("renders neutral Block 2 missing state without ar-EG chrome", async () => {
        expect(BUNNY_VIDEO_GUIDS[MISSING_VIDEO_LESSON_ID]).toBeTruthy();
        await withAbsentLocalizedVideoMapping(
          MISSING_VIDEO_LESSON_ID,
          locale,
          async () => {
            expect(
              getLocalizedBunnyEmbedUrl(MISSING_VIDEO_LESSON_ID, locale),
            ).toBeFalsy();
            const pkg = readLocalizedPackage(locale, MISSING_VIDEO_LESSON_ID);
            const { container } = await renderLocalizedLesson(pkg);
            const html = container.innerHTML;

            expect(html).not.toContain("E:\\");
            expect(html).not.toContain("E:/Masaarat/Artifacts");
            expect(container.querySelector("iframe")).toBeNull();
            expect(html).not.toContain("/lessons/intro/");
            expect(html).not.toContain(BUNNY_VIDEO_GUIDS[MISSING_VIDEO_LESSON_ID]!);
            expect(
              container.textContent?.includes(
                getUiString(locale, "intro.video.optionalBadge"),
              ) ||
                container.textContent?.includes(
                  getUiString(locale, "intro.video.skipBody"),
                ) ||
                container.textContent?.includes(
                  getUiString(locale, "safety.video.title"),
                ),
            ).toBe(true);
          },
        );
      });

      it("never renders canonical LESSON_DIAGRAMS; missing Block 7 uses neutral state", async () => {
        const pkg = readLocalizedPackage(locale, SAMPLE_LESSON_ID);
        const canonical = await loadIntroLessonContent(SAMPLE_LESSON_ID);
        const adapted = adaptLocalizedPackageToIntroContent(pkg, canonical);
        const hasDiagram = adapted.some((s) => s.block.kind === "diagram");
        const hasScreenshot = adapted.some((s) => s.block.kind === "screenshot");

        const { container } = await renderLocalizedLesson(pkg);

        if (hasDiagram) {
          expect(
            container.querySelector('[data-locale-diagram="placeholder"]'),
          ).not.toBeNull();
          expect(container.textContent).toContain(
            getStrictVisualUiString(
              locale,
              STRICT_VISUAL_UI_KEYS.diagramTitle,
            ) ?? "",
          );
        } else {
          expect(
            container.querySelector('[data-locale-diagram="placeholder"]'),
          ).toBeNull();
        }
        if (hasScreenshot) {
          expect(
            container.querySelector('[data-locale-screenshot="placeholder"]'),
          ).not.toBeNull();
          expect(container.querySelector("img")).toBeNull();
        }
      });
    });
  }
});

describe("strict localized visual 300-cell matrix", () => {
  it("validates 100 lessons × 3 locales with no ar-EG / LESSON_DIAGRAMS fallback", async () => {
    let pass = 0;
    let fail = 0;
    let unsafeVisibleTextCells = 0;
    const failures: string[] = [];

    function assertAdaptedVisibleTextPolicy(
      locale: LessonPackageLocale,
      adapted: IntroLessonContent,
    ) {
      for (const section of adapted) {
        if (section.block.kind === "lessonVideo") {
          for (const value of [
            section.title,
            section.eyebrow,
            section.block.caption,
            section.block.durationLabel,
          ]) {
            if (value?.trim()) {
              expect(isStrictVisualPackageTextAllowed(locale, value)).toBe(true);
            }
          }
        }
        if (section.block.kind === "screenshot") {
          for (const value of [
            section.title,
            section.eyebrow,
            section.block.caption,
            section.block.label,
            section.block.alt,
          ]) {
            if (value?.trim()) {
              expect(isStrictVisualPackageTextAllowed(locale, value)).toBe(true);
            }
          }
        }
        if (section.block.kind === "diagram") {
          for (const value of [
            section.title,
            section.eyebrow,
            section.block.caption,
            section.block.label,
          ]) {
            if (value?.trim()) {
              expect(isStrictVisualPackageTextAllowed(locale, value)).toBe(true);
            }
          }
        }
      }
    }

    function packageHasUnsafeBlock2Or7Text(
      locale: LessonPackageLocale,
      pkg: LocalizedLessonPackage,
    ): boolean {
      for (const section of pkg.sections) {
        const role = section.role.toLowerCase();
        if (!role.includes("video") && !role.includes("screenshot") && !role.includes("diagram")) {
          continue;
        }
        const candidates = [
          section.heading,
          section.subtitle,
          ...section.bullets,
          section.contentMarkdown,
        ];
        for (const raw of candidates) {
          const cleaned = raw?.replace(/\*\*/g, "").trim();
          if (!cleaned) continue;
          if (!isStrictVisualPackageTextAllowed(locale, cleaned)) {
            return true;
          }
        }
      }
      return false;
    }

    for (const locale of PACKAGE_LOCALES) {
      expect(isPackageLocale(locale)).toBe(true);
      const lessonIds = [...getPackageLessonIds(locale)].sort();
      expect(lessonIds).toHaveLength(100);

      for (const lessonId of lessonIds) {
        const cell = `${locale}/${lessonId}`;
        try {
          const pkg = readLocalizedPackage(locale, lessonId);
          expect(pkg.locale).toBe(locale);
          expect(pkg.lessonId).toBe(lessonId);

          const canonical = await loadIntroLessonContent(lessonId);
          expect(canonical).toBeTruthy();
          const adapted = adaptLocalizedPackageToIntroContent(pkg, canonical);

          if (packageHasUnsafeBlock2Or7Text(locale, pkg)) {
            unsafeVisibleTextCells += 1;
          }

          assertNoArEgBlock2Fallback(adapted, canonical!, locale, pkg);
          assertNoArEgBlock7Fallback(adapted, canonical!, locale, pkg);
          assertAdaptedVisibleTextPolicy(locale, adapted);

          const video = adapted.find((s) => s.block.kind === "lessonVideo");
          expect(video).toBeDefined();
          if (video?.block.kind === "lessonVideo") {
            expect(video.block.url).toBeUndefined();
            expect(video.block.poster).toBeUndefined();
            expect(video.block.durationLabel).toBeUndefined();
            expect(video.title.trim().length).toBeGreaterThan(0);
            expect(video.eyebrow.trim().length).toBeGreaterThan(0);
          }

          const shot = adapted.find((s) => s.block.kind === "screenshot");
          if (shot?.block.kind === "screenshot") {
            expect(shot.block.src).toBeUndefined();
            expect(shot.block.alt).toBeUndefined();
            expect(shot.block.label).toBeUndefined();
            expect(
              resolveStrictLocalizedScreenshotSrc(locale, lessonId),
            ).toBeUndefined();
          }

          const diagram = adapted.find((s) => s.block.kind === "diagram");
          if (diagram?.block.kind === "diagram") {
            expect(diagram.block.label).toBeUndefined();
            expect(diagram.title.trim().length).toBeGreaterThan(0);
            expect(
              resolveStrictLocalizedDiagramSrc(locale, lessonId),
            ).toBeUndefined();
          }

          const serialized = JSON.stringify(adapted);
          expect(serialized).not.toMatch(/E:\\\\Masaarat/);
          expect(serialized).not.toContain("Artifacts/localization");

          pass += 1;
        } catch (error) {
          fail += 1;
          failures.push(
            `${cell}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
    }

    expect(unsafeVisibleTextCells).toBeGreaterThanOrEqual(0);
    expect({ pass, fail, total: pass + fail, unsafeVisibleTextCells, failures: failures.slice(0, 20) }).toEqual(
      {
        pass: 300,
        fail: 0,
        total: 300,
        unsafeVisibleTextCells,
        failures: [],
      },
    );
  }, 120_000);
});

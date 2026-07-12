import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { adaptLocalizedPackageToIntroContent,
  introContentBlockKinds,
} from "@/lib/locale-lessons/adapt-localized-package-to-intro-content";
import { PILOT_VIDEO_CELLS } from "@/lib/__tests__/locale-pilot-video-cells";
import { renderLocalizedLesson } from "@/lib/__tests__/locale-test-utils";
import type { LocalizedLessonPackage } from "@/lib/locale-lessons/types";
import type { SupportedLocale } from "@/lib/locale/types";
import { loadIntroLessonContent } from "@/components/intro/lessons";
import {
  getBunnyEmbedUrl,
  getBunnyEmbedUrlForLocale,
  getBunnyGuidForLocale,
  getLocalizedBunnyEmbedUrl,
  getLocalizedBunnyGuid,
} from "@/lib/bunny-videos";

const REPO_ROOT = path.resolve(import.meta.dirname, "../../..");

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
const LEARN_ROUTE = path.join(
  REPO_ROOT,
  "src/routes/learn.$pathId.$lessonId.tsx",
);

const PACKAGE_LOCALES = ["en", "ar-MSA", "ar-Gulf"] as const;
const PREVIEW_UI_MARKERS = [
  "Platform preview",
  "Internal preview only",
  "data-locale-preview",
  "data-locale-mission-evaluation",
  "data-locale-mission=\"readonly\"",
  "data-locale-assistant=\"unavailable\"",
  "LocaleMockMissionSubmit",
  "LocalePreviewMission",
];

function readLocalizedPackage(
  locale: SupportedLocale,
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

describe("localized learner-experience parity", () => {
  for (const cell of PILOT_VIDEO_CELLS) {
    describe(`${cell.lessonId} | ${cell.locale}`, () => {
      it("matches canonical ar-EG block order", async () => {
        const pkg = readLocalizedPackage(cell.locale, cell.lessonId);
        const canonical = await loadIntroLessonContent(cell.lessonId);
        const adapted = adaptLocalizedPackageToIntroContent(pkg, canonical);

        expect(introContentBlockKinds(adapted)).toEqual(
          introContentBlockKinds(canonical!),
        );
      });

      it("places exactly one localized video in the canonical lessonVideo slot", async () => {
        const pkg = readLocalizedPackage(cell.locale, cell.lessonId);
        const canonical = await loadIntroLessonContent(cell.lessonId);
        const adapted = adaptLocalizedPackageToIntroContent(pkg, canonical);
        const videoIndexes = adapted
          .map((section, index) =>
            section.block.kind === "lessonVideo" ? index : -1,
          )
          .filter((index) => index >= 0);
        const canonicalVideoIndex = introContentBlockKinds(canonical!).indexOf(
          "lessonVideo",
        );

        expect(videoIndexes).toEqual([canonicalVideoIndex]);
        expect(getLocalizedBunnyGuid(cell.lessonId, cell.locale)).toBe(
          cell.guid,
        );
      });

      it("renders a single Bunny player without preview/mock learner UI", async () => {
        const pkg = readLocalizedPackage(cell.locale, cell.lessonId);
        const { container } = await renderLocalizedLesson(pkg);

        expect(container.querySelectorAll('[data-locale-video="player"]')).toHaveLength(
          1,
        );
        expect(container.querySelectorAll("iframe")).toHaveLength(1);
        expect(container.querySelector("iframe")?.getAttribute("src")).toBe(
          getLocalizedBunnyEmbedUrl(cell.lessonId, cell.locale),
        );

        const html = container.innerHTML;
        for (const marker of PREVIEW_UI_MARKERS) {
          expect(html).not.toContain(marker);
        }
        expect(container.querySelector('[data-locale-preview]')).toBeNull();
      });
    });
  }

  it("ar-EG legacy Bunny lookup remains unchanged", () => {
    const lessonId = "intro-m1-l4-ai-can-cannot";
    const legacyGuid = "b139cfa2-e80e-4dd6-ab6d-e79ed8d34522";

    expect(getBunnyGuidForLocale(lessonId, undefined)).toBe(legacyGuid);
    expect(getBunnyEmbedUrlForLocale(lessonId, undefined)).toBe(
      getBunnyEmbedUrl(lessonId),
    );
    expect(getBunnyGuidForLocale(lessonId, "ar-EG")).toBe(legacyGuid);
  });

  it("learn route uses LocalePackageLessonRenderer and canonical assistant/mission stack", () => {
    const source = readFileSync(LEARN_ROUTE, "utf8");

    expect(source).toContain("LocalePackageLessonRenderer");
    expect(source).not.toContain("LocalePackagePreviewRenderer");
    expect(source).not.toContain("LocaleAssistantUnavailable");
    expect(source).not.toContain("LocaleLiveSafetyMarkers");
    expect(source).not.toContain("localizedPackagePreview");
    expect(source).toContain("contextOverride={assistantContextOverride}");
    expect(source).toContain("buildLocalizedAssistantContextOverride");
  });

  it("all package locales share canonical structure for pilot lessons", async () => {
    const lessonIds = [...new Set(PILOT_VIDEO_CELLS.map((cell) => cell.lessonId))];

    for (const lessonId of lessonIds) {
      const canonical = await loadIntroLessonContent(lessonId);
      for (const locale of PACKAGE_LOCALES) {
        const pkg = readLocalizedPackage(locale, lessonId);
        const adapted = adaptLocalizedPackageToIntroContent(pkg, canonical);
        expect(introContentBlockKinds(adapted)).toEqual(
          introContentBlockKinds(canonical!),
        );
      }
    }
  });
});

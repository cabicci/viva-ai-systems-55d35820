import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { LocalePackagePreviewRenderer } from "@/components/locale/LocalePackagePreviewRenderer";
import {
  getBunnyEmbedUrl,
  getBunnyEmbedUrlForLocale,
  getBunnyGuidForLocale,
  getLocalizedBunnyEmbedUrl,
  getLocalizedBunnyGuid,
} from "@/lib/bunny-videos";
import type { LocalizedLessonPackage } from "@/lib/locale-lessons/types";
import type { SupportedLocale } from "@/lib/locale/types";

const REPO_ROOT = path.resolve(import.meta.dirname, "../../..");

/** Six successful locale-aware pilot cells (lessonId | locale | Bunny GUID). */
export const PILOT_VIDEO_CELLS = [
  {
    lessonId: "analyst-m3-l2-ai-summarization",
    locale: "ar-MSA",
    guid: "ec795bb3-018d-4642-908a-ec86a842175f",
  },
  {
    lessonId: "analyst-m3-l2-ai-summarization",
    locale: "ar-Gulf",
    guid: "5c44ca7d-814a-4eea-a03a-81692942458f",
  },
  {
    lessonId: "analyst-m3-l2-ai-summarization",
    locale: "en",
    guid: "7a08de3d-6997-412e-834e-54906b65896f",
  },
  {
    lessonId: "intro-m1-l4-ai-can-cannot",
    locale: "ar-MSA",
    guid: "1b6a5491-8e93-4ed6-b3a8-08744cd26546",
  },
  {
    lessonId: "intro-m1-l4-ai-can-cannot",
    locale: "ar-Gulf",
    guid: "4eec6df1-cc3f-4d68-ab65-13361880bcfd",
  },
  {
    lessonId: "intro-m1-l4-ai-can-cannot",
    locale: "en",
    guid: "0605d5f9-623f-4b90-9a43-307e1fcdd8e7",
  },
] as const;

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

describe("locale pilot video placement matrix", () => {
  for (const cell of PILOT_VIDEO_CELLS) {
    describe(`${cell.lessonId} | ${cell.locale}`, () => {
      it("resolves composite Bunny GUID from registry", () => {
        expect(getLocalizedBunnyGuid(cell.lessonId, cell.locale)).toBe(
          cell.guid,
        );
        expect(getLocalizedBunnyEmbedUrl(cell.lessonId, cell.locale)).toBe(
          `https://iframe.mediadelivery.net/embed/670679/${cell.guid}?autoplay=false&preload=true`,
        );
      });

      it("renders Bunny player instead of coming-soon placeholder", () => {
        const pkg = readLocalizedPackage(cell.locale, cell.lessonId);
        const { container } = render(<LocalePackagePreviewRenderer pkg={pkg} />);

        expect(container.querySelector('[data-locale-video="player"]')).not.toBeNull();
        expect(container.querySelector('[data-locale-video="placeholder"]')).toBeNull();
        expect(container.querySelector("iframe")?.getAttribute("src")).toBe(
          getLocalizedBunnyEmbedUrl(cell.lessonId, cell.locale),
        );
      });
    });
  }

  it("legacy Egyptian fallback uses plain lessonId when locale is omitted", () => {
    const lessonId = "intro-m1-l4-ai-can-cannot";
    const legacyGuid = "b139cfa2-e80e-4dd6-ab6d-e79ed8d34522";

    expect(getBunnyGuidForLocale(lessonId, undefined)).toBe(legacyGuid);
    expect(getBunnyEmbedUrlForLocale(lessonId, undefined)).toBe(
      getBunnyEmbedUrl(lessonId),
    );
    expect(getBunnyGuidForLocale(lessonId, "ar-EG")).toBe(legacyGuid);
  });

  it("shows placeholder when localized composite GUID is absent even if legacy GUID exists", () => {
    const lessonId = "intro-m1-l1-what-is-ai";
    expect(getLocalizedBunnyGuid(lessonId, "en")).toBeUndefined();
    expect(getBunnyGuidForLocale(lessonId, "en")).toBe(
      getBunnyGuidForLocale(lessonId, undefined),
    );

    const pkg = readLocalizedPackage("en", lessonId);
    const { container } = render(<LocalePackagePreviewRenderer pkg={pkg} />);

    expect(container.querySelector('[data-locale-video="placeholder"]')).not.toBeNull();
    expect(container.querySelector('[data-locale-video="player"]')).toBeNull();
    expect(container.querySelector("iframe")).toBeNull();
  });
});

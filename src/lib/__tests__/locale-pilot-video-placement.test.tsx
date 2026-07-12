import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { LocalePackageLessonRenderer } from "@/components/locale/LocalePackageLessonRenderer";
import { renderLocalizedLesson, renderLocalizedLessonWithoutVideo } from "@/lib/__tests__/locale-test-utils";
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

import { PILOT_VIDEO_CELLS } from "@/lib/__tests__/locale-pilot-video-cells";

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

      it("renders Bunny player instead of coming-soon placeholder", async () => {
        const pkg = readLocalizedPackage(cell.locale, cell.lessonId);
        const { container } = await renderLocalizedLesson(pkg);

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

  it("shows canonical video skip notice when localized composite GUID is absent", async () => {
    const lessonId = "intro-m1-l1-what-is-ai";
    expect(getLocalizedBunnyGuid(lessonId, "en")).toBeUndefined();
    expect(getBunnyGuidForLocale(lessonId, "en")).toBe(
      getBunnyGuidForLocale(lessonId, undefined),
    );

    const pkg = readLocalizedPackage("en", lessonId);
    const { container } = await renderLocalizedLessonWithoutVideo(pkg);

    expect(container.querySelector('[data-locale-video="placeholder"]')).toBeNull();
    expect(container.querySelector('[data-locale-video="player"]')).toBeNull();
    expect(container.querySelector("iframe")).toBeNull();
    expect(container.textContent).toMatch(/Optional video|Short on time\?/);
  });
});
